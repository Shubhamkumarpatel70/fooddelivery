import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { 
  FiPackage, 
  FiShoppingBag, 
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiX,
  FiHome,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiList,
  FiCheck,
  FiXCircle
} from 'react-icons/fi'

const DeliveryDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [otp, setOtp] = useState('')
  const [paymentCollected, setPaymentCollected] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState(null)
  const [activeTab, setActiveTab] = useState('assigned') // 'assigned' or 'delivered'
  const [deliveredOrders, setDeliveredOrders] = useState([])
  const [orderStats, setOrderStats] = useState({ delivered: 0, cancelled: 0 })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'delivery_boy') {
      navigate('/')
      return
    }
    fetchData()
  }, [user, navigate])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch current user details to get restaurant info
      const userRes = await axios.get('/api/users/me')
      const currentUser = userRes.data
      
      // Store approval status
      setApprovalStatus(currentUser.approvalStatus)
      
      // Only show restaurant info if user is approved
      if (currentUser.approvalStatus === 'approved' && currentUser.restaurant) {
        // Fetch restaurant details (owner will be populated by backend)
        try {
          const restaurantRes = await axios.get(`/api/restaurants/${currentUser.restaurant}`)
          setRestaurant(restaurantRes.data)
        } catch (error) {
          console.error('Error fetching restaurant:', error)
          setRestaurant(null)
        }
      } else {
        // Clear restaurant if not approved or no restaurant assigned
        setRestaurant(null)
      }
      
      // Fetch delivery orders (only if approved)
      if (currentUser.approvalStatus === 'approved') {
        const ordersRes = await axios.get('/api/orders/delivery/my-orders')
        setOrders(ordersRes.data || [])
        
        // Fetch delivered and cancelled orders
        const deliveredRes = await axios.get('/api/orders/delivery/delivered-orders')
        setDeliveredOrders(deliveredRes.data || [])
        
        // Calculate stats
        const delivered = deliveredRes.data.filter(o => o.status === 'delivered').length
        const cancelled = deliveredRes.data.filter(o => o.status === 'cancelled').length
        setOrderStats({ delivered, cancelled })
      } else {
        setOrders([])
        setDeliveredOrders([])
        setOrderStats({ delivered: 0, cancelled: 0 })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeliverOrder = async () => {
    if (!selectedOrder) return

    if (!otp || otp.length !== 4) {
      alert('Please enter a valid 4-digit OTP')
      return
    }

    try {
      await axios.put(`/api/orders/${selectedOrder._id}/verify-delivery`, {
        otp: otp,
        paymentCollected: paymentCollected
      })
      setShowDeliveryModal(false)
      setSelectedOrder(null)
      setOtp('')
      setPaymentCollected(false)
      fetchData()
      alert('Order marked as delivered successfully')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify delivery. Please check OTP.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Delivery Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
            title="Refresh"
          >
            <FiRefreshCw className="text-lg" />
            <span>Refresh</span>
          </button>
          <div className="text-sm text-gray-600">
            Welcome, <span className="font-semibold text-primary">{user?.name}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Restaurant Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Restaurant Info</h2>
            {approvalStatus === 'approved' ? (
              restaurant ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FiShoppingBag className="text-primary text-xl" />
                    <div>
                      <p className="font-semibold text-gray-800">{restaurant.name}</p>
                      <p className="text-sm text-gray-600">{restaurant.location}</p>
                    </div>
                  </div>
                  {restaurant.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiPhone className="text-primary" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiMail className="text-primary" />
                      <span>{restaurant.email}</span>
                    </div>
                  )}
                  {restaurant.owner && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiUser className="text-primary" />
                      <span>Owner: {restaurant.owner.name || restaurant.owner}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No restaurant assigned</p>
              )
            ) : (
              <div className="space-y-2">
                <p className="text-yellow-600 font-semibold">Pending Approval</p>
                <p className="text-sm text-gray-500">
                  Your account is pending admin approval. Restaurant information will be displayed once approved.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Tabs */}
            <div className="flex items-center space-x-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('assigned')}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === 'assigned'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiPackage />
                  <span>Assigned Orders</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('delivered')}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === 'delivered'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiList />
                  <span>My Delivered Orders</span>
                </div>
              </button>
            </div>

            {/* Assigned Orders Tab */}
            {activeTab === 'assigned' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Assigned Orders</h2>
            {approvalStatus !== 'approved' ? (
              <div className="text-center py-12">
                <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Account Pending Approval</p>
                <p className="text-gray-400 text-sm mt-2">
                  Your account needs to be approved by an admin before you can receive orders.
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No orders assigned</p>
                <p className="text-gray-400 text-sm mt-2">Orders will appear here when assigned to you</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-semibold text-gray-600">#{order._id.slice(-8)}</span>
                          <span className="text-lg font-bold text-gray-800">{order.user?.name || 'Customer'}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <FiMapPin className="mr-1" />
                            {typeof order.deliveryAddress === 'string' 
                              ? order.deliveryAddress 
                              : order.deliveryAddress?.address || 'N/A'}
                          </span>
                          <span className="flex items-center">
                            <FiPhone className="mr-1" />
                            {order.user?.phone || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600 mb-1">₹{order.totalAmount}</p>
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowDeliveryModal(true)
                            setPaymentCollected(false)
                            setOtp('')
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition text-sm font-semibold"
                        >
                          Mark Delivered
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Order Items:</p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.menuItem?.name || item.name || 'Item'}</span>
                            <span className="font-semibold">₹{item.price} x {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}

            {/* My Delivered Orders Tab */}
            {activeTab === 'delivered' && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">My Delivered Orders</h2>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Delivered Orders</p>
                          <p className="text-3xl font-bold text-green-600">{orderStats.delivered}</p>
                        </div>
                        <FiCheck className="text-4xl text-green-400" />
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Cancelled Orders</p>
                          <p className="text-3xl font-bold text-red-600">{orderStats.cancelled}</p>
                        </div>
                        <FiXCircle className="text-4xl text-red-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {approvalStatus !== 'approved' ? (
                  <div className="text-center py-12">
                    <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Account Pending Approval</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Your account needs to be approved by an admin before you can view orders.
                    </p>
                  </div>
                ) : deliveredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No delivered orders yet</p>
                    <p className="text-gray-400 text-sm mt-2">Your delivered and cancelled orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deliveredOrders.map((order) => (
                      <div
                        key={order._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-semibold text-gray-600">#{order._id.slice(-8)}</span>
                              <span className="text-lg font-bold text-gray-800">{order.user?.name || 'Customer'}</span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order.status === 'delivered'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {order.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center">
                                <FiMapPin className="mr-1" />
                                {typeof order.deliveryAddress === 'string' 
                                  ? order.deliveryAddress 
                                  : order.deliveryAddress?.address || 'N/A'}
                              </span>
                              <span className="flex items-center">
                                <FiPhone className="mr-1" />
                                {order.user?.phone || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <FiUser className="text-primary" />
                              <span>Delivered by: <span className="font-semibold">{user?.name || 'You'}</span></span>
                            </div>
                            {order.updatedAt && (
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                <FiClock />
                                <span>Delivered on: {new Date(order.updatedAt).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600 mb-1">₹{order.totalAmount}</p>
                            <p className="text-xs text-gray-500">
                              {order.paymentCollected ? (
                                <span className="text-green-600">Payment Collected</span>
                              ) : order.paymentStatus === 'paid' ? (
                                <span className="text-green-600">Paid</span>
                              ) : (
                                <span className="text-gray-500">Unpaid</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Order Items:</p>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.menuItem?.name || item.name || 'Item'}</span>
                                <span className="font-semibold">₹{item.price} x {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Order Delivery</h2>
              <button
                onClick={() => {
                  setShowDeliveryModal(false)
                  setSelectedOrder(null)
                  setOtp('')
                  setPaymentCollected(false)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-semibold">{selectedOrder.user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-green-600">₹{selectedOrder.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold">{selectedOrder.paymentMethod || 'Cash'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className={`font-semibold ${
                      selectedOrder.paymentStatus === 'paid' || selectedOrder.paymentApprovalStatus === 'approved' 
                        ? 'text-green-600' 
                        : 'text-yellow-600'
                    }`}>
                      {selectedOrder.paymentStatus === 'paid' || selectedOrder.paymentApprovalStatus === 'approved' 
                        ? 'Paid' 
                        : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Collection */}
              {(selectedOrder.paymentMethod === 'cash' || 
                (selectedOrder.paymentStatus !== 'paid' && selectedOrder.paymentApprovalStatus !== 'approved')) ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentCollected}
                      onChange={(e) => setPaymentCollected(e.target.checked)}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="font-semibold text-gray-800">Amount Collected from Customer</span>
                  </label>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-800 flex items-center">
                    <FiCheckCircle className="mr-2" />
                    Payment Already Paid
                  </p>
                </div>
              )}

              {/* OTP Verification */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Enter OTP from Customer *</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit OTP"
                  maxLength="4"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask the customer for the OTP from their order page and enter it here to verify delivery
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleDeliverOrder}
                  disabled={!otp || otp.length !== 4}
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Delivery
                </button>
                <button
                  onClick={() => {
                    setShowDeliveryModal(false)
                    setSelectedOrder(null)
                    setOtp('')
                    setPaymentCollected(false)
                  }}
                  className="flex-1 px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryDashboard

