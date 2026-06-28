import { Inter, JetBrains_Mono, Space_Grotesk, DM_Sans } from 'next/font/google'
import './globals.css'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const geistMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm', display: 'swap' })

export const metadata: Metadata = {
  title: 'CoachOS',
  description: 'Multi-tenant CRM for coaching institutes',
}

import { ToastProvider } from '@/components/Toast'
import ChartRegistry from '@/components/ChartRegistry'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${dmSans.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </head>
      <body className="antialiased font-body">
        <ToastProvider><ChartRegistry />{children}</ToastProvider>
      </body>
    </html>
  )
}
