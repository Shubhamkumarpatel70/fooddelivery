const mongoose = require('mongoose');
require('dotenv').config();
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');

const restaurants = [
  {
    name: 'Pizza Paradise',
    cuisine: 'Italian',
    rating: 4.5,
    deliveryTime: '30-40 mins',
    costForTwo: 500,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    location: 'Downtown',
    isOpen: true
  },
  {
    name: 'Burger King',
    cuisine: 'American',
    rating: 4.2,
    deliveryTime: '25-35 mins',
    costForTwo: 400,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    location: 'Mall Road',
    isOpen: true
  },
  {
    name: 'Sushi House',
    cuisine: 'Japanese',
    rating: 4.7,
    deliveryTime: '35-45 mins',
    costForTwo: 800,
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    location: 'City Center',
    isOpen: true
  },
  {
    name: 'Tandoor Express',
    cuisine: 'Indian',
    rating: 4.6,
    deliveryTime: '30-40 mins',
    costForTwo: 350,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    location: 'Old Town',
    isOpen: true
  },
  {
    name: 'Noodle Bar',
    cuisine: 'Chinese',
    rating: 4.3,
    deliveryTime: '25-35 mins',
    costForTwo: 300,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    location: 'Food Street',
    isOpen: true
  },
  {
    name: 'Cafe Mocha',
    cuisine: 'Cafe',
    rating: 4.4,
    deliveryTime: '20-30 mins',
    costForTwo: 250,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4c7c98?w=400',
    location: 'Park Avenue',
    isOpen: true
  }
];

const menuItems = [
  // Pizza Paradise
  { name: 'Margherita Pizza', description: 'Classic cheese and tomato', price: 299, category: 'Pizza', isVeg: true },
  { name: 'Pepperoni Pizza', description: 'Spicy pepperoni with cheese', price: 399, category: 'Pizza', isVeg: false },
  { name: 'Veg Supreme Pizza', description: 'Loaded with vegetables', price: 349, category: 'Pizza', isVeg: true },
  { name: 'Garlic Bread', description: 'Crispy garlic breadsticks', price: 149, category: 'Sides', isVeg: true },
  
  // Burger King
  { name: 'Classic Burger', description: 'Juicy beef patty with veggies', price: 199, category: 'Burgers', isVeg: false },
  { name: 'Veg Burger', description: 'Crispy veg patty', price: 149, category: 'Burgers', isVeg: true },
  { name: 'Chicken Burger', description: 'Grilled chicken burger', price: 249, category: 'Burgers', isVeg: false },
  { name: 'French Fries', description: 'Crispy golden fries', price: 99, category: 'Sides', isVeg: true },
  
  // Sushi House
  { name: 'Salmon Sushi', description: 'Fresh salmon rolls', price: 499, category: 'Sushi', isVeg: false },
  { name: 'California Roll', description: 'Avocado and crab', price: 399, category: 'Sushi', isVeg: false },
  { name: 'Veg Sushi', description: 'Vegetable rolls', price: 299, category: 'Sushi', isVeg: true },
  { name: 'Miso Soup', description: 'Traditional Japanese soup', price: 149, category: 'Soup', isVeg: true },
  
  // Tandoor Express
  { name: 'Butter Chicken', description: 'Creamy tomato curry', price: 349, category: 'Main Course', isVeg: false },
  { name: 'Paneer Tikka', description: 'Grilled cottage cheese', price: 299, category: 'Appetizers', isVeg: true },
  { name: 'Biryani', description: 'Fragrant rice with spices', price: 249, category: 'Main Course', isVeg: false },
  { name: 'Naan', description: 'Fresh baked bread', price: 49, category: 'Bread', isVeg: true },
  
  // Noodle Bar
  { name: 'Chicken Noodles', description: 'Stir-fried noodles', price: 199, category: 'Noodles', isVeg: false },
  { name: 'Veg Noodles', description: 'Vegetable noodles', price: 149, category: 'Noodles', isVeg: true },
  { name: 'Spring Rolls', description: 'Crispy vegetable rolls', price: 129, category: 'Appetizers', isVeg: true },
  { name: 'Manchurian', description: 'Spicy vegetable balls', price: 179, category: 'Appetizers', isVeg: true },
  
  // Cafe Mocha
  { name: 'Cappuccino', description: 'Espresso with steamed milk', price: 149, category: 'Beverages', isVeg: true },
  { name: 'Latte', description: 'Smooth espresso and milk', price: 159, category: 'Beverages', isVeg: true },
  { name: 'Chocolate Cake', description: 'Rich chocolate cake', price: 199, category: 'Desserts', isVeg: true },
  { name: 'Sandwich', description: 'Grilled vegetable sandwich', price: 129, category: 'Snacks', isVeg: true }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swiggy-clone');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});

    // Create restaurants
    const createdRestaurants = await Restaurant.insertMany(restaurants);
    console.log('Restaurants created');

    // Create menu items and assign to restaurants
    let menuIndex = 0;
    for (let i = 0; i < createdRestaurants.length; i++) {
      const restaurant = createdRestaurants[i];
      const itemsForRestaurant = menuItems.slice(menuIndex, menuIndex + 4);
      
      const createdItems = await MenuItem.insertMany(
        itemsForRestaurant.map(item => ({
          ...item,
          restaurant: restaurant._id
        }))
      );

      restaurant.menu = createdItems.map(item => item._id);
      await restaurant.save();
      
      menuIndex += 4;
    }

    console.log('Menu items created');
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

