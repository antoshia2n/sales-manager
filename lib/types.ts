export type Sale = {
  id: number
  month: string
  name: string
  business: string
  amount: number
  type: string
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
