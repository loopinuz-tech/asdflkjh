import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider } from '@/context/sidebar-context'
import YandexMetrica from '@/components/analytics/yandex-metrica'
import { NotificationProvider } from '@/context/notification-context'
import AppRouter from './router'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <NotificationProvider>
            <TooltipProvider>
              <SidebarProvider>
                <AppRouter />
              </SidebarProvider>
            </TooltipProvider>
          </NotificationProvider>
        </ThemeProvider>
        <YandexMetrica />
      </BrowserRouter>
    </HelmetProvider>
  )
}
