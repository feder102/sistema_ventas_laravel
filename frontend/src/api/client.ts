import axios from 'axios'

const baseURL = `${import.meta.env.VITE_API_URL ?? ''}`

const apiClient = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    'Accept':       'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
