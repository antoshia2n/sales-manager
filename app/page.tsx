export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabaseServer'
import SalesManager from '@/components/SalesManager'

export default async function Page() {
  const [salesRes, expensesRes, strategyRes] = await Promise.all([
    supabaseServer.from('sm_sales').select('*').order('created_at', { ascending: true }),
    supabaseServer.from('sm_expenses').select('*').order('created_at', { ascending: true }),
    supabaseServer.from('sm_strategy').select('*'),
  ])

  return (
    <SalesManager
      initialSales={salesRes.data ?? []}
      initialExpenses={expensesRes.data ?? []}
      initialStrategy={strategyRes.data ?? []}
    />
  )
}
