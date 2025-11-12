import { Link } from 'react-router-dom';

/**
 * Landing Page component
 * Main entry point of the application
 * Provides navigation links to different views:
 * - Manager: Dashboard for managing inventory, viewing analytics, and orders
 * - Cashier: Interface for creating and processing orders
 * - Customer: Customer-facing ordering interface
 * - Menu Board: Public menu display
 */
function LandingPage() {
  return (
    <div className="p-5 text-center bg-white">
      <h1 className="text-2xl font-normal mb-10">Boba POS System</h1>
      {/* Navigation links to different application views */}
      <div className="mt-10">
        <Link to="/manager" className="block my-2.5 p-2.5 border border-gray-300 no-underline text-black bg-white">
          Manager
        </Link>
        <Link to="/cashier" className="block my-2.5 p-2.5 border border-gray-300 no-underline text-black bg-white">
          Cashier
        </Link>
        <Link to="/customer" className="block my-2.5 p-2.5 border border-gray-300 no-underline text-black bg-white">
          Customer
        </Link>
        <Link to="/menu-board" className="block my-2.5 p-2.5 border border-gray-300 no-underline text-black bg-white">
          Menu Board
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;