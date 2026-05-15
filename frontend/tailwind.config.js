/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          red: '#FF5A5F',
          orange: '#FF9A3D',
          DEFAULT: '#FF5A5F', // Default primary color
        },
        accent: {
          yellow: '#FFCC00',
        },
        // Secondary Colors
        gray: {
          dark: '#333333',
          medium: '#666666',
          light: '#999999',
          background: '#F8F8F8',
        },
        // Status & UI Colors
        success: '#00B14F',
        warning: '#FF9500',
        error: '#FF3B30',
        info: '#007AFF',
        // Food Category Colors
        veg: '#4CAF50',
        'non-veg': '#F44336',
        spicy: '#FF7043',
        sweet: '#FF4081',
        beverage: '#2196F3',
        // App-Specific Elements
        discount: '#FF4081',
        rating: '#FFB300',
        'free-delivery': '#4CAF50',
        // Legacy support
        secondary: '#60B246',
      },
      backgroundImage: {
        'gradient-cta': 'linear-gradient(to right, #FF5A5F, #FF9A3D)',
      },
    },
  },
  plugins: [],
}

