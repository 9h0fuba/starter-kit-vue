<script setup lang="ts">
const emit = defineEmits<{
  (e: 'submit'): void
}>()

const firstName = defineModel<string>('firstName')
const lastName = defineModel<string>('lastName')
const email = defineModel<string>('email')
const city = defineModel<string>('city')
const country = defineModel<string>('country')
const company = defineModel<string>('company')
const checkbox = defineModel<boolean>('checkbox')
</script>

<template>
  <VCard
    variant="flat"
    border
    class="pa-6"
  >
    <VForm @submit.prevent="emit('submit')">
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

        <!-- 👉 Email -->
        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model="email"
            label="Email"
            placeholder="johndoe@email.com"
          />
        </VCol>

        <!-- 👉 City -->
        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model="city"
            label="City"
            placeholder="New York"
          />
        </VCol>

        <!-- 👉 Country -->
        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model="country"
            label="Country"
            placeholder="United States"
          />
        </VCol>

        <!-- 👉 Company -->
        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model="company"
            label="Company"
            placeholder="Pixinvent"
          />
        </VCol>

        <!-- 👉 Remember me -->
        <VCol cols="12">
          <VCheckbox
            v-model="checkbox"
            label="Remember me"
          />
        </VCol>

        <VCol
          cols="12"
          class="d-flex gap-4"
        >
          <VBtn type="submit">
            Submit
          </VBtn>

          <VBtn
            type="reset"
            color="secondary"
            variant="tonal"
          >
            Reset
          </VBtn>
        </VCol>
      </VRow>
    </VForm>
  </VCard>
</template>
