import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/use-auth'
import { ToastProvider } from '@/components/ui/app-toast'

export const metadata: Metadata = {
  title: 'Interpreter Finance',
  description: 'Track your interpretation practice, goals, and progress.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Interpreter Finance',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#0b2026',
}

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#0b2026', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b2026" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Interpreter Finance" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}