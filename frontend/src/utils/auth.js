export const storage = {
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  removeUser: () => {
    localStorage.removeItem('user');
  },
  
  isAuthenticated: () => {
    return localStorage.getItem('user') !== null;
  }
};

export const requireAuth = (navigate) => {
  if (!storage.isAuthenticated()) {
    navigate('/login');
    return false;
  }
  return true;
};