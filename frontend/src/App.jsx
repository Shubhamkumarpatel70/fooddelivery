import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Restaurant from './pages/Restaurant'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Orders from './pages/Orders'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import RestaurantDashboard from './pages/RestaurantDashboard'
import RestaurantRegistration from './pages/RestaurantRegistration'
import DeliveryDashboard from './pages/DeliveryDashboard'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/restaurant/:id" element={<Restaurant />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<Orders />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
                <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                <Route path="/restaurant-registration" element={<RestaurantRegistration />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App

