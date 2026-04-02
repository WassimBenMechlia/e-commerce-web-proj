import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

import { adminNavigation } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const AdminShell = ({ children }: PropsWithChildren) => (
  <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:px-12 lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside className="rounded-card border border-border bg-background-secondary p-5 shadow-soft">
      <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
        Dashboard
      </p>
      <nav className="mt-5 grid gap-2">
        {adminNavigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'rounded-button px-4 py-3 text-sm text-text-secondary transition hover:bg-background-tertiary hover:text-text-primary',
                isActive && 'bg-background-tertiary text-text-primary',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
    <div className="min-w-0">{children}</div>
  </section>
);
