import { supabase } from './supabase'

const HUB_URL = import.meta.env.VITE_HUB_URL || 'https://digicollabo.com'
const APP_NAME = import.meta.env.VITE_APP_NAME || 'booking'

/** iframe 内で実行されているかを判定する（cross-origin で window.top アクセスが投げる場合は true 扱い）。 */
const isInIframe = (): boolean => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

/**
 * 認証ハブへリダイレクト。
 *
 * iframe 内で呼ばれた場合: HUB_URL (= digicollabo.com) に遷移すると Flow Builder
 * 自身が iframe 内に再帰表示されるため、`window.location` 変更はスキップする。
 * 代わりに親 (Flow Builder) へ postMessage を送り、ユーザ向けの簡素なエラーを
 * iframe 内に表示する。
 */
export function redirectToHub(reason: 'login' | 'expired' = 'login'): void {
  if (isInIframe()) {
    try {
      window.parent.postMessage(
        { type: 'flowbuilder:sso-failed', origin: window.location.origin, reason },
        HUB_URL,
      )
    } catch { /* noop */ }
    document.body.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;color:#475569;gap:8px;padding:16px;text-align:center"><div style="font-weight:bold">セッションを確認できませんでした</div><div style="font-size:12px">フロービルダー本体にログインし直して、もう一度お試しください。</div></div>'
    return
  }
  const returnTo = `${window.location.origin}${window.location.pathname}${window.location.search}`
  const params = new URLSearchParams({
    app: APP_NAME,
    return_to: returnTo,
    reason,
  })
  window.location.href = `${HUB_URL}/auth?${params.toString()}`
}

/**
 * SSO 引換券 (sso_code) を fb-sso-exchange Edge Function に送って
 * access_token / refresh_token を得て setSession する。
 * cart / course / mail / line と同方針。
 */
async function exchangeSsoCode(ssoCode: string): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const res = await fetch(`${supabaseUrl}/functions/v1/fb-sso-exchange`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sso_code: ssoCode }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json?.success) {
    throw new Error(`SSO exchange failed: ${res.status} ${json?.error ?? ''}`)
  }
  if (!json.access_token || !json.refresh_token) {
    throw new Error('SSO exchange returned malformed tokens')
  }
  const { error } = await supabase.auth.setSession({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
  })
  if (error) throw error
}

/**
 * 旧方式 fallback: sso_token + sso_refresh をそのまま setSession に渡す。
 * Flow Builder は移行期間中、sso_code と並行して sso_token / sso_refresh も
 * iframe URL に付与しているため、code 交換が失敗した時の保険として残す。
 */
async function exchangeLegacyTokens(ssoToken: string, ssoRefresh: string): Promise<void> {
  const { error } = await supabase.auth.setSession({
    access_token: ssoToken,
    refresh_token: ssoRefresh,
  })
  if (error) throw error
}

/**
 * URL の SSO パラメータを消費してセッションを確立する。
 *
 * 優先順:
 *   1. sso_code (新方式・1回限り引換券) → fb-sso-exchange で交換
 *   2. sso_token + sso_refresh (旧方式・Phase α 互換) → そのまま setSession
 *
 * @returns SSO 消費に成功したら true、SSO パラメータが無い・全て失敗なら false
 */
export async function consumeSsoTokensFromUrl(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  const ssoCode = params.get('sso_code')
  const ssoToken = params.get('sso_token')
  const ssoRefresh = params.get('sso_refresh')

  if (!ssoCode && !(ssoToken && ssoRefresh)) return false

  const cleanUrl = () => {
    params.delete('sso_code')
    params.delete('sso_token')
    params.delete('sso_refresh')
    const clean = params.toString()
    const newUrl = `${window.location.pathname}${clean ? `?${clean}` : ''}`
    window.history.replaceState({}, '', newUrl)
  }

  // 新方式: sso_code を優先で交換
  if (ssoCode) {
    try {
      await exchangeSsoCode(ssoCode)
      cleanUrl()
      return true
    } catch (err) {
      console.error('[sso] sso_code exchange failed; trying legacy fallback', err)
      // 旧方式 fallback へフォールスルー
    }
  }

  // 旧方式 fallback: sso_token + sso_refresh
  if (ssoToken && ssoRefresh) {
    try {
      await exchangeLegacyTokens(ssoToken, ssoRefresh)
      cleanUrl()
      return true
    } catch (err) {
      console.error('[sso] legacy token setSession failed', err)
    }
  }

  return false
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
