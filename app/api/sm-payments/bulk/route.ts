import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 契約停止時: contract_id と month_idx > X の未払い予定を一括削除
// PATCH /api/sm-payments/bulk { action: 'delete_future', contract_id, from_month_idx }
export async function PATCH(req: Request) {
  const body = await req.json()

  if (body.action === 'delete_future') {
    const { error } = await supabaseServer
      .from('sm_payments')
      .delete()
      .eq('contract_id', body.contract_id)
      .gt('month_idx', body.from_month_idx)
      .eq('paid', false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // 月ごと一括入金確認
  if (body.action === 'mark_month_paid') {
    const { error } = await supabaseServer
      .from('sm_payments')
      .update({ paid: true })
      .eq('month_idx', body.month_idx)
      .eq('paid', false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
