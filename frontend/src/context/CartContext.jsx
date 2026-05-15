import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0 })
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      setCart({ items: [], total: 0 })
    }
  }, [user])

  const fetchCart = async () => {
    try {
      const res = await axios.get('/api/cart')
      setCart(res.data)
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }

  const addToCart = async (menuItemId, quantity = 1) => {
    if (!user) {
      return { success: false, message: 'Please login to add items to cart' }
    }
    try {
      const res = await axios.post('/api/cart/add', { menuItemId, quantity })
      setCart(res.data)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to add to cart' }
    }
  }

  const updateCartItem = async (menuItemId, quantity) => {
    try {
      const res = await axios.put('/api/cart/update', { menuItemId, quantity })
      setCart(res.data)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update cart' }
    }
  }

  const removeFromCart = async (menuItemId) => {
    try {
      const res = await axios.delete(`/api/cart/remove/${menuItemId}`)
      setCart(res.data)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to remove from cart' }
    }
  }

  const clearCart = async () => {
    try {
      await axios.delete('/api/cart/clear')
      setCart({ items: [], total: 0 })
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to clear cart' }
    }
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, updateCartItem, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

