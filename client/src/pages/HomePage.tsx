import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ProductCard } from '@/components/common/ProductCard';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/axios';
import { PageTransition } from '@/components/common/PageTransition';
import type { CategoriesResponse, ProductsResponse } from '@/types/api';

export const HomePage = () => {
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<CategoriesResponse>('/categories');
      return data.categories;
    },
  });

  const productsQuery = useQuery({
    queryKey: ['home-products'],
    queryFn: async () => {
      const { data } = await api.get<ProductsResponse>(
        '/products?limit=6&sort=ratingDesc',
      );
      return data.products;
    },
  });

  return (
    <PageTransition>
      <section className="page-shell grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="space-y-7">
          <p className="font-serif text-sm uppercase tracking-[0.35em] text-text-secondary">
            Quiet ritual, modern stack
          </p>
          <div className="space-y-4">
            <h1 className="max-w-4xl font-heading text-5xl leading-[0.95] text-text-primary md:text-7xl">
              Editorial commerce for body, home, and everyday routines.
            </h1>
            <p className="max-w-2xl text-lg text-text-secondary">
              Desert Modern blends a calm retail aesthetic with secure auth, MongoDB
              persistence, Stripe checkout, and admin analytics in a production-ready
              MERN build.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/shop">
              <Button size="lg">
                Browse Collection
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="grid gap-6 bg-warm-grid p-8">
            <div className="space-y-3">
              <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
                Build highlights
              </p>
              <h2 className="font-heading text-3xl text-text-primary">
                Secure, responsive, and shaped for real storefront flows.
              </h2>
            </div>
            <div className="grid gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: 'JWT + httpOnly cookies',
                  copy: 'Access and refresh tokens with rotation and role-based auth.',
                },
                {
                  icon: Truck,
                  title: 'Checkout + tracking',
                  copy: 'Stripe checkout, order states, and confirmation email support.',
                },
                {
                  icon: Sparkles,
                  title: 'Admin controls',
                  copy: 'Analytics, product CRUD, order updates, and inventory alerts.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-card border border-border bg-background-primary/70 p-4"
                >
                  <item.icon className="mb-3 h-5 w-5 text-brand-primary" />
                  <p className="font-medium text-text-primary">{item.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="page-shell grid gap-8">
        <SectionHeading
          eyebrow="Curated categories"
          title="Warm, organic navigation that feels like an editorial shelf."
          description="Choose a category to open the matching products in shop."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {categoriesQuery.isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-72 rounded-card" />
              ))
            : categoriesQuery.data?.map((category) => (
                <Link
                  key={category._id}
                  to={`/shop?category=${category.slug}`}
                  className="group overflow-hidden rounded-card border border-border bg-background-secondary shadow-soft"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover saturate-[0.8] transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-2 p-5">
                    <p className="font-heading text-2xl text-text-primary">
                      {category.name}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {category.productCount ?? 0} item
                      {(category.productCount ?? 0) === 1 ? '' : 's'} in this category
                    </p>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      <section className="page-shell grid gap-8">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Featured product edit"
            title="Bestsellers with strong imagery, clear pricing, and inventory signals."
            description="Framer Motion powers transitions, Zustand handles session/cart state, and the product cards stay clean under the Desert Modern palette."
          />
          <Link to="/shop" className="hidden md:block">
            <Button variant="secondary">View All Products</Button>
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {productsQuery.isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[420px] rounded-card" />
              ))
            : productsQuery.data?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
        </div>
      </section>
    </PageTransition>
  );
};
