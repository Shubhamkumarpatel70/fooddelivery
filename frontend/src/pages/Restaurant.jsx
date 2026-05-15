import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { FiPlus, FiMinus, FiShoppingCart, FiStar, FiClock, FiDollarSign, FiTag } from 'react-icons/fi'

const Restaurant = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [filteredMenuItems, setFilteredMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [restaurantLoading, setRestaurantLoading] = useState(true)
  const [quantities, setQuantities] = useState({})
  const [foodTypeFilter, setFoodTypeFilter] = useState('all') // 'all', 'veg', 'nonveg'
  const [restaurantCoupons, setRestaurantCoupons] = useState([])

  useEffect(() => {
    fetchRestaurant()
    fetchMenuItems()
    fetchRestaurantCoupons()
  }, [id])

  const fetchRestaurant = async () => {
    try {
      setRestaurantLoading(true)
      // Use admin query to allow viewing offline restaurants
      const res = await axios.get(`/api/restaurants/${id}?admin=true`)
      setRestaurant(res.data)
    } catch (error) {
      console.error('Error fetching restaurant:', error)
      if (error.response?.status === 404) {
        setRestaurant(null) // Set to null so the "not found" message shows
      } else {
        // Try to fetch with admin flag to show offline restaurants
        try {
          const adminRes = await axios.get(`/api/restaurants/${id}?admin=true`)
          setRestaurant(adminRes.data)
        } catch (adminError) {
          setRestaurant(null)
        }
      }
    } finally {
      setRestaurantLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/menu/restaurant/${id}`)
      setMenuItems(res.data)
      setFilteredMenuItems(res.data)
    } catch (error) {
      console.error('Error fetching menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRestaurantCoupons = async () => {
    try {
      const res = await axios.get(`/api/restaurant-coupons/restaurant/${id}`)
      setRestaurantCoupons(res.data || [])
    } catch (error) {
      console.error('Error fetching restaurant coupons:', error)
    }
  }

  // Get coupons available for a specific menu item
  const getCouponsForItem = (itemId) => {
    return restaurantCoupons.filter(coupon => {
      if (!coupon.applicableItems || coupon.applicableItems.length === 0) {
        return false // Coupon applies to all items if no specific items set
      }
      return coupon.applicableItems.some(couponItem => 
        couponItem._id?.toString() === itemId.toString() || couponItem.toString() === itemId.toString()
      )
    })
  }

  useEffect(() => {
    // Filter menu items based on food type
    if (foodTypeFilter === 'all') {
      setFilteredMenuItems(menuItems)
    } else if (foodTypeFilter === 'veg') {
      setFilteredMenuItems(menuItems.filter(item => item.isVeg === true))
    } else if (foodTypeFilter === 'nonveg') {
      setFilteredMenuItems(menuItems.filter(item => item.isVeg === false))
    }
  }, [foodTypeFilter, menuItems])

  const handleQuantityChange = (itemId, change) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }))
  }

  const handleAddToCart = async (item) => {
    if (!user) {
      navigate('/login')
      return
    }

    // Check if restaurant is active
    if (!restaurant.isActive) {
      alert('This restaurant is currently inactive. Orders cannot be placed at this time.')
      return
    }

    // Check if restaurant is online
    if (!restaurant.isOnline) {
      alert('This restaurant is currently offline. Orders cannot be placed at this time.')
      return
    }

    // Check closing time - use India/Kolkata timezone
    if (restaurant.closingTime) {
      const getKolkataTime = () => {
        const now = new Date()
        const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
        return {
          hour: kolkataTime.getHours(),
          minute: kolkataTime.getMinutes()
        }
      }
      
      const kolkataTime = getKolkataTime()
      const [closingHour, closingMinute] = restaurant.closingTime.split(':').map(Number)
      const isClosed = kolkataTime.hour > closingHour || (kolkataTime.hour === closingHour && kolkataTime.minute >= closingMinute)
      
      if (isClosed) {
        alert(`Restaurant is closed. Closing time is ${restaurant.closingTime}. Please order during business hours.`)
        return
      }
    }

    const quantity = quantities[item._id] || 1
    const result = await addToCart(item._id, quantity)
    if (result.success) {
      setQuantities((prev) => ({ ...prev, [item._id]: 0 }))
      // Show success notification (you can replace with a toast library)
    } else {
      if (result.redirectToLogin) {
        navigate('/login')
      } else {
        alert(result.message)
      }
    }
  }

  if (restaurantLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 text-lg">Restaurant not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
        >
          Go Back Home
        </button>
      </div>
    )
  }

  const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-64 md:h-80">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{restaurant.name}</h1>
              <p className="text-gray-600 mb-2">{restaurant.cuisine} • {restaurant.location}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <FiStar className="text-yellow-500 fill-current" />
                  <span className="font-semibold">{restaurant.rating || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiClock />
                  <span>{restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiDollarSign />
                  <span>₹{restaurant.costForTwo} for two</span>
                </div>
              </div>
            </div>
            {(() => {
              // Get current time in India/Kolkata timezone
              const getKolkataTime = () => {
                const now = new Date()
                const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
                return {
                  hour: kolkataTime.getHours(),
                  minute: kolkataTime.getMinutes()
                }
              }
              
              const kolkataTime = getKolkataTime()
              const isOffline = !restaurant.isOnline || !restaurant.isActive
              let isClosed = false
              
              if (restaurant.closingTime && !isOffline) {
                const [hours, minutes] = restaurant.closingTime.split(':').map(Number)
                isClosed = kolkataTime.hour > hours || (kolkataTime.hour === hours && kolkataTime.minute >= minutes)
              }
              
              if (isOffline) {
                return (
                  <div className="mt-4 md:mt-0 px-4 py-2 bg-red-100 text-red-700 rounded-lg">
                    {!restaurant.isActive ? 'Inactive' : 'Offline'}
                  </div>
                )
              }
              
              if (isClosed) {
                return (
                  <div className="mt-4 md:mt-0 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                    Closed (Opens tomorrow)
                  </div>
                )
              }
              
              return null
            })()}
          </div>
        </div>
      </div>

      {/* Food Type Filter */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Filter by Type</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFoodTypeFilter('all')}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              foodTypeFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFoodTypeFilter('veg')}
            className={`px-6 py-2 rounded-full font-semibold transition flex items-center space-x-2 ${
              foodTypeFilter === 'veg'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>🟢</span>
            <span>Veg</span>
          </button>
          <button
            onClick={() => setFoodTypeFilter('nonveg')}
            className={`px-6 py-2 rounded-full font-semibold transition flex items-center space-x-2 ${
              foodTypeFilter === 'nonveg'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>🔴</span>
            <span>Non-Veg</span>
          </button>
        </div>
      </div>

      {/* Menu Items */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">No menu items available for selected filter</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.length > 0 ? (
            categories.map((category) => {
              const items = filteredMenuItems.filter(item => item.category === category && (item.isAvailable !== false))
              if (items.length === 0) return null
              return (
                <div key={category} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => {
                      const itemCoupons = getCouponsForItem(item._id)
                      return (
                        <div
                          key={item._id}
                          className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden"
                        >
                          {/* Item Image with Overlays */}
                          <div className="relative w-full h-48 bg-gray-200">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                            
                            {/* Veg/Non-Veg Badge - Top Left */}
                            <div className="absolute top-2 left-2">
                              {item.isVeg ? (
                                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                  <span className="mr-1">🟢</span> VEG
                                </span>
                              ) : (
                                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                  <span className="mr-1">🔴</span> NON-VEG
                                </span>
                              )}
                            </div>
                            
                            {/* Discount Badge - Top Right */}
                            {item.discountPercent && item.discountPercent > 0 && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                  {item.discountPercent}% OFF
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="p-4">
                            {/* Item Name */}
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h3>
                            
                            {/* Pricing */}
                            <div className="flex items-center space-x-2 mb-2">
                              {item.discountPrice ? (
                                <>
                                  <span className="text-xl font-bold text-primary">₹{item.discountPrice}</span>
                                  <span className="text-sm text-gray-500 line-through">₹{item.price}</span>
                                </>
                              ) : (
                                <span className="text-xl font-bold text-primary">₹{item.price}</span>
                              )}
                            </div>
                            
                            {/* Description */}
                            {item.description && (
                              <p className="text-gray-500 text-sm mb-3">{item.description}</p>
                            )}
                            
                            {/* Available Coupons */}
                            {itemCoupons.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">Available Coupons:</p>
                                <div className="flex flex-wrap gap-2">
                                  {itemCoupons.map((coupon) => (
                                    <span
                                      key={coupon._id}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200"
                                    >
                                      <FiTag className="mr-1" />
                                      {coupon.code}
                                      {coupon.discountType === 'percentage' 
                                        ? ` (${coupon.discountValue}% off)`
                                        : ` (₹${coupon.discountValue} off)`
                                      }
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Add to Cart Section */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                              {(() => {
                                // Check restaurant status
                                const getKolkataTime = () => {
                                  const now = new Date()
                                  const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
                                  return {
                                    hour: kolkataTime.getHours(),
                                    minute: kolkataTime.getMinutes()
                                  }
                                }
                                
                                const kolkataTime = getKolkataTime()
                                const isInactive = !restaurant.isActive
                                const isOffline = !restaurant.isOnline
                                let isClosed = false
                                
                                if (restaurant.closingTime && !isInactive && !isOffline) {
                                  const [hours, minutes] = restaurant.closingTime.split(':').map(Number)
                                  isClosed = kolkataTime.hour > hours || (kolkataTime.hour === hours && kolkataTime.minute >= minutes)
                                }
                                
                                const cannotOrder = isInactive || isOffline || isClosed
                                
                                if (cannotOrder) {
                                  let message = 'No orders accepted'
                                  if (isInactive) message = 'Restaurant inactive - No orders accepted'
                                  else if (isOffline) message = 'Restaurant offline - No orders accepted'
                                  else if (isClosed) message = `Restaurant closed (Closes at ${restaurant.closingTime})`
                                  
                                  return (
                                    <div className="w-full text-center py-2">
                                      <span className="text-red-600 text-sm font-semibold">{message}</span>
                                    </div>
                                  )
                                }
                                
                                return null
                              })()}
                              {(() => {
                                // Check restaurant status
                                const getKolkataTime = () => {
                                  const now = new Date()
                                  const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
                                  return {
                                    hour: kolkataTime.getHours(),
                                    minute: kolkataTime.getMinutes()
                                  }
                                }
                                
                                const kolkataTime = getKolkataTime()
                                const isInactive = !restaurant.isActive
                                const isOffline = !restaurant.isOnline
                                let isClosed = false
                                
                                if (restaurant.closingTime && !isInactive && !isOffline) {
                                  const [hours, minutes] = restaurant.closingTime.split(':').map(Number)
                                  isClosed = kolkataTime.hour > hours || (kolkataTime.hour === hours && kolkataTime.minute >= minutes)
                                }
                                
                                const canOrder = !isInactive && !isOffline && !isClosed
                                
                                if (!canOrder) return null
                                
                                return quantities[item._id] > 0 ? (
                                  <div className="flex items-center space-x-3 bg-primary text-white rounded-lg px-4 py-2">
                                    <button
                                      onClick={() => handleQuantityChange(item._id, -1)}
                                      className="hover:bg-orange-600 rounded p-1"
                                    >
                                      <FiMinus />
                                    </button>
                                    <span className="font-semibold">{quantities[item._id]}</span>
                                    <button
                                      onClick={() => handleQuantityChange(item._id, 1)}
                                      className="hover:bg-orange-600 rounded p-1"
                                    >
                                      <FiPlus />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleQuantityChange(item._id, 1)}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                                  >
                                    ADD
                                  </button>
                                )
                              })()}
                              {(() => {
                                // Check restaurant status
                                const getKolkataTime = () => {
                                  const now = new Date()
                                  const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
                                  return {
                                    hour: kolkataTime.getHours(),
                                    minute: kolkataTime.getMinutes()
                                  }
                                }
                                
                                const kolkataTime = getKolkataTime()
                                const isInactive = !restaurant.isActive
                                const isOffline = !restaurant.isOnline
                                let isClosed = false
                                
                                if (restaurant.closingTime && !isInactive && !isOffline) {
                                  const [hours, minutes] = restaurant.closingTime.split(':').map(Number)
                                  isClosed = kolkataTime.hour > hours || (kolkataTime.hour === hours && kolkataTime.minute >= minutes)
                                }
                                
                                const canOrder = !isInactive && !isOffline && !isClosed
                                
                                if (quantities[item._id] > 0 && canOrder) {
                                  return (
                                    <button
                                      onClick={() => handleAddToCart(item)}
                                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
                                    >
                                      <FiShoppingCart />
                                      <span>Add to Cart</span>
                                    </button>
                                  )
                                }
                                
                                return null
                              })()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Menu Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenuItems.filter(item => item.isAvailable !== false).map((item) => {
                  const itemCoupons = getCouponsForItem(item._id)
                  return (
                    <div
                      key={item._id}
                      className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden"
                    >
                      {/* Item Image with Overlays */}
                      <div className="relative w-full h-48 bg-gray-200">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                        
                        {/* Veg/Non-Veg Badge - Top Left */}
                        <div className="absolute top-2 left-2">
                          {item.isVeg ? (
                            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                              <span className="mr-1">🟢</span> VEG
                            </span>
                          ) : (
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                              <span className="mr-1">🔴</span> NON-VEG
                            </span>
                          )}
                        </div>
                        
                        {/* Discount Badge - Top Right */}
                        {item.discountPercent && item.discountPercent > 0 && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                              {item.discountPercent}% OFF
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="p-4">
                        {/* Item Name */}
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h3>
                        
                        {/* Pricing */}
                        <div className="flex items-center space-x-2 mb-2">
                          {item.discountPrice ? (
                            <>
                              <span className="text-xl font-bold text-primary">₹{item.discountPrice}</span>
                              <span className="text-sm text-gray-500 line-through">₹{item.price}</span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-primary">₹{item.price}</span>
                          )}
                        </div>
                        
                        {/* Description */}
                        {item.description && (
                          <p className="text-gray-500 text-sm mb-3">{item.description}</p>
                        )}
                        
                        {/* Available Coupons */}
                        {itemCoupons.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Available Coupons:</p>
                            <div className="flex flex-wrap gap-2">
                              {itemCoupons.map((coupon) => (
                                <span
                                  key={coupon._id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200"
                                >
                                  <FiTag className="mr-1" />
                                  {coupon.code}
                                  {coupon.discountType === 'percentage' 
                                    ? ` (${coupon.discountValue}% off)`
                                    : ` (₹${coupon.discountValue} off)`
                                  }
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Add to Cart Section */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                          {(() => {
                            // Check restaurant status
                            const getKolkataTime = () => {
                              const now = new Date()
                              const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
                              return {
                                hour: kolkataTime.getHours(),
                                minute: kolkataTime.getMinutes()
                              }
                            }
                            
                            const kolkataTime = getKolkataTime()
                            const isInactive = !restaurant.isActive
                            const isOffline = !restaurant.isOnline
                            let isClosed = false
                            
                            if (restaurant.closingTime && !isInactive && !isOffline) {
                              const [hours, minutes] = restaurant.closingTime.split(':').map(Number)
                              isClosed = kolkataTime.hour > hours || (kolkataTime.hour === hours && kolkataTime.minute >= minutes)
                            }
                            
                            const cannotOrder = isInactive || isOffline || isClosed
                            
                            if (cannotOrder) {
                              let message = 'No orders accepted'
                              if (isInactive) message = 'Restaurant inactive - No orders accepted'
                              else if (isOffline) message = 'Restaurant offline - No orders accepted'
                              else if (isClosed) message = `Restaurant closed (Closes at ${restaurant.closingTime})`
                              
                              return (
                                <div className="w-full text-center py-2">
                                  <span className="text-red-600 text-sm font-semibold">{message}</span>
                                </div>
                              )
                            }
                            
                            return null
                          })()}
                          {(() => {
                            // Check restaurant status
                            const getKolkataTime = () => {
                              const now = new Date()
                              const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
                              return {
                                hour: kolkataTime.getHours(),
                                minute: kolkataTime.getMinutes()
                              }
                            }
                            
                            const kolkataTime = getKolkataTime()
                            const isInactive = !restaurant.isActive
                            const isOffline = !restaurant.isOnline
                            let isClosed = false
                            
                            if (restaurant.closingTime && !isInactive && !isOffline) {
                              const [hours, minutes] = restaurant.closingTime.split(':').map(Number)
                              isClosed = kolkataTime.hour > hours || (kolkataTime.hour === hours && kolkataTime.minute >= minutes)
                            }
                            
                            const canOrder = !isInactive && !isOffline && !isClosed
                            
                            if (!canOrder) return null
                            
                            return quantities[item._id] > 0 ? (
                              <div className="flex items-center space-x-3 bg-primary text-white rounded-lg px-4 py-2">
                                <button
                                  onClick={() => handleQuantityChange(item._id, -1)}
                                  className="hover:bg-orange-600 rounded p-1"
                                >
                                  <FiMinus />
                                </button>
                                <span className="font-semibold">{quantities[item._id]}</span>
                                <button
                                  onClick={() => handleQuantityChange(item._id, 1)}
                                  className="hover:bg-orange-600 rounded p-1"
                                >
                                  <FiPlus />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleQuantityChange(item._id, 1)}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                              >
                                ADD
                              </button>
                            )
                          })()}
                          {(() => {
                            // Check restaurant status
                            const getKolkataTime = () => {
                              const now = new Date()
                              const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
                              return {
                                hour: kolkataTime.getHours(),
                                minute: kolkataTime.getMinutes()
                              }
                            }
                            
                            const kolkataTime = getKolkataTime()
                            const isInactive = !restaurant.isActive
                            const isOffline = !restaurant.isOnline
                            let isClosed = false
                            
                            if (restaurant.closingTime && !isInactive && !isOffline) {
                              const [hours, minutes] = restaurant.closingTime.split(':').map(Number)
                              isClosed = kolkataTime.hour > hours || (kolkataTime.hour === hours && kolkataTime.minute >= minutes)
                            }
                            
                            const canOrder = !isInactive && !isOffline && !isClosed
                            
                            if (quantities[item._id] > 0 && canOrder) {
                              return (
                                <button
                                  onClick={() => handleAddToCart(item)}
                                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
                                >
                                  <FiShoppingCart />
                                  <span>Add to Cart</span>
                                </button>
                              )
                            }
                            
                            return null
                          })()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Restaurant

