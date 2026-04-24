<script setup lang="ts">
import { computed, ref } from 'vue'
import * as XLSX from 'xlsx'
import employeeData from '@/data/employees'

// --- INTERFACES ---
interface AttendanceLog {
  date: string
  checkIn: string | null
  breakOut: string | null
  breakIn: string | null
  checkOut: string | null
  totalWorkMinutes: number
  workMinutes: number // Jam kerja reguler (tidak termasuk lembur)
  overtimeMinutes: number // Lembur (mulai jam 18.00)
  minusMinutes: number // Total potongan
  isAnomaly: boolean
  rawLogs: string[]
}

interface EmployeeAttendance {
  id: string
  name: string
  department: string
  attendanceDetail: AttendanceLog[]
  presentCount: number
  totalWorkHours: number // workHours + overtime (dalam menit)
  workHours: number // Total jam kerja reguler (menit)
  overtime: number // Total lembur (menit)
  minus: number // Total potongan (menit)
  salary: number
}

// --- SPECIAL NAMES (uppercase, stripped) ---
const SPECIAL_HARI = 'HARI'
const SPECIAL_OYEK = 'OYEK'
const SPECIAL_AGUNG = 'AGUNG'
const SPECIAL_SUPARDI = 'SUPARDI'
const IS_SATURDAY = 6

const isHari = (name: string) => name.includes(SPECIAL_HARI)
const isOyek = (name: string) => name.includes(SPECIAL_OYEK)
const isAgung = (name: string) => name.includes(SPECIAL_AGUNG)
const isSupardi = (name: string) => name.includes(SPECIAL_SUPARDI)
const isSpecialNoBreakDeduct = (name: string) => isHari(name) || isOyek(name) || isAgung(name)

// --- STATE ---
const employeesAttendance = ref<EmployeeAttendance[]>([])
const isProcessing = ref(false)
const searchQuery = ref('')
const selectedEmployee = ref<EmployeeAttendance | null>(null)
const isDetailDialogOpen = ref(false)
const selectedDepartment = ref('Semua Departemen')
const employees = ref(employeeData)

// --- VUEXY TABLE HEADERS ---
const headers = [
  { title: 'KARYAWAN', key: 'name' },
  { title: 'ID', key: 'id' },
  { title: 'DEPARTEMEN', key: 'department' },
  { title: 'KEHADIRAN', key: 'presentCount' },
  { title: 'KERJA REGULER', key: 'workHours' },
  { title: 'LEMBUR', key: 'overtime' },
  { title: 'POTONGAN', key: 'minus' },
  { title: 'TOTAL KERJA', key: 'totalWorkHours' },
  { title: 'GAJI', key: 'salary' },
  { title: 'STATUS', key: 'status' },
  { title: 'AKSI', key: 'actions', sortable: false },
]

// --- HELPER ---
const avatarText = (name: string) => {
  const nameArray = name.split(' ')

  return nameArray.map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

/** Convert "HH:MM" string to total minutes from midnight */
const toMins = (timeStr: string | null): number => {
  if (!timeStr)
    return 0
  const [h, m] = timeStr.split(':').map(Number)

  return h * 60 + m
}

/** Convert minutes-from-midnight to "HH:MM" */
// const minsToTime = (mins: number): string => {
//   const h = Math.floor(mins / 60)
//   const m = mins % 60

//   return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
// }

/**
 * Bulatkan jam Check-In:
 * - menit <= 30 → bulatkan ke bawah (08:28 → 08:00)
 * - menit >= 31 → bulatkan ke atas  (08:31 → 09:00)
 * Khusus Supardi: minimum jam 08:00
 */
const roundCheckIn = (timeStr: string, name: string): number => {
  const [h, m] = timeStr.split(':').map(Number)
  let rounded = m <= 30 ? h * 60 : (h + 1) * 60

  // Khusus Supardi: tidak boleh lebih awal dari jam 08:00
  if (isSupardi(name) && rounded < 8 * 60)
    rounded = 8 * 60

  return rounded
}

/**
 * Bulatkan jam Check-Out:
 * - menit < 30  → bulatkan ke bawah (16:29 → 16:00)
 * - menit >= 30 → bulatkan ke bawah tetap jam yg sama  (rules: kurang dari 30 mnt anggap jam 17, > 30 mnt anggap jam 17)
 * NOTE: Dari rules: "kurang dari 30 menit anggep jam 17, > 30 mnt anggep jam 17" → artinya checkOut selalu dibulatkan ke jam (bukan ke atas)
 * Implementasi: menit < 30 → bulatkan ke bawah, menit >= 30 → bulatkan ke bawah (sama)
 * Ini berarti: checkOut selalu floor ke jam penuh
 */
const roundCheckOut = (timeStr: string): number => {
  const [h] = timeStr.split(':').map(Number)

  // Dari rules: "kurang dari 30 menit anggep jam 17 , > 30 mnt anggep jam 17"
  // Artinya untuk tujuan hitung kerja, checkOut dibulatkan ke jam penuh (floor)
  return h * 60
}

/** Extract unique sorted times from raw string */
const extractTimes = (raw: string): string[] => {
  if (!raw || raw === 'undefined' || raw === 'null')
    return []
  const matches = raw.match(/\d{2}:\d{2}/g) || []

  return [...new Set(matches.map(t => t.trim()))].sort()
}

const getDateIndex = (date: string): number => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() // 0-11
  const checkDate = new Date(currentYear, currentMonth, Number(date))

  return checkDate.getDay()
}

const getRoundedTime = (timeStr: string): number => {
  if (!timeStr)
    return 0

  const [h, m] = timeStr.split(':').map(Number)

  // Logika utama: Jika menit > 30, tambah 1 jam, menit jadi 0.
  // Jika tidak, jam tetap, menit jadi 0.
  const roundedHour = m >= 31 ? h + 1 : h

  // Mengembalikan total menit (misal 09:00 -> 540)
  return roundedHour * 60
}

/**
 * Jika kamu butuh output dalam format string "HH:00" lagi:
 */
const getRoundedTimeString = (timeStr: string): string => {
  const totalMins = getRoundedTime(timeStr)
  const h = Math.floor(totalMins / 60)

  // Format ke "08:00" atau "12:00"
  return `${String(h).padStart(2, '0')}:00`
}

/** Selisih menit antara dua time string */
// const diffMins = (start: string, end: string): number => {
//   return toMins(end) - toMins(start)
// }

/**
 * Hitung potongan istirahat berdasarkan rules:
 * - Threshold breakOut: 13:10. Jika breakOut > 13:10 maka dikurangi (breakIn - breakOut), else 0
 * - Jika selisih breakOut & breakIn < 20 mnt → minus 30 mnt (curang)
 * - Jika breakOut sebelum 13:10 (contoh 12:50, 12:10) → curang → minus 30 mnt
 * - Jika breakOut & breakIn ada dan breakIn > breakOut+10 mnt → minus selisih dari 60 mnt
 *   contoh: breakOut 11:58, breakIn 13:17 → selisih 79 mnt, minus 79-60 = 19?
 *   Dari contoh: "11:58,13:17, maka minus 7 mnt" → 13:17-11:58 = 79 mnt, minus = 79-72?
 *   Dari contoh lain: "13.17 dihitung minus 7 mnt (08:10,11:58,13:20,16:00 8 jam kerja , minus 10 mnt maka 7.50)"
 *   breakIn 13:20, breakOut 11:58, selisih = 82 mnt. Jika normal 60 mnt istirahat, lebih 22 mnt? tapi minus 10...
 *   Lebih konsisten: minus = (breakIn - breakOut) - 60 mnt. Jika > 0 → potong
 * - Khusus Hari, Oyek, Agung: jika tidak ada breakOut & breakIn → tidak minus 30 mnt
 */
const calcBreakDeduction = (
  breakOut: string | null,
  breakIn: string | null,
  name: string,
): number => {
  // 1. Validasi Data Lengkap
  if (!breakOut || !breakIn)
    return isSpecialNoBreakDeduct(name) ? 0 : 30

  const breakOutMins = toMins(breakOut)
  const breakInMins = toMins(breakIn)
  const duration = breakInMins - breakOutMins
  const thresholdMins = toMins('13:10') // 790 menit

  // 2. Cek Curang (Istirahat terlalu cepat / durasi tidak masuk akal)
  if (duration < 20 || duration > 70)
    return 30

  // 3. Cek Keterlambatan Kembali (Threshold 13:10)
  // Ini mencakup contoh: 13:17 -> minus 7, 13:20 -> minus 10
  if (breakInMins > thresholdMins && isSpecialNoBreakDeduct(name) === false)
    return breakInMins - thresholdMins

  // Kita ambil yang terbesar antara 'telat kembali' atau 'kelebihan durasi'
  // const overDurationDeduction = duration > 60 ? duration - 60 : 0

  if (duration > 20 && breakInMins < thresholdMins)// return Math.max(lateDeduction, overDurationDeduction)
    return 0
}

/**
 * Cek apakah ini setengah hari:
 * Rules dari contoh:
 * - (08:40,11:58,13:03) → setengah hari. 3 log, tidak ada checkOut di sore.
 * - (11:58,13:03,17:05) → bukan setengah hari? Total 5 jam → setengah hari
 * - (12:06,12:58,17:01) → "baru dihitung dari jam 1, 4 jam kerja" → setengah hari
 * Definisi: jika checkIn (rounded) >= 12:00 → setengah hari
 * Atau jika total raw duration < 7 jam (420 menit)
 * Dari contoh: "08:40,11:58,13:03 → clock in 9, total kerja 3 jam" → masuk sebelum 12, tapi setengah hari (tidak ada pulang sore)
 * Kunci: jika times.length < 4 DAN checkOut (time terakhir) < 17:00 → setengah hari
 */
const isHalfDay = (times: string[]): boolean => {
  if (times.length === 0)
    return false
  const lastTime = toMins(times[times.length - 1])
  const firstTime = toMins(times[0])
  const rawDuration = lastTime - firstTime

  // Setengah hari jika durasi mentah < 7 jam (420 menit)
  return rawDuration < 7 * 60
}

const safeNum = (val: any): number => {
  const n = Number(val)

  return isNaN(n) ? 0 : n
}

// --- MAIN ANALYZE FUNCTION ---
const analyzeAttendance = (date: string, times: string[], name: string): AttendanceLog => {
  // 1. Inisialisasi State Awal
  const log: AttendanceLog = {
    date,
    checkIn: null,
    breakOut: null,
    breakIn: null,
    checkOut: null,
    totalWorkMinutes: 0,
    workMinutes: 0,
    overtimeMinutes: 0,
    minusMinutes: 0,
    isAnomaly: false,
    rawLogs: [...times], // Clone agar tidak merusak array asli
  }

  // 2. Filter Sabtu (Jika Sabtu, kembalikan log kosong)
  if (getDateIndex(date) === IS_SATURDAY)
    return log

  // 3. Khusus Nama "HARI": Force Check-In 09:00 jika ada log
  if (isHari(name) && times.length > 0) {
    if (!times.includes('09:00')) {
      times.unshift('09:00')
      log.rawLogs = [...times]
    }
  }

  // 4. Pembersihan Log Ganda (Pagi Hari) menggunakan while
  // Menghapus log kedua jika jaraknya < 60 menit dari log pertama
  if (times.length >= 2) {
    while (times.length >= 2 && (toMins(times[1]) - toMins(times[0]) < 60))
      times.splice(1, 1)
  }

  // 5. Mapping Log ke Properti
  log.checkIn = times[0] || null
  if (times.length >= 4) {
    log.breakOut = times[1]
    log.breakIn = times[2]
    log.checkOut = times[times.length - 1]
  }
  else if (times.length === 3) {
    log.breakOut = times[1]
    log.checkOut = times[2]
  }
  else if (times.length === 2) {
    log.checkOut = times[1]
  }

  // Jika tidak ada Check-In atau Check-Out, tidak bisa hitung menit
  if (!log.checkIn || !log.checkOut)
    return log

  // 6. Pembulatan Waktu (Rounding)
  const checkInMins = isHari(name) ? (9 * 60) : roundCheckIn(log.checkIn, name)
  const checkOutRaw = toMins(log.checkOut)
  const checkOutRounded = roundCheckOut(log.checkOut)

  // 7. Cek Setengah Hari & Potongan Istirahat
  const halfDay = isHalfDay(times)
  const breakDeduction = halfDay ? 0 : calcBreakDeduction(log.breakOut, log.breakIn, name)

  // 8. Logika Jam Kerja & Lembur (Berdasarkan durasi 8 jam)
  // Menghitung selisih antara checkout bulat dan checkin bulat
  let grossWorkMins = checkOutRounded - checkInMins
  if (grossWorkMins < 0)
    grossWorkMins = 0

  let workMins = 0
  let overtimeMins = 0

  if (halfDay) {
    workMins = grossWorkMins
    overtimeMins = 0
  }
  else {
    // Jika lebih dari 8 jam (480 mnt), sisanya masuk lembur
    if (grossWorkMins > 480) {
      workMins = 480
      overtimeMins = grossWorkMins - 480
    }
    else {
      workMins = grossWorkMins
      overtimeMins = 0
    }
  }

  // Tambahkan lembur murni dari sisa menit checkout (Raw vs Rounded)
  // Misal: Out 17:15 (Raw) vs 17:00 (Rounded) -> Tambah lembur 15 mnt
  // const extraMins = checkOutRaw - checkOutRounded
  // if (extraMins > 0)
  //   overtimeMins += extraMins

  // 9. Kalkulasi Akhir (Mencegah NaN)
  const totalBeforeDeduct = safeNum(workMins) + safeNum(overtimeMins)
  const finalTotal = Math.max(0, totalBeforeDeduct - safeNum(breakDeduction))

  // 10. Update Object Log
  log.workMinutes = safeNum(workMins)
  log.overtimeMinutes = safeNum(overtimeMins)
  log.minusMinutes = safeNum(breakDeduction)
  log.totalWorkMinutes = safeNum(finalTotal)

  // Anomali jika ada potongan atau log kurang dari 4 (kecuali setengah hari/special name)
  log.isAnomaly = log.minusMinutes > 0 || (times.length < 4 && !halfDay && !isSpecialNoBreakDeduct(name))

  return log
}

// --- COMPUTED ---
const filteredEmployees = computed(() => {
  return employeesAttendance.value.filter(emp => {
    return selectedDepartment.value === 'Semua Departemen' || emp.department === selectedDepartment.value
  })
})

const departmentList = computed(() => {
  const depts = employeesAttendance.value.map(emp => emp.department)

  return ['Semua Departemen', ...new Set(depts)]
})

// --- FILE UPLOAD HANDLER ---
const handleFileUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files?.length)
    return

  isProcessing.value = true
  try {
    const file = target.files[0]
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[2]
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    // --- Baca header tanggal ---
    const workingDates = rows[3]?.slice(0, 7).map(d => String(d)) || []

    console.log('Raw Date Headers:', workingDates)

    const parsedEmployees: EmployeeAttendance[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row && String(row[0]).trim().toUpperCase() === 'ID:') {
        const id = String(row[2] || '')
        const name = String(row[10]).trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '') || ''
        const dept = String(row[20] || '')
        const logRow = rows[i + 1] || []

        // Proses hanya kolom valid (skip Sabtu)
        const detail: AttendanceLog[] = workingDates.map((dateStr, index) => {
          const rawLog = String(logRow[index] || '')

          return analyzeAttendance(
            dateStr,
            extractTimes(rawLog),
            name,
          )
        })

        const hasWorkedThisWeek = detail.some(log => log.rawLogs.length > 0)

        // 3. Logika Tambah Sabtu (Hanya jika Jumat adalah hari terakhir DAN dia pernah masuk)
        if (hasWorkedThisWeek && detail.length > 0) {
          // Ambil tanggal terakhir, pastikan dia angka sebelum ditambah 1
          const lastDateInExcel = detail[detail.length - 1].date
          const nextDate = String(Number(lastDateInExcel) + 1)

          const virtualSaturday: AttendanceLog = {
            date: nextDate, // Ini akan jadi tanggal 25 jika terakhir 24
            checkIn: '09:00',
            breakOut: '12:00',
            breakIn: '13:00',
            checkOut: '17:00',
            totalWorkMinutes: 480,
            workMinutes: 480,
            overtimeMinutes: 0,
            minusMinutes: 0,
            isAnomaly: false,
            rawLogs: ['SABTU-AUTO'], // Pakai penanda agar tahu ini auto-generate
          }

          detail.push(virtualSaturday)
        }

        const totalWork = detail.reduce((acc, d) => acc + d.workMinutes, 0)
        const totalOvertime = detail.reduce((acc, d) => acc + d.overtimeMinutes, 0)
        const totalMinus = detail.reduce((acc, d) => acc + d.minusMinutes, 0)
        const totalAll = detail.reduce((acc, d) => acc + d.totalWorkMinutes, 0)

        const master = employees.value.find(emp => String(emp.id) === id)
        const hourlyRate = master?.salary || 0
        const calculatedSalary = (totalAll / 60) * hourlyRate

        parsedEmployees.push({
          id,
          name,
          department: dept,
          attendanceDetail: detail,
          presentCount: detail.filter(d => d.rawLogs.length > 0).length,
          totalWorkHours: totalAll,
          workHours: totalWork,
          overtime: totalOvertime,
          minus: totalMinus,
          salary: calculatedSalary,
        })
        if (parsedEmployees.some(emp => emp.name === 'OYEK'))
          console.log('Parsed Employees:', parsedEmployees)
      }
    }

    employeesAttendance.value = parsedEmployees
  }
  catch (err) {
    console.error(err)
  }
  finally {
    isProcessing.value = false
  }
}

const openDetail = (item: EmployeeAttendance) => {
  selectedEmployee.value = item
  isDetailDialogOpen.value = true
}

const formatTime = (mins: number) => {
  if (mins === 0)
    return '0j 0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60

  return m > 0 ? `${h}j ${m}m` : `${h}j`
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

const calculateMoney = (minutes: number, id: string) => {
  // Cari master data untuk ambil rate salary-nya
  const master = employees.value.find(emp => String(emp.id) === String(id))
  const hourlyRate = master?.salary || 0

  // Hitung: (menit / 60) * rate per jam
  return Math.round((minutes / 60) * hourlyRate)
}
</script>

<template>
  <VCard>
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <VFileInput
            label="Upload Absensi"
            prepend-inner-icon="tabler-file-spreadsheet"
            density="compact"
            variant="outlined"
            @change="handleFileUpload"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="searchQuery"
            label="Cari Karyawan"
            prepend-inner-icon="tabler-search"
            density="compact"
            variant="outlined"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VSelect
            v-model="selectedDepartment"
            :items="departmentList"
            label="Filter Departemen"
            prepend-inner-icon="tabler-filter"
            density="compact"
            variant="outlined"
          />
        </VCol>
      </VRow>
    </VCardText>

    <VDataTable
      v-if="filteredEmployees.length > 0"
      :headers="headers"
      :items="filteredEmployees"
      :search="searchQuery"
      :items-per-page="10"
      class="text-no-wrap"
    >
      <!-- Karyawan -->
      <template #item.name="{ item }">
        <div class="d-flex align-center">
          <VAvatar
            size="34"
            variant="tonal"
            color="primary"
            class="me-3"
          >
            <span class="text-xs">{{ avatarText(item.name) }}</span>
          </VAvatar>
          <div class="d-flex flex-column">
            <span class="font-weight-medium text-high-emphasis text-truncate">{{ item.name }}</span>
            <small class="text-disabled">{{ item.department }}</small>
          </div>
        </div>
      </template>

      <!-- Kehadiran -->
      <template #item.presentCount="{ item }">
        <span class="font-weight-bold text-primary">{{ item.presentCount }}</span>
        <span class="text-disabled"> / {{ item.attendanceDetail.length }} Hari</span>
      </template>

      <!-- Kerja Reguler -->
      <template #item.workHours="{ item }">
        <span class="text-success font-weight-medium">{{ formatTime(item.workHours) }}</span>
      </template>

      <!-- Lembur -->
      <template #item.overtime="{ item }">
        <VChip
          v-if="item.overtime > 0"
          color="warning"
          size="small"
          variant="tonal"
        >
          +{{ formatTime(item.overtime) }}
        </VChip>
        <span
          v-else
          class="text-disabled"
        >-</span>
      </template>

      <!-- Potongan -->
      <template #item.minus="{ item }">
        <VChip
          v-if="item.minus > 0"
          color="error"
          size="small"
          variant="tonal"
        >
          -{{ formatTime(item.minus) }}
        </VChip>
        <span
          v-else
          class="text-success"
        >-</span>
      </template>

      <!-- Total Kerja -->
      <template #item.totalWorkHours="{ item }">
        <div class="d-flex flex-column align-center">
          <span class="font-weight-bold text-high-emphasis">{{ formatTime(item.totalWorkHours) }}</span>
          <VProgressLinear
            :model-value="(item.totalWorkHours / (40 * 60)) * 100"
            color="primary"
            height="4"
            rounded
            class="mt-1"
            style="inline-size: 60px;"
          />
        </div>
      </template>

      <!-- Template Salary -->
      <template #item.salary="{ item }">
        <span class="font-weight-medium text-high-emphasis">
          {{ formatCurrency(item.salary) }}
        </span>
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <VChip
          :color="item.presentCount >= 5 ? 'success' : (item.presentCount > 0 ? 'warning' : 'error')"
          size="small"
          class="font-weight-medium"
        >
          {{ item.presentCount >= 5 ? 'Full' : (item.presentCount > 0 ? 'Partial' : 'Absent') }}
        </VChip>
      </template>

      <!-- Aksi -->
      <template #item.actions="{ item }">
        <VBtn
          icon
          size="x-small"
          color="default"
          variant="text"
          @click="openDetail(item)"
        >
          <VIcon
            size="22"
            icon="tabler-eye"
          />
        </VBtn>
      </template>
    </VDataTable>
  </VCard>

  <VCard class="mt-6">
    <EmployeeTable
      :data="employees"
      :search="searchQuery"
      @view-detail="(emp: any) => console.log('view detail', emp.name)"
    />
  </VCard>

  <!-- DETAIL DIALOG -->
  <VDialog
    v-model="isDetailDialogOpen"
    max-width="1100"
  >
    <VCard
      v-if="selectedEmployee"
      class="bg-surface"
    >
      <!-- Header -->
      <VCardItem class="py-5">
        <div class="d-flex align-center gap-3 flex-wrap">
          <VCardTitle class="text-h5 font-weight-bold">
            Detail Absensi — {{ selectedEmployee.name }} ||
            <VChip
              color="primary"
              variant="tonal"
              size="small"
            >
              <VIcon
                start
                icon="mdi-cash-multiple"
                size="14"
              />
              {{ selectedEmployee.salary > 0 ? formatCurrency(selectedEmployee.salary) : 'Gak Kerjo Kok Njaluk Bayaran' }}
            </VChip>
          </VCardTitle>
        </div>
        <!-- Summary chips -->
        <div class="d-flex gap-2 mt-2 flex-wrap">
          <VChip
            color="success"
            variant="tonal"
            size="small"
          >
            <VIcon
              start
              icon="tabler-briefcase"
              size="14"
            />
            Reguler: {{ formatTime(selectedEmployee.workHours) }}
            {{ formatCurrency(calculateMoney(selectedEmployee.workHours, selectedEmployee.id)) }}
          </VChip>
          <VChip
            color="warning"
            variant="tonal"
            size="small"
          >
            <VIcon
              start
              icon="tabler-clock-up"
              size="14"
            />
            Lembur: +{{ formatTime(selectedEmployee.overtime) }}
            {{ formatCurrency(calculateMoney(selectedEmployee.overtime, selectedEmployee.id)) }}
          </VChip>
          <VChip
            color="error"
            variant="tonal"
            size="small"
          >
            <VIcon
              start
              icon="tabler-clock-minus"
              size="14"
            />
            Potongan: -{{ formatTime(selectedEmployee.minus) }}
            {{ formatCurrency(calculateMoney(selectedEmployee.minus, selectedEmployee.id)) }}
          </VChip>
          <VChip
            color="primary"
            variant="tonal"
            size="small"
          >
            <VIcon
              start
              icon="tabler-sum"
              size="14"
            />
            Total: {{ formatTime(selectedEmployee.totalWorkHours) }}
            {{ formatCurrency(calculateMoney(selectedEmployee.totalWorkHours, selectedEmployee.id)) }}
          </VChip>
        </div>
        <template #append>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="default"
            @click="isDetailDialogOpen = false"
          />
        </template>
      </VCardItem>

      <VCardText class="pa-0">
        <VTable class="custom-attendance-table">
          <thead>
            <tr>
              <th class="text-uppercase text-caption font-weight-bold">
                Tanggal
              </th>
              <th class="text-uppercase text-caption font-weight-bold">
                Masuk
              </th>
              <th class="text-uppercase text-caption font-weight-bold">
                Keluar Istirahat
              </th>
              <th class="text-uppercase text-caption font-weight-bold">
                Masuk Istirahat
              </th>
              <th class="text-uppercase text-caption font-weight-bold">
                Pulang
              </th>
              <th class="text-uppercase text-caption font-weight-bold text-center">
                Reguler
              </th>
              <th class="text-uppercase text-caption font-weight-bold text-center">
                Lembur
              </th>
              <th class="text-uppercase text-caption font-weight-bold text-center">
                Potongan
              </th>
              <th class="text-uppercase text-caption font-weight-bold text-center">
                Total Kerja
              </th>
              <th class="text-uppercase text-caption font-weight-bold text-center">
                Ket.
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in selectedEmployee.attendanceDetail"
              :key="log.date"
              :class="{ 'bg-error-subtle': log.isAnomaly }"
            >
              <!-- Tanggal -->
              <td class="font-weight-bold text-body-1">
                {{ log.date }}
              </td>

              <!-- Masuk -->
              <td class="font-mono">
                <span
                  v-if="log.checkIn"
                  class="text-success font-weight-bold"
                >{{ log.checkIn }}</span>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>

              <!-- Keluar Istirahat -->
              <td class="font-mono">
                <span
                  v-if="log.breakOut"
                  class="text-warning"
                >{{ log.breakOut }}</span>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>

              <!-- Masuk Istirahat -->
              <td class="font-mono">
                <span
                  v-if="log.breakIn"
                  class="text-warning"
                >{{ log.breakIn }}</span>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>

              <!-- Pulang -->
              <td class="font-mono">
                <span
                  v-if="log.checkOut"
                  class="text-error font-weight-bold"
                >{{ log.checkOut }}</span>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>

              <!-- Reguler -->
              <td class="text-center">
                <VChip
                  v-if="log.workMinutes > 0"
                  color="success"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold"
                >
                  {{ formatTime(log.workMinutes) }}
                </VChip>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>

              <!-- Lembur -->
              <td class="text-center">
                <VChip
                  v-if="log.overtimeMinutes > 0"
                  color="warning"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold"
                >
                  +{{ formatTime(log.overtimeMinutes) }}
                </VChip>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>

              <!-- Potongan -->
              <td class="text-center">
                <VChip
                  v-if="log.minusMinutes > 0"
                  color="error"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold"
                >
                  -{{ formatTime(log.minusMinutes) }}
                </VChip>
                <span
                  v-else
                  class="text-success"
                >-</span>
              </td>

              <!-- Total Kerja -->
              <td class="text-center">
                <VChip
                  v-if="log.totalWorkMinutes > 0"
                  color="info"
                  variant="tonal"
                  size="small"
                  class="rounded-sm font-weight-bold"
                  style="min-inline-size: 70px;"
                >
                  {{ formatTime(log.totalWorkMinutes) }}
                </VChip>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>

              <!-- Keterangan -->
              <td class="text-center">
                <VTooltip
                  v-if="log.rawLogs.includes('SABTU-AUTO')"
                  text="Sabtu otomatis 8 jam"
                >
                  <template #activator="{ props }">
                    <VIcon
                      v-bind="props"
                      icon="tabler-calendar-check"
                      color="info"
                      size="18"
                    />
                  </template>
                </VTooltip>
                <VTooltip
                  v-else-if="log.isAnomaly"
                  :text="`Anomali: potongan ${formatTime(log.minusMinutes)}`"
                >
                  <template #activator="{ props }">
                    <VIcon
                      v-bind="props"
                      icon="tabler-alert-triangle"
                      color="warning"
                      size="18"
                    />
                  </template>
                </VTooltip>
                <VTooltip
                  v-else-if="log.overtimeMinutes > 0"
                  :text="`Lembur ${formatTime(log.overtimeMinutes)}`"
                >
                  <template #activator="{ props }">
                    <VIcon
                      v-bind="props"
                      icon="tabler-clock-up"
                      color="success"
                      size="18"
                    />
                  </template>
                </VTooltip>
                <span
                  v-else-if="log.rawLogs.length === 0"
                  class="text-disabled"
                >—</span>
                <VIcon
                  v-else
                  icon="tabler-check"
                  color="success"
                  size="18"
                />
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>

      <!-- Footer total -->
      <VCardText class="d-flex justify-end gap-3 pt-4">
        <div class="text-caption text-disabled">
          <VIcon
            icon="tabler-alert-triangle"
            size="14"
            color="warning"
          /> = Anomali / Potongan istirahat
          &nbsp;|&nbsp;
          <VIcon
            icon="tabler-clock-up"
            size="14"
            color="success"
          /> = Lembur
          &nbsp;|&nbsp;
          <VIcon
            icon="tabler-calendar-check"
            size="14"
            color="info"
          /> = Sabtu otomatis
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>
