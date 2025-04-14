import * as React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Caricamento...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  // Check role permissions
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    setLocation('/unauthorized');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;