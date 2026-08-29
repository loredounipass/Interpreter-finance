import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/use-auth'

export const metadata: Metadata = { title: 'Interpreter Finance', description: 'Track your interpretation practice, goals, and progress.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#0b2026', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background"><body className="antialiased"><AuthProvider>{children}</AuthProvider>{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
