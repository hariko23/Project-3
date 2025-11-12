import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ManagerView from './components/ManagerView';
import CashierView from './components/CashierView';
import CustomerView from './components/CustomerView';
import MenuBoardView from './components/MenuBoardView';

function Navigation() {
  const location = useLocation();
  
  const getPageName = () => {
    switch (location.pathname) {
      case '/':
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
        return 'Home';
    }
  };

  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
      <Link to="/" style={{ marginRight: '10px', color: '#000', textDecoration: 'none' }}>
        {getPageName()}
      </Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/manager" element={<ManagerView />} />
          <Route path="/cashier" element={<CashierView />} />
          <Route path="/customer" element={<CustomerView />} />
          <Route path="/menu-board" element={<MenuBoardView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;