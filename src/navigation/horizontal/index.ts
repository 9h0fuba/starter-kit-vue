export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },
  },
  {
    title: 'Roles & Permissions',
    icon: { icon: 'tabler-settings-cog' }, // Anda bisa ganti iconnya
    children: [
      {
        title: 'Roles',
        to: { name: 'apps-roles' }, // Pastikan nama rute sesuai dengan file di src/pages
      },
    ],
  },
  {
    title: 'Second page',
    to: { name: 'second-page' },
    icon: { icon: 'tabler-file' },
  },
]
