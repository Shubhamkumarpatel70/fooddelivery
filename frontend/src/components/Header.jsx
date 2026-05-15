import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { FiShoppingCart, FiUser, FiLogOut, FiX, FiChevronDown } from 'react-icons/fi'

const Header = () => {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const [showCartDropdown, setShowCartDropdown] = useState(false)
  const cartDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target)) {
        setShowCartDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl font-bold text-primary">Foodie</span>
          </Link>

          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <input
              type="text"
              placeholder="Search for restaurants or food..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-semibold"
                  >
                    Admin
                  </Link>
                )}
                {user.role === 'restaurant' && (
                  <Link
                    to="/restaurant/dashboard"
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-semibold"
                  >
                    Restaurant
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary transition"
                >
                  <FiUser className="text-xl" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Link>
                
                {/* Cart with Dropdown */}
                <div className="relative" ref={cartDropdownRef}>
                  <button
                    onClick={() => setShowCartDropdown(!showCartDropdown)}
                    className="relative flex items-center space-x-1 text-gray-700 hover:text-primary transition"
                  >
                    <FiShoppingCart className="text-2xl" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {cartItemCount}
                      </span>
                    )}
                    <span className="hidden sm:inline">Cart</span>
                    {cartItemCount > 0 && (
                      <FiChevronDown className={`hidden sm:inline transition-transform ${showCartDropdown ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {/* Cart Dropdown */}
                  {showCartDropdown && cartItemCount > 0 && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Cart ({cartItemCount} items)</h3>
                        <button
                          onClick={() => setShowCartDropdown(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FiX />
                        </button>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {cart.items.map((item) => (
                          <div key={item.menuItemId} className="p-4 border-b border-gray-100 flex gap-3 hover:bg-gray-50">
                            <img
                              src={item.image || 'https://via.placeholder.com/60'}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h4>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              <p className="text-sm font-semibold text-primary mt-1">₹{item.price * item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-gray-800">Total:</span>
                          <span className="text-xl font-bold text-primary">₹{cartTotal}</span>
                        </div>
                        <Link
                          to="/cart"
                          onClick={() => setShowCartDropdown(false)}
                          className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                        >
                          View Cart
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary transition"
                >
                  <FiLogOut className="text-xl" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-primary transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="mt-4 md:hidden">
          <input
            type="text"
            placeholder="Search for restaurants or food..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
