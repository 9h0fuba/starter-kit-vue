<script setup lang="ts">
interface Permission {
  name: string
  read: boolean
}

interface RoleData {
  roleName: string
  permissions: Permission[]
}

// --- 2. PROPS & EMITS ---
const props = defineProps<{
  modelValue: RoleData // v-model standar
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: RoleData): void
}>()

// --- 3. STATE LOKAL ---
// Kita salin data dari props ke state lokal agar tidak mengubah props secara langsung (best practice)
const localRoleName = ref(props.modelValue.roleName)
const localPermissions = ref<Permission[]>([...props.modelValue.permissions])

// --- 4. LOGIKA KIRIM DATA ---
const saveData = () => {
  // Susun data terbaru
  const updatedData: RoleData = {
    roleName: localRoleName.value,
    permissions: localPermissions.value,
  }

  // Kirim ke parent
  emit('update:modelValue', updatedData)
  alert('Data berhasil dikirim ke Parent!')
}
</script>

<template>
  <VCard
    variant="outlined"
    class="pa-5"
    max-width="500"
  >
    <div class="text-h6 mb-4">
      Edit Role & Permissions
    </div>

    <!-- Input Nama Role -->
    <!-- Kita pakai AppTextField buatanmu tadi -->
    <AppTextField
      v-model="localRoleName"
      label="Role Name"
      placeholder="Contoh: Editor"
      class="mb-6"
    />

    <!-- Daftar Permission Sederhana -->
    <div
      v-for="(item, index) in localPermissions"
      :key="item.name"
      class="d-flex align-center justify-space-between border-bottom py-2"
    >
      <span>{{ item.name }}</span>
      <VCheckbox
        v-model="localPermissions[index].read"
        label="Read Access"
        hide-details
      />
    </div>

    <!-- Tombol Submit -->
    <VBtn
      color="primary"
      block
      class="mt-6"
      @click="saveData"
    >
      Update Role
    </VBtn>
  </VCard>
</template>
