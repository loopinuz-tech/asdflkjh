import { Outlet } from 'react-router-dom'

export default function TestsLayout() {
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background">
      <Outlet />
    </div>
  )
}
