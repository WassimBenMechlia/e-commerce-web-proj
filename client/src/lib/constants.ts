export const mainNavigation = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/cart', label: 'Cart' },
  { to: '/profile', label: 'Profile' },
] as const;

export const adminNavigation = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' },
] as const;

export const emptyCart = {
  id: null,
  itemCount: 0,
  subtotal: 0,
  items: [],
};
