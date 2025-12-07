import { useNavigate } from 'react-router-dom';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { useEffect } from 'react';

/**
 * Login Page component
 * Uses Clerk authentication - redirects to home if already signed in
 */
function LoginPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  // Redirect to home if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/home');
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (isLoaded && isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card p-8 rounded-lg shadow-md max-w-md w-full border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Boba POS System</h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="space-y-4">
          <SignInButton mode="modal" fallbackRedirectUrl="/home">
            <button className="w-full py-4 px-6 text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

