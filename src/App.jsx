import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import OfferBanner from './components/OfferBanner.jsx'
import ClosedBanner from './components/ClosedBanner.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Customer pages
import Home from './pages/Home.jsx'
import Menu from './pages/Menu.jsx'
import Deals from './pages/Deals.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import TrackOrder from './pages/TrackOrder.jsx'
import NotFound from './pages/NotFound.jsx'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import ManageMenu from './pages/admin/ManageMenu.jsx'
import ManageDeals from './pages/admin/ManageDeals.jsx'
import ManageDiscounts from './pages/admin/ManageDiscounts.jsx'
import ManageSlider from './pages/admin/ManageSlider.jsx'
import DeliveryRules from './pages/admin/DeliveryRules.jsx'
import Settings from './pages/admin/Settings.jsx'
import Orders from './pages/admin/Orders.jsx'
import Expenses from './pages/admin/Expenses.jsx'
import Suppliers from './pages/admin/Suppliers.jsx'
import Businesses from './pages/admin/Businesses.jsx'

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {!isAdmin && (
        <>
          <OfferBanner />
          <ClosedBanner />
          <Navbar />
        </>
      )}

      <main className="flex-1">
        <Routes>
          {/* Customer */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
          <Route path="/track" element={<TrackOrder />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="menu" element={<ManageMenu />} />
            <Route path="deals" element={<ManageDeals />} />
            <Route path="discounts" element={<ManageDiscounts />} />
            <Route path="slider" element={<ManageSlider />} />
            <Route path="delivery" element={<DeliveryRules />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="businesses" element={<Businesses />} />
            <Route path="settings" element={<Settings />} />
            <Route path="orders" element={<Orders />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdmin && <Footer />}
    </div>
  )
}
