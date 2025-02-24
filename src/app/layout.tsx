import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BP Acton - Research & Projects",
  description: "Interactive 3D visualization of research topics and projects",
  metadataBase: new URL('https://bpacton.com'),
  openGraph: {
    title: "BP Acton - Research & Projects",
    description: "Interactive 3D visualization of research topics and projects",
    url: 'https://bpacton.com',
    siteName: 'BP Acton',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    title: "BP Acton - Research & Projects",
    description: "Interactive 3D visualization of research topics and projects",
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

