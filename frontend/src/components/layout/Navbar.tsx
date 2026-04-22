import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useOnlineStore } from '../../store/onlineStore'
import { useToast } from '../ui/Toast'

export function Navbar() {
  const { user, logout }   = useAuthStore()
  const { isOnline }       = useOnlineStore()
  const { toast }          = useToast()
  const navigate           = useNavigate()
  const [menuOpen, setMenu] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
    toast('Sesión cerrada', 'info')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-700 text-white' : 'text-gray-200 hover:bg-gray-700'
    }`

  return (
    <nav className="bg-gray-900 text-white fixed top-0 left-0 right-0 z-40 shadow-md print:hidden">
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-900 text-xs text-center py-1 font-medium">
          Sin conexión — las ventas se guardarán localmente
        </div>
      )}
      <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="font-bold text-lg tracking-wide">
          🏪 POS
        </Link>

        <button
          className="md:hidden p-2 rounded"
          onClick={() => setMenu((v) => !v)}
          aria-label="Menú"
        >
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white" />
        </button>

        <div
          className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-1 absolute md:static top-14 left-0 right-0 bg-gray-900 md:bg-transparent p-4 md:p-0`}
        >
          <NavLink to="/sell"      className={navClass} onClick={() => setMenu(false)}>Vender</NavLink>
          <NavLink to="/products"  className={navClass} onClick={() => setMenu(false)}>Productos</NavLink>
          <NavLink to="/sales"     className={navClass} onClick={() => setMenu(false)}>Ventas</NavLink>
          <NavLink to="/customers" className={navClass} onClick={() => setMenu(false)}>Clientes</NavLink>
          <NavLink to="/users"     className={navClass} onClick={() => setMenu(false)}>Usuarios</NavLink>
          {user && (
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-700 text-left"
            >
              Salir ({user.name})
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
