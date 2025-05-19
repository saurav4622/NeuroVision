// Custom authentication hook to centralize auth logic
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const navigate = useNavigate();

  const setAuthData = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };
  
  const setRememberMe = (email, role) => {
    if (email && role) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedRole', role);
      return true;
    }
    return false;
  };
  
  const clearRememberMe = () => {
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedRole');
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Don't clear remember me data during logout
  };

  const redirectBasedOnRole = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        return true;
      case 'doctor':
        navigate('/doctor');
        return true;
      case 'patient':
        navigate('/dashboard');
        return true;
      default:
        return false;
    }
  };
  
  const getAuthData = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return { token, user };
  };
  
  return {
    setAuthData,
    clearAuthData,
    setRememberMe,
    clearRememberMe,
    redirectBasedOnRole,
    getAuthData
  };
};
