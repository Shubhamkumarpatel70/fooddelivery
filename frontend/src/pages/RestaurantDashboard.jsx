import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { 
  FiPackage, 
  FiShoppingBag, 
  FiDollarSign,
  FiTrendingUp,
  FiEdit,
  FiMenu,
  FiX,
  FiHome,
  FiPlus,
  FiTrash2,
  FiClock,
  FiToggleLeft,
  FiToggleRight,
  FiCheckCircle,
  FiEye,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiChevronDown,
  FiChevronUp,
  FiPrinter,
  FiBarChart2,
  FiCalendar,
  FiTag,
  FiStar,
  FiRefreshCw,
  FiCreditCard
} from 'react-icons/fi'

const RestaurantDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Check if screen is large, default to open on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 // lg breakpoint
    }
    return true
  })
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on mount
    return localStorage.getItem('restaurantActiveTab') || 'overview'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('restaurantActiveTab', activeTab)
  }, [activeTab])

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // On large screens, keep sidebar state but close mobile menu
        setMobileMenuOpen(false)
      } else {
        // On small screens, close sidebar and mobile menu
        setSidebarOpen(false)
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const [orders, setOrders] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState(null)
  const [newOrderCount, setNewOrderCount] = useState(0)
  const [orderFilter, setOrderFilter] = useState('all')
  const [orderDateFilter, setOrderDateFilter] = useState('today') // 'today', 'all', 'custom'
  const [orderCustomDate, setOrderCustomDate] = useState(new Date().toISOString().split('T')[0])
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('all')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('week')
  const [restaurantCoupons, setRestaurantCoupons] = useState([])
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [categories, setCategories] = useState([])
  const [ratings, setRatings] = useState([])
  const [paymentForm, setPaymentForm] = useState({
    upiId: ''
  })
  const [showPaymentRestrictionModal, setShowPaymentRestrictionModal] = useState(false)
  const [paymentRestrictionMessage, setPaymentRestrictionMessage] = useState('')
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [earningsFilter, setEarningsFilter] = useState('today') // 'today' or 'month'
  const [todayEarnings, setTodayEarnings] = useState({
    totalAmount: 0,
    totalOrders: 0,
    orders: []
  })
  const [monthEarnings, setMonthEarnings] = useState({
    totalAmount: 0,
    totalOrders: 0,
    orders: []
  })
  const [totalEarnings, setTotalEarnings] = useState({
    totalAmount: 0,
    totalOrders: 0,
    orders: []
  })
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    validUntil: '',
    usageLimit: '',
    applicableItems: []
  })
  const [restaurantUsers, setRestaurantUsers] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'delivery_boy'
  })
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    isVeg: false,
    image: ''
  })
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    cuisine: '',
    location: '',
    deliveryTime: '',
    costForTwo: '',
    closingTime: '',
    image: ''
  })
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })

  useEffect(() => {
    if (!user || user.role !== 'restaurant') {
      navigate('/')
      return
    }
    
    // Check if restaurant was just approved
    const approved = sessionStorage.getItem('restaurantApproved')
    if (approved === 'true') {
      setShowSuccess(true)
      sessionStorage.removeItem('restaurantApproved')
    }
    
    fetchData()
    
    // Poll for new orders
    const interval = setInterval(() => {
      checkNewOrders()
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [user, activeTab])

  const checkNewOrders = async () => {
    try {
      if (!restaurant) return
      
      // Get orders for this restaurant
      const ordersRes = await axios.get(`/api/orders/restaurant/${restaurant._id}`).catch(() => ({ data: [] }))
      const newOrders = ordersRes.data?.filter(
        order => order.status === 'pending' &&
        new Date(order.createdAt) > new Date(Date.now() - 300000) // Last 5 minutes
      ) || []
      setNewOrderCount(newOrders.length)
    } catch (error) {
      // Silently fail - this is just for notification
      console.error('Error checking new orders:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch restaurant by owner
      let userRestaurant
      try {
        const res = await axios.get('/api/restaurants/my-restaurant')
        userRestaurant = res.data
      } catch (error) {
        // If restaurant not found, try to find in all restaurants
        try {
          const restaurantsRes = await axios.get('/api/restaurants?admin=true')
          userRestaurant = restaurantsRes.data.find(r => 
            r.owner && (r.owner._id === user.id || r.owner.toString() === user.id)
          )
        } catch (err) {
          console.error('Error fetching restaurants:', err)
          userRestaurant = null
        }
      }
      setRestaurant(userRestaurant)

      if (userRestaurant) {
        setRestaurantForm({
          name: userRestaurant.name || '',
          cuisine: userRestaurant.cuisine || '',
          location: userRestaurant.location || '',
          deliveryTime: userRestaurant.deliveryTime || '',
          costForTwo: userRestaurant.costForTwo || '',
          closingTime: userRestaurant.closingTime || '23:00',
          image: userRestaurant.image || ''
        })

        // Fetch menu items
        if (activeTab === 'menu' || activeTab === 'restaurant' || activeTab === 'coupons' || showCouponModal) {
          try {
            const menuRes = await axios.get(`/api/menu/restaurant/${userRestaurant._id}`)
            setMenuItems(menuRes.data || [])
          } catch (error) {
            console.error('Error fetching menu items:', error)
            setMenuItems([])
          }
        }

        // Fetch categories for menu items
        if (activeTab === 'menu' || showMenuModal) {
          try {
            const categoriesRes = await axios.get('/api/categories')
            setCategories(categoriesRes.data || [])
          } catch (error) {
            console.error('Error fetching categories:', error)
            setCategories([])
          }
        }

        // Fetch restaurant coupons
        if (activeTab === 'coupons') {
          try {
            const couponsRes = await axios.get(`/api/restaurant-coupons/restaurant/${userRestaurant._id}`)
            setRestaurantCoupons(couponsRes.data || [])
          } catch (error) {
            console.error('Error fetching coupons:', error)
            setRestaurantCoupons([])
          }
        }

        // Fetch ratings
        if (activeTab === 'ratings') {
          try {
            const ratingsRes = await axios.get(`/api/ratings/restaurant/${userRestaurant._id}`)
            setRatings(ratingsRes.data || [])
          } catch (error) {
            console.error('Error fetching ratings:', error)
            setRatings([])
          }
        }

        // Fetch restaurant users
        if (activeTab === 'users') {
          try {
            const usersRes = await axios.get('/api/restaurant-users')
            setRestaurantUsers(usersRes.data || [])
          } catch (error) {
            console.error('Error fetching restaurant users:', error)
            setRestaurantUsers([])
          }
        }

        // Fetch orders - restaurant owners can see their own orders
        if (activeTab === 'overview' || activeTab === 'orders' || activeTab === 'analytics' || activeTab === 'earnings' || activeTab === 'total-earnings') {
          try {
            // Get orders for this restaurant
            const ordersRes = await axios.get(`/api/orders/restaurant/${userRestaurant._id}`)
            const restaurantOrders = ordersRes.data
            setOrders(restaurantOrders)

            // Calculate stats
            const totalOrders = restaurantOrders.length
            const totalRevenue = restaurantOrders
              .filter(o => o.status === 'delivered')
              .reduce((sum, o) => sum + o.totalAmount, 0)
            const pendingOrders = restaurantOrders.filter(o => 
              ['pending', 'confirmed', 'preparing'].includes(o.status)
            ).length

            setStats({ totalOrders, totalRevenue, pendingOrders })
            
            // Calculate earnings (today and month)
            if (activeTab === 'earnings') {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              
              // Today's earnings
              const todayOrders = restaurantOrders.filter(order => {
                const orderDate = new Date(order.createdAt)
                orderDate.setHours(0, 0, 0, 0)
                return orderDate.getTime() === today.getTime() && order.status === 'delivered'
              })
              const todayAmount = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
              setTodayEarnings({
                totalAmount: todayAmount,
                totalOrders: todayOrders.length,
                orders: todayOrders
              })
              
              // Current month's earnings
              const currentMonth = new Date()
              currentMonth.setDate(1)
              currentMonth.setHours(0, 0, 0, 0)
              
              const monthOrders = restaurantOrders.filter(order => {
                const orderDate = new Date(order.createdAt)
                return orderDate >= currentMonth && order.status === 'delivered'
              })
              const monthAmount = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0)
              setMonthEarnings({
                totalAmount: monthAmount,
                totalOrders: monthOrders.length,
                orders: monthOrders
              })
              
              // Calculate all-time total earnings
              const allTimeOrders = restaurantOrders.filter(order => order.status === 'delivered')
              const allTimeAmount = allTimeOrders.reduce((sum, o) => sum + o.totalAmount, 0)
              setTotalEarnings({
                totalAmount: allTimeAmount,
                totalOrders: allTimeOrders.length,
                orders: allTimeOrders
              })
            }
          } catch (error) {
            console.error('Error fetching orders:', error)
            setOrders([])
          }
        }
        
        // Load payment info
        if (activeTab === 'payment' && userRestaurant) {
          setPaymentForm({ upiId: userRestaurant.upiId || '' })
          
          // Calculate days remaining if payment was changed before
          if (userRestaurant.paymentLastChanged) {
            const lastChanged = new Date(userRestaurant.paymentLastChanged)
            const now = new Date()
            const daysSinceLastChange = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24))
            const daysRemaining = Math.max(0, 14 - daysSinceLastChange)
            setDaysRemaining(daysRemaining)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOnline = async () => {
    try {
      await axios.put(`/api/restaurants/${restaurant._id}`, {
        isOnline: !restaurant.isOnline
      })
      fetchData()
    } catch (error) {
      console.error('Error toggling online status:', error)
      alert('Failed to update status')
    }
  }

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`/api/restaurants/${restaurant._id}`, restaurantForm)
      setEditingRestaurant(false)
      fetchData()
      alert('Restaurant updated successfully')
    } catch (error) {
      console.error('Error updating restaurant:', error)
      alert('Failed to update restaurant')
    }
  }

  const handleSaveMenu = async (e) => {
    e.preventDefault()
    try {
      const menuData = {
        ...menuForm,
        price: parseFloat(menuForm.price),
        discountPrice: menuForm.discountPrice ? parseFloat(menuForm.discountPrice) : null,
        discountPercent: menuForm.discountPrice && menuForm.price 
          ? Math.round(((parseFloat(menuForm.price) - parseFloat(menuForm.discountPrice)) / parseFloat(menuForm.price)) * 100)
          : null,
        restaurant: restaurant._id,
        isAvailable: true // Ensure menu items are available by default
      }

      if (editingMenuItem) {
        await axios.put(`/api/menu/${editingMenuItem._id}`, menuData)
      } else {
        await axios.post('/api/menu', menuData)
      }

      setShowMenuModal(false)
      setMenuForm({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        category: '',
        isVeg: false,
        image: ''
      })
      setEditingMenuItem(null)
      fetchData()
      alert(editingMenuItem ? 'Menu item updated' : 'Menu item added')
    } catch (error) {
      console.error('Error saving menu item:', error)
      alert('Failed to save menu item')
    }
  }

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return
    
    try {
      await axios.delete(`/api/menu/${itemId}`)
      fetchData()
      alert('Menu item deleted successfully')
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('Failed to delete menu item')
    }
  }

  const handleSaveCoupon = async (e) => {
    e.preventDefault()
    try {
      if (!restaurant) {
        alert('Restaurant not found')
        return
      }

      const couponData = {
        ...couponForm,
        discountValue: parseFloat(couponForm.discountValue),
        minOrderAmount: parseFloat(couponForm.minOrderAmount) || 0,
        maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
        usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
        validUntil: new Date(couponForm.validUntil),
        applicableItems: selectedItems,
        restaurant: restaurant._id
      }

      if (editingCoupon) {
        await axios.put(`/api/restaurant-coupons/${editingCoupon._id}`, couponData)
        alert('Coupon updated successfully')
      } else {
        await axios.post('/api/restaurant-coupons', couponData)
        alert('Coupon created successfully')
      }

      setShowCouponModal(false)
      setEditingCoupon(null)
      setSelectedItems([])
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscount: '',
        validUntil: '',
        usageLimit: '',
        applicableItems: []
      })
      fetchData()
    } catch (error) {
      console.error('Error saving coupon:', error)
      alert(error.response?.data?.message || 'Failed to save coupon')
    }
  }

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return
    
    try {
      await axios.delete(`/api/restaurant-coupons/${couponId}`)
      fetchData()
      alert('Coupon deleted successfully')
    } catch (error) {
      console.error('Error deleting coupon:', error)
      alert('Failed to delete coupon')
    }
  }

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus })
      fetchData()
      checkNewOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const handleImageChange = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'menu') {
          setMenuForm({...menuForm, image: reader.result})
        } else {
          setRestaurantForm({...restaurantForm, image: reader.result})
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/restaurant-users', userForm)
      setShowUserModal(false)
      setUserForm({
        name: '',
        phone: '',
        password: '',
        role: 'delivery_boy'
      })
      fetchData()
      alert('User created successfully')
    } catch (error) {
      console.error('Error creating user:', error)
      alert(error.response?.data?.message || 'Failed to create user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }
    try {
      await axios.delete(`/api/restaurant-users/${userId}`)
      fetchData()
      alert('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const handleAssignDelivery = async (orderId, deliveryBoyId) => {
    try {
      await axios.put(`/api/orders/${orderId}/assign-delivery`, { deliveryBoyId })
      fetchData()
      alert('Order assigned to delivery boy successfully')
    } catch (error) {
      console.error('Error assigning delivery:', error)
      alert('Failed to assign delivery')
    }
  }

  const menuTabs = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'restaurant', label: 'My Restaurant', icon: FiShoppingBag },
    { id: 'menu', label: 'Menu', icon: FiMenu },
    { id: 'coupons', label: 'Coupons', icon: FiTag },
    { id: 'orders', label: 'Orders', icon: FiPackage },
    { id: 'users', label: 'Users', icon: FiUser },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { id: 'ratings', label: 'Ratings', icon: FiStar },
    { id: 'payment', label: 'Payment', icon: FiCreditCard },
    { id: 'earnings', label: 'My Today Earnings', icon: FiDollarSign },
    { id: 'total-earnings', label: 'Total Earnings', icon: FiTrendingUp },
  ]

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <FiCheckCircle className="text-2xl" />
          <div>
            <p className="font-semibold">Restaurant Approved!</p>
            <p className="text-sm">Your restaurant is now live and ready to accept orders.</p>
          </div>
          <button onClick={() => setShowSuccess(false)} className="ml-4">
            <FiX />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        bg-white shadow-lg transition-all duration-300 
        fixed top-0 left-0 h-screen z-50 flex flex-col overflow-hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header - Fixed */}
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0">
          {sidebarOpen && <h2 className="text-xl font-bold text-primary whitespace-nowrap">Restaurant Panel</h2>}
          {!sidebarOpen && <h2 className="text-xl font-bold text-primary">R</h2>}
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen)
              if (mobileMenuOpen) setMobileMenuOpen(false)
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
        
        {/* Scrollable Menu Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e0 #f7fafc'
        }}>
          {menuTabs.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 transition relative group ${
                  activeTab === item.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className={`text-xl flex-shrink-0 ${!sidebarOpen && activeTab === item.id ? 'text-white' : ''}`} />
                <span className={`${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-opacity duration-200 whitespace-nowrap overflow-hidden flex-1`}>
                  {item.label}
                </span>
                {item.id === 'orders' && newOrderCount > 0 && (
                  <span className={`bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0'
                  } transition-opacity`}>
                    {newOrderCount}
                  </span>
                )}
                {/* Tooltip for collapsed sidebar */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                    {item.id === 'orders' && newOrderCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {newOrderCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300 w-full min-w-0`}>
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiMenu className="text-2xl" />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {menuTabs.find(m => m.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="text-sm text-gray-600 hidden md:block">
              Welcome, <span className="font-semibold text-primary">{user?.name}</span>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && restaurant && (
            <div className="space-y-6">
              {/* Online/Offline Toggle */}
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Restaurant Status</h3>
                    <p className="text-sm md:text-base text-gray-600">
                      {restaurant.isOnline ? 'Your restaurant is online and accepting orders' : 'Your restaurant is offline'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleOnline}
                    className="flex items-center space-x-2 flex-shrink-0"
                    aria-label={restaurant.isOnline ? 'Go offline' : 'Go online'}
                  >
                    {restaurant.isOnline ? (
                      <FiToggleRight className="text-3xl md:text-4xl text-green-500" />
                    ) : (
                      <FiToggleLeft className="text-3xl md:text-4xl text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 md:p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-blue-100 text-xs md:text-sm mb-1">Total Orders</p>
                      <p className="text-2xl md:text-3xl font-bold">{stats.totalOrders}</p>
                    </div>
                    <FiPackage className="text-3xl md:text-4xl opacity-50 flex-shrink-0" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 md:p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-green-100 text-xs md:text-sm mb-1">Total Revenue</p>
                      <p className="text-2xl md:text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <FiDollarSign className="text-3xl md:text-4xl opacity-50 flex-shrink-0" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-4 md:p-6 text-white sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-yellow-100 text-xs md:text-sm mb-1">Pending Orders</p>
                      <p className="text-2xl md:text-3xl font-bold">{stats.pendingOrders}</p>
                    </div>
                    <FiTrendingUp className="text-3xl md:text-4xl opacity-50 flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Recent Orders Preview */}
              {orders.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-primary hover:text-orange-600 text-sm font-semibold"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-semibold text-gray-600">#{order._id.slice(-8)}</span>
                            <span className="text-sm text-gray-800">{order.user?.name || 'Customer'}</span>
                            <span className="text-xs text-gray-500">
                              {order.items.length} item{order.items.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-gray-800">₹{order.totalAmount}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My Restaurant Tab */}
          {activeTab === 'restaurant' && restaurant && (
            <div className="bg-white rounded-lg shadow-md p-6">
              {!editingRestaurant ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">My Restaurant</h2>
                    <button
                      onClick={() => setEditingRestaurant(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
                    >
                      <FiEdit />
                      <span>Edit Restaurant</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{restaurant.name}</h3>
                        <p className="text-gray-600 mb-2">{restaurant.cuisine}</p>
                        <p className="text-gray-600">{restaurant.location}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">Rating:</span>
                          <span>{restaurant.rating} ⭐</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FiClock className="mr-2" />
                          <span className="font-semibold">Delivery Time:</span>
                          <span>{restaurant.deliveryTime}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">Cost for Two:</span>
                          <span>₹{restaurant.costForTwo}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">Closing Time:</span>
                          <span>{restaurant.closingTime}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            restaurant.isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {restaurant.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateRestaurant} className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Restaurant</h2>
                    <button
                      type="button"
                      onClick={() => setEditingRestaurant(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX className="text-2xl" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Restaurant Name</label>
                      <input
                        type="text"
                        value={restaurantForm.name}
                        onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Cuisine</label>
                      <input
                        type="text"
                        value={restaurantForm.cuisine}
                        onChange={(e) => setRestaurantForm({...restaurantForm, cuisine: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Location</label>
                      <input
                        type="text"
                        value={restaurantForm.location}
                        onChange={(e) => setRestaurantForm({...restaurantForm, location: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Delivery Time</label>
                      <input
                        type="text"
                        value={restaurantForm.deliveryTime}
                        onChange={(e) => setRestaurantForm({...restaurantForm, deliveryTime: e.target.value})}
                        placeholder="30-40 mins"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Cost for Two</label>
                      <input
                        type="number"
                        value={restaurantForm.costForTwo}
                        onChange={(e) => setRestaurantForm({...restaurantForm, costForTwo: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Closing Time</label>
                      <input
                        type="time"
                        value={restaurantForm.closingTime}
                        onChange={(e) => setRestaurantForm({...restaurantForm, closingTime: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Restaurant Image</label>
                    {restaurantForm.image && (
                      <img src={restaurantForm.image} alt="Preview" className="w-32 h-32 object-cover rounded-lg mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'restaurant')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                  >
                    Save Changes
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === 'menu' && restaurant && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Menu Items</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <select
                    value={menuCategoryFilter}
                    onChange={(e) => setMenuCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                  >
                    <option value="all">All Categories</option>
                    {[...new Set(menuItems.map(item => item.category))].map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <button
                  onClick={() => {
                    setShowMenuModal(true)
                    setEditingMenuItem(null)
                    setMenuForm({
                      name: '',
                      description: '',
                      price: '',
                      discountPrice: '',
                      category: '',
                      isVeg: false,
                      image: ''
                    })
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
                >
                  <FiPlus />
                  <span>Add Menu Item</span>
                </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                {menuItems.length === 0 ? (
                  <div className="text-center py-12">
                    <FiMenu className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No menu items yet</p>
                    <p className="text-gray-400 text-sm mt-2">Add your first menu item to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(menuCategoryFilter === 'all' 
                      ? menuItems 
                      : menuItems.filter(item => item.category === menuCategoryFilter)
                    ).map((item) => (
                    <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          {item.discountPrice ? (
                            <div>
                              <span className="text-lg font-bold text-primary">₹{item.discountPrice}</span>
                              <span className="text-sm text-gray-500 line-through ml-2">₹{item.price}</span>
                              <span className="text-sm text-green-600 ml-2">({item.discountPercent}% off)</span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-primary">₹{item.price}</span>
                          )}
                        </div>
                        <span className={`text-xs font-semibold ${item.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                          {item.isVeg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => {
                            setEditingMenuItem(item)
                            setMenuForm({
                              name: item.name,
                              description: item.description || '',
                              price: item.price,
                              discountPrice: item.discountPrice || '',
                              category: item.category,
                              isVeg: item.isVeg,
                              image: item.image || ''
                            })
                            setShowMenuModal(true)
                          }}
                          className="flex-1 px-3 py-1 bg-primary text-white rounded hover:bg-orange-600 transition text-sm"
                        >
                          <FiEdit className="inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && restaurant && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Restaurant Coupons</h2>
                <button
                  onClick={() => {
                    setShowCouponModal(true)
                    setEditingCoupon(null)
                    setSelectedItems([])
                    setCouponForm({
                      code: '',
                      description: '',
                      discountType: 'percentage',
                      discountValue: '',
                      minOrderAmount: '',
                      maxDiscount: '',
                      validUntil: '',
                      usageLimit: '',
                      applicableItems: []
                    })
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
                >
                  <FiPlus />
                  <span>Add Coupon</span>
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Discount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Applicable Items</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Valid Until</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurantCoupons.map((coupon) => (
                        <tr key={coupon._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold">{coupon.code}</td>
                          <td className="py-3 px-4">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%` 
                              : `₹${coupon.discountValue}`}
                            {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                              <span className="text-xs text-gray-500"> (max ₹{coupon.maxDiscount})</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {coupon.applicableItems && coupon.applicableItems.length > 0 
                              ? `${coupon.applicableItems.length} item(s)`
                              : 'All items'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(coupon.validUntil).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {coupon.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCoupon(coupon)
                                  setSelectedItems(coupon.applicableItems?.map(item => item._id || item) || [])
                                  setCouponForm({
                                    code: coupon.code,
                                    description: coupon.description || '',
                                    discountType: coupon.discountType,
                                    discountValue: coupon.discountValue,
                                    minOrderAmount: coupon.minOrderAmount || '',
                                    maxDiscount: coupon.maxDiscount || '',
                                    validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
                                    usageLimit: coupon.usageLimit || '',
                                    applicableItems: coupon.applicableItems?.map(item => item._id || item) || []
                                  })
                                  setShowCouponModal(true)
                                }}
                                className="text-primary hover:text-orange-600"
                              >
                                <FiEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon._id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (() => {
            // Filter orders by date
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            let filteredOrders = orders
            
            // Apply date filter
            if (orderDateFilter === 'today') {
              filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt)
                orderDate.setHours(0, 0, 0, 0)
                return orderDate.getTime() === today.getTime()
              })
            } else if (orderDateFilter === 'custom') {
              const selectedDate = new Date(orderCustomDate)
              selectedDate.setHours(0, 0, 0, 0)
              filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt)
                orderDate.setHours(0, 0, 0, 0)
                return orderDate.getTime() === selectedDate.getTime()
              })
            }
            
            // Apply status filter
            if (orderFilter !== 'all') {
              filteredOrders = filteredOrders.filter(order => order.status === orderFilter)
            }
            
            // Group orders by date
            const ordersByDate = {}
            filteredOrders.forEach(order => {
              const orderDate = new Date(order.createdAt)
              const dateKey = orderDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
              
              if (!ordersByDate[dateKey]) {
                ordersByDate[dateKey] = []
              }
              ordersByDate[dateKey].push(order)
            })
            
            const sortedDates = Object.keys(ordersByDate).sort((a, b) => {
              return new Date(b) - new Date(a)
            })
            
            return (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <h2 className="text-2xl font-bold text-gray-800">Customer Orders</h2>
                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    <button
                      onClick={() => fetchData()}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
                    >
                      <FiRefreshCw />
                      <span>Refresh</span>
                    </button>
                    <select
                      value={orderDateFilter}
                      onChange={(e) => setOrderDateFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="today">Today's Orders</option>
                      <option value="all">All Orders</option>
                      <option value="custom">Custom Date</option>
                    </select>
                    {orderDateFilter === 'custom' && (
                      <input
                        type="date"
                        value={orderCustomDate}
                        onChange={(e) => setOrderCustomDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="out for delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Summary Cards */}
                {(() => {
                  const todayOrders = orders.filter(order => {
                    const orderDate = new Date(order.createdAt)
                    orderDate.setHours(0, 0, 0, 0)
                    return orderDate.getTime() === today.getTime()
                  })
                  const todayTotal = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-100">
                        <p className="text-gray-600 text-xs md:text-sm mb-1">Today's Orders</p>
                        <p className="text-xl md:text-2xl font-bold text-blue-600">{todayOrders.length}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 md:p-4 border border-green-100">
                        <p className="text-gray-600 text-xs md:text-sm mb-1">Today's Revenue</p>
                        <p className="text-xl md:text-2xl font-bold text-green-600">₹{todayTotal}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 md:p-4 border border-purple-100">
                        <p className="text-gray-600 text-xs md:text-sm mb-1">Filtered Orders</p>
                        <p className="text-xl md:text-2xl font-bold text-purple-600">{filteredOrders.length}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 md:p-4 border border-orange-100">
                        <p className="text-gray-600 text-xs md:text-sm mb-1">Total Orders</p>
                        <p className="text-xl md:text-2xl font-bold text-orange-600">{orders.length}</p>
                      </div>
                    </div>
                  )
                })()}

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No orders found</p>
                    {orderDateFilter === 'today' && (
                      <p className="text-gray-400 text-sm mt-2">No orders for today yet</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedDates.map((dateKey) => (
                      <div key={dateKey} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FiCalendar className="mr-2" />
                            {dateKey}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              ({ordersByDate[dateKey].length} order{ordersByDate[dateKey].length !== 1 ? 's' : ''})
                            </span>
                          </h3>
                        </div>
                        <div className="p-6 space-y-4">
                          {ordersByDate[dateKey].map((order) => (
                            <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className="text-sm font-semibold text-gray-600">#{order._id.slice(-8)}</span>
                                    <span className="text-lg font-bold text-gray-800">{order.user?.name || 'Customer'}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span className="flex items-center">
                                      <FiPackage className="mr-1" />
                                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                    </span>
                                    <span className="flex items-center">
                                      <FiClock className="mr-1" />
                                      {new Date(order.createdAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-green-600 mb-1">₹{order.totalAmount}</p>
                                  <select
                                    value={order.status}
                                    onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                                    className="px-3 py-1 rounded text-xs font-semibold border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="out for delivery">Out for Delivery</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                  {order.status === 'out for delivery' && !order.deliveryBoy && (
                                    <div className="mt-2">
                                      <select
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handleAssignDelivery(order._id, e.target.value)
                                          }
                                        }}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                      >
                                        <option value="">Assign Delivery Boy</option>
                                        {restaurantUsers.filter(u => u.role === 'delivery_boy').map(user => (
                                          <option key={user._id} value={user._id}>{user.name} ({user.phone})</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {expandedOrder === order._id ? (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <button
                                    onClick={() => setExpandedOrder(null)}
                                    className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
                                  >
                                    <FiChevronUp className="mr-1" />
                                    Hide Details
                                  </button>
                                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Customer</p>
                                        <p className="text-sm text-gray-600">{order.user?.name || 'N/A'}</p>
                                        {order.user?.email && (
                                          <p className="text-xs text-gray-500">{order.user.email}</p>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Delivery Address</p>
                                        <p className="text-sm text-gray-600">
                                          {typeof order.deliveryAddress === 'string' 
                                            ? order.deliveryAddress 
                                            : order.deliveryAddress?.address || 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-700 mb-1">Payment Method</p>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                        {order.paymentMethod || 'Cash on Delivery'}
                                      </span>
                                      <div className="mt-2">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                          order.paymentStatus === 'paid' || order.paymentApprovalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                          order.paymentStatus === 'failed' || order.paymentApprovalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                          order.paymentMethod === 'cash' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {order.paymentStatus === 'paid' || order.paymentApprovalStatus === 'approved' ? 'Paid' : 
                                           order.paymentStatus === 'failed' || order.paymentApprovalStatus === 'rejected' ? 'Failed' : 
                                           order.paymentMethod === 'cash' ? 'Unpaid' : 'Pending'}
                                        </span>
                                      </div>
                                      {order.status === 'delivered' && (order.paymentMethod === 'cash' || order.paymentStatus !== 'paid') && (
                                        <div className="mt-2">
                                          <label className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              checked={order.paymentCollected || false}
                                              onChange={async (e) => {
                                                try {
                                                  await axios.put(`/api/orders/${order._id}/status`, {
                                                    paymentCollected: e.target.checked
                                                  })
                                                  fetchData()
                                                } catch (error) {
                                                  alert('Failed to update payment collection status')
                                                }
                                              }}
                                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                            />
                                            <span className="text-xs text-gray-700">Payment Collected</span>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-700 mb-2">Order Items</p>
                                      <div className="space-y-2">
                                        {order.items.map((item, idx) => (
                                          <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded">
                                            <span>{item.menuItem?.name || item.name || 'Item'}</span>
                                            <span className="font-semibold">₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                      <span className="font-semibold text-gray-700">Total Amount:</span>
                                      <span className="font-bold text-lg text-green-600">₹{order.totalAmount}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setExpandedOrder(order._id)}
                                  className="mt-3 text-sm text-primary hover:text-orange-600 flex items-center"
                                >
                                  <FiChevronDown className="mr-1" />
                                  View Details
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })(          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Restaurant Users</h2>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
                >
                  <FiPlus />
                  <span>Add User</span>
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurantUsers.map((user) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold">{user.name}</td>
                          <td className="py-3 px-4">{user.phone}</td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {user.role === 'delivery_boy' ? 'Delivery Boy' : 'Owner'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && restaurant && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Analytics & Reports</h2>
                <select
                  value={analyticsPeriod}
                  onChange={(e) => setAnalyticsPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {orders.filter(o => {
                          const orderDate = new Date(o.createdAt)
                          const now = new Date()
                          if (analyticsPeriod === 'today') return orderDate.toDateString() === now.toDateString()
                          if (analyticsPeriod === 'week') {
                            const weekAgo = new Date(now)
                            weekAgo.setDate(weekAgo.getDate() - 7)
                            return orderDate >= weekAgo
                          }
                          if (analyticsPeriod === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
                          if (analyticsPeriod === 'year') return orderDate.getFullYear() === now.getFullYear()
                          return true
                        }).length}
                      </p>
                    </div>
                    <FiPackage className="text-3xl text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Revenue</p>
                      <p className="text-2xl font-bold text-gray-800">
                        ₹{orders.filter(o => {
                          const orderDate = new Date(o.createdAt)
                          const now = new Date()
                          if (analyticsPeriod === 'today') return orderDate.toDateString() === now.toDateString() && o.status === 'delivered'
                          if (analyticsPeriod === 'week') {
                            const weekAgo = new Date(now)
                            weekAgo.setDate(weekAgo.getDate() - 7)
                            return orderDate >= weekAgo && o.status === 'delivered'
                          }
                          if (analyticsPeriod === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear() && o.status === 'delivered'
                          if (analyticsPeriod === 'year') return orderDate.getFullYear() === now.getFullYear() && o.status === 'delivered'
                          return o.status === 'delivered'
                        }).reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
                      </p>
                    </div>
                    <FiDollarSign className="text-3xl text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Completed Orders</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {orders.filter(o => {
                          const orderDate = new Date(o.createdAt)
                          const now = new Date()
                          if (analyticsPeriod === 'today') return orderDate.toDateString() === now.toDateString() && o.status === 'delivered'
                          if (analyticsPeriod === 'week') {
                            const weekAgo = new Date(now)
                            weekAgo.setDate(weekAgo.getDate() - 7)
                            return orderDate >= weekAgo && o.status === 'delivered'
                          }
                          if (analyticsPeriod === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear() && o.status === 'delivered'
                          if (analyticsPeriod === 'year') return orderDate.getFullYear() === now.getFullYear() && o.status === 'delivered'
                          return o.status === 'delivered'
                        }).length}
                      </p>
                    </div>
                    <FiCheckCircle className="text-3xl text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Average Order Value</p>
                      <p className="text-2xl font-bold text-gray-800">
                        ₹{(() => {
                          const deliveredOrders = orders.filter(o => {
                            const orderDate = new Date(o.createdAt)
                            const now = new Date()
                            if (analyticsPeriod === 'today') return orderDate.toDateString() === now.toDateString() && o.status === 'delivered'
                            if (analyticsPeriod === 'week') {
                              const weekAgo = new Date(now)
                              weekAgo.setDate(weekAgo.getDate() - 7)
                              return orderDate >= weekAgo && o.status === 'delivered'
                            }
                            if (analyticsPeriod === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear() && o.status === 'delivered'
                            if (analyticsPeriod === 'year') return orderDate.getFullYear() === now.getFullYear() && o.status === 'delivered'
                            return o.status === 'delivered'
                          })
                          if (deliveredOrders.length === 0) return 0
                          const avg = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0) / deliveredOrders.length
                          return Math.round(avg).toLocaleString()
                        })()}
                      </p>
                    </div>
                    <FiTrendingUp className="text-3xl text-purple-500 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Order Status Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {['pending', 'confirmed', 'preparing', 'out for delivery', 'delivered', 'cancelled'].map(status => {
                    const count = orders.filter(o => {
                      const orderDate = new Date(o.createdAt)
                      const now = new Date()
                      if (analyticsPeriod === 'today') return orderDate.toDateString() === now.toDateString() && o.status === status
                      if (analyticsPeriod === 'week') {
                        const weekAgo = new Date(now)
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return orderDate >= weekAgo && o.status === status
                      }
                      if (analyticsPeriod === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear() && o.status === status
                      if (analyticsPeriod === 'year') return orderDate.getFullYear() === now.getFullYear() && o.status === status
                      return o.status === status
                    }).length
                    return (
                      <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-800">{count}</p>
                        <p className="text-xs text-gray-600 mt-1 capitalize">{status}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Popular Items */}
              {menuItems.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Popular Menu Items</h3>
                  <div className="space-y-2">
                    {(() => {
                      const itemCounts = {}
                      orders.forEach(order => {
                        order.items.forEach(item => {
                          const itemName = item.menuItem?.name || item.name || 'Unknown Item'
                          itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity
                        })
                      })
                      const popularItems = Object.entries(itemCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                      return popularItems.length > 0 ? (
                        popularItems.map(([name, count]) => (
                          <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-800">{name}</span>
                            <span className="text-sm text-gray-600">{count} orders</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No orders yet</p>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Settings</h2>
              
              {/* Payment Restriction Info */}
              {restaurant?.paymentLastChanged && daysRemaining > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FiClock className="text-yellow-600 text-xl mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-1">Payment Settings Locked</h3>
                      <p className="text-sm text-yellow-700">
                        You can change your payment settings again after <span className="font-bold">{daysRemaining} day(s)</span>.
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Last changed: {new Date(restaurant.paymentLastChanged).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {restaurant?.paymentLastChanged && daysRemaining === 0 && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FiCheckCircle className="text-green-600 text-xl mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-800 mb-1">Payment Settings Can Be Changed</h3>
                      <p className="text-sm text-green-700">
                        You can now update your payment settings. After updating, you'll need to wait 14 days before changing again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault()
                
                // Check if 14 days restriction applies
                if (restaurant?.paymentLastChanged) {
                  const lastChanged = new Date(restaurant.paymentLastChanged)
                  const now = new Date()
                  const daysSinceLastChange = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24))
                  
                  if (daysSinceLastChange < 14) {
                    const daysRemaining = 14 - daysSinceLastChange
                    setDaysRemaining(daysRemaining)
                    setPaymentRestrictionMessage(
                      `Payment settings cannot be changed before 14 days. You can change again after ${daysRemaining} day(s).`
                    )
                    setShowPaymentRestrictionModal(true)
                    return
                  }
                }

                try {
                  const response = await axios.put(`/api/restaurants/${restaurant._id}/payment`, {
                    upiId: paymentForm.upiId
                  })
                  
                  if (response.data.canChange) {
                    alert('Payment settings updated successfully. You can change again after 14 days.')
                    fetchData()
                  }
                } catch (error) {
                  if (error.response?.status === 400) {
                    // 14-day restriction error
                    setPaymentRestrictionMessage(error.response.data.message)
                    setDaysRemaining(error.response.data.daysRemaining || 0)
                    setShowPaymentRestrictionModal(true)
                  } else {
                    alert('Failed to update payment settings')
                  }
                }
              }}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">UPI ID</label>
                  <input
                    type="text"
                    value={paymentForm.upiId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                    placeholder="Enter your UPI ID (e.g., yourname@paytm)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={restaurant?.paymentLastChanged && daysRemaining > 0}
                  />
                  <p className="text-sm text-gray-500 mt-1">This UPI ID will be used for receiving payments from admin</p>
                  {restaurant?.paymentLastChanged && daysRemaining > 0 && (
                    <p className="text-sm text-red-600 mt-1 font-medium">
                      ⚠️ Payment settings are locked for {daysRemaining} more day(s)
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={restaurant?.paymentLastChanged && daysRemaining > 0}
                >
                  Save UPI ID
                </button>
              </form>
            </div>
          )}

          {/* Payment Restriction Modal */}
          {showPaymentRestrictionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Payment Settings Restriction</h3>
                  <button
                    onClick={() => setShowPaymentRestrictionModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX className="text-2xl" />
                  </button>
                </div>
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <FiClock className="text-yellow-600 text-2xl mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 mb-2">{paymentRestrictionMessage}</p>
                      {restaurant?.paymentLastChanged && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Last changed:</span> {new Date(restaurant.paymentLastChanged).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This restriction helps maintain payment security and prevents frequent changes. 
                      You can update your payment settings again after 14 days from your last change.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentRestrictionModal(false)}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Understood
                </button>
              </div>
            </div>
          )}

          {/* My Today Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Earnings</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEarningsFilter('today')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      earningsFilter === 'today'
                        ? 'bg-[#FF5A5F] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setEarningsFilter('month')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      earningsFilter === 'month'
                        ? 'bg-[#FF5A5F] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    This Month
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-gray-600 text-sm mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {earningsFilter === 'today' ? todayEarnings.totalOrders : monthEarnings.totalOrders}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-gray-600 text-sm mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{earningsFilter === 'today' ? todayEarnings.totalAmount : monthEarnings.totalAmount}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-gray-600 text-sm mb-1">UPI ID</p>
                  <p className="text-lg font-semibold text-purple-600">{restaurant?.upiId || 'Not Set'}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <p className="text-gray-600 text-sm mb-1">Current Month Total</p>
                  <p className="text-2xl font-bold text-orange-600">₹{monthEarnings.totalAmount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              
              {(earningsFilter === 'today' ? todayEarnings.orders : monthEarnings.orders).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">UTR Number</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          {earningsFilter === 'today' ? 'Time' : 'Date & Time'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(earningsFilter === 'today' ? todayEarnings.orders : monthEarnings.orders).map((order) => (
                        <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">#{order._id.slice(-8)}</td>
                          <td className="py-3 px-4">{order.user?.name || 'N/A'}</td>
                          <td className="py-3 px-4 font-semibold">₹{order.totalAmount}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                              order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.paymentStatus || 'pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{order.utrNumber || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {earningsFilter === 'today' 
                              ? new Date(order.createdAt).toLocaleTimeString()
                              : new Date(order.createdAt).toLocaleString()
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No earnings {earningsFilter === 'today' ? 'for today' : 'for this month'} yet
                </p>
              )}
            </div>
          )}

          {/* Total Earnings Tab */}
          {activeTab === 'total-earnings' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Total Earnings (All Time)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-gray-600 text-sm mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{totalEarnings.totalOrders}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-gray-600 text-sm mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalEarnings.totalAmount}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-gray-600 text-sm mb-1">Paid Orders</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {totalEarnings.orders.filter(o => o.paymentStatus === 'paid').length}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <p className="text-gray-600 text-sm mb-1">Pending Payment</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{totalEarnings.orders.filter(o => o.paymentStatus !== 'paid').reduce((sum, o) => sum + o.totalAmount, 0)}
                  </p>
                </div>
              </div>
              
              {totalEarnings.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">UTR Number</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalEarnings.orders
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((order) => (
                          <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">#{order._id.slice(-8)}</td>
                            <td className="py-3 px-4">{order.user?.name || 'N/A'}</td>
                            <td className="py-3 px-4 font-semibold">₹{order.totalAmount}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.paymentStatus || 'pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">{order.utrNumber || '-'}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No earnings recorded yet</p>
              )}
            </div>
          )}

          {/* Ratings Tab */}
          {activeTab === 'ratings' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Ratings</h2>
              {ratings.length === 0 ? (
                <div className="text-center py-12">
                  <FiStar className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No ratings yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((rating) => {
                    // Mask user name - show first 2 letters, rest masked
                    const userName = rating.user?.name || 'Anonymous'
                    const maskedName = userName.length > 2 
                      ? userName.substring(0, 2) + '*'.repeat(userName.length - 2)
                      : userName + '*'
                    
                    return (
                      <div key={rating._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-800">{maskedName}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FiStar
                                key={star}
                                className={`text-lg ${
                                  star <= rating.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2 font-semibold text-gray-700">{rating.rating}/5</span>
                          </div>
                        </div>
                        {rating.comment && (
                          <p className="text-gray-700 bg-gray-50 rounded-lg p-3 mt-2">
                            {rating.comment}
                          </p>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          Order Amount: ₹{rating.order?.totalAmount || 'N/A'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button
                onClick={() => {
                  setShowMenuModal(false)
                  setEditingMenuItem(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleSaveMenu} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={menuForm.price}
                    onChange={(e) => {
                      const price = e.target.value
                      setMenuForm({...menuForm, price})
                      // Auto-calculate discount percent if discount price exists
                      if (menuForm.discountPrice && price) {
                        const discount = ((parseFloat(price) - parseFloat(menuForm.discountPrice)) / parseFloat(price)) * 100
                        // This will be calculated on submit
                      }
                    }}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Discount Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={menuForm.discountPrice}
                    onChange={(e) => setMenuForm({...menuForm, discountPrice: e.target.value})}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {menuForm.discountPrice && menuForm.price && (
                    <p className="text-sm text-green-600 mt-1">
                      Discount: {Math.round(((parseFloat(menuForm.price) - parseFloat(menuForm.discountPrice)) / parseFloat(menuForm.price)) * 100)}%
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Item Image</label>
                {menuForm.image && (
                  <img src={menuForm.image} alt="Preview" className="w-32 h-32 object-cover rounded-lg mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'menu')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-sm text-gray-500 mt-1">Minimum 4 images, Maximum 5 images per item</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isVeg"
                  checked={menuForm.isVeg}
                  onChange={(e) => setMenuForm({...menuForm, isVeg: e.target.checked})}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isVeg" className="text-gray-700 font-semibold cursor-pointer">
                  Vegetarian Item
                </label>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  {editingMenuItem ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuModal(false)
                    setEditingMenuItem(null)
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

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
              </h2>
              <button
                onClick={() => {
                  setShowCouponModal(false)
                  setEditingCoupon(null)
                  setSelectedItems([])
                  setCouponForm({
                    code: '',
                    description: '',
                    discountType: 'percentage',
                    discountValue: '',
                    minOrderAmount: '',
                    maxDiscount: '',
                    validUntil: '',
                    usageLimit: '',
                    applicableItems: []
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Coupon Code *</label>
                  <input
                    type="text"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Discount Type *</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Discount Value {couponForm.discountType === 'percentage' ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({...couponForm, discountValue: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {couponForm.discountType === 'percentage' && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Max Discount (₹)</label>
                    <input
                      type="number"
                      value={couponForm.maxDiscount}
                      onChange={(e) => setCouponForm({...couponForm, maxDiscount: e.target.value})}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm({...couponForm, minOrderAmount: e.target.value})}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Valid Until *</label>
                  <input
                    type="date"
                    value={couponForm.validUntil}
                    onChange={(e) => setCouponForm({...couponForm, validUntil: e.target.value})}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Usage Limit</label>
                  <input
                    type="number"
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm({...couponForm, usageLimit: e.target.value})}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Unlimited if empty"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({...couponForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows="2"
                  placeholder="Coupon description"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Applicable Menu Items</label>
                <p className="text-sm text-gray-600 mb-2">Select items to apply discount. Leave empty to apply to all items.</p>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {menuItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No menu items available</p>
                  ) : (
                    <div className="space-y-2">
                      {menuItems.map((item) => (
                        <label key={item._id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, item._id])
                              } else {
                                setSelectedItems(selectedItems.filter(id => id !== item._id))
                              }
                            }}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span className="flex-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-gray-600 ml-2">- ₹{item.price}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCouponModal(false)
                    setEditingCoupon(null)
                    setSelectedItems([])
                    setCouponForm({
                      code: '',
                      description: '',
                      discountType: 'percentage',
                      discountValue: '',
                      minOrderAmount: '',
                      maxDiscount: '',
                      validUntil: '',
                      usageLimit: '',
                      applicableItems: []
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

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add User</h2>
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setUserForm({
                    name: '',
                    phone: '',
                    password: '',
                    role: 'delivery_boy'
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password *</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  required
                  minLength="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="delivery_boy">Delivery Boy</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false)
                    setUserForm({
                      name: '',
                      phone: '',
                      password: '',
                      role: 'delivery_boy'
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

export default RestaurantDashboard
