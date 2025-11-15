import { useAuth } from '../contexts/AuthContext';

export const useAdmin = () => {
  const { isAdmin, user } = useAuth();

  const hasAdminAccess = () => {
    if (!isAdmin) {
      alert('Admin access required');
      return false;
    }
    return true;
  };

  return { isAdmin, hasAdminAccess, user };
};
