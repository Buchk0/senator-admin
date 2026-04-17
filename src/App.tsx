import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CouponList from './pages/coupons/CouponList'
import CouponForm from './pages/coupons/CouponForm'
import EventList from './pages/events/EventList'
import EventForm from './pages/events/EventForm'
import SpaList from './pages/spa/SpaList'
import SpaForm from './pages/spa/SpaForm'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Guard: redirects to /login when not authenticated or not admin */}
          <Route element={<ProtectedRoute />}>
            {/* Layout: sidebar + <Outlet /> for child pages */}
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/coupons" element={<CouponList />} />
              <Route path="/coupons/new" element={<CouponForm />} />
              <Route path="/coupons/:id" element={<CouponForm />} />
              <Route path="/events" element={<EventList />} />
              <Route path="/events/new" element={<EventForm />} />
              <Route path="/events/:id" element={<EventForm />} />
              <Route path="/spa" element={<SpaList />} />
              <Route path="/spa/new" element={<SpaForm />} />
              <Route path="/spa/:id" element={<SpaForm />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
