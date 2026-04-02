import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Footer } from './Footer';
import { Header } from './Header';

export const AppShell = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="min-h-[calc(100vh-220px)]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
