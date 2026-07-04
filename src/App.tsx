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
import PhotoList from './pages/photos/PhotoList'
import PhotoForm from './pages/photos/PhotoForm'
import MenuList from './pages/menu/MenuList'
import MenuForm from './pages/menu/MenuForm'

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
              <Route path="/photos" element={<PhotoList />} />
              <Route path="/photos/new" element={<PhotoForm />} />
              <Route path="/photos/:id" element={<PhotoForm />} />
              <Route path="/menu" element={<MenuList />} />
              <Route path="/menu/new" element={<MenuForm />} />
              <Route path="/menu/:id" element={<MenuForm />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
