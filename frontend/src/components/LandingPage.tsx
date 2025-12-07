import { Link } from 'react-router-dom';
import Translator from './Translator';

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
    <div className="p-5 text-center bg-background min-h-screen">
      <div className="flex justify-end mb-4">
        <Translator />
      </div>
      <h1 className="text-2xl font-normal mb-10 text-foreground">Boba POS System</h1>
      {/* Navigation links to different application views */}
      <div className="mt-10">
        <Link to="/manager" className="block my-2.5 p-2.5 border border-border no-underline text-foreground bg-card hover:bg-accent transition-colors">
          Manager
        </Link>
        <Link to="/cashier" className="block my-2.5 p-2.5 border border-border no-underline text-foreground bg-card hover:bg-accent transition-colors">
          Cashier
        </Link>
        <Link to="/customer" className="block my-2.5 p-2.5 border border-border no-underline text-foreground bg-card hover:bg-accent transition-colors">
          Customer
        </Link>
        <Link to="/menu-board" className="block my-2.5 p-2.5 border border-border no-underline text-foreground bg-card hover:bg-accent transition-colors">
          Menu Board
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;