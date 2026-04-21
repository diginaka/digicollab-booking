# デジコラボ ブッキング (digicollab-booking)

**Phase 4-A MVP** — 独立した予約アプリ。外部顧客向けの Zoom 1-on-1 個別セッション予約を Calendly 相当の UX で成立させる。

## 目的

- `tpl-booking`（フロービルダー LP テンプレート, LINK型）から送客される外部予約 URL の受け皿
- ゲスト側: 日付 → 時間 → フォーム → 確定（無料）/ 決済遷移（有料）までワンストロークで完了
- ホスト側: 予約一覧（リスト / カレンダー）、予約商品 CRUD、キャンセル、CSV エクスポート
- 認証は **SSO v2 (PKCE Exchange)**。`/admin/*` のみガード、ゲスト予約ページは匿名アクセス可

## 技術スタック

- React 18 + TypeScript + Vite 6
- Tailwind CSS + shadcn/ui (手組み軽量版)
- React Router v6 / TanStack Query / Zustand / Sonner
- Supabase JS v2 (PKCE, `storageKey=sb-digicollab-booking` で他アプリと隔離)
- date-fns / date-fns-tz

## デプロイ先

- 本番ホスト: **book.digicollabo.com**（Cloudflare Pages）
- Supabase プロジェクト: `whpqheywobndaeaikchh`（共用）
- 決済: 既存 Stripe 連携（cart.digicollabo.com の Edge Function を再利用）
- メール: 既存 Brevo Transactional (`mail.digicollab.jp`)

### Cloudflare Pages 設定値

| 項目 | 値 |
|---|---|
| Build command | `npm install && npm run build` |
| Build output | `dist` |
| Node/env flag | `SKIP_DEPENDENCY_INSTALL=true` |
| 本番ブランチ | `main` |
| カスタムドメイン | `book.digicollabo.com` |
| SPA ルーティング | `public/_redirects` に `/* /index.html 200` |

## 環境変数

フル一覧は [`.env.example`](./.env.example) を参照。

| キー | 用途 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable key |
| `VITE_HUB_URL` | SSO v2 Hub (`https://digicollabo.com`) |
| `VITE_APP_NAME` | `booking` |
| `VITE_CART_URL` | `https://cart.digicollabo.com` |
| `VITE_PAGE_RENDERER_URL` | `https://page.digicollabo.com` (tpl-checkout リダイレクト先) |
| `VITE_BOOK_URL` | このアプリ自身の URL (`https://book.digicollabo.com`) |

### Edge Function 側 (`fb-booking-notify`) のシークレット

Supabase Dashboard → Settings → Edge Functions → Secrets で設定:

| キー | デフォルト | 用途 |
|---|---|---|
| `BREVO_API_KEY` | (必須) | Brevo Transactional Email 送信 |
| `BREVO_FROM_EMAIL` | `no-reply@mail.digicollab.jp` | 送信元アドレス |
| `BREVO_FROM_NAME` | `デジコラボ` | 送信者名 |
| `BOOK_APP_URL` | `https://book.digicollabo.com` | メール内 URL 生成用 |
| `BOOKING_NOTIFY_SECRET` | (任意) | pg_net トリガーからの呼び出し検証用共有シークレット |

## ルーティング

```
/                          → 案内ページ（ルート誘導）
/:subdomain/:booking_slug  → ゲスト予約ウィザード（匿名可）
/cancel/:cancel_token      → ゲストキャンセル（匿名可、anon SELECT via token）
/embed/:booking_slug       → Phase B 用骨組（Lindo iframe 配信、構造のみ）

/admin/login               → SSO リダイレクト待受
/admin/dashboard           → 予約一覧（リスト / カレンダー）
/admin/bookings            → 予約商品一覧
/admin/bookings/new        → 新規作成
/admin/bookings/:id        → 編集
/admin/settings            → アカウント / 通知設定
```

## 開発

```bash
npm install
cp .env.example .env   # 値を埋める
npm run dev            # http://localhost:5190
npm run lint
npm run build
```

## Phase 4-A のスコープ

### ✅ 含むもの

- ゲスト予約ウィザード 4 ステップ（無料: 即確定 / 有料: tpl-checkout にリダイレクト）
- 予約確定時の `fb_booking_appointments.status='confirmed'`（無料）または `pending_payment` + 15 分仮押さえ（有料）
- 匿名 SELECT by `cancel_token` RLS ポリシー（`anon_select_by_cancel_token`）
- ゲストキャンセル (`cancelled_by='guest'`) / ホストキャンセル (`cancelled_by='host'`)
- 管理画面: 予約一覧（リスト + 月間カレンダー）、予約商品 CRUD、CSV エクスポート
- `fb-booking-notify` Edge Function（Brevo Transactional Email、ゲスト + ホスト通知）
- pg_net トリガー `trg_booking_appointment_notify`（INSERT / status 変化で Edge Function 呼び出し）
- SSO v2 (PKCE Exchange) で Hub 経由認証

### ⏸ スコープ外（Phase 4-B 以降）

- **Phase 4-B**: `tpl-checkout` 側で `?booking_appointment_id=…` を受け取って `fb_bookings.price` を読み込み、決済成功 webhook で `status='confirmed'` UPDATE。cart リポ側の改修。
- **Phase 4-C**: AI 一括生成との結線。`useAIGeneration.ts` の booking ケース、`fb_bookings` UPDATE パス、`tpl-booking.booking_url` の自動差し替え。Layer 0 で整備した `prompt_template` / `default_config` を参照。
- **Phase 4-D**: Calendly / Cal.com 連携（外部カレンダー同期、自動 Zoom URL 生成）。
- **Phase B**: Lindo iframe 埋め込み配信 (`/embed/:slug` の本実装)、`X-Frame-Options` / CSP、`postMessage` 高さ同期、`partner_embed_domains` テーブル。

### 🐛 既知の課題（次セッション以降で対応予定）

- `get_available_slots` RPC が `schedule_pattern.start_time` を UTC 扱いしている（Phase 3-E で適用）。`timezone` カラムを反映するよう修正する必要がある。現状 JST 10:00-17:00 指定でも UTC で解釈され、UI 上では 19:00-02:00 JST の枠が表示される。
- `tpl-booking` の `booking_url` を `https://book.digicollabo.com/{subdomain}/{booking_slug}` に手動差し替えする運用で MVP を回す（AI 自動差し替えは 4-C）。
- 管理ダッシュボード UI のさらなる磨き込み + Event Factory V2 からのカレンダー UI 流用（Wave 3 残り）。

## 関連リポジトリ

- [`diginaka/digicollab-flow-builder-cart`](https://github.com/diginaka/digicollab-flow-builder-cart) — 決済 (tpl-checkout) / 既存 Stripe 連携。Phase 4-B で改修対象。
- `digicollab-flow-builder` — LP テンプレート、`tpl-booking` を保持。

## 不可侵

- Event Factory v2（Remo ラウンジ予約、内部メンバー用）には触らない。`remo_table_bookings`, `remo_room_config`, 4 ルーム構成も別系統。
- 既存 `tpl-booking` の slot_schema 17 フィールド、prompt_template（1717 文字、LINK型）は変更しない。
- SSO v2 Edge Function (`fb-sso-exchange`, `fb-sso-issue-code`) には触らない。
