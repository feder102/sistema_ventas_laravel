import './index.css'
import { StrictMode, useEffect } from 'react'
import { createRoot }    from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { useAuthStore }  from './store/authStore'
import { useOnlineStore } from './store/onlineStore'
import { ToastProvider } from './components/ui/Toast'
import { router }        from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:              1,
      staleTime:          5 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
})

function AppBootstrap() {
  const hydrate     = useAuthStore((s) => s.hydrate)
  const setOnline   = useOnlineStore((s) => s.setOnline)

  useEffect(() => {
    hydrate()
    const onOnline  = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [hydrate, setOnline])

  return <RouterProvider router={router} />
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppBootstrap />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
