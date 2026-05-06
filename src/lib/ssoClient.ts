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

export async function exchangeSsoTokens(ssoToken: string, ssoRefresh: string): Promise<void> {
  const exchangeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fb-sso-exchange`
  const res = await fetch(exchangeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sso_token: ssoToken, sso_refresh: ssoRefresh, app: APP_NAME }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`SSO exchange failed: ${res.status} ${body}`)
  }
  const data = await res.json()
  if (!data.access_token || !data.refresh_token) {
    throw new Error('SSO exchange returned malformed tokens')
  }
  const { error } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  })
  if (error) throw error
}

export async function consumeSsoTokensFromUrl(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  const ssoToken = params.get('sso_token')
  const ssoRefresh = params.get('sso_refresh')
  if (!ssoToken || !ssoRefresh) return false
  try {
    await exchangeSsoTokens(ssoToken, ssoRefresh)
    params.delete('sso_token')
    params.delete('sso_refresh')
    const clean = params.toString()
    const newUrl = `${window.location.pathname}${clean ? `?${clean}` : ''}`
    window.history.replaceState({}, '', newUrl)
    return true
  } catch (err) {
    console.error('[sso] exchange failed', err)
    return false
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
