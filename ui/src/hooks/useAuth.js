import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to use Authentication context
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;