export const storage = {
  setUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  },
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  getUserId: () => {
    const user = storage.getUser();
    return user ? user._id : null;
  },

  getUserRole: () => {
    const user = storage.getUser();
    return user ? user.role : null;
  },

  isAdmin: () => {
    const role = storage.getUserRole();
    return role === 'admin';
  },
  
  removeUser: () => {
    localStorage.removeItem('user');
  },
  
  isAuthenticated: () => {
    return storage.getUser() !== null;
  }
};

export const requireAuth = (navigate) => {
  if (!storage.isAuthenticated()) {
    navigate('/login');
    return false;
  }
  return true;
};

export const requireAdmin = (navigate) => {
  if (!storage.isAuthenticated()) {
    navigate('/login');
    return false;
  }
  if (!storage.isAdmin()) {
    alert('Access Denied: Admin only');
    navigate('/dashboard');
    return false;
  }
  return true;
};