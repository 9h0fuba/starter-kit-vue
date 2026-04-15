import type { Budget, ExpenseAccount, ExpenseCategory } from './types'

export const db: {
  expense_categories: ExpenseCategory[]
  expense_accounts: ExpenseAccount[]
  budgets: Budget[]
} = {
  expense_categories: [
    { id: 1, name: "BEBAN KEPERLUAN KANTOR", code: "BKK" },
    { id: 2, name: "BEBAN GAJI DAN UPAH", code: "BGU" },
    { id: 3, name: "BEBAN KESEJAHTERAAN PEGAWAI", code: "BKP" },
    { id: 4, name: "BEBAN PENDIDIKAN & PELATIHAN", code: "BPL" },
    { id: 5, name: "BEBAN OPERASIONAL LAIN", code: "BOL" }
  ],

  expense_accounts: [
    { id: 101, category_id: 1, name: "BEBAN LISTRIK" },
    { id: 102, category_id: 1, name: "BEBAN MATERAI" },
    { id: 103, category_id: 1, name: "BEBAN PENGADAAN AIR" },
    { id: 104, category_id: 1, name: "BEBAN PENGELOLAAN ARSIP" },
    { id: 201, category_id: 2, name: "BEBAN GAJI DASAR" },
    { id: 202, category_id: 2, name: "BEBAN LEMBUR" },
    { id: 301, category_id: 3, name: "BEBAN THR" },
    { id: 302, category_id: 3, name: "BEBAN TUNJANGAN TELEPON" },
    { id: 401, category_id: 4, name: "BEBAN PELATIHAN LEADERSHIP" },
    { id: 402, category_id: 4, name: "BEBAN PELATIHAN IT" }
  ],

  budgets: []
}

const units = ["AFC1", "AFC2", "IT-DEV", "HR-CORP", "FIN-OPS"]
const fiscalYear = 2026
let currentId = 1

units.forEach((unit) => {
  db.expense_accounts.forEach((acc) => {
    const allocated = Math.floor(Math.random() * 500 + 50) * 1000000 
    db.budgets.push({
      id: currentId++,
      unit_id: unit,
      expense_account_id: acc.id,
      norek: `122-000-${Math.floor(100000 + Math.random() * 900000)}`,
      allocated_amount: allocated,
      remaining_amount: allocated - (Math.floor(Math.random() * 10) * 1000000), 
      fiscal_year: fiscalYear
    })
  })
})
