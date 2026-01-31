import type React from "react"
import type { Metadata } from "next"
import { Urbanist, Spectral } from "next/font/google"
import "./globals.css"
import { NotificationProvider, NotificationSlider, GlobalNotificationToast } from "@/components/notification"
import { Toaster } from "@/components/ui/sonner"
import { ExtractDetailModalProvider } from "@/components/features/inventory/providers/extract-detail-modal-provider"
import { AuthSyncProvider } from "@/components/shared/providers/auth-sync-provider"
import { QueryProvider } from "@/lib/query"
import { ReactScanProvider } from "@/components/shared/providers/react-scan-provider"

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
})

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-spectral",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Casa Carigar",
  description: "Comprehensive sales analytics and business insights for Casa Carigar",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${urbanist.variable} ${spectral.variable}`}>
      <body className="font-urbanist">
        {/* <ReactScanProvider> */}
          <QueryProvider>
            <AuthSyncProvider>
              <NotificationProvider>
                <ExtractDetailModalProvider>
                  {children}
                  <NotificationSlider />
                  <GlobalNotificationToast />
                  <Toaster />
                </ExtractDetailModalProvider>
              </NotificationProvider>
            </AuthSyncProvider>
          </QueryProvider>
        {/* </ReactScanProvider> */}
      </body>
    </html>
  )
}
