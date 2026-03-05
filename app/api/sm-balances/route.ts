import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const { data, error } = await supabaseServer
    .from('sm_balances')
    .select('*')
    .order('month_idx', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { data, error } = await supabaseServer
    .from('sm_balances')
    .upsert({ month_idx: body.month_idx, opening: body.opening, memo: body.memo ?? '', updated_at: new Date().toISOString() }, { onConflict: 'month_idx' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
