// index.ts (Handler Apps Budgets)
import { paginateArray } from '@api-utils/paginateArray'
import { destr } from 'destr'
import { http, HttpResponse } from 'msw'
import { db } from './db'

export const handlerAppsBudgets = [
  
  /**
   * 1. GET: Fetch Budgets with Advanced Filtering & Joins
   * Digunakan untuk tabel utama. Menggabungkan data Budget dengan Master Account & Category.
   */
  http.get('/api/apps/budgets', ({ request }) => {
    const url = new URL(request.url)
    
    // Extract query parameters
    const q = url.searchParams.get('q')
    const unitId = url.searchParams.get('unitId')
    const categoryId = url.searchParams.get('categoryId')
    const fiscalYear = url.searchParams.get('fiscalYear')
    const page = destr(url.searchParams.get('page')) || 1
    const itemsPerPage = destr(url.searchParams.get('itemsPerPage')) || 10

    // Join Logic (Denormalization for Frontend)
    let results = db.budgets.map(budget => {
      const account = db.expense_accounts.find(a => a.id === budget.expense_account_id)
      const category = db.expense_categories.find(c => c.id === account?.category_id)
      
      return {
        ...budget,
        account_name: account?.name || 'N/A',
        category_id: category?.id,
        category_name: category?.name || 'N/A',
      }
    })

    // Search Filter (Norek or Account Name)
    if (q) {
      const query = q.toLowerCase()
      results = results.filter(b => 
        b.account_name.toLowerCase().includes(query) || 
        b.norek.includes(query)
      )
    }

    // Direct Filters
    if (unitId) results = results.filter(b => b.unit_id === unitId)
    if (categoryId) results = results.filter(b => b.category_id === Number(categoryId))
    if (fiscalYear) results = results.filter(b => b.fiscal_year === Number(fiscalYear))

    const totalResults = results.length
    const totalPages = Math.ceil(totalResults / (itemsPerPage as number))

    return HttpResponse.json({
      budgets: paginateArray(results, itemsPerPage as number, page as number),
      totalPages,
      totalResults,
      page
    }, { status: 200 })
  }),

  /**
   * 2. POST: Create New Budget Allocation
   * Menambahkan rekening beban baru ke unit tertentu.
   */
  http.post('/api/apps/budgets', async ({ request }) => {
    const payload = await request.json() as any

    // Validasi Integritas: Cegah Duplikasi (Unit + Account + Year)
    const exists = db.budgets.find(b => 
      b.unit_id === payload.unit_id && 
      b.expense_account_id === payload.expense_account_id &&
      b.fiscal_year === payload.fiscal_year
    )

    if (exists) {
      return HttpResponse.json(
        { message: 'Rekening ini sudah terdaftar untuk unit tersebut di tahun fiskal ini.' }, 
        { status: 400 }
      )
    }

    const newBudget = {
      ...payload,
      id: db.budgets.length > 0 ? Math.max(...db.budgets.map(b => b.id)) + 1 : 1,
      remaining_amount: payload.allocated_amount, // Awalnya sisa saldo sama dengan alokasi
    }

    db.budgets.unshift(newBudget) // Tambahkan ke paling atas
    return HttpResponse.json(newBudget, { status: 201 })
  }),

  /**
   * 3. GET: List Categories & Accounts for Cascading Dropdowns
   * Digunakan di Form Tambah Rekening (Pilih Kategori -> Filter Akun)
   */
  http.get('/api/apps/budgets/master-options', () => {
    return HttpResponse.json({
      categories: db.expense_categories,
      accounts: db.expense_accounts
    }, { status: 200 })
  }),

  /**
   * 4. PATCH: Update Allocation Amount
   * Simulasi penyesuaian budget di tengah jalan.
   */
  http.patch('/api/apps/budgets/:id', async ({ params, request }) => {
    const id = Number(params.id)
    const { new_allocation } = await request.json() as any
    
    const index = db.budgets.findIndex(b => b.id === id)
    if (index === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 })

    const diff = new_allocation - db.budgets[index].allocated_amount
    
    db.budgets[index].allocated_amount = new_allocation
    db.budgets[index].remaining_amount += diff // Sesuaikan sisa saldo

    return HttpResponse.json(db.budgets[index], { status: 200 })
  }),

  /**
   * 5. DELETE: Remove Budget Allocation
   * Hanya boleh jika belum ada uang yang dipakai (integrity rule).
   */
  http.delete('/api/apps/budgets/:id', ({ params }) => {
    const id = Number(params.id)
    const budget = db.budgets.find(b => b.id === id)

    if (!budget) return HttpResponse.json({ message: 'Not found' }, { status: 404 })

    if (budget.remaining_amount < budget.allocated_amount) {
      return HttpResponse.json(
        { message: 'Gagal hapus: Rekening ini sudah memiliki riwayat pemakaian saldo.' }, 
        { status: 400 }
      )
    }

    const index = db.budgets.findIndex(b => b.id === id)
    db.budgets.splice(index, 1)

    return new HttpResponse(null, { status: 204 })
  })
]
