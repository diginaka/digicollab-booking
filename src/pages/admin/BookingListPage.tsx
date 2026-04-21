import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { deleteBooking, listMyBookings, toggleActive } from '@/lib/bookingRepository'
import { formatDuration, formatYen } from '@/lib/utils'

export function BookingListPage() {
  const qc = useQueryClient()
  const bookingsQ = useQuery({ queryKey: ['my-bookings'], queryFn: listMyBookings })

  const handleToggle = async (id: string, next: boolean) => {
    try {
      await toggleActive(id, next)
      await qc.invalidateQueries({ queryKey: ['my-bookings'] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '更新に失敗しました')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`「${title}」を削除します。紐づく予約履歴はキャンセル扱いとして残ります。続行しますか?`)) return
    try {
      await deleteBooking(id)
      toast.success('削除しました')
      await qc.invalidateQueries({ queryKey: ['my-bookings'] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '削除に失敗しました')
    }
  }

  const copyUrl = async (subdomain: string, slug: string) => {
    const url = `${import.meta.env.VITE_BOOK_URL || window.location.origin}/${subdomain}/${slug}`
    await navigator.clipboard.writeText(url)
    toast.success('URLをコピーしました')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">予約商品</h1>
          <p className="text-sm text-slate-500">ゲスト向けの予約ページを管理します</p>
        </div>
        <Button asChild>
          <Link to="/admin/bookings/new">
            <Plus className="mr-1 h-4 w-4" /> 新規作成
          </Link>
        </Button>
      </div>

      {bookingsQ.isLoading && <div className="text-sm text-slate-500">読み込み中…</div>}

      {!bookingsQ.isLoading && (bookingsQ.data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="text-lg font-medium">まだ予約商品がありません</div>
            <p className="text-sm text-slate-500">最初の予約商品を作成してゲストにURLを共有しましょう。</p>
            <Button asChild>
              <Link to="/admin/bookings/new">
                <Plus className="mr-1 h-4 w-4" /> 新規作成
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {bookingsQ.data?.map((b) => {
          const url = `${import.meta.env.VITE_BOOK_URL || window.location.origin}/_/${b.booking_slug}`
          return (
            <Card key={b.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{b.title}</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={b.price > 0 ? 'default' : 'success'}>{formatYen(b.price)}</Badge>
                      <Badge variant="muted">{formatDuration(b.duration_minutes)}</Badge>
                      <Badge variant={b.is_active ? 'success' : 'muted'}>
                        {b.is_active ? '公開中' : '非公開'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={b.is_active}
                      onCheckedChange={(v) => handleToggle(b.id, Boolean(v))}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/bookings/${b.id}`}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> 編集
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id, b.title)}>
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                  <code className="flex-1 truncate">{url}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyUrl('_', b.booking_slug)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <a href={url} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
                {b.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{b.description}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
