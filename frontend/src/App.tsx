import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ManagerView from './components/ManagerView';
import CashierView from './components/CashierView';
import CustomerKioskLayout from './components/CustomerKioskLayout';
import MenuBoardView from './components/MenuBoardView';
import LoginPage from './components/LoginPage';
import AccessibilityButton from './components/AccessibilityButton';
import { useAuth, UserButton } from '@clerk/clerk-react';


/**
 * Protected Route component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  // Show nothing while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Navigation component
 * Displays the current page name and provides a link back to home
 * Shows user info and logout button if authenticated
 */
function Navigation() {
  const location = useLocation();
  
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

  // Don't show navigation on login page or customer kiosk
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/customer') {
    return null;
  }

  return (
    <nav className="p-2.5 border-b border-gray-300 flex justify-between items-center">
      <Link to="/home" className="mr-2.5 text-black no-underline">
        {getPageName()}
      </Link>
      <div className="flex items-center">
        <UserButton afterSignOutUrl="/login" />
      </div>
    </nav>
  );
}

/**
 * Main App component
 * Sets up React Router and defines all application routes
 * Routes:
 * - / : Login page (default/first screen)
 * - /login : Login page
 * - /home : Landing page with navigation to different views (protected)
 * - /manager : Manager dashboard (protected)
 * - /cashier : Cashier interface (protected)
 * - /customer : Customer ordering interface (protected)
 * - /menu-board : Menu board display (protected)
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
          <Route 
            path="/customer" 
            element={
              <ProtectedRoute>
                <CustomerKioskLayout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/menu-board" 
            element={
              <ProtectedRoute>
                <MenuBoardView />
              </ProtectedRoute>
            } 
          />
          {/* Catch-all route - redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <AccessibilityButton />
      </div>
    </Router>
  );
}

export default App;