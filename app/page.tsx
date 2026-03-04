export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabaseServer'
import SalesManager from '@/components/SalesManager'

export default async function Page() {
  const [contractsRes, paymentsRes, singlesRes, expensesRes, strategyRes] = await Promise.all([
    supabaseServer.from('sm_contracts').select('*').order('created_at', { ascending: true }),
    supabaseServer.from('sm_payments').select('*').order('month_idx', { ascending: true }),
    supabaseServer.from('sm_singles').select('*').order('month_idx', { ascending: true }),
    supabaseServer.from('sm_expenses').select('*').order('created_at', { ascending: true }),
    supabaseServer.from('sm_strategy').select('*'),
  ])

  return (
    <SalesManager
      initialContracts={contractsRes.data ?? []}
      initialPayments={paymentsRes.data ?? []}
      initialSingles={singlesRes.data ?? []}
      initialExpenses={expensesRes.data ?? []}
      initialStrategy={strategyRes.data ?? []}
    />
  )
}
