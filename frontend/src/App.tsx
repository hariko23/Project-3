import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ManagerView from './components/ManagerView';
import CashierView from './components/CashierView';
import CustomerView from './components/CustomerView';
import MenuBoardView from './components/MenuBoardView';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AccessibilityButton from './components/AccessibilityButton';
import { useAuth } from './contexts/AuthContext';

/**
 * Navigation component
 * Displays the current page name and provides a link back to home
 * Shows user info and logout button if authenticated
 */
function Navigation() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  
  /**
   * Get the display name for the current route
   * @returns The page name based on the current pathname
   */
  const getPageName = () => {
    switch (location.pathname) {
      case '/':
      case '/login':
        return 'Login';
      case '/home':
        return 'Home';
      case '/manager':
        return 'Manager';
      case '/cashier':
        return 'Cashier';
      case '/customer':
        return 'Customer';
      case '/menu-board':
        return 'Menu Board';
      default:
        return 'Login';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Don't show navigation on login page
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="p-2.5 border-b border-gray-300 flex justify-between items-center">
      <Link to="/home" className="mr-2.5 text-black no-underline">
        {getPageName()}
      </Link>
      {isAuthenticated && user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

/**
 * Main App component
 * Sets up React Router and defines all application routes
 * Routes:
 * - / : Login page with Google OAuth (default/first screen)
 * - /home : Landing page with navigation to different views (protected)
 * - /manager : Manager dashboard (protected)
 * - /cashier : Cashier interface (protected)
 * - /customer : Customer ordering interface (public)
 * - /menu-board : Menu board display (public)
 * - * : Catch-all route that redirects to login
 */
function App() {
  return (
    <Router>
      <div className="bg-white min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute>
                <ManagerView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier"
            element={
              <ProtectedRoute>
                <CashierView />
              </ProtectedRoute>
            }
          />
          <Route path="/customer" element={<CustomerView />} />
          <Route path="/menu-board" element={<MenuBoardView />} />
          {/* Catch-all route - redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AccessibilityButton />
      </div>
    </Router>
  );
}

export default App;