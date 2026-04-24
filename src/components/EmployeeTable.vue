<script setup lang="ts">
import { computed } from 'vue'

// --- PROPS DEFINITION ---
interface Employee {
  id: string
  name: string
  department: string
  salary: number
  benefit: number
}

const props = defineProps<{
  data: Employee[]
  search?: string
}>()

// --- EMITS ---
const emit = defineEmits(['viewDetail'])

// --- HEADERS ---
const headers = [
  { title: 'KARYAWAN', key: 'name', align: 'start' as const },
  { title: 'ID', key: 'id', align: 'start' as const },
  { title: 'DEPARTEMEN', key: 'department', align: 'start' as const },
  { title: 'SALARY', key: 'salary', align: 'end' as const },
  { title: 'BENEFIT', key: 'benefit', align: 'center' as const },
  { title: 'AKSI', key: 'actions', sortable: false, align: 'center' as const },
]

// --- MAPPING DATA ---
// Menambahkan properti dummy agar UI template tetap jalan sempurna
const displayItems = computed(() => {
  return props.data.map(emp => ({
    ...emp,
    presentCount: 0, // Default dummy
    totalWorkHours: 0, // Default dummy
  }))
})

// --- HELPERS ---
const avatarText = (name: string) => {
  if (!name)
    return '??'

  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <VDataTable
    v-if="displayItems.length > 0"
    :headers="headers as any"
    :search="props.search"
    :items="displayItems"
    :items-per-page="10"
    class="text-no-wrap"
  >
    <!-- Template Karyawan -->
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

    <!-- Template Salary -->
    <template #item.salary="{ item }">
      <span class="font-weight-medium text-high-emphasis">
        {{ formatCurrency(item.salary) }}
      </span>
    </template>

    <!-- Template Benefit -->
    <template #item.benefit="{ item }">
      <span class="font-weight-medium text-high-emphasis">
        {{ formatCurrency(item.benefit) }}
      </span>
    </template>

    <!-- Template Aksi -->
    <template #item.actions="{ item }">
      <VBtn
        icon
        size="x-small"
        color="default"
        variant="text"
        @click="emit('viewDetail', item)"
      >
        <VIcon
          size="22"
          icon="tabler-eye"
        />
      </VBtn>
    </template>
  </VDataTable>

  <VCardText
    v-else
    class="text-center pa-10"
  >
    <p class="text-disabled">
      Tidak ada data untuk ditampilkan
    </p>
  </VCardText>
</template>
