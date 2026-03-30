import './globals.css'
import SessionProvider from '../components/SessionProvider'

export const metadata = {
  title: 'App Factory — Xưởng Sản Xuất App',
  description: 'Quản lý workflow AI để tạo app bằng copy/paste giữa ChatGPT và Claude',
  manifest: '/manifest.json',
  themeColor: '#00ff94',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'App Factory',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-forge-bg text-forge-text font-mono antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
