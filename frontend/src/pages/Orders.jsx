import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { FiClock, FiCheckCircle, FiXCircle, FiArrowLeft, FiMapPin, FiChevronDown, FiChevronUp, FiX, FiStar, FiRefreshCw, FiShoppingBag, FiEdit, FiTrash2, FiUser } from 'react-icons/fi'

const Orders = () => {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedOrders, setExpandedOrders] = useState({})
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelOrderId, setCancelOrderId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackOrderId, setFeedbackOrderId] = useState(null)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [hasRated, setHasRated] = useState({})
  const [ratings, setRatings] = useState({}) // Store actual rating data
  const [isEditingRating, setIsEditingRating] = useState(false)
  const [editingRatingId, setEditingRatingId] = useState(null)
  const [timerKey, setTimerKey] = useState(0) // For timer updates

  // Auto-refresh timer countdown every second for cancel button
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerKey(prev => prev + 1) // Force re-render to update timer
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Handle page refresh - stay on current page
  useEffect(() => {
    // Save current route to sessionStorage
    const currentPath = window.location.pathname
    sessionStorage.setItem('lastPath', currentPath)
  }, [])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (id) {
      fetchSingleOrder(id)
    } else {
      fetchOrders()
    }
  }, [user, id])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/orders/my-orders')
      setOrders(res.data)
      setFilteredOrders(res.data)
      
      // Fetch ratings for all delivered orders
      const deliveredOrders = res.data.filter(o => o.status === 'delivered')
      for (const order of deliveredOrders) {
        try {
          const ratingRes = await axios.get(`/api/ratings/order/${order._id}`)
          setHasRated(prev => ({ ...prev, [order._id]: ratingRes.data.hasRated }))
          if (ratingRes.data.hasRated && ratingRes.data.rating) {
            setRatings(prev => ({ ...prev, [order._id]: ratingRes.data.rating }))
          }
        } catch (error) {
          setHasRated(prev => ({ ...prev, [order._id]: false }))
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders)
    } else {
      setFilteredOrders(orders.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase()))
    }
  }, [statusFilter, orders])

  const fetchSingleOrder = async (orderId) => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/orders/${orderId}`)
      setOrder(res.data)
      // Check if this order has been rated and fetch rating data
      if (res.data.status === 'delivered') {
        try {
          const ratingRes = await axios.get(`/api/ratings/order/${orderId}`)
          setHasRated(prev => ({ ...prev, [orderId]: ratingRes.data.hasRated }))
          if (ratingRes.data.hasRated && ratingRes.data.rating) {
            setRatings(prev => ({ ...prev, [orderId]: ratingRes.data.rating }))
          }
        } catch (error) {
          setHasRated(prev => ({ ...prev, [orderId]: false }))
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'out for delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-blue-600 bg-blue-100'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Get order status steps - 5 parts
  const getOrderSteps = (status) => {
    const steps = [
      { key: 'pending', label: 'Pending' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'preparing', label: 'Preparing' },
      { key: 'out', label: 'Out for Delivery' },
      { key: 'delivered', label: 'Delivered' }
    ]

    const statusOrder = {
      'pending': 1,
      'confirmed': 2,
      'preparing': 3,
      'out for delivery': 4,
      'delivered': 5,
      'cancelled': -1
    }

    const currentStepIndex = statusOrder[status.toLowerCase()] || 0

    return steps.map((step, index) => {
      const stepIndex = index + 1
      const isCompleted = stepIndex <= currentStepIndex && currentStepIndex > 0
      const isDelivered = status.toLowerCase() === 'delivered' && step.key === 'delivered'
      
      return {
        ...step,
        isCompleted,
        isDelivered
      }
    })
  }

  // Single Order View
  if (id && order) {
    const orderSteps = getOrderSteps(order.status)
    const deliveryDate = order.status === 'delivered' && order.updatedAt 
      ? new Date(order.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
      : null

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-6"
        >
          <FiArrowLeft />
          <span>Back to Orders</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Details</h1>
              <p className="text-gray-600">Order ID: #{order._id.slice(-8).toUpperCase()}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === 'delivered'
                  ? 'bg-green-100 text-green-700'
                  : order.status === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {order.status.toUpperCase()}
            </span>
          </div>

          {/* Order Status - Horizontal Timeline */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">Order Status</h3>
            <div className="relative">
              <div className="flex items-center justify-between">
                {orderSteps.map((step, index) => (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                    {/* Horizontal Line */}
                    {index < orderSteps.length - 1 && (
                      <div className={`absolute top-4 left-1/2 w-full h-0.5 ${
                        step.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} style={{ zIndex: 0 }}></div>
                    )}
                    
                    {/* Circle Indicator */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.isDelivered 
                        ? 'bg-red-500' 
                        : step.isCompleted 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    }`}>
                      {step.isCompleted && (
                        <FiCheckCircle className="text-white text-sm" />
                      )}
                    </div>
                    
                    {/* Step Label */}
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-semibold ${
                        step.isCompleted ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {step.isDelivered && deliveryDate && (
                        <p className="text-xs text-gray-600 mt-1">{deliveryDate}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OTP Display for Out for Delivery Status */}
          {order.status === 'out for delivery' && order.deliveryOtp && (
            <div className="mb-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-blue-800 mb-2 text-lg">Delivery OTP</h3>
                  <p className="text-sm text-blue-600 mb-3">
                    Please provide this OTP to the delivery person when they arrive
                  </p>
                  <div className="bg-white rounded-lg p-4 border-2 border-blue-400 inline-block">
                    <p className="text-4xl font-bold text-blue-700 tracking-widest text-center">
                      {order.deliveryOtp}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivered By Display */}
          {order.status === 'delivered' && order.deliveryBoy && (
            <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <FiUser className="text-purple-600" />
                <span className="text-sm text-gray-700">
                  Delivered by: <span className="font-semibold text-purple-700">{order.deliveryBoy.name || 'N/A'}</span>
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Restaurant</h3>
              <p className="text-gray-800">{order.restaurant?.name || 'N/A'}</p>
              <p className="text-sm text-gray-600">{order.restaurant?.location || ''}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Order Date</h3>
              <p className="text-gray-800">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
              <FiMapPin className="mr-2" />
              Delivery Address
            </h3>
            <div className="text-gray-800 bg-gray-50 rounded-lg p-3">
              {typeof order.deliveryAddress === 'string' ? (
                <p>{order.deliveryAddress}</p>
              ) : order.deliveryAddress ? (
                <div className="space-y-1">
                  {order.deliveryAddress.name && <p><span className="font-medium">Name:</span> {order.deliveryAddress.name}</p>}
                  {order.deliveryAddress.address && <p><span className="font-medium">Address:</span> {order.deliveryAddress.address}</p>}
                  {order.deliveryAddress.city && <p><span className="font-medium">City:</span> {order.deliveryAddress.city}</p>}
                  {order.deliveryAddress.pincode && <p><span className="font-medium">Pincode:</span> {order.deliveryAddress.pincode}</p>}
                  {order.deliveryAddress.phone && <p><span className="font-medium">Phone:</span> {order.deliveryAddress.phone}</p>}
                  {!order.deliveryAddress.name && !order.deliveryAddress.address && (
                    <p>{JSON.stringify(order.deliveryAddress)}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No delivery address provided</p>
              )}
            </div>
          </div>
          
          {/* View Restaurant Button */}
          {order.restaurant && (
            <div className="mb-6">
              <button
                onClick={() => navigate(`/restaurant/${order.restaurant._id || order.restaurant}`)}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
              >
                <FiShoppingBag />
                <span>View Restaurant</span>
              </button>
            </div>
          )}

          {/* Cancel Reason (if cancelled) */}
          {order.status === 'cancelled' && order.cancelReason && (
            <div className="mb-6">
              <h3 className="font-semibold text-red-700 mb-3">Cancel Reason</h3>
              <p className="text-gray-800 bg-red-50 rounded-lg p-3 border border-red-200">
                {order.cancelReason}
              </p>
            </div>
          )}

          {/* Cancel Button (if order can be cancelled) */}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (() => {
            // Calculate time since order creation
            const orderTime = new Date(order.createdAt).getTime()
            const currentTime = new Date().getTime()
            const timeElapsed = currentTime - orderTime
            const twoMinutes = 2 * 60 * 1000 // 2 minutes in milliseconds
            const timeRemaining = twoMinutes - timeElapsed
            const canCancel = timeRemaining > 0
            const minutesRemaining = Math.floor(timeRemaining / 60000)
            const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000)
            
            return (
              <div className="mb-6">
                <button
                  onClick={() => {
                    if (canCancel) {
                      setCancelOrderId(order._id)
                      setShowCancelModal(true)
                    }
                  }}
                  disabled={!canCancel}
                  className={`px-6 py-2 rounded-lg transition ${
                    canCancel
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  {canCancel 
                    ? `Cancel Order (${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')} remaining)`
                    : 'Cancel Time Expired'
                  }
                </button>
              </div>
            )
          })()}

          {/* Feedback Button (if order is delivered and not rated) */}
          {order.status === 'delivered' && !hasRated[order._id] && (
            <div className="mb-6">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setFeedbackOrderId(order._id)
                  setIsEditingRating(false)
                  setEditingRatingId(null)
                  setFeedbackRating(0)
                  setFeedbackComment('')
                  setShowFeedbackModal(true)
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
              >
                <FiStar />
                <span>Rate & Review</span>
              </button>
            </div>
          )}

          {/* Show rating if already rated */}
          {order.status === 'delivered' && hasRated[order._id] && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-semibold mb-1">✓ You have rated this order</p>
              <p className="text-sm text-green-600">Thank you for your feedback!</p>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-700 mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-800">{item.menuItem?.name || 'Item'}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between text-xl font-bold">
              <span>Total Amount</span>
              <span className="text-primary">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">My Orders</h1>
        
        {/* Status Filter Dropdown */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white appearance-none cursor-pointer"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FiClock className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Start ordering delicious food!</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
          >
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const orderSteps = getOrderSteps(order.status)
            const deliveryDate = order.status === 'delivered' && order.updatedAt 
              ? new Date(order.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
              : null

            const isExpanded = expandedOrders[order._id] || false
            const toggleExpand = () => {
              setExpandedOrders(prev => ({
                ...prev,
                [order._id]: !prev[order._id]
              }))
            }

            return (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Collapsed Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition"
                  onClick={toggleExpand}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {order.restaurant?.name || 'Restaurant'}
                        </h3>
                        <button className="text-gray-500 hover:text-gray-700">
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">
                        Order ID: {order._id.slice(-8).toUpperCase()} • {new Date(order.createdAt).toLocaleString()}
                      </p>
                      
                      {/* Collapsed View - Item Summary */}
                      {!isExpanded && (
                        <div className="mt-3 space-y-2">
                          {/* Prominent OTP Display for Out for Delivery */}
                          {order.status === 'out for delivery' && order.deliveryOtp && (
                            <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-3 shadow-md">
                              <div className="text-center">
                                <p className="text-xs text-blue-600 mb-2 font-semibold uppercase tracking-wide">Delivery OTP</p>
                                <p className="text-4xl font-bold text-blue-700 tracking-widest mb-2">
                                  {order.deliveryOtp}
                                </p>
                                <p className="text-xs text-blue-600">Provide this to the delivery person</p>
                              </div>
                            </div>
                          )}
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm text-gray-600">
                              <span>{item.menuItem?.name || 'Item'} x {item.quantity}</span>
                              <span className="font-semibold">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-gray-500">+{order.items.length - 2} more items</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4 flex items-center space-x-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                      <p className="text-xl font-bold text-primary">
                        ₹{order.totalAmount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t bg-gray-50">
                    {/* OTP Display for Out for Delivery Status */}
                    {order.status === 'out for delivery' && order.deliveryOtp && (
                      <div className="mb-6 pt-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="w-full">
                            <h4 className="font-bold text-blue-800 mb-2 text-lg">Delivery OTP</h4>
                            <p className="text-sm text-blue-600 mb-3">
                              Please provide this OTP to the delivery person when they arrive
                            </p>
                            <div className="bg-white rounded-lg p-4 border-2 border-blue-400 text-center">
                              <p className="text-4xl font-bold text-blue-700 tracking-widest">
                                {order.deliveryOtp}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Status - Horizontal Timeline */}
                    <div className="mb-6 pt-4">
                      <h4 className="font-semibold text-gray-700 mb-4">Order Status</h4>
                      <div className="relative">
                        <div className="flex items-center justify-between">
                          {orderSteps.map((step, index) => (
                            <div key={step.key} className="flex-1 flex flex-col items-center relative">
                              {/* Horizontal Line */}
                              {index < orderSteps.length - 1 && (
                                <div className={`absolute top-4 left-1/2 w-full h-0.5 ${
                                  step.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                }`} style={{ zIndex: 0 }}></div>
                              )}
                              
                              {/* Circle Indicator */}
                              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                step.isDelivered 
                                  ? 'bg-red-500' 
                                  : step.isCompleted 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-300'
                              }`}>
                                {step.isCompleted && (
                                  <FiCheckCircle className="text-white text-sm" />
                                )}
                              </div>
                              
                              {/* Step Label */}
                              <div className="mt-2 text-center">
                                <p className={`text-sm font-semibold ${
                                  step.isCompleted ? 'text-gray-800' : 'text-gray-400'
                                }`}>
                                  {step.label}
                                </p>
                                {step.isDelivered && deliveryDate && (
                                  <p className="text-xs text-gray-600 mt-1">{deliveryDate}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Order Items Details */}
                    <div className="mb-4 bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{item.menuItem?.name || 'Item'}</p>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity} × ₹{item.price}</p>
                              <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                                order.status === 'delivered' 
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivered By Display */}
                    {order.status === 'delivered' && order.deliveryBoy && (
                      <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <FiUser className="text-purple-600" />
                          <span className="text-sm text-gray-700">
                            Delivered by: <span className="font-semibold text-purple-700">{order.deliveryBoy.name || 'N/A'}</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Delivery Address */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                        <FiMapPin className="mr-2" />
                        Delivery Address
                      </h4>
                      <div className="text-gray-800 bg-white rounded-lg p-3">
                        {typeof order.deliveryAddress === 'string' ? (
                          <p>{order.deliveryAddress}</p>
                        ) : order.deliveryAddress ? (
                          <div className="space-y-1">
                            {order.deliveryAddress.name && <p><span className="font-medium">Name:</span> {order.deliveryAddress.name}</p>}
                            {order.deliveryAddress.address && <p><span className="font-medium">Address:</span> {order.deliveryAddress.address}</p>}
                            {order.deliveryAddress.city && <p><span className="font-medium">City:</span> {order.deliveryAddress.city}</p>}
                            {order.deliveryAddress.pincode && <p><span className="font-medium">Pincode:</span> {order.deliveryAddress.pincode}</p>}
                            {order.deliveryAddress.phone && <p><span className="font-medium">Phone:</span> {order.deliveryAddress.phone}</p>}
                            {!order.deliveryAddress.name && !order.deliveryAddress.address && (
                              <p>{JSON.stringify(order.deliveryAddress)}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">No delivery address provided</p>
                        )}
                      </div>
                    </div>
                    
                    {/* View Restaurant Button */}
                    {order.restaurant && (
                      <div className="mb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/restaurant/${order.restaurant._id || order.restaurant}`)
                          }}
                          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center space-x-2"
                        >
                          <FiShoppingBag />
                          <span>View Restaurant</span>
                        </button>
                      </div>
                    )}

                    {/* Cancel Reason (if cancelled) */}
                    {order.status === 'cancelled' && order.cancelReason && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-red-700 mb-2">Cancel Reason</h4>
                        <p className="text-gray-800 bg-red-50 rounded-lg p-3 border border-red-200">
                          {order.cancelReason}
                        </p>
                      </div>
                    )}

                    {/* Cancel Button (if order can be cancelled) */}
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (() => {
                      // Calculate time since order creation
                      const orderTime = new Date(order.createdAt).getTime()
                      const currentTime = new Date().getTime()
                      const timeElapsed = currentTime - orderTime
                      const twoMinutes = 2 * 60 * 1000 // 2 minutes in milliseconds
                      const timeRemaining = twoMinutes - timeElapsed
                      const canCancel = timeRemaining > 0
                      const minutesRemaining = Math.floor(timeRemaining / 60000)
                      const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000)
                      
                      return (
                        <div className="mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (canCancel) {
                                setCancelOrderId(order._id)
                                setShowCancelModal(true)
                              }
                            }}
                            disabled={!canCancel}
                            className={`w-full px-4 py-2 rounded-lg transition ${
                              canCancel
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            }`}
                          >
                            {canCancel 
                              ? `Cancel Order (${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')} remaining)`
                              : 'Cancel Time Expired'
                            }
                          </button>
                        </div>
                      )
                    })()}

                    {/* Feedback Button (if order is delivered and not rated) */}
                    {order.status === 'delivered' && !hasRated[order._id] && (
                      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setFeedbackOrderId(order._id)
                            setShowFeedbackModal(true)
                          }}
                          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center space-x-2"
                        >
                          <FiStar />
                          <span>Rate & Review</span>
                        </button>
                      </div>
                    )}

                    {/* Show rating if already rated */}
                    {order.status === 'delivered' && hasRated[order._id] && ratings[order._id] && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-green-700 font-semibold text-sm mb-1">✓ Your Rating & Review</p>
                            <div className="flex items-center space-x-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FiStar
                                  key={star}
                                  className={`text-sm ${
                                    star <= ratings[order._id].rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-xs text-gray-700">({ratings[order._id].rating}/5)</span>
                            </div>
                            {ratings[order._id].comment && (
                              <p className="text-xs text-gray-700 mt-1 italic">"{ratings[order._id].comment}"</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            <button
                              onClick={() => {
                                setFeedbackOrderId(order._id)
                                setFeedbackRating(ratings[order._id].rating)
                                setFeedbackComment(ratings[order._id].comment || '')
                                setIsEditingRating(true)
                                setEditingRatingId(ratings[order._id]._id)
                                setShowFeedbackModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <FiEdit className="text-sm" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this review?')) {
                                  try {
                                    await axios.delete(`/api/ratings/${ratings[order._id]._id}`)
                                    setHasRated(prev => ({ ...prev, [order._id]: false }))
                                    setRatings(prev => {
                                      const newRatings = { ...prev }
                                      delete newRatings[order._id]
                                      return newRatings
                                    })
                                    fetchOrders()
                                    alert('Review deleted successfully')
                                  } catch (error) {
                                    alert(error.response?.data?.message || 'Failed to delete review')
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Cancel Order</h2>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelOrderId(null)
                  setCancelReason('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Please provide a reason for canceling this order:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancel reason..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
              rows="4"
              required
            />
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  if (!cancelReason.trim()) {
                    alert('Please enter a cancel reason')
                    return
                  }
                  try {
                    await axios.put(`/api/orders/${cancelOrderId}/status`, {
                      status: 'cancelled',
                      cancelReason: cancelReason.trim()
                    })
                    setShowCancelModal(false)
                    setCancelOrderId(null)
                    setCancelReason('')
                    if (id) {
                      fetchSingleOrder(id)
                    } else {
                      fetchOrders()
                    }
                  } catch (error) {
                    alert(error.response?.data?.message || 'Failed to cancel order')
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Cancel Order
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelOrderId(null)
                  setCancelReason('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{isEditingRating ? 'Edit Your Review' : 'Rate Your Order'}</h2>
              <button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setFeedbackOrderId(null)
                  setFeedbackRating(0)
                  setFeedbackComment('')
                  setIsEditingRating(false)
                  setEditingRatingId(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">How was your experience?</p>
            
            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Rating *</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className={`text-3xl transition ${
                      star <= feedbackRating
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    <FiStar fill={star <= feedbackRating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              {feedbackRating > 0 && (
                <p className="text-sm text-gray-600 mt-2">{feedbackRating} out of 5 stars</p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Comment (Optional)</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows="4"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  if (feedbackRating === 0) {
                    alert('Please select a rating')
                    return
                  }
                  try {
                    if (isEditingRating && editingRatingId) {
                      // Update existing rating
                      const res = await axios.put(`/api/ratings/${editingRatingId}`, {
                        rating: feedbackRating,
                        comment: feedbackComment.trim()
                      })
                      setRatings(prev => ({ ...prev, [feedbackOrderId]: res.data }))
                      alert('Review updated successfully!')
                    } else {
                      // Create new rating
                      const res = await axios.post('/api/ratings', {
                        orderId: feedbackOrderId,
                        rating: feedbackRating,
                        comment: feedbackComment.trim()
                      })
                      setRatings(prev => ({ ...prev, [feedbackOrderId]: res.data }))
                      alert('Thank you for your feedback!')
                    }
                    setShowFeedbackModal(false)
                    setFeedbackOrderId(null)
                    setFeedbackRating(0)
                    setFeedbackComment('')
                    setIsEditingRating(false)
                    setEditingRatingId(null)
                    // Update hasRated state
                    setHasRated(prev => ({ ...prev, [feedbackOrderId]: true }))
                    if (id) {
                      fetchSingleOrder(id)
                    } else {
                      fetchOrders()
                    }
                  } catch (error) {
                    alert(error.response?.data?.message || 'Failed to submit feedback')
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
              >
                {isEditingRating ? 'Update Review' : 'Submit Feedback'}
              </button>
              <button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setFeedbackOrderId(null)
                  setFeedbackRating(0)
                  setFeedbackComment('')
                  setIsEditingRating(false)
                  setEditingRatingId(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders

