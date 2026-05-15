import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { 
  FiPackage, 
  FiUsers, 
  FiUser,
  FiShoppingBag, 
  FiDollarSign,
  FiTrendingUp,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiEye,
  FiMenu,
  FiX,
  FiTag,
  FiHome,
  FiToggleLeft,
  FiToggleRight,
  FiFilter,
  FiStar,
  FiCreditCard,
  FiCalendar,
  FiSettings,
  FiCheckCircle
} from 'react-icons/fi'

const AdminDashboard = () => {
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
    return localStorage.getItem('adminActiveTab') || 'overview'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab)
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
  const [filteredOrders, setFilteredOrders] = useState([])
  const [users, setUsers] = useState([])
  const [coupons, setCoupons] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [filteredRestaurants, setFilteredRestaurants] = useState([])
  const [restaurantRegistrations, setRestaurantRegistrations] = useState([])
  const [carousels, setCarousels] = useState([])
  const [categories, setCategories] = useState([])
  const [ratings, setRatings] = useState([])
  const [charges, setCharges] = useState([])
  const [currentCharges, setCurrentCharges] = useState({ platformFee: 0, deliveryFee: 50, tax: 5 })
  const [loading, setLoading] = useState(true)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showChargesModal, setShowChargesModal] = useState(false)
  const [showCarouselModal, setShowCarouselModal] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [viewingRegistration, setViewingRegistration] = useState(null)
  const [editingRestaurant, setEditingRestaurant] = useState(null)
  const [editingCarousel, setEditingCarousel] = useState(null)
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    cuisine: '',
    location: '',
    deliveryTime: '',
    costForTwo: '',
    closingTime: '',
    image: '',
    isActive: true,
    isOnline: true
  })
  const [orderFilter, setOrderFilter] = useState('all')
  const [restaurantFilter, setRestaurantFilter] = useState('all')
  const [carouselForm, setCarouselForm] = useState({
    image: '',
    title: '',
    description: '',
    link: '',
    order: 0
  })
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    offerType: 'food',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    validUntil: '',
    usageLimit: ''
  })
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalRestaurants: 0,
    pendingOrders: 0
  })
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null)
  const [utrNumber, setUtrNumber] = useState('')
  const [todaySpent, setTodaySpent] = useState([])
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all') // 'all', 'configured', 'pending', 'locked'
  const [todaySpentDate, setTodaySpentDate] = useState(new Date().toISOString().split('T')[0])
  const [transactionHistory, setTransactionHistory] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    name: 'cash',
    displayName: 'Cash on Delivery',
    isActive: true,
    qrCodeData: ''
  })
  const [deliveryBoys, setDeliveryBoys] = useState([])
  const [showDeliveryEditModal, setShowDeliveryEditModal] = useState(false)
  const [editingDeliveryBoy, setEditingDeliveryBoy] = useState(null)
  const [deliveryBoyForm, setDeliveryBoyForm] = useState({
    name: '',
    phone: '',
    password: ''
  })

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }
    fetchData()
  }, [user, activeTab, todaySpentDate])

  useEffect(() => {
    applyOrderFilter()
  }, [orders, orderFilter])

  useEffect(() => {
    applyRestaurantFilter()
  }, [restaurants, restaurantFilter])

  const applyOrderFilter = () => {
    let filtered = [...orders]
    
    if (orderFilter === 'pending') {
      filtered = filtered.filter(o => o.status === 'pending')
    } else if (orderFilter === 'confirmed') {
      filtered = filtered.filter(o => o.status === 'confirmed')
    } else if (orderFilter === 'preparing') {
      filtered = filtered.filter(o => o.status === 'preparing')
    } else if (orderFilter === 'delivered') {
      filtered = filtered.filter(o => o.status === 'delivered')
    } else if (orderFilter === 'cancelled') {
      filtered = filtered.filter(o => o.status === 'cancelled')
    }
    
    setFilteredOrders(filtered)
  }

  const applyRestaurantFilter = () => {
    let filtered = [...restaurants]
    
    if (restaurantFilter === 'active') {
      filtered = filtered.filter(r => r.isActive)
    } else if (restaurantFilter === 'inactive') {
      filtered = filtered.filter(r => !r.isActive)
    }
    
    setFilteredRestaurants(filtered)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'overview' || activeTab === 'orders' || activeTab === 'transaction-history') {
        const ordersRes = await axios.get('/api/orders/all')
        setOrders(ordersRes.data)
      }
      
      if (activeTab === 'overview' || activeTab === 'restaurants' || activeTab === 'payment' || activeTab === 'transaction-history') {
        const restaurantsRes = await axios.get('/api/restaurants?admin=true')
        setRestaurants(restaurantsRes.data)
      }
      
      if (activeTab === 'users') {
        const usersRes = await axios.get('/api/users')
        setUsers(usersRes.data)
      }

      if (activeTab === 'coupons') {
        const couponsRes = await axios.get('/api/coupons/all')
        setCoupons(couponsRes.data)
      }
      
      if (activeTab === 'payment-methods') {
        try {
          const paymentMethodsRes = await axios.get('/api/payment-methods/all')
          setPaymentMethods(paymentMethodsRes.data)
        } catch (error) {
          console.error('Error fetching payment methods:', error)
          setPaymentMethods([])
        }
      }

      if (activeTab === 'delivery') {
        try {
          const deliveryBoysRes = await axios.get('/api/users/delivery-boys')
          setDeliveryBoys(deliveryBoysRes.data)
        } catch (error) {
          console.error('Error fetching delivery boys:', error)
          setDeliveryBoys([])
        }
      }

      if (activeTab === 'charges') {
        try {
          const chargesRes = await axios.get('/api/charges/all')
          setCharges(chargesRes.data || [])
        } catch (error) {
          console.error('Error fetching charges:', error)
          setCharges([])
        }
        try {
          const currentRes = await axios.get('/api/charges')
          setCurrentCharges(currentRes.data || { platformFee: 0, deliveryFee: 50, tax: 5 })
        } catch (error) {
          console.error('Error fetching current charges:', error)
          setCurrentCharges({ platformFee: 0, deliveryFee: 50, tax: 5 })
        }
      }

      if (activeTab === 'restaurant-registration') {
        const registrationsRes = await axios.get('/api/restaurant-registration/all')
        setRestaurantRegistrations(registrationsRes.data)
      }

      if (activeTab === 'carousel') {
        const carouselsRes = await axios.get('/api/carousel/all')
        setCarousels(carouselsRes.data)
      }

      if (activeTab === 'categories') {
        const categoriesRes = await axios.get('/api/categories/all')
        setCategories(categoriesRes.data)
      }
      
      if (activeTab === 'ratings') {
        const ratingsRes = await axios.get('/api/ratings/all')
        setRatings(ratingsRes.data)
      }
      
      if (activeTab === 'transaction-history') {
        const ordersRes = await axios.get('/api/orders/all')
        const restaurantsRes = await axios.get('/api/restaurants?admin=true')
        const allOrders = ordersRes.data
        const allRestaurants = restaurantsRes.data
        
        // Group orders by restaurant and calculate totals
        const restaurantTransactions = {}
        
        // Process all delivered orders - include both paid and pending
        allOrders.forEach(order => {
          if (order.status === 'delivered') {
            const restaurantId = order.restaurant?._id || order.restaurant
            const restaurant = allRestaurants.find(r => r._id.toString() === restaurantId.toString())
            
            if (!restaurantTransactions[restaurantId]) {
              restaurantTransactions[restaurantId] = {
                restaurant: restaurant || { name: 'Unknown' },
                totalAmount: 0,
                paidAmount: 0,
                pendingAmount: 0,
                totalOrders: 0,
                paidOrders: 0,
                pendingOrders: 0,
                orders: []
              }
            }
            
            // Always include the order in totals regardless of payment status
            restaurantTransactions[restaurantId].totalAmount += order.totalAmount
            restaurantTransactions[restaurantId].totalOrders++
            restaurantTransactions[restaurantId].orders.push(order)
            
            // Categorize by restaurant payment status
            if (order.restaurantPaid) {
              restaurantTransactions[restaurantId].paidAmount += order.totalAmount
              restaurantTransactions[restaurantId].paidOrders++
            } else {
              // Include pending, failed, or any non-paid status
              restaurantTransactions[restaurantId].pendingAmount += order.totalAmount
              restaurantTransactions[restaurantId].pendingOrders++
            }
          }
        })
        
        // Always show all restaurants with delivered orders, even if all are paid
        setTransactionHistory(Object.values(restaurantTransactions))
      }
      
      if (activeTab === 'today-spent') {
        const ordersRes = await axios.get('/api/orders/all')
        const restaurantsRes = await axios.get('/api/restaurants?admin=true')
        const allOrders = ordersRes.data
        const allRestaurants = restaurantsRes.data
        
        // Get selected date (default to today)
        const selectedDate = new Date(todaySpentDate || new Date().toISOString().split('T')[0])
        selectedDate.setHours(0, 0, 0, 0)
        
        // Filter orders for selected date
        const filteredOrders = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt)
          orderDate.setHours(0, 0, 0, 0)
          return orderDate.getTime() === selectedDate.getTime() && order.status === 'delivered'
        })
        
        // Group by restaurant and track payment status
        const restaurantSpent = {}
        filteredOrders.forEach(order => {
          const restaurantId = order.restaurant?._id || order.restaurant
          if (!restaurantSpent[restaurantId]) {
            const restaurant = allRestaurants.find(r => r._id.toString() === restaurantId.toString())
            restaurantSpent[restaurantId] = {
              restaurant: restaurant || { name: 'Unknown' },
              totalOrders: 0,
              totalAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              paidOrders: 0,
              pendingOrders: 0,
              orders: []
            }
          }
          restaurantSpent[restaurantId].totalOrders++
          restaurantSpent[restaurantId].totalAmount += order.totalAmount
          restaurantSpent[restaurantId].orders.push(order)
          
          // Track restaurant payment status
          if (order.restaurantPaid) {
            restaurantSpent[restaurantId].paidAmount += order.totalAmount
            restaurantSpent[restaurantId].paidOrders++
          } else {
            restaurantSpent[restaurantId].pendingAmount += order.totalAmount
            restaurantSpent[restaurantId].pendingOrders++
          }
        })
        
        setTodaySpent(Object.values(restaurantSpent))
      }

      // Calculate stats
      const ordersRes = await axios.get('/api/orders/all')
      const restaurantsRes = await axios.get('/api/restaurants?admin=true')
      
      const allOrders = ordersRes.data
      const totalOrders = allOrders.length
      const totalRevenue = allOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0)
      const totalRestaurants = restaurantsRes.data.length
      const pendingOrders = allOrders.filter(o => 
        ['pending', 'confirmed', 'preparing'].includes(o.status)
      ).length

      setStats({ totalOrders, totalRevenue, totalRestaurants, pendingOrders })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus })
      fetchData()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'terminated' : 'active'
      await axios.put(`/api/users/${userId}/status`, { status: newStatus })
      fetchData()
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status')
    }
  }

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole })
      fetchData()
      alert('User role updated successfully')
    } catch (error) {
      console.error('Error updating user role:', error)
      alert(error.response?.data?.message || 'Failed to update user role')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    
    try {
      await axios.delete(`/api/users/${userId}`)
      fetchData()
      alert('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return
    
    try {
      await axios.delete(`/api/coupons/${couponId}`)
      fetchData()
      alert('Coupon deleted successfully')
    } catch (error) {
      console.error('Error deleting coupon:', error)
      alert('Failed to delete coupon')
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory._id}`, categoryForm)
        alert('Category updated successfully')
      } else {
        await axios.post('/api/categories', categoryForm)
        alert('Category created successfully')
      }
      setShowCategoryModal(false)
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '', isActive: true })
      fetchData()
    } catch (error) {
      console.error('Error saving category:', error)
      alert(error.response?.data?.message || 'Failed to save category')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    
    try {
      await axios.delete(`/api/categories/${categoryId}`)
      fetchData()
      alert('Category deleted successfully')
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    try {
      const couponData = {
        ...couponForm,
        discountValue: parseFloat(couponForm.discountValue),
        minOrderAmount: parseFloat(couponForm.minOrderAmount) || 0,
        maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
        usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
        isActive: true, // Default to enabled
        // For new_user coupons, validUntil is optional
        validUntil: couponForm.validUntil ? new Date(couponForm.validUntil) : (couponForm.offerType === 'new_user' ? null : new Date(couponForm.validUntil))
      }
      
      // Remove validUntil if it's null for new_user coupons
      if (couponForm.offerType === 'new_user' && !couponForm.validUntil) {
        delete couponData.validUntil
      }

      await axios.post('/api/coupons', couponData)
      setShowCouponModal(false)
      setCouponForm({
        code: '',
        description: '',
        offerType: 'food',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscount: '',
        validUntil: '',
        usageLimit: ''
      })
      fetchData()
      alert('Coupon created successfully')
    } catch (error) {
      console.error('Error creating coupon:', error)
      alert(error.response?.data?.message || 'Failed to create coupon')
    }
  }

  const handleRestaurantToggle = async (restaurantId, currentStatus) => {
    try {
      await axios.put(`/api/restaurants/${restaurantId}/toggle-active`)
      fetchData()
      alert(`Restaurant ${currentStatus ? 'deactivated' : 'activated'} successfully`)
    } catch (error) {
      console.error('Error toggling restaurant status:', error)
      alert('Failed to update restaurant status')
    }
  }

  const handleCouponToggle = async (couponId, currentStatus) => {
    try {
      await axios.put(`/api/coupons/${couponId}/toggle-active`)
      fetchData()
      alert(`Coupon ${currentStatus ? 'deactivated' : 'activated'} successfully`)
    } catch (error) {
      console.error('Error toggling coupon:', error)
      alert('Failed to toggle coupon status')
    }
  }

  const handleCreatePaymentMethod = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/payment-methods', paymentMethodForm)
      setShowPaymentMethodModal(false)
      setPaymentMethodForm({
        name: 'cash',
        displayName: 'Cash on Delivery',
        isActive: true,
        qrCodeData: ''
      })
      fetchData()
      alert('Payment method created successfully')
    } catch (error) {
      console.error('Error creating payment method:', error)
      alert(error.response?.data?.message || 'Failed to create payment method')
    }
  }

  const handlePaymentMethodToggle = async (paymentMethodId, currentStatus) => {
    try {
      await axios.put(`/api/payment-methods/${paymentMethodId}/toggle-active`)
      fetchData()
      alert(`Payment method ${currentStatus ? 'deactivated' : 'activated'} successfully`)
    } catch (error) {
      console.error('Error toggling payment method:', error)
      alert('Failed to toggle payment method status')
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return
    }
    try {
      await axios.delete(`/api/payment-methods/${paymentMethodId}`)
      fetchData()
      alert('Payment method deleted successfully')
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert('Failed to delete payment method')
    }
  }

  const handleDeliveryApproval = async (deliveryBoyId, approvalStatus) => {
    try {
      await axios.put(`/api/users/${deliveryBoyId}/delivery-approval`, { approvalStatus })
      fetchData()
      alert(`Delivery boy ${approvalStatus === 'approved' ? 'approved' : 'rejected'} successfully`)
    } catch (error) {
      console.error('Error updating delivery approval:', error)
      alert('Failed to update approval status')
    }
  }

  const handleEditDeliveryBoy = async (e) => {
    e.preventDefault()
    try {
      const updateData = {
        name: deliveryBoyForm.name,
        phone: deliveryBoyForm.phone
      }
      if (deliveryBoyForm.password) {
        updateData.password = deliveryBoyForm.password
      }
      await axios.put(`/api/users/${editingDeliveryBoy._id}`, updateData)
      setShowDeliveryEditModal(false)
      setEditingDeliveryBoy(null)
      setDeliveryBoyForm({ name: '', phone: '', password: '' })
      fetchData()
      alert('Delivery boy updated successfully')
    } catch (error) {
      console.error('Error updating delivery boy:', error)
      alert('Failed to update delivery boy')
    }
  }

  const handleDeleteDeliveryBoy = async (deliveryBoyId) => {
    if (!window.confirm('Are you sure you want to delete this delivery boy?')) {
      return
    }
    try {
      await axios.delete(`/api/users/${deliveryBoyId}`)
      fetchData()
      alert('Delivery boy deleted successfully')
    } catch (error) {
      console.error('Error deleting delivery boy:', error)
      alert('Failed to delete delivery boy')
    }
  }

  const handleEditRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant)
    setRestaurantForm({
      name: restaurant.name || '',
      cuisine: restaurant.cuisine || '',
      location: restaurant.location || '',
      deliveryTime: restaurant.deliveryTime || '',
      costForTwo: restaurant.costForTwo || '',
      closingTime: restaurant.closingTime || '23:00',
      image: restaurant.image || '',
      isActive: restaurant.isActive !== undefined ? restaurant.isActive : true,
      isOnline: restaurant.isOnline !== undefined ? restaurant.isOnline : true
    })
    setShowRestaurantModal(true)
  }

  const handleSaveRestaurant = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`/api/restaurants/${editingRestaurant._id}`, restaurantForm)
      setShowRestaurantModal(false)
      setEditingRestaurant(null)
      fetchData()
      alert('Restaurant updated successfully')
    } catch (error) {
      console.error('Error updating restaurant:', error)
      alert('Failed to update restaurant')
    }
  }

  const handleRestaurantImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setRestaurantForm({...restaurantForm, image: reader.result})
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteRestaurant = async (restaurantId) => {
    if (!window.confirm('Are you sure you want to delete this restaurant?')) return
    
    try {
      await axios.delete(`/api/restaurants/${restaurantId}`)
      fetchData()
      alert('Restaurant deleted successfully')
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      alert('Failed to delete restaurant')
    }
  }

  const handleApproveRestaurant = async (registrationId) => {
    try {
      await axios.put(`/api/restaurant-registration/${registrationId}/approve`)
      // Set session storage for success message
      const registration = restaurantRegistrations.find(r => r._id === registrationId)
      if (registration?.user) {
        sessionStorage.setItem('restaurantApproved', 'true')
      }
      fetchData()
      alert('Restaurant approved successfully')
    } catch (error) {
      console.error('Error approving restaurant:', error)
      alert('Failed to approve restaurant')
    }
  }

  const handleRejectRestaurant = async (registrationId) => {
    if (!window.confirm('Are you sure you want to reject this restaurant registration?')) return
    
    try {
      await axios.put(`/api/restaurant-registration/${registrationId}/reject`)
      fetchData()
      alert('Restaurant registration rejected')
    } catch (error) {
      console.error('Error rejecting restaurant:', error)
      alert('Failed to reject restaurant')
    }
  }

  const handleSaveCarousel = async (e) => {
    e.preventDefault()
    try {
      if (editingCarousel) {
        await axios.put(`/api/carousel/${editingCarousel._id}`, carouselForm)
      } else {
        await axios.post('/api/carousel', carouselForm)
      }
      setShowCarouselModal(false)
      setCarouselForm({ image: '', title: '', description: '', link: '', order: 0 })
      setEditingCarousel(null)
      fetchData()
      alert(editingCarousel ? 'Carousel updated' : 'Carousel added')
    } catch (error) {
      console.error('Error saving carousel:', error)
      alert('Failed to save carousel')
    }
  }

  const handleDeleteCarousel = async (carouselId) => {
    if (!window.confirm('Are you sure you want to delete this carousel item?')) return
    
    try {
      await axios.delete(`/api/carousel/${carouselId}`)
      fetchData()
      alert('Carousel deleted successfully')
    } catch (error) {
      console.error('Error deleting carousel:', error)
      alert('Failed to delete carousel')
    }
  }

  const handleImageChange = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'carousel') {
          setCarouselForm({...carouselForm, image: reader.result})
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'orders', label: 'Orders', icon: FiPackage },
    { id: 'users', label: 'Manage Users', icon: FiUsers },
    { id: 'coupons', label: 'Coupons', icon: FiTag },
    { id: 'categories', label: 'Categories', icon: FiMenu },
    { id: 'restaurants', label: 'Restaurants', icon: FiShoppingBag },
    { id: 'restaurant-registration', label: 'Restaurant Registration', icon: FiShoppingBag },
    { id: 'carousel', label: 'Home Carousel', icon: FiHome },
    { id: 'ratings', label: 'Ratings', icon: FiStar },
    { id: 'payment', label: 'Payment', icon: FiCreditCard },
    { id: 'payment-methods', label: 'Payment Methods', icon: FiCreditCard },
    { id: 'delivery', label: 'Delivery', icon: FiUser },
    { id: 'today-spent', label: 'Today Spent', icon: FiCalendar },
    { id: 'transaction-history', label: 'Transaction History', icon: FiDollarSign },
    { id: 'charges', label: 'Charges', icon: FiSettings },
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

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        bg-white shadow-lg transition-all duration-300 
        fixed top-0 left-0 h-screen z-50 flex flex-col overflow-hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header - Fixed */}
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0">
          {sidebarOpen && <h2 className="text-xl font-bold text-primary whitespace-nowrap">Admin Panel</h2>}
          {!sidebarOpen && <h2 className="text-xl font-bold text-primary">A</h2>}
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
        <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-2" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e0 #f7fafc'
        }}>
          {menuItems.map((item) => {
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
                <span className={`${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-opacity duration-200 whitespace-nowrap overflow-hidden`}>
                  {item.label}
                </span>
                {/* Tooltip for collapsed sidebar */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300 w-full min-w-0`}>
        <div className="container mx-auto px-4 py-8">
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
                {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="text-sm text-gray-600 hidden md:block">
              Welcome, <span className="font-semibold text-primary">{user?.name}</span>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                      <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-800">₹{stats.totalRevenue}</p>
                    </div>
                    <FiDollarSign className="text-4xl text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Restaurants</p>
                      <p className="text-3xl font-bold text-gray-800">{stats.totalRestaurants}</p>
                    </div>
                    <FiShoppingBag className="text-4xl text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Pending Orders</p>
                      <p className="text-3xl font-bold text-gray-800">{stats.pendingOrders}</p>
                    </div>
                    <FiTrendingUp className="text-4xl text-yellow-500 opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">All Orders</h2>
                <div className="flex items-center space-x-2">
                  <FiFilter className="text-gray-600" />
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Restaurant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Mode</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Delivered By</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">#{order._id.slice(-8)}</td>
                        <td className="py-3 px-4">{order.restaurant?.name || 'N/A'}</td>
                        <td className="py-3 px-4">{order.user?.name || 'N/A'}</td>
                        <td className="py-3 px-4 font-semibold">₹{order.totalAmount}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                            {order.paymentMethod || 'Cash on Delivery'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              order.paymentStatus === 'paid' || order.paymentApprovalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              order.paymentStatus === 'failed' || order.paymentApprovalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.paymentStatus === 'paid' || order.paymentApprovalStatus === 'approved' ? '✓ Paid' : 
                               order.paymentStatus === 'failed' || order.paymentApprovalStatus === 'rejected' ? 'Failed' : 
                               'Pending'}
                            </span>
                            {order.utrNumber && (
                              <p className="text-xs text-gray-500">UTR: {order.utrNumber}</p>
                            )}
                            {order.upiId && (
                              <p className="text-xs text-gray-500">UPI: {order.upiId}</p>
                            )}
                            {order.paymentMethod === 'upi' && order.paymentApprovalStatus === 'pending' && (
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await axios.put(`/api/orders/${order._id}/payment-approval`, { approvalStatus: 'approved' })
                                      fetchData()
                                      alert('Payment approved successfully')
                                    } catch (error) {
                                      alert('Failed to approve payment')
                                    }
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await axios.put(`/api/orders/${order._id}/payment-approval`, { approvalStatus: 'rejected' })
                                      fetchData()
                                      alert('Payment rejected')
                                    } catch (error) {
                                      alert('Failed to reject payment')
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                            className="px-3 py-1 rounded-full text-xs font-semibold border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="out for delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {order.status === 'delivered' && order.deliveryBoy ? (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                              {order.deliveryBoy.name || 'N/A'}
                            </span>
                          ) : order.status === 'out for delivery' && order.deliveryBoy ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                              {order.deliveryBoy.name || 'N/A'}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {/* Pay button for online payments - show if delivered, customer payment approved, but restaurant not paid yet */}
                          {order.status === 'delivered' && 
                           !order.restaurantPaid && 
                           (order.paymentApprovalStatus === 'approved' || order.paymentStatus === 'paid' || order.paymentStatus === 'approved') &&
                           order.paymentMethod !== 'cash' && 
                           order.paymentMethod !== 'cash on delivery' && (
                            <button
                              onClick={() => {
                                setSelectedPaymentOrder(order)
                                setShowPayModal(true)
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                            >
                              Pay to Restaurant
                            </button>
                          )}
                          {/* Cash payment message - no pay button needed */}
                          {order.status === 'delivered' && 
                           (order.paymentMethod === 'cash' || order.paymentMethod === 'cash on delivery') && (
                            <span className="text-xs text-gray-500 italic">Cash - Collected by delivery</span>
                          )}
                          {/* Already paid to restaurant */}
                          {order.status === 'delivered' && 
                           order.restaurantPaid && 
                           order.paymentMethod !== 'cash' && 
                           order.paymentMethod !== 'cash on delivery' && (
                            <span className="text-xs text-green-600 font-semibold">✓ Paid to Restaurant</span>
                          )}
                          {/* Customer payment not approved yet - show pending message */}
                          {order.status === 'delivered' && 
                           !order.restaurantPaid && 
                           order.paymentMethod !== 'cash' && 
                           order.paymentMethod !== 'cash on delivery' &&
                           order.paymentApprovalStatus !== 'approved' && 
                           order.paymentStatus !== 'paid' && 
                           order.paymentStatus !== 'approved' && (
                            <span className="text-xs text-yellow-600 font-semibold">Waiting for Payment Approval</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date Registered</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{u.name}</td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleUserRoleChange(u._id, e.target.value)}
                            className="px-3 py-1 rounded-full text-xs font-semibold border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="user">User</option>
                            <option value="restaurant">Restaurant</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleUserStatusToggle(u._id, u.status)}
                            className="flex items-center space-x-2"
                          >
                            {u.status === 'active' ? (
                              <FiToggleRight className="text-2xl text-green-500" />
                            ) : (
                              <FiToggleLeft className="text-2xl text-red-500" />
                            )}
                            <span className={`text-sm font-semibold ${
                              u.status === 'active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {u.status}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
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
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Coupons</h2>
                <button
                  onClick={() => setShowCouponModal(true)}
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
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Offer Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Discount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Valid Until</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <tr key={coupon._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold">{coupon.code}</td>
                          <td className="py-3 px-4">{coupon.description || '-'}</td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {coupon.offerType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%` 
                              : `₹${coupon.discountValue}`}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(coupon.validUntil).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleCouponToggle(coupon._id, coupon.isActive)}
                              className="flex items-center space-x-2"
                            >
                              {coupon.isActive ? (
                                <FiToggleRight className="text-2xl text-green-500" />
                              ) : (
                                <FiToggleLeft className="text-2xl text-red-500" />
                              )}
                              <span className={`text-sm font-semibold ${
                                coupon.isActive ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {coupon.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeleteCoupon(coupon._id)}
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

          {/* Ratings Tab */}
          {activeTab === 'ratings' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">All Ratings</h2>
              {ratings.length === 0 ? (
                <div className="text-center py-12">
                  <FiStar className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No ratings yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group ratings by restaurant */}
                  {(() => {
                    const ratingsByRestaurant = {}
                    ratings.forEach(rating => {
                      const restaurantName = rating.restaurant?.name || 'Unknown Restaurant'
                      if (!ratingsByRestaurant[restaurantName]) {
                        ratingsByRestaurant[restaurantName] = []
                      }
                      ratingsByRestaurant[restaurantName].push(rating)
                    })
                    
                    return Object.entries(ratingsByRestaurant).map(([restaurantName, restaurantRatings]) => (
                      <div key={restaurantName} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                          <h3 className="text-xl font-bold text-gray-800">{restaurantName}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              {restaurantRatings.length} rating{restaurantRatings.length > 1 ? 's' : ''}
                            </span>
                            <div className="flex items-center space-x-1">
                              {(() => {
                                const avgRating = restaurantRatings.reduce((sum, r) => sum + r.rating, 0) / restaurantRatings.length
                                return (
                                  <>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <FiStar
                                        key={star}
                                        className={`text-sm ${
                                          star <= Math.round(avgRating)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-2 font-semibold text-gray-700">
                                      {avgRating.toFixed(1)}/5
                                    </span>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {restaurantRatings.map((rating) => (
                            <div key={rating._id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-gray-800">{rating.user?.name || 'Anonymous'}</p>
                                  <p className="text-sm text-gray-500">{rating.user?.email || ''}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FiStar
                                      key={star}
                                      className={`text-sm ${
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
                                <p className="text-gray-700 mt-2">{rating.comment}</p>
                              )}
                              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                                <span>Order Amount: ₹{rating.order?.totalAmount || 'N/A'}</span>
                                <span>{new Date(rating.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
                <button
                  onClick={() => {
                    setShowCategoryModal(true)
                    setEditingCategory(null)
                    setCategoryForm({ name: '', description: '', isActive: true })
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
                >
                  <FiPlus />
                  <span>Add Category</span>
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{category.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{category.description || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              category.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {category.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCategory(category)
                                  setCategoryForm({
                                    name: category.name,
                                    description: category.description || '',
                                    isActive: category.isActive
                                  })
                                  setShowCategoryModal(true)
                                }}
                                className="text-primary hover:text-orange-600"
                              >
                                <FiEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category._id)}
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

          {/* Restaurants Tab */}
          {activeTab === 'restaurants' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Restaurants</h2>
                <div className="flex items-center space-x-2">
                  <FiFilter className="text-gray-600" />
                  <select
                    value={restaurantFilter}
                    onChange={(e) => setRestaurantFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Restaurants</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRestaurants.map((restaurant) => (
                    <div key={restaurant._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{restaurant.cuisine}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">{restaurant.location}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditRestaurant(restaurant)}
                            className="text-primary hover:text-orange-600"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteRestaurant(restaurant._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          restaurant.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {restaurant.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleRestaurantToggle(restaurant._id, restaurant.isActive)}
                          className="flex items-center space-x-2"
                        >
                          {restaurant.isActive ? (
                            <FiToggleRight className="text-2xl text-green-500" />
                          ) : (
                            <FiToggleLeft className="text-2xl text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Restaurant Registration Tab */}
          {activeTab === 'restaurant-registration' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Registrations</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Restaurant Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Owner</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Address</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Closing Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurantRegistrations.map((reg) => (
                      <tr key={reg._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{reg.restaurantName}</td>
                        <td className="py-3 px-4">{reg.ownerName}</td>
                        <td className="py-3 px-4 text-sm">{reg.restaurantAddress}</td>
                        <td className="py-3 px-4">{reg.closingTime}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            reg.status === 'approved' ? 'bg-green-100 text-green-700' :
                            reg.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setViewingRegistration(reg)
                                setShowRegistrationModal(true)
                              }}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm flex items-center space-x-1"
                            >
                              <FiEye className="text-sm" />
                              <span>View</span>
                            </button>
                            {reg.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveRestaurant(reg._id)}
                                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectRestaurant(reg._id)}
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Carousel Tab */}
          {activeTab === 'carousel' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Home Carousel</h2>
                <button
                  onClick={() => {
                    setShowCarouselModal(true)
                    setEditingCarousel(null)
                    setCarouselForm({ image: '', title: '', description: '', link: '', order: 0 })
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
                >
                  <FiPlus />
                  <span>Upload Image</span>
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {carousels.map((carousel) => (
                    <div key={carousel._id} className="border border-gray-200 rounded-lg p-4">
                      <img
                        src={carousel.image}
                        alt={carousel.title || 'Carousel'}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                      {carousel.title && (
                        <h3 className="font-semibold text-lg mb-1">{carousel.title}</h3>
                      )}
                      {carousel.description && (
                        <p className="text-sm text-gray-600 mb-2">{carousel.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Order: {carousel.order}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingCarousel(carousel)
                              setCarouselForm({
                                image: carousel.image,
                                title: carousel.title || '',
                                description: carousel.description || '',
                                link: carousel.link || '',
                                order: carousel.order || 0
                              })
                              setShowCarouselModal(true)
                            }}
                            className="text-primary hover:text-orange-600"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteCarousel(carousel._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add New Coupon</h2>
              <button
                onClick={() => {
                  setShowCouponModal(false)
                  setCouponForm({
                    code: '',
                    description: '',
                    offerType: 'food',
                    discountType: 'percentage',
                    discountValue: '',
                    minOrderAmount: '',
                    maxDiscount: '',
                    validUntil: '',
                    usageLimit: ''
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
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
                <label className="block text-gray-700 font-semibold mb-2">Offer Type *</label>
                <select
                  value={couponForm.offerType}
                  onChange={(e) => setCouponForm({...couponForm, offerType: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="food">For Food</option>
                  <option value="new_user">For New User</option>
                  <option value="other">Other</option>
                </select>
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
                <label className="block text-gray-700 font-semibold mb-2">Discount Value *</label>
                <input
                  type="number"
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm({...couponForm, discountValue: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={couponForm.discountType === 'percentage' ? '20' : '100'}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Minimum Order Amount</label>
                <input
                  type="number"
                  value={couponForm.minOrderAmount}
                  onChange={(e) => setCouponForm({...couponForm, minOrderAmount: e.target.value})}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>
              {couponForm.discountType === 'percentage' && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Max Discount (Optional)</label>
                  <input
                    type="number"
                    value={couponForm.maxDiscount}
                    onChange={(e) => setCouponForm({...couponForm, maxDiscount: e.target.value})}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="500"
                  />
                </div>
              )}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Valid Until {couponForm.offerType === 'new_user' ? '(Optional)' : '*'}
                </label>
                <input
                  type="date"
                  value={couponForm.validUntil}
                  onChange={(e) => setCouponForm({...couponForm, validUntil: e.target.value})}
                  required={couponForm.offerType !== 'new_user'}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {couponForm.offerType === 'new_user' && (
                  <p className="text-xs text-gray-500 mt-1">For new user coupons, this is optional. Coupon applies to all new users.</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Usage Limit (Optional)</label>
                <input
                  type="number"
                  value={couponForm.usageLimit}
                  onChange={(e) => setCouponForm({...couponForm, usageLimit: e.target.value})}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Unlimited"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  Create Coupon
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCouponModal(false)
                    setCouponForm({
                      code: '',
                      description: '',
                      offerType: 'food',
                      discountType: 'percentage',
                      discountValue: '',
                      minOrderAmount: '',
                      maxDiscount: '',
                      validUntil: '',
                      usageLimit: ''
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

      {/* Carousel Modal */}
      {showCarouselModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCarousel ? 'Edit Carousel' : 'Upload Carousel Image'}
              </h2>
              <button
                onClick={() => {
                  setShowCarouselModal(false)
                  setEditingCarousel(null)
                  setCarouselForm({ image: '', title: '', description: '', link: '', order: 0 })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleSaveCarousel} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Image *</label>
                {carouselForm.image && (
                  <img src={carouselForm.image} alt="Preview" className="w-full h-64 object-cover rounded-lg mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'carousel')}
                  required={!editingCarousel}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={carouselForm.title}
                  onChange={(e) => setCarouselForm({...carouselForm, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Carousel title (optional)"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={carouselForm.description}
                  onChange={(e) => setCarouselForm({...carouselForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Carousel description (optional)"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Link (Optional)</label>
                <input
                  type="url"
                  value={carouselForm.link}
                  onChange={(e) => setCarouselForm({...carouselForm, link: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Display Order</label>
                <input
                  type="number"
                  value={carouselForm.order}
                  onChange={(e) => setCarouselForm({...carouselForm, order: parseInt(e.target.value) || 0})}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  {editingCarousel ? 'Update Carousel' : 'Upload Carousel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCarouselModal(false)
                    setEditingCarousel(null)
                    setCarouselForm({ image: '', title: '', description: '', link: '', order: 0 })
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

      {/* Registration Details Modal */}
      {showRegistrationModal && viewingRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Restaurant Registration Details</h2>
              <button
                onClick={() => {
                  setShowRegistrationModal(false)
                  setViewingRegistration(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Images Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Front Image</h3>
                  {viewingRegistration.frontImage ? (
                    <img 
                      src={viewingRegistration.frontImage} 
                      alt="Restaurant Front" 
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Restaurant Image</h3>
                  {viewingRegistration.restaurantImage ? (
                    <img 
                      src={viewingRegistration.restaurantImage} 
                      alt="Restaurant Interior" 
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Restaurant Name</label>
                    <p className="text-gray-800 font-medium">{viewingRegistration.restaurantName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Restaurant Address</label>
                    <p className="text-gray-800">{viewingRegistration.restaurantAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Closing Time</label>
                    <p className="text-gray-800">{viewingRegistration.closingTime}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Owner Name</label>
                    <p className="text-gray-800 font-medium">{viewingRegistration.ownerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Owner Email</label>
                    <p className="text-gray-800">{viewingRegistration.ownerEmail}</p>
                  </div>
                  {viewingRegistration.ownerPhone && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Owner Phone</label>
                      <p className="text-gray-800">{viewingRegistration.ownerPhone}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      viewingRegistration.status === 'approved' ? 'bg-green-100 text-green-700' :
                      viewingRegistration.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {viewingRegistration.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Registration Date</label>
                    <p className="text-gray-800">
                      {new Date(viewingRegistration.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info if available */}
              {viewingRegistration.user && typeof viewingRegistration.user === 'object' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Name</label>
                      <p className="text-gray-800">{viewingRegistration.user.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
                      <p className="text-gray-800">{viewingRegistration.user.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {viewingRegistration.status === 'pending' && (
                <div className="flex space-x-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      handleApproveRestaurant(viewingRegistration._id)
                      setShowRegistrationModal(false)
                      setViewingRegistration(null)
                    }}
                    className="flex-1 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                  >
                    Approve Registration
                  </button>
                  <button
                    onClick={() => {
                      handleRejectRestaurant(viewingRegistration._id)
                      setShowRegistrationModal(false)
                      setViewingRegistration(null)
                    }}
                    className="flex-1 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                  >
                    Reject Registration
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Payment Management</h2>
              <p className="text-gray-600 mt-1">View and manage restaurant payment information</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search restaurants..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                />
                <FiFilter className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
            >
              <option value="all">All Status</option>
              <option value="configured">Configured</option>
              <option value="locked">Locked</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Summary Cards */}
          {(() => {
            const filtered = restaurants.filter(r => {
              const matchesSearch = r.name.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                                   (r.upiId && r.upiId.toLowerCase().includes(paymentSearch.toLowerCase()))
              
              let daysRemaining = 0
              let canChange = true
              if (r.paymentLastChanged) {
                const lastChanged = new Date(r.paymentLastChanged)
                const now = new Date()
                const daysSinceLastChange = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24))
                daysRemaining = Math.max(0, 14 - daysSinceLastChange)
                canChange = daysRemaining === 0
              }
              
              const status = r.upiId ? (canChange ? 'configured' : 'locked') : 'pending'
              const matchesFilter = paymentFilter === 'all' || status === paymentFilter
              
              return matchesSearch && matchesFilter
            })
            
            const stats = {
              total: restaurants.length,
              configured: restaurants.filter(r => r.upiId && (!r.paymentLastChanged || (() => {
                const lastChanged = new Date(r.paymentLastChanged)
                const now = new Date()
                const daysSinceLastChange = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24))
                return daysSinceLastChange >= 14
              })())).length,
              locked: restaurants.filter(r => {
                if (!r.paymentLastChanged) return false
                const lastChanged = new Date(r.paymentLastChanged)
                const now = new Date()
                const daysSinceLastChange = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24))
                return daysSinceLastChange < 14
              }).length,
              pending: restaurants.filter(r => !r.upiId).length
            }
            
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-gray-600 text-sm mb-1">Total Restaurants</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-gray-600 text-sm mb-1">Configured</p>
                    <p className="text-2xl font-bold text-green-600">{stats.configured}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <p className="text-gray-600 text-sm mb-1">Locked</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.locked}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <p className="text-gray-600 text-sm mb-1">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Restaurant</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">UPI ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Changed</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length > 0 ? (
                        filtered.map((restaurant) => {
                          let daysRemaining = 0
                          let canChange = true
                          
                          if (restaurant.paymentLastChanged) {
                            const lastChanged = new Date(restaurant.paymentLastChanged)
                            const now = new Date()
                            const daysSinceLastChange = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24))
                            daysRemaining = Math.max(0, 14 - daysSinceLastChange)
                            canChange = daysRemaining === 0
                          }
                          
                          return (
                            <tr key={restaurant._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                              <td className="py-3 px-4 font-semibold">{restaurant.name}</td>
                              <td className="py-3 px-4">
                                <span className={restaurant.upiId ? 'text-gray-800' : 'text-gray-400 italic'}>
                                  {restaurant.upiId || 'Not Set'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {restaurant.paymentLastChanged ? (
                                  <div>
                                    <p className="text-sm text-gray-700">
                                      {new Date(restaurant.paymentLastChanged).toLocaleDateString()}
                                    </p>
                                    {daysRemaining > 0 && (
                                      <p className="text-xs text-yellow-600 mt-1">
                                        Locked for {daysRemaining} more day(s)
                                      </p>
                                    )}
                                    {canChange && (
                                      <p className="text-xs text-green-600 mt-1">
                                        Can be changed
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">Never changed</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  restaurant.upiId 
                                    ? (canChange ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {restaurant.upiId 
                                    ? (canChange ? 'Configured' : 'Locked')
                                    : 'Pending'
                                  }
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-gray-500">
                            No restaurants found matching your search
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment-methods' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Payment Methods</h2>
            <button
              onClick={() => setShowPaymentMethodModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
            >
              <FiPlus />
              <span>Add Payment Method</span>
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Display Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">QR Code Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map((method) => (
                    <tr key={method._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold">{method.displayName}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {method.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {method.qrCodeData || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handlePaymentMethodToggle(method._id, method.isActive)}
                          className="flex items-center space-x-2"
                        >
                          {method.isActive ? (
                            <FiToggleRight className="text-2xl text-green-500" />
                          ) : (
                            <FiToggleLeft className="text-2xl text-red-500" />
                          )}
                          <span className={`text-sm font-semibold ${
                            method.isActive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {method.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeletePaymentMethod(method._id)}
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

      {/* Delivery Tab */}
      {activeTab === 'delivery' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Delivery Boys</h2>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Restaurant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Approval</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryBoys.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        No delivery boys found
                      </td>
                    </tr>
                  ) : (
                    deliveryBoys.map((deliveryBoy) => (
                      <tr key={deliveryBoy._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold">{deliveryBoy.name}</td>
                        <td className="py-3 px-4">{deliveryBoy.phone || '-'}</td>
                        <td className="py-3 px-4">{deliveryBoy.email}</td>
                        <td className="py-3 px-4">
                          {deliveryBoy.restaurant ? (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                              {deliveryBoy.restaurant.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No restaurant</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            deliveryBoy.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {deliveryBoy.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            deliveryBoy.approvalStatus === 'approved' 
                              ? 'bg-green-100 text-green-700' 
                              : deliveryBoy.approvalStatus === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {deliveryBoy.approvalStatus || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingDeliveryBoy(deliveryBoy)
                                setDeliveryBoyForm({
                                  name: deliveryBoy.name,
                                  phone: deliveryBoy.phone || '',
                                  password: ''
                                })
                                setShowDeliveryEditModal(true)
                              }}
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit"
                            >
                              <FiEdit />
                            </button>
                            {deliveryBoy.approvalStatus !== 'approved' && (
                              <button
                                onClick={() => handleDeliveryApproval(deliveryBoy._id, 'approved')}
                                className="text-green-500 hover:text-green-700"
                                title="Approve"
                              >
                                <FiCheckCircle />
                              </button>
                            )}
                            {deliveryBoy.approvalStatus !== 'rejected' && (
                              <button
                                onClick={() => handleDeliveryApproval(deliveryBoy._id, 'rejected')}
                                className="text-orange-500 hover:text-orange-700"
                                title="Reject"
                              >
                                <FiX />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteDeliveryBoy(deliveryBoy._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Today Spent Tab */}
      {activeTab === 'today-spent' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Spending by Restaurant</h2>
              <p className="text-gray-600 mt-1">Total amount spent at each restaurant</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Select Date:</label>
              <input
                type="date"
                value={todaySpentDate}
                onChange={(e) => setTodaySpentDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              />
            </div>
          </div>

          {/* Summary Cards */}
          {(() => {
            const totalAmount = todaySpent.reduce((sum, item) => sum + item.totalAmount, 0)
            const totalOrders = todaySpent.reduce((sum, item) => sum + item.totalOrders, 0)
            const selectedDateObj = new Date(todaySpentDate)
            const isToday = selectedDateObj.toDateString() === new Date().toDateString()
            
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-gray-600 text-sm mb-1">Total Restaurants</p>
                    <p className="text-2xl font-bold text-blue-600">{todaySpent.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-gray-600 text-sm mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-green-600">{totalOrders}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <p className="text-gray-600 text-sm mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-purple-600">₹{totalAmount}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <p className="text-gray-600 text-sm mb-1">Date</p>
                    <p className="text-lg font-bold text-orange-600">
                      {selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {isToday && (
                      <p className="text-xs text-orange-600 mt-1">(Today)</p>
                    )}
                  </div>
                </div>

                {todaySpent.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Restaurant Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Orders</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">UPI ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todaySpent
                          .sort((a, b) => b.totalAmount - a.totalAmount)
                          .map((item) => (
                            <tr key={item.restaurant._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                              <td className="py-3 px-4 font-semibold">{item.restaurant.name}</td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-semibold">{item.totalOrders}</p>
                                  {item.paidOrders > 0 && item.pendingOrders > 0 && (
                                    <p className="text-xs text-gray-500">
                                      Paid: {item.paidOrders} | Pending: {item.pendingOrders}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-green-600">₹{item.totalAmount}</td>
                              <td className="py-3 px-4">
                                {item.pendingAmount === 0 && item.totalAmount > 0 ? (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                                    ✓ Fully Paid
                                  </span>
                                ) : item.paidAmount > 0 ? (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">
                                    Partial (₹{item.paidAmount} paid)
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={item.restaurant.upiId ? 'text-gray-800' : 'text-gray-400 italic'}>
                                  {item.restaurant.upiId || 'Not Set'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {item.pendingAmount > 0 ? (
                                  <button
                                    onClick={() => {
                                      // Only include unpaid orders
                                      const unpaidOrders = item.orders.filter(o => !o.restaurantPaid)
                                      setSelectedPaymentOrder({
                                        restaurant: item.restaurant,
                                        totalAmount: item.pendingAmount,
                                        orders: unpaidOrders
                                      })
                                      setShowPayModal(true)
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-[#FF5A5F] to-[#FF9A3D] text-white rounded-lg hover:opacity-90 transition shadow-md hover:shadow-lg"
                                  >
                                    Pay ₹{item.pendingAmount}
                                  </button>
                                ) : (
                                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold inline-block">
                                    ✓ Paid
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiCalendar className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      No spending recorded for {selectedDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* Transaction History Tab */}
      {activeTab === 'transaction-history' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 mb-6">View all transactions with restaurant payment details</p>

          {/* Summary Cards */}
          {(() => {
            const totalAmount = transactionHistory.reduce((sum, t) => sum + t.totalAmount, 0)
            const totalPaid = transactionHistory.reduce((sum, t) => sum + t.paidAmount, 0)
            const totalPending = transactionHistory.reduce((sum, t) => sum + t.pendingAmount, 0)
            const totalOrders = transactionHistory.reduce((sum, t) => sum + t.totalOrders, 0)
            
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-gray-600 text-sm mb-1">Total Restaurants</p>
                    <p className="text-2xl font-bold text-blue-600">{transactionHistory.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-gray-600 text-sm mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">₹{totalAmount}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <p className="text-gray-600 text-sm mb-1">Paid Amount</p>
                    <p className="text-2xl font-bold text-purple-600">₹{totalPaid}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <p className="text-gray-600 text-sm mb-1">Pending Amount</p>
                    <p className="text-2xl font-bold text-orange-600">₹{totalPending}</p>
                  </div>
                </div>

                {transactionHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Restaurant Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Orders</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Paid</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Pending</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">UPI ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionHistory
                          .sort((a, b) => b.totalAmount - a.totalAmount)
                          .map((transaction) => (
                            <tr key={transaction.restaurant._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                              <td className="py-3 px-4 font-semibold">{transaction.restaurant.name}</td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-semibold">{transaction.totalOrders}</p>
                                  <p className="text-xs text-gray-500">
                                    Paid: {transaction.paidOrders} | Pending: {transaction.pendingOrders}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-gray-800">₹{transaction.totalAmount}</td>
                              <td className="py-3 px-4">
                                <div>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    transaction.paidAmount > 0 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    ₹{transaction.paidAmount}
                                  </span>
                                  {transaction.paidAmount === transaction.totalAmount && transaction.totalAmount > 0 && (
                                    <p className="text-xs text-green-600 mt-1">✓ Fully Paid</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    transaction.pendingAmount > 0 
                                      ? 'bg-yellow-100 text-yellow-700' 
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    ₹{transaction.pendingAmount}
                                  </span>
                                  {transaction.pendingAmount === 0 && transaction.totalAmount > 0 && (
                                    <p className="text-xs text-green-600 mt-1">All Paid</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={transaction.restaurant.upiId ? 'text-gray-800' : 'text-gray-400 italic'}>
                                  {transaction.restaurant.upiId || 'Not Set'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiDollarSign className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No transaction history available</p>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* Charges Tab */}
      {activeTab === 'charges' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Charges Management</h2>
            <button
              onClick={() => {
                setShowChargesModal(true)
                setCurrentCharges({ platformFee: 0, deliveryFee: 50, tax: 5 })
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
            >
              <FiPlus />
              <span>Set New Charges</span>
            </button>
          </div>

          {/* Current Active Charges */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Active Charges</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Platform Fee</p>
                <p className="text-2xl font-bold text-green-600">₹{currentCharges.platformFee || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Delivery Fee</p>
                <p className="text-2xl font-bold text-green-600">₹{currentCharges.deliveryFee || 50}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Tax (%)</p>
                <p className="text-2xl font-bold text-green-600">{currentCharges.tax || 5}%</p>
              </div>
            </div>
          </div>

          {/* Charges History */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform Fee</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Delivery Fee</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tax (%)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created At</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {charges.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      No charges configured yet
                    </td>
                  </tr>
                ) : (
                  charges.map((charge) => (
                    <tr key={charge._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">₹{charge.platformFee}</td>
                      <td className="py-3 px-4">₹{charge.deliveryFee}</td>
                      <td className="py-3 px-4">{charge.tax || 5}%</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          charge.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {charge.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(charge.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setCurrentCharges(charge)
                              setShowChargesModal(true)
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm flex items-center space-x-1"
                          >
                            <FiEdit />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this charge configuration?')) {
                                try {
                                  await axios.delete(`/api/charges/${charge._id}`)
                                  fetchData()
                                } catch (error) {
                                  alert('Failed to delete charges')
                                }
                              }
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm flex items-center space-x-1"
                          >
                            <FiTrash2 />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charges Modal */}
      {showChargesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Set Charges</h2>
              <button
                onClick={() => {
                  setShowChargesModal(false)
                  setCurrentCharges({ platformFee: 0, deliveryFee: 50, tax: 5 })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  if (currentCharges._id) {
                    await axios.put(`/api/charges/${currentCharges._id}`, {
                      platformFee: parseFloat(currentCharges.platformFee),
                      deliveryFee: parseFloat(currentCharges.deliveryFee),
                      tax: parseFloat(currentCharges.tax),
                      isActive: true
                    })
                  } else {
                    await axios.post('/api/charges', {
                      platformFee: parseFloat(currentCharges.platformFee),
                      deliveryFee: parseFloat(currentCharges.deliveryFee),
                      tax: parseFloat(currentCharges.tax)
                    })
                  }
                  setShowChargesModal(false)
                  setCurrentCharges({ platformFee: 0, deliveryFee: 50, tax: 5 })
                  fetchData()
                } catch (error) {
                  alert('Failed to save charges')
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Platform Fee (₹) *</label>
                <input
                  type="number"
                  value={currentCharges.platformFee || 0}
                  onChange={(e) => setCurrentCharges({...currentCharges, platformFee: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Delivery Fee (₹) *</label>
                <input
                  type="number"
                  value={currentCharges.deliveryFee || 50}
                  onChange={(e) => setCurrentCharges({...currentCharges, deliveryFee: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Tax (%) *</label>
                <input
                  type="number"
                  value={currentCharges.tax || 5}
                  onChange={(e) => setCurrentCharges({...currentCharges, tax: e.target.value})}
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="5"
                />
                <p className="text-xs text-gray-500 mt-1">Tax percentage applied to subtotal</p>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  {currentCharges._id ? 'Update Charges' : 'Set Charges'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChargesModal(false)
                    setCurrentCharges({ platformFee: 0, deliveryFee: 50, tax: 5 })
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

      {/* Pay Modal */}
      {showPayModal && selectedPaymentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
              <button
                onClick={() => {
                  setShowPayModal(false)
                  setSelectedPaymentOrder(null)
                  setUtrNumber('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Restaurant Information</h3>
                <p><span className="font-medium">Name:</span> {selectedPaymentOrder.restaurant?.name || 'N/A'}</p>
                <p><span className="font-medium">UPI ID:</span> {selectedPaymentOrder.restaurant?.upiId || 'Not Set'}</p>
              </div>
              
              {selectedPaymentOrder.orders && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Order Details</h3>
                  <div className="space-y-2">
                    {selectedPaymentOrder.orders.map((order) => (
                      <div key={order._id} className="flex justify-between text-sm">
                        <span>Order #{order._id.slice(-8)}</span>
                        <span className="font-semibold">₹{order.totalAmount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Total Amount</h3>
                <p className="text-2xl font-bold text-blue-600">₹{selectedPaymentOrder.totalAmount || selectedPaymentOrder.orders?.reduce((sum, o) => sum + o.totalAmount, 0) || 0}</p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">UTR Number *</label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter UTR number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={async () => {
                    if (!utrNumber.trim()) {
                      alert('Please enter UTR number')
                      return
                    }
                    try {
                      const orderIds = selectedPaymentOrder.orders?.map(o => o._id) || [selectedPaymentOrder._id]
                      await Promise.all(orderIds.map(orderId => 
                        axios.put(`/api/orders/${orderId}/status`, {
                          restaurantPaid: true,
                          utrNumber: utrNumber.trim()
                        })
                      ))
                      alert('Payment recorded successfully')
                      setShowPayModal(false)
                      setSelectedPaymentOrder(null)
                      setUtrNumber('')
                      // Refresh data to update all tabs including today-spent and transaction-history
                      await fetchData()
                      // Force refresh if on today-spent or transaction-history tab
                      if (activeTab === 'today-spent' || activeTab === 'transaction-history') {
                        setTimeout(() => {
                          fetchData()
                        }, 300)
                      }
                    } catch (error) {
                      alert('Failed to record payment')
                    }
                  }}
                  className="flex-1 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                >
                  Confirm Payment
                </button>
                <button
                  onClick={() => {
                    setShowPayModal(false)
                    setSelectedPaymentOrder(null)
                    setUtrNumber('')
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

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                  setCategoryForm({ name: '', description: '', isActive: true })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Fast Food"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows="3"
                  placeholder="Category description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({...categoryForm, isActive: e.target.checked})}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-gray-700 font-semibold">Active</label>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false)
                    setEditingCategory(null)
                    setCategoryForm({ name: '', description: '', isActive: true })
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

      {/* Restaurant Edit Modal */}
      {showRestaurantModal && editingRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Restaurant</h2>
              <button
                onClick={() => {
                  setShowRestaurantModal(false)
                  setEditingRestaurant(null)
                  setRestaurantForm({
                    name: '',
                    cuisine: '',
                    location: '',
                    deliveryTime: '',
                    costForTwo: '',
                    closingTime: '',
                    image: '',
                    isActive: true,
                    isOnline: true
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleSaveRestaurant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Restaurant Name *</label>
                  <input
                    type="text"
                    value={restaurantForm.name}
                    onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Cuisine *</label>
                  <input
                    type="text"
                    value={restaurantForm.cuisine}
                    onChange={(e) => setRestaurantForm({...restaurantForm, cuisine: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Location *</label>
                  <input
                    type="text"
                    value={restaurantForm.location}
                    onChange={(e) => setRestaurantForm({...restaurantForm, location: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Delivery Time *</label>
                  <input
                    type="text"
                    value={restaurantForm.deliveryTime}
                    onChange={(e) => setRestaurantForm({...restaurantForm, deliveryTime: e.target.value})}
                    required
                    placeholder="30-40 mins"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Cost for Two (₹) *</label>
                  <input
                    type="number"
                    value={restaurantForm.costForTwo}
                    onChange={(e) => setRestaurantForm({...restaurantForm, costForTwo: e.target.value})}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Closing Time *</label>
                  <input
                    type="time"
                    value={restaurantForm.closingTime}
                    onChange={(e) => setRestaurantForm({...restaurantForm, closingTime: e.target.value})}
                    required
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
                  onChange={handleRestaurantImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-sm text-gray-500 mt-1">Or enter image URL:</p>
                <input
                  type="text"
                  value={restaurantForm.image}
                  onChange={(e) => setRestaurantForm({...restaurantForm, image: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={restaurantForm.isActive}
                    onChange={(e) => setRestaurantForm({...restaurantForm, isActive: e.target.checked})}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-gray-700 font-semibold">Active</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOnline"
                    checked={restaurantForm.isOnline}
                    onChange={(e) => setRestaurantForm({...restaurantForm, isOnline: e.target.checked})}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="isOnline" className="text-gray-700 font-semibold">Online</label>
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  Update Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRestaurantModal(false)
                    setEditingRestaurant(null)
                    setRestaurantForm({
                      name: '',
                      cuisine: '',
                      location: '',
                      deliveryTime: '',
                      costForTwo: '',
                      closingTime: '',
                      image: '',
                      isActive: true,
                      isOnline: true
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

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add Payment Method</h2>
              <button
                onClick={() => {
                  setShowPaymentMethodModal(false)
                  setPaymentMethodForm({
                    name: 'cash',
                    displayName: 'Cash on Delivery',
                    isActive: true,
                    qrCodeData: ''
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleCreatePaymentMethod} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Payment Method *</label>
                <select
                  value={paymentMethodForm.name}
                  onChange={(e) => {
                    const methodNames = {
                      cash: 'Cash on Delivery',
                      upi: 'UPI',
                      card: 'Credit/Debit Card',
                      bank_transfer: 'Bank Transfer',
                      scan_and_pay: 'Scan and Pay'
                    }
                    setPaymentMethodForm({
                      ...paymentMethodForm,
                      name: e.target.value,
                      displayName: methodNames[e.target.value] || paymentMethodForm.displayName
                    })
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="cash">Cash on Delivery</option>
                  <option value="upi">UPI</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="scan_and_pay">Scan and Pay</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Display Name *</label>
                <input
                  type="text"
                  value={paymentMethodForm.displayName}
                  onChange={(e) => setPaymentMethodForm({...paymentMethodForm, displayName: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">QR Code Data (Optional)</label>
                <input
                  type="text"
                  value={paymentMethodForm.qrCodeData}
                  onChange={(e) => setPaymentMethodForm({...paymentMethodForm, qrCodeData: e.target.value})}
                  placeholder="UPI ID or account details for QR code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">Required for Scan and Pay method</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActivePayment"
                  checked={paymentMethodForm.isActive}
                  onChange={(e) => setPaymentMethodForm({...paymentMethodForm, isActive: e.target.checked})}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isActivePayment" className="text-gray-700 font-semibold">Active</label>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  Create Payment Method
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentMethodModal(false)
                    setPaymentMethodForm({
                      name: 'cash',
                      displayName: 'Cash on Delivery',
                      isActive: true,
                      qrCodeData: ''
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

      {/* Delivery Boy Edit Modal */}
      {showDeliveryEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Delivery Boy</h2>
              <button
                onClick={() => {
                  setShowDeliveryEditModal(false)
                  setEditingDeliveryBoy(null)
                  setDeliveryBoyForm({ name: '', phone: '', password: '' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleEditDeliveryBoy} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  value={deliveryBoyForm.name}
                  onChange={(e) => setDeliveryBoyForm({...deliveryBoyForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Phone Number *</label>
                <input
                  type="text"
                  value={deliveryBoyForm.phone}
                  onChange={(e) => setDeliveryBoyForm({...deliveryBoyForm, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">New Password (Leave blank to keep current)</label>
                <input
                  type="password"
                  value={deliveryBoyForm.password}
                  onChange={(e) => setDeliveryBoyForm({...deliveryBoyForm, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  Update Delivery Boy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveryEditModal(false)
                    setEditingDeliveryBoy(null)
                    setDeliveryBoyForm({ name: '', phone: '', password: '' })
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

export default AdminDashboard
