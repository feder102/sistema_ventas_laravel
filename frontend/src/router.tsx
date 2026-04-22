import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard }       from './components/layout/AuthGuard'
import { Layout }          from './components/layout/Layout'
import { LoginPage }       from './pages/auth/LoginPage'
import { PosPage }         from './pages/pos/PosPage'
import { ProductsPage }    from './pages/products/ProductsPage'
import { CustomersPage }   from './pages/customers/CustomersPage'
import { SalesPage }       from './pages/sales/SalesPage'
import { SaleDetailPage }  from './pages/sales/SaleDetailPage'
import { SalePrintPage }   from './pages/sales/SalePrintPage'
import { UsersPage }       from './pages/users/UsersPage'

export const router = createBrowserRouter([
  {
    path:    '/login',
    element: <LoginPage />,
  },
  {
    path:    '/sales/:id/print',
    element: (
      <AuthGuard>
        <SalePrintPage />
      </AuthGuard>
    ),
  },
  {
    path:    '/',
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true,           element: <Navigate to="/sell" replace /> },
      { path: 'sell',          element: <PosPage /> },
      { path: 'products',      element: <ProductsPage /> },
      { path: 'customers',     element: <CustomersPage /> },
      { path: 'sales',         element: <SalesPage /> },
      { path: 'sales/:id',     element: <SaleDetailPage /> },
      { path: 'users',         element: <UsersPage /> },
    ],
  },
])
