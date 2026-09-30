import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'ApplyTrack',
    template: '%s · ApplyTrack',
  },
  description:
    'Resume and job description matching for S Pass and EP candidates in Singapore. Honest match scores, salary threshold checks, COMPASS estimates and sponsorship-aware cover letters.',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-text antialiased">{children}</body>
    </html>
  )
}
