// types.ts

export interface ExpenseCategory {
  id: number
  name: string
  code: string
}

export interface ExpenseAccount {
  id: number
  category_id: number
  name: string
}

export interface Unit {
  id: string
  division_id: number
  name: string
  code: string
}

export interface Budget {
  id: number
  unit_id: string
  expense_account_id: number
  norek: string
  allocated_amount: number
  remaining_amount: number
  fiscal_year: number
}

export interface BudgetResponse extends Budget {
  account_name: string
  category_name: string
}
