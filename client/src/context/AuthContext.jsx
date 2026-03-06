import { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the context
const AuthContext = createContext();

// 2. Provider component — wraps the app and shares user state globally
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if user is already saved in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Call this after login — saves to both state and localStorage
  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Call this on logout — clears everything
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Helper: get the token cleanly from anywhere in the app
  const getToken = () => user?.token || null;

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook — use this in any component to access user state
// Usage: const { user, logout, getToken } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};