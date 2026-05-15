import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { FiUser, FiMail, FiPhone, FiMapPin, FiPackage, FiClock, FiEdit2, FiPlus, FiTrash2, FiX, FiHome } from 'react-icons/fi'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on mount
    return localStorage.getItem('userActiveTab') || 'overview'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userActiveTab', activeTab)
  }, [activeTab])
  const [addresses, setAddresses] = useState([])
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    pincode: '',
    isDefault: false
  })
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchOrders()
    if (activeTab === 'addresses') {
      fetchAddresses()
    }
  }, [user, activeTab])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/orders/my-orders')
      setOrders(res.data)
      
      // Calculate stats
      const totalOrders = res.data.length
      const totalSpent = res.data.reduce((sum, order) => sum + order.totalAmount, 0)
      const pendingOrders = res.data.filter(order => 
        ['pending', 'confirmed', 'preparing', 'out for delivery'].includes(order.status)
      ).length

      setStats({ totalOrders, totalSpent, pendingOrders })
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    try {
      const res = await axios.get('/api/addresses')
      setAddresses(res.data)
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setAddresses([])
    }
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    try {
      if (editingAddress) {
        await axios.put(`/api/addresses/${editingAddress._id}`, addressForm)
      } else {
        await axios.post('/api/addresses', addressForm)
      }
      await fetchAddresses()
      setShowAddressModal(false)
      setEditingAddress(null)
      setAddressForm({
        name: user?.name || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        pincode: '',
        isDefault: false
      })
    } catch (error) {
      console.error('Error saving address:', error)
      alert('Failed to save address')
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return
    }
    try {
      await axios.delete(`/api/addresses/${addressId}`)
      await fetchAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('Failed to delete address')
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      await axios.put(`/api/addresses/${addressId}/set-default`)
      await fetchAddresses()
    } catch (error) {
      console.error('Error setting default address:', error)
      alert('Failed to set default address')
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Dashboard</h1>
        <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Addresses
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                <FiUser className="text-white text-3xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-600">
                <FiMail className="text-xl" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <FiPhone className="text-xl" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user?.address && (
                <div className="flex items-start space-x-3 text-gray-600">
                  <FiMapPin className="text-xl mt-1" />
                  <span>{user.address}</span>
                </div>
              )}
              <button
                onClick={() => navigate('/orders')}
                className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center space-x-2"
              >
                <FiEdit2 />
                <span>View Orders</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats and Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
                </div>
                <FiPackage className="text-4xl text-primary opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-gray-800">₹{stats.totalSpent}</p>
                </div>
                <FiClock className="text-4xl text-primary opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.pendingOrders}</p>
                </div>
                <FiClock className="text-4xl text-yellow-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Orders</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No orders yet</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Start Ordering
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order._id}
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {order.restaurant?.name || 'Restaurant'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    
                    {/* OTP Display for Out for Delivery */}
                    {order.status === 'out for delivery' && order.deliveryOtp && (
                      <div className="my-3 bg-blue-50 border-2 border-blue-400 rounded-lg p-3">
                        <div className="text-center">
                          <p className="text-xs text-blue-600 mb-1 font-semibold uppercase tracking-wide">Delivery OTP</p>
                          <p className="text-3xl font-bold text-blue-700 tracking-widest mb-1">
                            {order.deliveryOtp}
                          </p>
                          <p className="text-xs text-blue-600">Provide this to the delivery person</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Delivered By Display */}
                    {order.status === 'delivered' && order.deliveryBoy && (
                      <div className="my-2 text-sm text-gray-600">
                        <span className="flex items-center">
                          <FiUser className="mr-1 text-primary" />
                          <span>Delivered by: <span className="font-semibold text-gray-800">{order.deliveryBoy.name || 'N/A'}</span></span>
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="font-semibold text-primary">₹{order.totalAmount}</span>
                    </div>
                  </div>
                ))}
                {orders.length > 5 && (
                  <button
                    onClick={() => navigate('/orders')}
                    className="w-full mt-4 px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold"
                  >
                    View All Orders
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">My Addresses</h2>
            <button
              onClick={() => {
                setEditingAddress(null)
                setAddressForm({
                  name: user?.name || '',
                  phone: user?.phone || '',
                  address: '',
                  city: '',
                  pincode: '',
                  isDefault: addresses.length === 0
                })
                setShowAddressModal(true)
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
            >
              <FiPlus />
              <span>Add New Address</span>
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FiMapPin className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">No addresses saved yet</p>
              <button
                onClick={() => {
                  setEditingAddress(null)
                  setAddressForm({
                    name: user?.name || '',
                    phone: user?.phone || '',
                    address: '',
                    city: '',
                    pincode: '',
                    isDefault: true
                  })
                  setShowAddressModal(true)
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
              >
                Add New Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                    address.isDefault ? 'border-primary' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{address.name}</h3>
                        {address.isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-1">{address.phone}</p>
                      <p className="text-gray-700">{address.address}</p>
                      <p className="text-gray-600 text-sm mt-1">
                        {address.city}, {address.pincode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingAddress(address)
                        setAddressForm({
                          name: address.name,
                          phone: address.phone,
                          address: address.address,
                          city: address.city,
                          pincode: address.pincode,
                          isDefault: address.isDefault
                        })
                        setShowAddressModal(true)
                      }}
                      className="px-3 py-2 text-primary hover:text-orange-600 transition"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address._id)}
                      className="px-3 py-2 text-red-500 hover:text-red-700 transition"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={() => {
                  setShowAddressModal(false)
                  setEditingAddress(null)
                  setAddressForm({
                    name: user?.name || '',
                    phone: user?.phone || '',
                    address: '',
                    city: '',
                    pincode: '',
                    isDefault: false
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Phone *</label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Address *</label>
                <textarea
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">City *</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Pincode *</label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})}
                    required
                    pattern="[0-9]{6}"
                    maxLength="6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {addresses.length > 0 && !editingAddress && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="isDefault" className="text-gray-700 font-semibold cursor-pointer">
                    Set as default address
                  </label>
                </div>
              )}
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressModal(false)
                    setEditingAddress(null)
                    setAddressForm({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      address: '',
                      city: '',
                      pincode: '',
                      isDefault: false
                    })
                  }}
                  className="flex-1 px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

