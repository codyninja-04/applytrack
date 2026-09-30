export const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { href: '/applications', label: 'Applications', icon: 'columns' },
  { href: '/resume', label: 'Resumes', icon: 'file' },
  { href: '/compass', label: 'COMPASS', icon: 'compass' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
] as const

export type NavIcon = (typeof NAV)[number]['icon'] | 'plus' | 'menu' | 'close'
