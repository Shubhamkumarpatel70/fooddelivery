import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { FiUpload, FiCheckCircle, FiClock } from 'react-icons/fi'

const RestaurantRegistration = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantAddress: '',
    frontImage: '',
    restaurantImage: '',
    ownerName: user?.name || '',
    ownerEmail: user?.email || '',
    ownerPhone: '',
    closingTime: '23:00'
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  const handleImageChange = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB. Please compress the image.')
        return
      }
      
      // Convert to base64 for now (in production, upload to cloud storage)
      const reader = new FileReader()
      reader.onloadend = () => {
        // Compress image if it's too large
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Resize if too large (max 1920x1080)
          const maxWidth = 1920
          const maxHeight = 1080
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width
              width = maxWidth
            } else {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }
          
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with quality compression
          const compressed = canvas.toDataURL('image/jpeg', 0.7)
          setFormData({
            ...formData,
            [type]: compressed
          })
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = 'Restaurant name is required'
    }
    if (!formData.restaurantAddress.trim()) {
      newErrors.restaurantAddress = 'Restaurant address is required'
    }
    if (!formData.frontImage) {
      newErrors.frontImage = 'Front image is required'
    }
    if (!formData.restaurantImage) {
      newErrors.restaurantImage = 'Restaurant image is required'
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required'
    }
    if (!formData.ownerEmail.trim()) {
      newErrors.ownerEmail = 'Owner email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Please enter a valid email address'
    }
    if (!formData.closingTime) {
      newErrors.closingTime = 'Closing time is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/restaurant-registration', formData)
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting registration:', error)
      alert(error.response?.data?.message || 'Failed to submit registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <FiClock className="text-6xl text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Submitted</h2>
            <p className="text-gray-600 mb-4">
              Your restaurant registration is under review. Please wait for admin approval.
            </p>
            <p className="text-sm text-gray-500">
              You will be notified once your restaurant is approved.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Restaurant Registration</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Restaurant Name *
          </label>
          <input
            type="text"
            name="restaurantName"
            value={formData.restaurantName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.restaurantName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter restaurant name"
          />
          {errors.restaurantName && (
            <p className="text-red-500 text-sm mt-1">{errors.restaurantName}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Restaurant Address *
          </label>
          <textarea
            name="restaurantAddress"
            value={formData.restaurantAddress}
            onChange={handleChange}
            rows="3"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
              errors.restaurantAddress ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter complete restaurant address"
          />
          {errors.restaurantAddress && (
            <p className="text-red-500 text-sm mt-1">{errors.restaurantAddress}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Restaurant Front Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {formData.frontImage ? (
                <div className="space-y-2">
                  <img
                    src={formData.frontImage}
                    alt="Front preview"
                    className="w-full h-32 object-cover rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, frontImage: ''})}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <FiUpload className="text-4xl text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload front image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'frontImage')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {errors.frontImage && (
              <p className="text-red-500 text-sm mt-1">{errors.frontImage}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Restaurant Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {formData.restaurantImage ? (
                <div className="space-y-2">
                  <img
                    src={formData.restaurantImage}
                    alt="Restaurant preview"
                    className="w-full h-32 object-cover rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, restaurantImage: ''})}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <FiUpload className="text-4xl text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload restaurant image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'restaurantImage')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {errors.restaurantImage && (
              <p className="text-red-500 text-sm mt-1">{errors.restaurantImage}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Owner Name *
            </label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.ownerName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter owner name"
            />
            {errors.ownerName && (
              <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Owner Email *
            </label>
            <input
              type="email"
              name="ownerEmail"
              value={formData.ownerEmail}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.ownerEmail ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter owner email"
            />
            {errors.ownerEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.ownerEmail}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Owner Phone
          </label>
          <input
            type="tel"
            name="ownerPhone"
            value={formData.ownerPhone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter owner phone (optional)"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Closing Time *
          </label>
          <input
            type="time"
            name="closingTime"
            value={formData.closingTime}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.closingTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.closingTime && (
            <p className="text-red-500 text-sm mt-1">{errors.closingTime}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <FiCheckCircle />
              <span>Submit Registration</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default RestaurantRegistration

