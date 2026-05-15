import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FiClock, FiStar, FiDollarSign, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const Home = () => {
  const [restaurants, setRestaurants] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [carousels, setCarousels] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuLoading, setMenuLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [showMenuItems, setShowMenuItems] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    fetchRestaurants()
    fetchMenuItems()
    fetchCarousels()
    fetchCategories()
  }, [selectedCuisine, selectedCategory, searchTerm, locationFilter])

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories')
      setCategories(res.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    if (carousels.length > 0) {
      const interval = setInterval(() => {
        setCurrentCarouselIndex((prev) => (prev + 1) % carousels.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [carousels])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedCuisine) params.cuisine = selectedCuisine
      if (searchTerm) params.search = searchTerm
      if (locationFilter) params.location = locationFilter
      
      const res = await axios.get('/api/restaurants', { params })
      
      // Filter restaurants for home page
      let filtered = (res.data || [])
      
      if (!params.admin) {
        // Filter out only inactive restaurants
        // Show online restaurants (even if closed) - they will display closed status
        filtered = filtered.filter(restaurant => {
          // Filter out inactive restaurants
          if (restaurant.isActive === false) return false
          
          // Only show online restaurants on home page
          if (!restaurant.isOnline) return false
          
          // Show all online restaurants (including closed ones) - they will show closed message
          return true
        })
      }

      // Filter by category if selected (filter restaurants that have menu items in that category)
      if (selectedCategory && selectedCategory !== '' && selectedCategory !== 'All') {
        try {
          const restaurantsWithCategory = await Promise.all(
            filtered.map(async (restaurant) => {
              try {
                const menuRes = await axios.get(`/api/menu/restaurant/${restaurant._id}`)
                const hasCategoryItem = menuRes.data && menuRes.data.length > 0 && menuRes.data.some(item => item.category === selectedCategory)
                return hasCategoryItem ? restaurant : null
              } catch (error) {
                // If menu fetch fails, include the restaurant anyway to avoid hiding all restaurants
                return restaurant
              }
            })
          )
          filtered = restaurantsWithCategory.filter(r => r !== null)
        } catch (error) {
          console.error('Error filtering by category:', error)
          // If category filtering fails, show all filtered restaurants
        }
      }
      
      setRestaurants(filtered)
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      setMenuLoading(true)
      const params = {}
      if (selectedCategory && selectedCategory !== '' && selectedCategory !== 'All') {
        params.category = selectedCategory
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const res = await axios.get('/api/menu', { params })
      
      // Show menu items from all active restaurants (including offline ones)
      // Offline restaurant items will be marked as unavailable
      const filtered = (res.data || []).filter(item => {
        if (!item.restaurant) return false
        // Only filter out items from inactive restaurants
        // Show items from both online and offline restaurants
        if (item.restaurant.isActive === false) {
          return false
        }
        return true
      })
      
      setMenuItems(filtered)
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setMenuItems([])
    } finally {
      setMenuLoading(false)
    }
  }

  const fetchCarousels = async () => {
    try {
      const res = await axios.get('/api/carousel')
      setCarousels(res.data)
    } catch (error) {
      console.error('Error fetching carousels:', error)
    }
  }

  const cuisines = ['All', 'Italian', 'American', 'Japanese', 'Indian', 'Chinese', 'Cafe']

  const nextCarousel = () => {
    setCurrentCarouselIndex((prev) => (prev + 1) % carousels.length)
  }

  const prevCarousel = () => {
    setCurrentCarouselIndex((prev) => (prev - 1 + carousels.length) % carousels.length)
  }

  return (
    <div>
      {/* Carousel */}
      {carousels.length > 0 && (
        <div className="relative w-full h-96 mb-8 overflow-hidden rounded-lg">
          {carousels.map((carousel, index) => (
            <div
              key={carousel._id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentCarouselIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={carousel.image}
                alt={carousel.title || 'Carousel'}
                className="w-full h-full object-cover"
              />
              {(carousel.title || carousel.description) && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white px-4">
                    {carousel.title && (
                      <h2 className="text-4xl font-bold mb-2">{carousel.title}</h2>
                    )}
                    {carousel.description && (
                      <p className="text-xl">{carousel.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {carousels.length > 1 && (
            <>
              <button
                onClick={prevCarousel}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 transition"
              >
                <FiChevronLeft className="text-2xl" />
              </button>
              <button
                onClick={nextCarousel}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 transition"
              >
                <FiChevronRight className="text-2xl" />
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {carousels.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCarouselIndex(index)}
                    className={`w-2 h-2 rounded-full transition ${
                      index === currentCarouselIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cuisine</h3>
            <div className="flex flex-wrap gap-2">
              {cuisines.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => setSelectedCuisine(cuisine === 'All' ? '' : cuisine)}
                  className={`px-4 py-2 rounded-full transition ${
                    (cuisine === 'All' && !selectedCuisine) || selectedCuisine === cuisine
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>
          {categories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Category</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-full transition ${
                    !selectedCategory
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-4 py-2 rounded-full transition ${
                      selectedCategory === category.name
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toggle between Restaurants and Menu Items */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowMenuItems(false)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              !showMenuItems
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => setShowMenuItems(true)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              showMenuItems
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Menu Items
          </button>
        </div>

        {showMenuItems ? (
          // Menu Items Section
          <>
            {menuLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No menu items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {menuItems.map((item) => {
                  const restaurant = item.restaurant
                  const isRestaurantOffline = restaurant && !restaurant.isOnline
                  const isRestaurantInactive = restaurant && !restaurant.isActive
                  
                  return (
                    <Link
                      key={item._id}
                      to={`/restaurant/${restaurant?._id || item.restaurant}`}
                      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 ${isRestaurantOffline || isRestaurantInactive ? 'opacity-75' : ''}`}
                    >
                      <div className="relative h-48 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-110 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                          </div>
                        )}
                        {item.isVeg && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            VEG
                          </div>
                        )}
                        {!item.isVeg && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            NON-VEG
                          </div>
                        )}
                        {(isRestaurantOffline || isRestaurantInactive) && (
                          <div className="absolute inset-0 bg-gray-800 bg-opacity-40 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm bg-red-500 px-3 py-1 rounded">
                              Restaurant Offline
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                          {(isRestaurantOffline || isRestaurantInactive) && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold whitespace-nowrap ml-2">
                              No Orders
                            </span>
                          )}
                        </div>
                        {restaurant && (
                          <p className="text-gray-600 text-sm mb-2">{restaurant.name} • {restaurant.cuisine}</p>
                        )}
                      {item.category && (
                        <p className="text-primary text-xs font-medium mb-2">{item.category}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {item.discountPrice ? (
                            <>
                              <span className="text-lg font-bold text-primary">₹{item.discountPrice}</span>
                              <span className="text-sm text-gray-500 line-through">₹{item.price}</span>
                              {item.discountPercent && (
                                <span className="text-xs text-green-600">({item.discountPercent}% off)</span>
                              )}
                            </>
                          ) : (
                            <span className="text-lg font-bold text-primary">₹{item.price}</span>
                          )}
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-gray-500 text-xs mt-2 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </Link>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          // Restaurants Section
          <>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No restaurants found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {restaurants.map((restaurant) => {
                  // Get current time in India/Kolkata timezone
                  const getKolkataTime = () => {
                    const now = new Date()
                    const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
                    return {
                      hour: kolkataTime.getHours(),
                      minute: kolkataTime.getMinutes(),
                      timeString: `${kolkataTime.getHours().toString().padStart(2, '0')}:${kolkataTime.getMinutes().toString().padStart(2, '0')}`
                    }
                  }
                  
                  const kolkataTime = getKolkataTime()
                  const isOffline = !restaurant.isOnline
                  const isInactive = !restaurant.isActive
                  
                  // Check if restaurant is closed based on Kolkata time
                  let isClosed = false
                  if (restaurant.closingTime && !isOffline && !isInactive) {
                    const [hours, minutes] = restaurant.closingTime.split(':').map(Number)
                    isClosed = kolkataTime.hour > hours || (kolkataTime.hour === hours && kolkataTime.minute >= minutes)
                  }

                  return (
                    <Link
                      key={restaurant._id}
                      to={`/restaurant/${restaurant._id}`}
                      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 ${isOffline || isInactive || isClosed ? 'opacity-90' : ''}`}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-full h-full object-cover hover:scale-110 transition duration-300"
                        />
                        {isInactive && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center">
                            <span className="text-white font-semibold text-lg mb-1">Inactive</span>
                            <span className="text-white text-sm">No orders accepted</span>
                          </div>
                        )}
                        {!isInactive && isOffline && (
                          <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex flex-col items-center justify-center">
                            <span className="text-white font-semibold text-lg mb-1">Offline</span>
                            <span className="text-white text-sm">No orders accepted</span>
                          </div>
                        )}
                        {!isOffline && !isInactive && isClosed && (
                          <>
                            <div className="absolute inset-0 bg-yellow-900 bg-opacity-70 flex flex-col items-center justify-center">
                              <span className="text-white font-bold text-xl mb-1">🕐 Closed for Today</span>
                              <span className="text-white text-sm">Opens tomorrow</span>
                            </div>
                            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              Closed
                            </div>
                          </>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{restaurant.name}</h3>
                          {isInactive && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold whitespace-nowrap ml-2">
                              Inactive
                            </span>
                          )}
                          {!isInactive && isOffline && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold whitespace-nowrap ml-2">
                              Offline
                            </span>
                          )}
                          {!isInactive && !isOffline && isClosed && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold whitespace-nowrap ml-2">
                              Closed for Today
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{restaurant.cuisine}</p>
                        {restaurant.location && (
                          <p className="text-gray-500 text-xs mb-2">📍 {restaurant.location}</p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <FiStar className="text-yellow-500 fill-current" />
                            <span>{restaurant.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FiClock />
                            <span>{restaurant.deliveryTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FiDollarSign />
                            <span>₹{restaurant.costForTwo}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Home
