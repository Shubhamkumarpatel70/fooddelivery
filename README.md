# Swiggy Clone - Food Delivery App

A fully functional food delivery web application built with MERN stack (MongoDB, Express, React, Node.js) and Tailwind CSS. This is a clone of Swiggy, featuring restaurant listings, menu browsing, shopping cart, order management, and user authentication.

## Features

- 🍕 **Restaurant Listings** - Browse restaurants with filters by cuisine
- 🔍 **Search Functionality** - Search restaurants and food items
- 🛒 **Shopping Cart** - Add items, update quantities, and manage cart
- 📱 **Fully Responsive** - Works seamlessly on mobile, tablet, and desktop
- 👤 **User Authentication** - Register, login, and secure JWT-based sessions
- 📦 **Order Management** - Place orders and view order history
- 🎨 **Modern UI** - Beautiful design with Tailwind CSS
- ⚡ **Fast & Efficient** - Optimized performance with React

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Axios for API calls
- React Icons

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swiggy-clone
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start MongoDB (if running locally):
```bash
# Make sure MongoDB is running on your system
```

5. Seed the database (optional):
```bash
node seed.js
```

6. Start the backend server:
```bash
npm run dev
# or
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
swiggy-clone/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── MenuItem.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── restaurants.js
│   │   ├── menu.js
│   │   ├── cart.js
│   │   └── orders.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── seed.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Header.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Restaurant.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Orders.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Restaurants
- `GET /api/restaurants` - Get all restaurants (with optional query params: cuisine, search)
- `GET /api/restaurants/:id` - Get single restaurant

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/restaurant/:restaurantId` - Get menu items by restaurant

### Cart
- `GET /api/cart` - Get user's cart (requires auth)
- `POST /api/cart/add` - Add item to cart (requires auth)
- `PUT /api/cart/update` - Update cart item quantity (requires auth)
- `DELETE /api/cart/remove/:menuItemId` - Remove item from cart (requires auth)
- `DELETE /api/cart/clear` - Clear cart (requires auth)

### Orders
- `POST /api/orders` - Create new order (requires auth)
- `GET /api/orders/my-orders` - Get user's orders (requires auth)
- `GET /api/orders/:id` - Get single order (requires auth)
- `PUT /api/orders/:id/status` - Update order status (requires auth)

## Usage

1. **Register/Login**: Create an account or login to access the app
2. **Browse Restaurants**: View all available restaurants on the home page
3. **Filter & Search**: Use cuisine filters or search bar to find restaurants
4. **View Menu**: Click on a restaurant to see its menu items
5. **Add to Cart**: Add items to your cart with desired quantities
6. **Checkout**: Review your cart, enter delivery address, and place order
7. **Track Orders**: View your order history in the Orders page

## Responsive Design

The application is fully responsive and optimized for:
- 📱 Mobile devices (320px and up)
- 📱 Tablets (768px and up)
- 💻 Desktop (1024px and up)
- 🖥️ Large screens (1280px and up)

## Future Enhancements

- Payment gateway integration
- Real-time order tracking
- Restaurant reviews and ratings
- Favorite restaurants
- Multiple delivery addresses
- Order cancellation
- Admin dashboard
- Restaurant owner panel

## License

This project is open source and available for educational purposes.

## Contributing

Contributions, issues, and feature requests are welcome!

