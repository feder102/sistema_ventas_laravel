import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-14 px-4 pb-8 max-w-screen-xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
