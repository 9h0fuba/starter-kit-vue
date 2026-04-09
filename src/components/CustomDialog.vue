<script setup lang="ts">
  import { ref } from 'vue';

  const dialog = ref(false)

  interface Props {
  buttonText?: string
  title?: string
  message?: string
  cancelText?: string
  confirmText?: string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: 'Update Data',
  title: 'Konfirmasi Perubahan',
  message: 'Apakah Anda yakin ingin memperbarui data ini?',
  cancelText: 'Batal',
  confirmText: 'Ya, Update',
  color: 'primary'
})

const emit = defineEmits(['confirm', 'cancel'])

const handleConfirm = () => {
  emit('confirm')
  dialog.value = false
}

const handleCancel = () => {
  emit('cancel')
  dialog.value = false
}

</script>

<template>
  <div class="text-center pa-4">
    <v-dialog
      v-model="dialog"
      max-width="400"
      persistent
    >
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn v-bind="activatorProps" >
            {{ props.buttonText}}
        </v-btn>
      </template>

      <v-card
        prepend-icon="mdi-map-marker"
        text="{{ props.body }}"
        title="{{ props.title }}"
      >
        <template v-slot:actions>
          <v-spacer></v-spacer>

          <v-btn @click="dialog = false">
            {{ props.cancelText}}
          </v-btn>

          <v-btn @click="dialog = false">
            {{ props.confirmText}}
          </v-btn>
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>
