import API_BASE_URL from './config';

/**
 * User interface for authenticated users
 */
export interface User {
  userid: number;
  googleid: string;
  email: string;
  name: string;
  picture: string | null;
  role: string;
}

/**
 * Authentication API response
 */
export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Get current authenticated user
 * @returns User object if authenticated, null otherwise
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies for session
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // Not authenticated
      }
      throw new Error('Failed to get current user');
    }

    const data: AuthResponse = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Initiate Google OAuth login
 * Redirects to Google OAuth page
 */
export const loginWithGoogle = (): void => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};

/**
 * Logout current user
 * @returns Promise that resolves when logout is complete
 */
export const logout = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to logout');
    }

    // Redirect to login page after logout
    window.location.href = '/';
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

