import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 入金済み/未済のトグル、または将来予定の一括削除
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { data, error } = await supabaseServer
    .from('sm_payments')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await supabaseServer
    .from('sm_payments')
    .delete()
    .eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
