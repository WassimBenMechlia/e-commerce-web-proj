import { Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { mainNavigation } from '@/lib/constants';
import { api } from '@/lib/axios';
import { cn, getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUiStore } from '@/store/uiStore';

import { SearchBar } from '../common/SearchBar';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Header = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const serverCart = useCartStore((state) => state.serverCart);
  const guestItems = useCartStore((state) => state.guestItems);
  const clearServerCart = useCartStore((state) => state.clearServerCart);
  const mobileMenuOpen = useUiStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useUiStore((state) => state.setMobileMenuOpen);

  const cartCount = user
    ? serverCart?.itemCount ?? 0
    : guestItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = () => {
    navigate(`/shop${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      clearUser();
      clearServerCart();
      toast.success('Signed out successfully.');
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background-primary/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 md:px-12">
        <Link to="/" className="min-w-fit">
          <p className="font-serif text-sm uppercase tracking-[0.35em] text-text-secondary">
            Desert Modern
          </p>
          <p className="font-heading text-xl text-text-primary">Quiet Commerce</p>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {mainNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'text-sm text-text-secondary transition hover:text-text-primary',
                  isActive && 'text-text-primary',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'admin' ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'text-sm text-text-secondary transition hover:text-text-primary',
                  isActive && 'text-text-primary',
                )
              }
            >
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="hidden flex-1 lg:block">
          <SearchBar value={search} onChange={setSearch} onSubmit={handleSearch} />
        </div>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="rounded-full"
          >
            <ShoppingBag className="h-4 w-4" />
            Cart ({cartCount})
          </Button>
          {user ? (
            <>
              <Button variant="secondary" onClick={() => navigate('/profile')}>
                <UserRound className="h-4 w-4" />
                {user.name.split(' ')[0]}
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log In
              </Button>
              <Button onClick={() => navigate('/register')}>Create Account</Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background-secondary lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-border px-6 py-5 lg:hidden">
          <div className="grid gap-4">
            <SearchBar value={search} onChange={setSearch} onSubmit={handleSearch} />
            <nav className="grid gap-3">
              {mainNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-text-primary"
                >
                  {item.label}
                </NavLink>
              ))}
              {user?.role === 'admin' ? (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-text-primary"
                >
                  Admin
                </NavLink>
              ) : null}
            </nav>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    Profile
                  </Button>
                  <Button variant="ghost" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Log In
                  </Button>
                  <Button onClick={() => navigate('/register')}>Create Account</Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};
