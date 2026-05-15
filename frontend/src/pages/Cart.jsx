import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { FiPlus, FiMinus, FiTrash2, FiShoppingBag, FiTag, FiX, FiCopy, FiCheck } from 'react-icons/fi'

const Cart = () => {
  const { cart, updateCartItem, removeFromCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [showCouponList, setShowCouponList] = useState(false)
  const [charges, setCharges] = useState({ platformFee: 0, deliveryFee: 50, tax: 5 })
  const [copiedCoupon, setCopiedCoupon] = useState(null)

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 text-lg mb-4">Please login to view your cart</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
        >
          Login
        </button>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FiShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some delicious food to get started!</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
        >
          Browse Restaurants
        </button>
      </div>
    )
  }

  const handleQuantityChange = async (menuItemId, newQuantity) => {
    if (!user) {
      alert('Please login to update cart')
      return
    }
    
    try {
      if (newQuantity <= 0) {
        const result = await removeFromCart(menuItemId)
        if (!result.success) {
          alert(result.message || 'Failed to remove item from cart')
        }
      } else {
        const result = await updateCartItem(menuItemId, newQuantity)
        if (!result.success) {
          alert(result.message || 'Failed to update cart')
        }
      }
      // Re-apply coupon if one was applied
      if (appliedCoupon) {
        setTimeout(() => {
          handleApplyCoupon(appliedCoupon.code)
        }, 100)
      }
    } catch (error) {
      console.error('Error updating cart:', error)
      alert('Failed to update cart. Please try again.')
    }
  }

  const handleApplyCoupon = async (code = null) => {
    const codeToApply = code || couponCode.trim().toUpperCase()
    if (!codeToApply) {
      setCouponError('Please enter a coupon code')
      return
    }

    setApplyingCoupon(true)
    setCouponError('')

    try {
      // First try regular coupon validation
      try {
        const res = await axios.post('/api/coupons/validate', {
          code: codeToApply,
          orderAmount: cart.total
        })

        if (res.data.valid) {
          setAppliedCoupon(res.data.coupon)
          localStorage.setItem('appliedCoupon', JSON.stringify(res.data.coupon))
          setCouponCode('')
          setCouponError('')
          setShowCouponList(false)
          setApplyingCoupon(false)
          return
        }
      } catch (regularError) {
        // If regular coupon fails, try restaurant coupon
        if (cart.items.length > 0) {
          const restaurantId = cart.items[0].restaurantId
          if (restaurantId) {
            try {
              const restaurantRes = await axios.post('/api/restaurant-coupons/validate', {
                code: codeToApply,
                restaurantId: restaurantId,
                orderAmount: cart.total,
                items: cart.items.map(item => ({
                  menuItem: item.menuItemId,
                  quantity: item.quantity
                }))
              })

              if (restaurantRes.data.valid) {
                setAppliedCoupon({
                  code: restaurantRes.data.coupon.code,
                  description: restaurantRes.data.coupon.description,
                  discount: restaurantRes.data.discount,
                  type: 'restaurant'
                })
                localStorage.setItem('appliedCoupon', JSON.stringify({
                  code: restaurantRes.data.coupon.code,
                  description: restaurantRes.data.coupon.description,
                  discount: restaurantRes.data.discount,
                  type: 'restaurant'
                }))
                setCouponCode('')
                setCouponError('')
                setShowCouponList(false)
                setApplyingCoupon(false)
                return
              }
            } catch (restaurantError) {
              // Both failed, show error
              setCouponError(restaurantError.response?.data?.message || 'Invalid coupon code')
            }
          }
        } else {
          setCouponError(regularError.response?.data?.message || 'Invalid coupon code')
        }
      }
      
      // If we get here, coupon validation failed
      if (!appliedCoupon) {
        setAppliedCoupon(null)
        localStorage.removeItem('appliedCoupon')
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Invalid coupon code')
      setAppliedCoupon(null)
      localStorage.removeItem('appliedCoupon')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
    localStorage.removeItem('appliedCoupon')
  }

  const handleCopyCoupon = async (couponCode) => {
    try {
      await navigator.clipboard.writeText(couponCode)
      setCopiedCoupon(couponCode)
      setTimeout(() => setCopiedCoupon(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = couponCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedCoupon(couponCode)
      setTimeout(() => setCopiedCoupon(null), 2000)
    }
  }

  // Fetch available coupons (both regular and restaurant coupons)
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        // Fetch regular coupons (public endpoint)
        const regularCouponsRes = await axios.get('/api/coupons')
        const regularCoupons = regularCouponsRes.data || []
        
        // Fetch restaurant coupons for the restaurant in cart
        let restaurantCoupons = []
        if (cart.items.length > 0) {
          try {
            // Get restaurant ID from first cart item's menuItem
            const firstItem = cart.items[0]
            if (firstItem.menuItem && firstItem.menuItem.restaurant) {
              const restaurantId = firstItem.menuItem.restaurant._id || firstItem.menuItem.restaurant
              if (restaurantId) {
                const restaurantCouponsRes = await axios.get(`/api/restaurant-coupons/restaurant/${restaurantId}`)
                restaurantCoupons = restaurantCouponsRes.data || []
              }
            }
          } catch (error) {
            console.error('Error fetching restaurant coupons:', error)
          }
        }
        
        // Merge both coupon types and filter only active coupons
        const mergedCoupons = [
          ...regularCoupons.filter(c => c.isActive !== false).map(c => ({ ...c, type: 'regular' })),
          ...restaurantCoupons.filter(c => c.isActive !== false).map(c => ({ ...c, type: 'restaurant' }))
        ]
        
        setAvailableCoupons(mergedCoupons)
      } catch (error) {
        console.error('Error fetching coupons:', error)
      }
    }
    
    if (cart.items.length > 0) {
      fetchCoupons()
    }
  }, [cart.items])

  // Load coupon from localStorage on mount
  useEffect(() => {
    const savedCoupon = localStorage.getItem('appliedCoupon')
    if (savedCoupon) {
      try {
        const coupon = JSON.parse(savedCoupon)
        // Re-validate coupon
        handleApplyCoupon(coupon.code)
      } catch (error) {
        localStorage.removeItem('appliedCoupon')
      }
    }
  }, [])

  // Fetch charges
  useEffect(() => {
    const fetchCharges = async () => {
      try {
        const res = await axios.get('/api/charges')
        setCharges(res.data)
      } catch (error) {
        console.error('Error fetching charges:', error)
        // Use defaults if fetch fails
        setCharges({ platformFee: 0, deliveryFee: 50, tax: 5 })
      }
    }
    fetchCharges()
  }, [])

  const platformFee = charges.platformFee || 0
  const deliveryFee = charges.deliveryFee || 50
  const taxPercentage = charges.tax || 5
  const tax = Math.round(cart.total * (taxPercentage / 100))
  const discount = appliedCoupon ? appliedCoupon.discount : 0
  const total = cart.total + platformFee + deliveryFee + tax - discount

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.menuItemId}
              className="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row gap-4"
            >
              <img
                src={item.image || 'https://via.placeholder.com/150'}
                alt={item.name}
                className="w-full sm:w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.name}</h3>
                <p className="text-primary font-bold text-lg mb-4">₹{item.price}</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-gray-100 rounded-lg px-4 py-2">
                    <button
                      onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                      className="hover:text-primary transition"
                    >
                      <FiMinus />
                    </button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                      className="hover:text-primary transition"
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <FiTrash2 className="text-xl" />
                  </button>
                  <span className="text-lg font-semibold text-gray-800">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>

            {/* Coupon Section */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FiTag className="text-green-600" />
                      <span 
                        className="font-semibold text-green-800 cursor-pointer hover:text-green-900 transition"
                        onClick={() => handleCopyCoupon(appliedCoupon.code)}
                        title="Click to copy"
                      >
                        {appliedCoupon.code}
                      </span>
                      {copiedCoupon === appliedCoupon.code ? (
                        <FiCheck className="text-green-600 text-sm" />
                      ) : (
                        <FiCopy 
                          className="text-green-600 text-sm cursor-pointer hover:text-green-800 transition"
                          onClick={() => handleCopyCoupon(appliedCoupon.code)}
                          title="Copy code"
                        />
                      )}
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-green-600 hover:text-green-800"
                    >
                      <FiX />
                    </button>
                  </div>
                  <p className="text-sm text-green-700">{appliedCoupon.description}</p>
                  <p className="text-sm font-semibold text-green-800 mt-1">
                    Discount: ₹{discount}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="flex items-center text-gray-700 font-semibold mb-2">
                    <FiTag className="mr-2" />
                    Coupon Code
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        onFocus={() => setShowCouponList(true)}
                        onBlur={() => setTimeout(() => setShowCouponList(false), 200)}
                        placeholder="Enter coupon code"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {/* Available Coupons Dropdown */}
                      {showCouponList && availableCoupons.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {availableCoupons.map((coupon) => (
                            <div
                              key={coupon._id}
                              className="px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <p 
                                      className="font-semibold text-gray-800 cursor-pointer hover:text-primary transition"
                                      onClick={() => handleCopyCoupon(coupon.code)}
                                      title="Click to copy"
                                    >
                                      {coupon.code}
                                    </p>
                                    {copiedCoupon === coupon.code ? (
                                      <FiCheck className="text-green-500 text-sm" />
                                    ) : (
                                      <FiCopy 
                                        className="text-gray-400 text-sm cursor-pointer hover:text-primary transition"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCopyCoupon(coupon.code)
                                        }}
                                        title="Copy code"
                                      />
                                    )}
                                  </div>
                                  {coupon.description && (
                                    <p className="text-sm text-gray-600">{coupon.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {coupon.type === 'restaurant' ? 'Restaurant' : 'General'}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCouponCode(coupon.code)
                                      setShowCouponList(false)
                                      handleApplyCoupon(coupon.code)
                                    }}
                                    className="px-3 py-1 bg-primary text-white text-xs rounded hover:bg-orange-600 transition"
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleApplyCoupon()}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-500 text-sm mt-2">{couponError}</p>
                  )}
                  {availableCoupons.length > 0 && (
                    <button
                      onClick={() => setShowCouponList(!showCouponList)}
                      className="text-sm text-primary hover:underline"
                    >
                      {showCouponList ? 'Hide' : 'Show'} available coupons ({availableCoupons.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{cart.total}</span>
              </div>
              {platformFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>₹{tax}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between text-xl font-bold text-gray-800">
                <span>Total</span>
                <span className="text-primary">₹{Math.max(0, total)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full text-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold text-lg inline-block"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
