export type Contract = {
  id: number
  name: string
  business: string
  type: 'recurring' | 'installment'
  amount: number
  method: string
  start_month_idx: number
  end_month_idx: number | null
  total_count: number | null
  note: string
  status: 'active' | 'stopped'
}

export type Payment = {
  id: number
  contract_id: number
  name: string
  business: string
  month_idx: number
  amount: number
  method: string
  type: string
  installment_no: number | null
  total_installments: number | null
  paid: boolean
}

export type SingleSale = {
  id: number
  month_idx: number
  name: string
  business: string
  amount: number
  method: string
  note: string
}

export type Expense = {
  id: number
  category: string
  name: string
  amount: number
  note: string
}

export type StrategyEntry = {
  key: string
  value: string
}

export type Balance = {
  id: number
  month_idx: number
  opening: number
  memo: string
}
