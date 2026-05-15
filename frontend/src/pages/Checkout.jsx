import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { FiCreditCard, FiMapPin, FiUser, FiPhone, FiMail, FiCheckCircle, FiTag, FiX } from 'react-icons/fi'

const Checkout = () => {
  const { cart, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [saveAddress, setSaveAddress] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm, setAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    pincode: ''
  })
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    pincode: '',
    paymentMethod: 'cash',
    utrNumber: ''
  })
  const [selectedPaymentMethodDetails, setSelectedPaymentMethodDetails] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (cart.items.length === 0) {
      navigate('/cart')
      return
    }

    // Fetch payment methods
    const fetchPaymentMethods = async () => {
      try {
        const res = await axios.get('/api/payment-methods')
        setPaymentMethods(res.data)
        // Set default payment method
        if (res.data.length > 0) {
          const defaultMethod = res.data.find(m => m.name === 'cash') || res.data[0]
          setFormData(prev => ({ ...prev, paymentMethod: defaultMethod.name }))
          setSelectedPaymentMethodDetails(defaultMethod)
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error)
      }
    }

    // Fetch user addresses
    const fetchAddresses = async () => {
      try {
        const res = await axios.get('/api/addresses')
        setAddresses(res.data)
        // Set default address
        const defaultAddress = res.data.find(a => a.isDefault) || res.data[0]
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id)
          setFormData(prev => ({
            ...prev,
            name: defaultAddress.name,
            phone: defaultAddress.phone,
            address: defaultAddress.address,
            city: defaultAddress.city,
            pincode: defaultAddress.pincode
          }))
        }
      } catch (error) {
        console.error('Error fetching addresses:', error)
        // Fallback to localStorage
        const savedAddress = localStorage.getItem('savedAddress')
        if (savedAddress) {
          try {
            const address = JSON.parse(savedAddress)
            setFormData(prev => ({
              ...prev,
              address: address.address || '',
              city: address.city || '',
              pincode: address.pincode || ''
            }))
          } catch (err) {
            console.error('Error loading saved address:', err)
          }
        }
      }
    }

    fetchPaymentMethods()
    fetchAddresses()

    // Load applied coupon
    const savedCoupon = localStorage.getItem('appliedCoupon')
    if (savedCoupon) {
      try {
        const coupon = JSON.parse(savedCoupon)
        setAppliedCoupon(coupon)
      } catch (error) {
        localStorage.removeItem('appliedCoupon')
      }
    }
  }, [user, cart, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Update selected payment method details when payment method changes
    if (name === 'paymentMethod') {
      const selectedMethod = paymentMethods.find(m => m.name === value)
      setSelectedPaymentMethodDetails(selectedMethod || null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.address.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      alert('Please fill in all address fields')
      return
    }

    // Validate UTR for non-cash payment methods
    if (formData.paymentMethod !== 'cash') {
      if (!formData.utrNumber || !formData.utrNumber.trim()) {
        alert('Please enter UTR number for online payment')
        return
      }
    }

    setLoading(true)
    try {
      let restaurantId = cart.items[0]?.restaurantId
      
      if (!restaurantId) {
        const menuItemRes = await axios.get(`/api/menu`)
        const menuItem = menuItemRes.data.find(item => item._id === cart.items[0].menuItemId)
        if (!menuItem || !menuItem.restaurant) {
          alert('Unable to find restaurant information')
          setLoading(false)
          return
        }
        restaurantId = menuItem.restaurant._id || menuItem.restaurant
      }

      const fullAddress = `${formData.address}, ${formData.city}, ${formData.pincode}`

      // Save address if checkbox is checked
      if (saveAddress) {
        const addressData = {
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode
        }
        localStorage.setItem('savedAddress', JSON.stringify(addressData))
        
        // Also save to user profile
        try {
          await axios.put('/api/users/me', { address: fullAddress })
        } catch (error) {
          console.error('Error saving address to profile:', error)
        }
      } else {
        localStorage.removeItem('savedAddress')
      }

      const orderData = {
        restaurantId: restaurantId,
        items: cart.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price
        })),
        deliveryAddress: fullAddress,
        paymentMethod: formData.paymentMethod,
        couponCode: appliedCoupon?.code || null,
        discount: appliedCoupon ? appliedCoupon.discount : 0,
        upiId: formData.paymentMethod === 'upi' && selectedPaymentMethodDetails?.qrCodeData ? selectedPaymentMethodDetails.qrCodeData : null,
        utrNumber: formData.paymentMethod !== 'cash' ? formData.utrNumber : null,
        paymentStatus: formData.paymentMethod === 'upi' ? 'pending' : (formData.paymentMethod === 'cash' ? 'pending' : 'pending')
      }

      const res = await axios.post('/api/orders', orderData)
      await clearCart()
      localStorage.removeItem('appliedCoupon')
      navigate(`/orders/${res.data._id}`)
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deliveryFee = 40
  const tax = Math.round(cart.total * 0.05)
  const discount = appliedCoupon ? appliedCoupon.discount : 0
  const total = Math.max(0, cart.total + deliveryFee + tax - discount)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-6">
              <FiMapPin className="text-primary text-xl" />
              <h2 className="text-2xl font-bold text-gray-800">Delivery Information</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <FiUser className="inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <FiPhone className="inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FiMail className="inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FiMapPin className="inline mr-2" />
                  Street Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="House/Flat No., Building Name, Street"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{6}"
                    maxLength="6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Save Address Checkbox */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="saveAddress"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="saveAddress" className="text-gray-700 font-semibold cursor-pointer">
                  Save address for future orders
                </label>
              </div>

              {/* Address Selection */}
              {addresses.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Select Address</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="text-primary hover:text-orange-600 text-sm font-semibold"
                    >
                      + Add New
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {addresses.map((address) => (
                      <label
                        key={address._id}
                        className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedAddressId === address._id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedAddress"
                          value={address._id}
                          checked={selectedAddressId === address._id}
                          onChange={() => {
                            setSelectedAddressId(address._id)
                            setFormData(prev => ({
                              ...prev,
                              name: address.name,
                              phone: address.phone,
                              address: address.address,
                              city: address.city,
                              pincode: address.pincode
                            }))
                          }}
                          className="w-5 h-5 text-primary mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-800">{address.name}</p>
                            {address.isDefault && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{address.address}, {address.city}, {address.pincode}</p>
                          <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

               {/* Payment Method */}
               <div className="mt-6 pt-6 border-t border-gray-200">
                 <div className="flex items-center space-x-2 mb-4">
                   <FiCreditCard className="text-primary text-xl" />
                   <h3 className="text-xl font-bold text-gray-800">Payment Method</h3>
                 </div>
                 <div className="space-y-2">
                   {paymentMethods.map((method) => (
                     <label
                       key={method._id}
                       className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition"
                     >
                       <input
                         type="radio"
                         name="paymentMethod"
                         value={method.name}
                         checked={formData.paymentMethod === method.name}
                         onChange={handleChange}
                         className="w-5 h-5 text-primary"
                       />
                       <span className="font-semibold">{method.displayName}</span>
                     </label>
                   ))}
                 </div>

                 {/* Payment Method Details */}
                 {formData.paymentMethod === 'upi' && selectedPaymentMethodDetails?.qrCodeData && (
                   <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                     <div>
                       <label className="block text-gray-700 font-semibold mb-2">UPI ID</label>
                       <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                         <p className="text-gray-800 font-medium">{selectedPaymentMethodDetails.qrCodeData}</p>
                       </div>
                       <p className="text-xs text-gray-500 mt-1">Please use this UPI ID to make your payment</p>
                     </div>
                   </div>
                 )}

                 {/* UTR Number Field - Required for all payment methods except cash */}
                 {formData.paymentMethod !== 'cash' && (
                   <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                     <div>
                       <label className="block text-gray-700 font-semibold mb-2">UTR Number *</label>
                       <input
                         type="text"
                         name="utrNumber"
                         value={formData.utrNumber}
                         onChange={handleChange}
                         required
                         placeholder="Enter UTR number after payment"
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                       />
                       <p className="text-xs text-gray-500 mt-1">Enter the UTR number from your payment receipt</p>
                     </div>
                   </div>
                 )}
               </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    <span>Place Order</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>

            {/* Applied Coupon */}
            {appliedCoupon && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FiTag className="text-green-600" />
                    <span className="font-semibold text-green-800">{appliedCoupon.code}</span>
                  </div>
                </div>
                <p className="text-sm text-green-700">{appliedCoupon.description || 'Discount applied'}</p>
                <p className="text-sm font-semibold text-green-800 mt-1">
                  Discount: ₹{discount}
                </p>
              </div>
            )}

            {/* Order Items */}
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{cart.total}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (5%)</span>
                <span>₹{tax}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800">
                <span>Total</span>
                <span className="text-primary">₹{total}</span>
              </div>
            </div>

            {/* QR Code for Scan and Pay */}
            {formData.paymentMethod === 'scan_and_pay' && (() => {
              const selectedMethod = paymentMethods.find(m => m.name === 'scan_and_pay')
              const qrData = selectedMethod?.qrCodeData || `upi://pay?pa=your-upi-id@paytm&pn=FoodDelivery&am=${total}&cu=INR`
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
              
              return (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="font-semibold text-gray-800 mb-3">Scan to Pay</p>
                    <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-3 border-2 border-gray-300 rounded-lg" />
                    <p className="text-sm text-gray-600">Amount: ₹{total}</p>
                    <p className="text-xs text-gray-500 mt-2">Scan this QR code with your UPI app to complete payment</p>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add New Address</h2>
              <button
                onClick={() => {
                  setShowAddressModal(false)
                  setAddressForm({
                    name: user?.name || '',
                    phone: user?.phone || '',
                    address: '',
                    city: '',
                    pincode: ''
                  })
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
                  const res = await axios.post('/api/addresses', {
                    ...addressForm,
                    isDefault: addresses.length === 0
                  })
                  const newAddresses = [...addresses, res.data]
                  setAddresses(newAddresses)
                  setSelectedAddressId(res.data._id)
                  setFormData(prev => ({
                    ...prev,
                    name: res.data.name,
                    phone: res.data.phone,
                    address: res.data.address,
                    city: res.data.city,
                    pincode: res.data.pincode
                  }))
                  setShowAddressModal(false)
                  setAddressForm({
                    name: user?.name || '',
                    phone: user?.phone || '',
                    address: '',
                    city: '',
                    pincode: ''
                  })
                } catch (error) {
                  console.error('Error adding address:', error)
                  alert('Failed to add address')
                }
              }}
              className="space-y-4"
            >
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
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  Add Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressModal(false)
                    setAddressForm({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      address: '',
                      city: '',
                      pincode: ''
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

export default Checkout
