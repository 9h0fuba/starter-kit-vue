<script setup lang="ts">
const myRole = ref({
  roleName: 'Admin',
  permissions: [
    { name: 'User Management', read: true },
    { name: 'Settings', read: false },
  ],
})

interface User {
  username: string
  email: string
}

// 1. State untuk Form (Input)
const formData = ref({
  username: '',
  email: '',
})

// 2. State untuk List (Penyimpan Data)
const userList = ref<User[]>([])

const handleSave = () => {
  // Validasi sederhana: pastikan tidak kosong
  if (!formData.value.username || !formData.value.email) {
    alert('Isi semua field dulu ya!')

    return
  }

  // Masukkan salinan data form ke dalam list
  userList.value.push({ ...formData.value })

  // Bersihkan form setelah save
  formData.value = { username: '', email: '' }
}

const handleCancel = () => {
  formData.value = { username: '', email: '' }
}

const userRegistration = 'User Registration COY'

interface FormList {
  firstName: string
  lastName: string
  email: string
  city: string
  country: string
  company: string
  checkbox: boolean
}

const formLists = ref<FormList[]>([])

const firstName = ref('')
const lastName = ref('')
const city = ref('')
const country = ref('')
const company = ref('')
const email = ref('')
const checkbox = ref(false)

const handleFormSubmit = () => {
  // Masukkan data ke array
  formLists.value.push({
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    city: city.value,
    country: country.value,
    company: company.value,
    checkbox: checkbox.value,
  })

  // Reset form (opsional)
  firstName.value = ''
  lastName.value = ''
  email.value = ''
  city.value = ''
  country.value = ''
  company.value = ''
  checkbox.value = false
}

const headers = [
  { title: 'First Name', key: 'firstName' },
  { title: 'Last Name', key: 'lastName' },
  { title: 'Email', key: 'email' },
  { title: 'City', key: 'city' },
  { title: 'Country', key: 'country' },
  { title: 'Company', key: 'company' },
  { title: 'Checkbox', key: 'checkbox' },
]

const resolveStatusVariant = (status: boolean) => {
  return status ? { color: 'primary', text: 'YESS' } : { color: 'error', text: 'NOPE' }
}

const selectedData = ref<FormList[]>([])

// (Opsional) Untuk melihat hasilnya di console
watch(selectedData, newVal => {
  console.log('Data yang dipilih:', newVal)
})
</script>

<template>
  <div class="gap-4 mt-6">
    <CobaForm
      v-model:first-name="firstName"
      v-model:last-name="lastName"
      v-model:city="city"
      v-model:country="country"
      v-model:company="company"
      v-model:email="email"
      v-model:checkbox="checkbox"
      @submit="handleFormSubmit"
    />
  </div>

  <!-- LIST TAMPILAN (Hasil Save) -->
  <VDataTable
    v-model="selectedData"
    :headers="headers"
    :items="formLists"
    show-select
    item-value="email"
    return-object
    must-sort
  >
    <!-- Slot diletakkan di SINI -->
    <template #item.checkbox="{ item }">
      <VChip :color="resolveStatusVariant(item.checkbox).color">
        {{ resolveStatusVariant(item.checkbox).text }}
      </VChip>
    </template>
  </VDataTable> <!-- Penutup di SINI -->

  <div class="mt-4">
    Jumlah terpilih: {{ selectedData.length }} item
  </div>

  <pre>{{ selectedData }}</pre>

  <div>
    <VContainer>
      <!-- Kita pakai v-model biasa -->
      <RoleManager v-model="myRole" />

      <!-- Preview data di parent untuk membuktikan data ter-update -->
      <div class="mt-10 pa-4 bg-grey-lighten-3">
        <strong>Data di Parent saat ini:</strong>
        <pre>{{ myRole }}</pre>
      </div>
    </VContainer>

    <VContainer>
      <!-- FORM LAYOUT -->
      <SimpleFormLayout
        :title="userRegistration"
        submit-text="Simpan ke List"
        cancel-text="CANCEL COK"
        @submit="handleSave"
        @cancel="handleCancel"
      >
        <AppTextField
          v-model="formData.username"
          label="Username"
          placeholder="janedoe123"
        />

        <AppTextField
          v-model="formData.email"
          label="Email Address"
          placeholder="jane@example.com"
        />
      </SimpleFormLayout>

      <!-- LIST TAMPILAN (Hasil Save) -->
      <VCard
        v-if="userList.length > 0"
        class="mt-8"
        title="Daftar User Terdaftar"
      >
        <VTable>
          <thead>
            <tr>
              <th>No</th>
              <th>Username</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(user, index) in userList"
              :key="index"
            >
              <td>{{ index + 1 }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
            </tr>
          </tbody>
        </VTable>
      </VCard>

      <VAlert
        v-else
        type="info"
        variant="tonal"
        class="mt-8"
      >
        Belum ada data yang disimpan.
      </VAlert>
    </VContainer>
  </div>
  <div>
    <VCard title="Create Awesome 🙌">
      <VCardText>This is your second page.</VCardText>
      <VCardText>
        Chocolate sesame snaps pie carrot cake pastry pie lollipop muffin.
        Carrot cake dragée chupa chups jujubes. Macaroon liquorice cookie
        wafer tart marzipan bonbon. Gingerbread jelly-o dragée
        chocolate.
      </VCardText>
    </VCard>
  </div>
</template>
