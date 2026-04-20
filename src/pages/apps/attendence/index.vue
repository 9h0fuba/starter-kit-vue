<script setup lang="ts">
import { ref } from 'vue'
import * as XLSX from 'xlsx'

// --- INTERFACES ---
interface AttendanceLog {
  date: string
  checkIn: string | null
  breakOut: string | null
  breakIn: string | null
  checkOut: string | null
  totalWorkMinutes: number
  isAnomaly: boolean
  rawLogs: string[]
}

interface EmployeeAttendance {
  id: string
  name: string
  department: string
  attendanceDetail: AttendanceLog[]
  presentCount: number
  totalWorkHours: number
}

// --- STATE ---
const employees = ref<EmployeeAttendance[]>([])
const isProcessing = ref(false)
const searchQuery = ref('')
const selectedEmployee = ref<EmployeeAttendance | null>(null)
const isDetailDialogOpen = ref(false)
const selectedDepartment = ref('Semua Departemen')

// --- VUEXY TABLE HEADERS ---
const headers = [
  { title: 'KARYAWAN', key: 'name' },
  { title: 'ID', key: 'id' },
  { title: 'DEPARTEMEN', key: 'department' },
  { title: 'KEHADIRAN', key: 'presentCount' },
  { title: 'TOTAL KERJA', key: 'totalWorkHours' },
  { title: 'STATUS', key: 'status' },
  { title: 'AKSI', key: 'actions', sortable: false },
]

// --- HELPER: Inisial Nama untuk Avatar ---
const avatarText = (name: string) => {
  const nameArray = name.split(' ')

  return nameArray.map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// --- LOGIC PARSER ---
const extractTimes = (raw: string): string[] => {
  if (!raw || raw === 'undefined' || raw === 'null')
    return []
  const matches = raw.match(/\d{2}:\d{2}/g) || []

  return [...new Set(matches.map(t => t.trim()))].sort()
}

const diffInMinutes = (start: string, end: string): number => {
  const [h1, m1] = start.split(':').map(Number)
  const [h2, m2] = end.split(':').map(Number)

  return (h2 * 60 + m2) - (h1 * 60 + m1)
}

const analyzeAttendance = (date: string, times: string[]): AttendanceLog => {
  const log: AttendanceLog = {
    date,
    checkIn: times[0] || null,
    breakOut: times.length >= 4 ? times[1] : null,
    breakIn: times.length >= 4 ? times[2] : null,
    checkOut: times.length > 1 ? times[times.length - 1] : null,
    totalWorkMinutes: 0,
    isAnomaly: times.length > 0 && times.length < 4,
    rawLogs: times,
  }

  if (log.checkIn && log.checkOut) {
    const totalDuration = diffInMinutes(log.checkIn, log.checkOut)

    log.totalWorkMinutes = totalDuration > 240 ? totalDuration - 60 : totalDuration
  }

  return log
}

// --- COMPUTED: Filtered Employees ---
const filteredEmployees = computed(() => {
  return employees.value.filter(emp => {
    return selectedDepartment.value === 'Semua Departemen' || emp.department === selectedDepartment.value
  })
})

const departmentList = computed(() => {
  const depts = employees.value.map(emp => emp.department)

  return ['Semua Departemen', ...new Set(depts)]
})

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

    const dateHeaders = rows[3]?.slice(0, 7).map(d => String(d)) || []
    const parsedEmployees: EmployeeAttendance[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row && String(row[0]).trim().toUpperCase() === 'ID:') {
        const id = String(row[2] || '')
        const name = String(row[10] || '')
        const dept = String(row[20] || '')
        const logRow = rows[i + 1] || []

        const detail = dateHeaders.map((date, colIdx) => {
          return analyzeAttendance(date, extractTimes(String(logRow[colIdx] || '')))
        })

        const totalMinutes = detail.reduce((acc, curr) => acc + curr.totalWorkMinutes, 0)

        parsedEmployees.push({
          id,
          name,
          department: dept,
          attendanceDetail: detail,
          presentCount: detail.filter(d => d.rawLogs.length > 0).length,
          totalWorkHours: totalMinutes,
        })
      }
    }

    employees.value = parsedEmployees
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

const formatTimeDisplay = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60

  return `${h}j ${m}m`
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

    <!-- TABLE START (Vuexy Style) -->
    <VDataTable
      :headers="headers"
      :items="filteredEmployees"
      :search="searchQuery"
      :items-per-page="10"
      class="text-no-wrap"
    >
      <!-- Template Karyawan (Avatar + Nama + Dept) -->
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

      <!-- Template Jumlah Hadir -->
      <template #item.presentCount="{ item }">
        <span class="font-weight-bold text-primary">{{ item.presentCount }}</span>
        <span class="text-disabled"> / 7 Hari</span>
      </template>

      <!-- Template Status -->
      <template #item.status="{ item }">
        <VChip
          :color="item.presentCount >= 5 ? 'success' : (item.presentCount > 0 ? 'warning' : 'error')"
          size="small"
          class="font-weight-medium"
        >
          {{ item.presentCount >= 5 ? 'Full' : (item.presentCount > 0 ? 'Partial' : 'Absent') }}
        </VChip>
      </template>

      <template #item.totalWorkHours="{ item }">
        <div class="d-flex flex-column align-center">
          <span class="font-weight-medium text-high-emphasis">
            {{ Math.floor(item.totalWorkHours / 60) }}j {{ item.totalWorkHours % 60 }}m
          </span>
          <VProgressLinear
            :model-value="(item.totalWorkHours / (40 * 60)) * 100"
            color="primary"
            height="4"
            rounded
            class="mt-1"
            style="inline-size: 50px;"
          />
          <!-- 40 jam dianggap sebagai target kerja seminggu -->
        </div>
      </template>

      <!-- Template Aksi -->
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

  <!-- DETAIL DIALOG -->
  <!-- Detail Dialog -->
  <VDialog
    v-model="isDetailDialogOpen"
    max-width="900"
  >
    <VCard
      v-if="selectedEmployee"
      class="bg-surface"
    >
      <!-- Judul & Total Waktu Kerja -->
      <VCardItem class="py-5">
        <div class="d-flex align-center gap-2">
          <VCardTitle class="text-h5 font-weight-bold">
            Detail Riwayat Absensi
          </VCardTitle>
          <span class="text-disabled">|</span>
          <span class="text-subtitle-1 text-secondary">
            Total work hours:
            <span class="text-primary font-weight-bold">
              {{ Math.floor(selectedEmployee.totalWorkHours / 60) }}j {{ selectedEmployee.totalWorkHours % 60 }}m
            </span>
          </span>
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
                Masuk Istirahat
              </th>
              <th class="text-uppercase text-caption font-weight-bold">
                Keluar Istirahat
              </th>
              <th class="text-uppercase text-caption font-weight-bold">
                Pulang
              </th>
              <th class="text-uppercase text-caption font-weight-bold text-center">
                Total Kerja
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in selectedEmployee.attendanceDetail"
              :key="log.date"
            >
              <!-- Tanggal -->
              <td class="font-weight-bold text-body-1">
                {{ log.date }}
              </td>

              <!-- Masuk (Hijau) -->
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

              <!-- Masuk Istirahat (Merah Soft) -->
              <td class="font-mono">
                <span
                  v-if="log.breakIn"
                  class="text-error opacity-75"
                >{{ log.breakIn }}</span>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>

              <!-- Keluar Istirahat (Merah Soft) -->
              <td class="font-mono">
                <span
                  v-if="log.breakOut"
                  class="text-error opacity-75"
                >{{ log.breakOut }}</span>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>

              <!-- Pulang (Merah Terang) -->
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

              <!-- Total Kerja (Chip ala Gambar) -->
              <td class="text-center">
                <VChip
                  v-if="log.totalWorkMinutes > 0"
                  color="info"
                  variant="tonal"
                  size="small"
                  class="rounded-sm font-weight-bold"
                  style="min-inline-size: 70px;"
                >
                  {{ formatTimeDisplay(log.totalWorkMinutes) }}
                </VChip>
                <span
                  v-else
                  class="text-disabled"
                >-</span>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>
  </VDialog>
</template>
