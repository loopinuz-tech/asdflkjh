import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

export default function MarketingLayout() {
  return (
    <>
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </>
  )
}
