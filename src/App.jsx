import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import OfferBanner from './components/OfferBanner.jsx'
import ClosedBanner from './components/ClosedBanner.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import PromoCatcher from './components/PromoCatcher.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import UserRoute from './components/UserRoute.jsx'

// Customer pages
import Home from './pages/Home.jsx'
import Menu from './pages/Menu.jsx'
import Deals from './pages/Deals.jsx'
import Contact from './pages/Contact.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import TrackOrder from './pages/TrackOrder.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import NotFound from './pages/NotFound.jsx'

// Customer account area
import AccountLayout from './pages/account/AccountLayout.jsx'
import Overview from './pages/account/Overview.jsx'
import MyOrders from './pages/account/MyOrders.jsx'
import MyCoupons from './pages/account/MyCoupons.jsx'
import ProfileSettings from './pages/account/ProfileSettings.jsx'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import ManageMenu from './pages/admin/ManageMenu.jsx'
import ManageDeals from './pages/admin/ManageDeals.jsx'
import ManageDiscounts from './pages/admin/ManageDiscounts.jsx'
import Promotions from './pages/admin/Promotions.jsx'
import ManageSlider from './pages/admin/ManageSlider.jsx'
import DeliveryRules from './pages/admin/DeliveryRules.jsx'
import Settings from './pages/admin/Settings.jsx'
import Orders from './pages/admin/Orders.jsx'
import Customers from './pages/admin/Customers.jsx'
import Messages from './pages/admin/Messages.jsx'
import Expenses from './pages/admin/Expenses.jsx'
import Suppliers from './pages/admin/Suppliers.jsx'
import Businesses from './pages/admin/Businesses.jsx'

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <PromoCatcher />
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
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Customer account */}
          <Route
            path="/account"
            element={
              <UserRoute>
                <AccountLayout />
              </UserRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="coupons" element={<MyCoupons />} />
            <Route path="profile" element={<ProfileSettings />} />
          </Route>

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
            <Route path="promotions" element={<Promotions />} />
            <Route path="slider" element={<ManageSlider />} />
            <Route path="delivery" element={<DeliveryRules />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="businesses" element={<Businesses />} />
            <Route path="settings" element={<Settings />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="messages" element={<Messages />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdmin && <Footer />}
    </div>
  )
}
