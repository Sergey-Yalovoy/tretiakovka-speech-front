import { Outlet } from "react-router-dom"

import { MiniAudioPlayer } from "@/components/audio/MiniAudioPlayer"
import { AppHeader } from "@/components/layout/AppHeader"
import { BottomNavigation } from "@/components/layout/BottomNavigation"
import { PageContainer } from "@/components/layout/PageContainer"

export function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex-1">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
      <MiniAudioPlayer />
      <BottomNavigation />
    </div>
  )
}
