import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import YandexMetrica from '@/components/analytics/yandex-metrica'
import AppRouter from './router'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <TooltipProvider>
            <AppRouter />
          </TooltipProvider>
        </ThemeProvider>
        <YandexMetrica />
      </BrowserRouter>
    </HelmetProvider>
  )
}
