<script setup lang="ts">
interface Props {
  title?: string
  submitText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Form Title',
  submitText: 'Submit',
  cancelText: 'Cancel',
})

// Emit untuk aksi tombol
const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <VCard
    variant="flat"
    border
    class="pa-6"
    max-width="600"
  >
    <!-- Header Form -->
    <VCardItem class="pa-0 mb-6">
      <VCardTitle class="text-h5 font-weight-bold">
        {{ props.title }}
      </VCardTitle>
    </VCardItem>

    <VForm @submit.prevent="emit('submit')">
      <!-- SLOT: Tempat menaruh AppTextField atau input lainnya -->
      <div class="d-flex flex-column gap-y-4">
        <slot />
      </div>

      <!-- Footer / Actions -->
      <div class="d-flex align-center gap-4 mt-8">
        <VBtn
          color="primary"
          type="submit"
        >
          {{ props.submitText }}
        </VBtn>

        <VBtn
          variant="tonal"
          color="secondary"
          @click="emit('cancel')"
        >
          {{ props.cancelText }}
        </VBtn>
      </div>
    </VForm>
  </VCard>
</template>

<style scoped>
.gap-y-4 {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
}
</style>
