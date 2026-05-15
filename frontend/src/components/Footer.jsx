import { Link } from 'react-router-dom'
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi'

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Foodie</h3>
            <p className="text-sm mb-4">
              Your favorite food delivery platform. Order delicious food from the best restaurants in town.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary transition">
                <FiFacebook className="text-2xl" />
              </a>
              <a href="#" className="hover:text-primary transition">
                <FiTwitter className="text-2xl" />
              </a>
              <a href="#" className="hover:text-primary transition">
                <FiInstagram className="text-2xl" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/restaurant-registration" className="hover:text-primary transition">
                  Register Restaurant
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary transition">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-primary transition">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-primary transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <FiMapPin className="mt-1" />
                <span className="text-sm">123 Food Street, City, State 12345</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiPhone />
                <span className="text-sm">+1 (234) 567-8900</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiMail />
                <span className="text-sm">support@foodie.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Foodie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

