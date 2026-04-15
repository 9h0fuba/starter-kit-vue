<script setup lang="ts">
import type { UserProperties } from '@db/apps/users/types'

interface Props {
  userData?: UserProperties
  isDialogVisible: boolean
}

interface Emit {
  (e: 'submit', value: UserProperties): void
  (e: 'update:isDialogVisible', val: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  userData: () => ({
    id: 0,
    fullName: '',
    company: '',
    role: '',
    username: '',
    country: '',
    contact: '',
    email: '',
    currentPlan: '',
    status: '',
    avatar: '',
    billing: '',
  }),
})

const emit = defineEmits<Emit>()

const userData = ref<UserProperties>(structuredClone(toRaw(props.userData)))
const isUseAsBillingAddress = ref(false)

watch(() => props, () => {
  userData.value = structuredClone(toRaw(props.userData))
})

const isConfirmVisible = ref(false)

const onFormSubmit = () => {
  isConfirmVisible.value = true
}

const onFormReset = () => {
  userData.value = structuredClone(toRaw(props.userData))

  emit('update:isDialogVisible', false)
}

const dialogModelValueUpdate = (val: boolean) => {
  emit('update:isDialogVisible', val)
}

// 👉 Computed untuk memisahkan/menggabungkan Nama
const firstName = computed({
  get: () => userData.value.fullName.split(' ')[0] || '',
  set: val => {
    const names = userData.value.fullName.split(' ')

    names[0] = val
    userData.value.fullName = names.join(' ').trim()
  },
})

const lastName = computed({
  get: () => userData.value.fullName.split(' ').slice(1).join(' ') || '',
  set: val => {
    const names = userData.value.fullName.split(' ')
    const fName = names[0] || ''

    userData.value.fullName = `${fName} ${val}`.trim()
  },
})

// Fungsi jika user yakin (Confirm)
const onConfirmSubmit = () => {
  isConfirmVisible.value = false

  // Gabungkan nama seperti logika senior sebelumnya
  userData.value.fullName = `${firstName.value} ${lastName.value}`.trim()

  // Kirim data ke Parent
  emit('update:isDialogVisible', false)
  emit('submit', userData.value)
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.isDialogVisible"
    @update:model-value="dialogModelValueUpdate"
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="dialogModelValueUpdate(false)" />

    <VCard class="pa-sm-10 pa-2">
      <VCardText>
        <!-- 👉 Title -->
        <h4 class="text-h4 text-center mb-2">
          Edit User Information
        </h4>
        <p class="text-body-1 text-center mb-6">
          Updating user details will receive a privacy audit.
        </p>

        <!-- 👉 Form -->
        <VForm
          class="mt-6"
          @submit.prevent="onFormSubmit"
        >
          <VRow>
            <!-- 👉 First Name -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="firstName"
                label="First Name"
                placeholder="John"
              />
            </VCol>

            <!-- 👉 Last Name -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="lastName"
                label="Last Name"
                placeholder="Doe"
              />
            </VCol>

            <!-- 👉 Username -->
            <VCol cols="12">
              <AppTextField
                v-model="userData.username"
                label="Username"
                placeholder="john.doe.007"
              />
            </VCol>

            <!-- 👉 Billing Email -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="userData.email"
                label="Email"
                placeholder="johndoe@email.com"
              />
            </VCol>

            <!-- 👉 Status -->
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="userData.status"
                label="Status"
                placeholder="Active"
                :items="['Active', 'Inactive', 'Pending']"
              />
            </VCol>
            <!-- 👉 Contact -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="userData.contact"
                label="Phone Number"
                placeholder="+1 9876543210"
              />
            </VCol>

            <!-- 👉 Country -->
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="userData.country"
                label="Country"
                placeholder="United States"
                :items="['United States', 'United Kingdom', 'France']"
              />
            </VCol>

            <!-- 👉 Switch -->
            <VCol cols="12">
              <VSwitch
                v-model="isUseAsBillingAddress"
                density="compact"
                label="Use as a billing address?"
              />
            </VCol>

            <!-- 👉 Submit and Cancel -->
            <VCol
              cols="12"
              class="d-flex flex-wrap justify-center gap-4"
            >
              <VBtn type="submit">
                >
                Submit
              </VBtn>

              <VBtn
                color="secondary"
                variant="tonal"
                @click="onFormReset"
              >
                Cancel
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>

  <VDialog
    v-model="isConfirmVisible"
    max-width="400"
  >
    <VCard>
      <VCardTitle class="text-h6">
        Konfirmasi Perubahan
      </VCardTitle>
      <VCardText>
        Apakah Anda yakin data yang Anda masukkan sudah benar?
        Perubahan ini akan dicatat dalam audit sistem.
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="tonal"
          @click="isConfirmVisible = false"
        >
          Batal
        </VBtn>
        <VBtn
          color="primary"
          @click="onConfirmSubmit"
        >
          Ya, Simpan
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
