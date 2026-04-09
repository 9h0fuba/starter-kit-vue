<script setup lang="ts">
interface Props {
  userData: {
    id: number
    fullName: string
    firstName: string
    lastName: string
    company: string
    username: string
    role: string
    country: string
    contact: string
    email: string
    currentPlan: string
    status: string
    avatar: string
    taskDone: number
    projectDone: number
    taxId: string
    language: string
  }
}

const props = defineProps<Props>()

// const standardPlan = {
//   plan: 'Standard',
//   price: 99,
//   benefits: ['10 Users', 'Up to 10GB storage', 'Basic Support'],
// }

// const isUpgradePlanDialogVisible = ref(false)
// const isUserInfoEditDialogVisible = ref(false)

const resolveUserRoleVariant = (role: string) => {
  if (role === 'subscriber')
    return { color: 'warning', icon: 'tabler-user' }
  if (role === 'author')
    return { color: 'success', icon: 'tabler-circle-check' }
  if (role === 'maintainer')
    return { color: 'primary', icon: 'tabler-chart-pie-2' }
  if (role === 'editor')
    return { color: 'info', icon: 'tabler-pencil' }
  if (role === 'admin')
    return { color: 'secondary', icon: 'tabler-server-2' }

  return { color: 'primary', icon: 'tabler-user' }
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardText class="text-center pt 12">
          <!-- AVATAR -->
          <VAvatar
            rounded
            :size="100"
            :color="!props.userData.avatar ? 'primary' : undefined"
            :variant="!props.userData.avatar ? 'tonal' : undefined"
          >
            <VImg
              v-if="props.userData.avatar"
              :src="props.userData.avatar"
            />
            <span
              v-else
              class="text-5xl font-weight-medium"
            >
              {{ avatarText(props.userData.fullName) }}
            </span>
          </VAvatar>

          <!-- User FULLNAME -->
          <h5 class="text-h5 mt-4">
            {{ props.userData.fullName }}
          </h5>

          <!-- ROLE -->
          <VChip
            label
            :color="resolveUserRoleVariant(props.userData.role).color"
            size="small"
            class="text-capitalize mt-4"
          >
            {{ props.userData.role }}
          </VChip>
        </VCardText>

        <VCardText>
          <div class="d-flex justify-space-around gap-x-6 gap-y-2 flex-wrap mb-6">
            <!-- 👉 Done task -->
            <div class="d-flex align-center me-8">
              <VAvatar
                :size="40"
                rounded
                color="primary"
                variant="tonal"
                class="me-4"
              >
                <VIcon
                  icon="tabler-checkbox"
                  size="24"
                />
              </VAvatar>
              <div>
                <h5 class="text-h5">
                  {{ `${(props.userData.taskDone / 1000).toFixed(2)}k` }}
                </h5>

                <span class="text-sm">Task Done</span>
              </div>
            </div>

            <!-- 👉 Done Project -->
            <div class="d-flex align-center me-4">
              <VAvatar
                :size="38"
                rounded
                color="primary"
                variant="tonal"
                class="me-4"
              >
                <VIcon
                  icon="tabler-briefcase"
                  size="24"
                />
              </VAvatar>
              <div>
                <h5 class="text-h5">
                  {{ kFormatter(props.userData.projectDone) }}
                </h5>
                <span class="text-sm">Project Done</span>
              </div>
            </div>
          </div>

          <!-- 👉 Details -->
          <h5 class="text-h5">
            Details
          </h5>

          <VDivider class="my-4" />

          <!-- 👉 User Details list -->
          <VList class="card-list mt-2">
            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Username:
                  <div class="d-inline-block text-body-1">
                    {{ props.userData.fullName }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <span class="text-h6">
                  Billing Email:
                </span>
                <span class="text-body-1">
                  {{ props.userData.email }}
                </span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Status:
                  <div class="d-inline-block text-body-1 text-capitalize">
                    {{ props.userData.status }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Role:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ props.userData.role }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Tax ID:
                  <div class="d-inline-block text-body-1">
                    {{ props.userData.taxId }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Contact:
                  <div class="d-inline-block text-body-1">
                    {{ props.userData.contact }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Language:
                  <div class="d-inline-block text-body-1">
                    {{ props.userData.language }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Country:
                  <div class="d-inline-block text-body-1">
                    {{ props.userData.country }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
