import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/app/globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: `[${process.env.NODE_ENV === "production" ? "PROD" : "DEV"}] Atlas CRM`,
  description: "Customer Relationship Management System",
  icons: {
    icon: "/logo.webp",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
