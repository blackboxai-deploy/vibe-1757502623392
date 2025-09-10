import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Color Match Rush - Hybrid Casual Mobile Game',
  description: 'Fast-paced color matching game with progressive difficulty, power-ups, and achievements. Match falling orbs with rotating color wheels!',
  keywords: 'game, mobile game, color matching, casual game, hybrid casual, puzzle game',
  authors: [{ name: 'Color Match Rush' }],
  creator: 'Color Match Rush',
  publisher: 'Color Match Rush',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Color Match Rush',
  },
  manifest: '/manifest.json',
  themeColor: '#1a1a2e',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Color Match Rush" />
        <meta name="application-name" content="Color Match Rush" />
        <meta name="msapplication-TileColor" content="#1a1a2e" />
        <meta name="theme-color" content="#1a1a2e" />
        
        {/* Prevent zoom on input focus */}
        <style>{`
          input, select, textarea, button {
            font-size: 16px !important;
          }
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          html, body {
            overflow: hidden;
            position: fixed;
            height: 100%;
            width: 100%;
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          body {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          }
        `}</style>
      </head>
      <body className={`${inter.className} h-full overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900`}>
        <div className="h-full w-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}