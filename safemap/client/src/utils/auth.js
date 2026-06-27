export const getToken = () => localStorage.getItem('safemap_token');

export const getUserId = () => localStorage.getItem('safemap_user');

export const getUserRole = () => localStorage.getItem('safemap_role');

export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const saveSession = ({ token, user }) => {
  if (token) localStorage.setItem('safemap_token', token);
  if (user?.id) localStorage.setItem('safemap_user', user.id);
  if (user?.role) localStorage.setItem('safemap_role', user.role);
};

export const logout = () => {
  localStorage.removeItem('safemap_token');
  localStorage.removeItem('safemap_user');
  localStorage.removeItem('safemap_role');
};
