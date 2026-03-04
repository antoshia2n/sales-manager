import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const { data, error } = await supabaseServer
    .from('sm_payments')
    .select('*')
    .order('month_idx', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json() // 配列で受け取る
  const rows = Array.isArray(body) ? body : [body]
  const { data, error } = await supabaseServer
    .from('sm_payments')
    .insert(rows)
    .select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
