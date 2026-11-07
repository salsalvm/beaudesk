import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AppShell } from './AppShell'
import { HomePage } from '@/features/home/HomePage'
import { ServicesPage } from '@/features/services/ServicesPage'
import { MembershipsPage } from '@/features/memberships/MembershipsPage'
import { MyBookingsPage } from '@/features/bookings/MyBookingsPage'
import { BookingFlow } from '@/features/booking/BookingFlow'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/memberships', element: <MembershipsPage /> },
      { path: '/bookings', element: <MyBookingsPage /> },
      { path: '/book', element: <BookingFlow /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
