<script setup lang="ts">
const selectedFile = ref<File | null>(null)
const pdfUrl = ref<string | undefined>(undefined)
const isPdfPreviewVisible = ref(false)
const isUploading = ref(false)

// 👉 Watcher untuk memantau file (Standard Senior: URL Management)
watch(selectedFile, newFile => {
  if (newFile) {
    // Jika input file adalah array (beberapa browser), ambil indeks 0
    const target = Array.isArray(newFile) ? newFile[0] : newFile

    if (target && target.type === 'application/pdf') {
      pdfUrl.value = URL.createObjectURL(target)
      console.log('File PDF siap:', target.name)
    }
    else if (target) {
      alert('Hanya file PDF yang diperbolehkan')
      selectedFile.value = null
    }
  }
  else {
    pdfUrl.value = undefined
  }
})

const uploadPdf = async () => {
  if (!selectedFile.value)
    return

  isUploading.value = true

  const formData = new FormData()

  // Handle jika selectedFile adalah array (Vuetify kadang return array)
  const fileToUpload = Array.isArray(selectedFile.value)
    ? selectedFile.value[0]
    : selectedFile.value

  formData.append('document', fileToUpload)

  try {
    await $api('/apps/documents/upload', {
      method: 'POST',
      body: formData,
    })
    alert('Berhasil Upload!')
    selectedFile.value = null
  }
  catch (err) {
    console.error('Upload gagal', err)
  }
  finally {
    isUploading.value = false
  }
}

const previewInNewTab = () => {
  if (!pdfUrl.value)
    return

  // Buka URL blob di tab baru
  const newTab = window.open(pdfUrl.value, '_blank')

  // Senior Tip: Berikan fokus ke tab baru tersebut
  if (newTab) {
    newTab.focus()
  }
  else {
    // Jika diblokir oleh popup blocker
    alert('Mohon izinkan popup untuk melihat pratinjau')
  }
}

// onUnmounted(() => {
//   if (pdfUrl.value)
//     URL.revokeObjectURL(pdfUrl.value)
// })
</script>

<template>
  <VCard
    title="Document Manager"
    class="pa-4 mt-6"
  >
    <VRow>
      <VCol cols="12">
        <VFileInput
          v-model="selectedFile"
          label="Pilih Laporan PDF"
          accept="application/pdf"
          prepend-icon="tabler-file-type-pdf"
          variant="outlined"
          density="compact"
        />
      </VCol>

      <VCol
        cols="12"
        class="d-flex gap-4"
      >
        <VBtn
          :disabled="!selectedFile"
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-external-link"
          @click="previewInNewTab"
        >
          Buka di Tab Baru
        </VBtn>

        <VBtn
          :disabled="!selectedFile"
          color="info"
          variant="tonal"
          @click="isPdfPreviewVisible = true"
        >
          Pratinjau
        </VBtn>

        <VBtn
          :disabled="!selectedFile"
          :loading="isUploading"
          color="primary"
          @click="uploadPdf"
        >
          Upload Sekarang
        </VBtn>
      </VCol>
    </VRow>

    <VDialog
      v-model="isPdfPreviewVisible"
      max-width="1200"
      width="95vw"
      height="95vh"
      persistent
    >
      <VCard class="d-flex flex-column fill-height pa-0 overflow-hidden">
        <DialogCloseBtn @click="isPdfPreviewVisible = false" />

        <VCardTitle class="pa-4 flex-none">
          Pratinjau Laporan: {{ selectedFile?.name }}
        </VCardTitle>

        <VCardText class="pa-0 flex-grow-1 overflow-hidden">
          <iframe
            v-if="pdfUrl"
            :src="pdfUrl"
            width="100%"
            height="100%"
            style=" display: block;border: none;"
          />
          <VCardText
            v-else
            class="text-center pt-10"
          >
            <VProgressCircular
              indeterminate
              color="primary"
            />
            <div class="mt-3">
              Memuat Dokumen...
            </div>
          </VCardText>
        </VCardText>
      </VCard>
    </VDialog>
  </VCard>
</template>
