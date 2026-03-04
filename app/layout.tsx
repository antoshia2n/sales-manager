import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sales Manager',
  description: '経営ダッシュボード',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
