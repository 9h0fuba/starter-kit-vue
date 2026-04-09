<script setup lang="ts">
import UserBioPanel from '@/views/pages/user/UserBioPanel.vue'

const route = useRoute('apps-users-id')

// const userData = {
//   fullName: 'Ghofur Bahtiar',
//   firstName: 'Ghofur',
//   lastName: 'Bahtiar',
//   avatar: '/src/assets/images/avatars/avatar-1.png',
//   billing: 'Manual-Cash',
//   company: 'Wayne Enterprises',
//   contact: '(829) 537-0057',
//   country: 'USA',
//   currentPlan: 'team',
//   email: 'irena.dubrovna@wayne.com',
//   id: 21,
//   language: 'English',
//   projectDone: 568,
//   role: 'admin',
//   status: 'active',
//   taskDone: 1230,
//   taxId: 'Tax-8894',
//   username: 'catwomen1940',
// }

const { data: userData } = await useApi<any>(`/apps/users/${route.params.id}`)
</script>

<template>
  <UserBioPanel :user-data="userData" />
</template>
