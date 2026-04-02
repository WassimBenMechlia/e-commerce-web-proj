import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { ProductCard } from '@/components/common/ProductCard';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/axios';
import type { CategoriesResponse, ProductsResponse } from '@/types/api';

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebounce(search, 350);

  const page = Number(searchParams.get('page') ?? '1');
  const sort = searchParams.get('sort') ?? 'newest';
  const category = searchParams.get('category') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';

  useEffect(() => {
    if (debouncedSearch === (searchParams.get('search') ?? '')) {
      return;
    }

    const next = new URLSearchParams(searchParams);

    if (debouncedSearch) {
      next.set('search', debouncedSearch);
    } else {
      next.delete('search');
    }

    next.set('page', '1');
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, searchParams, setSearchParams]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    params.set('limit', '9');
    return params.toString();
  }, [page, searchParams]);

  const productsQuery = useQuery({
    queryKey: ['shop-products', queryString],
    queryFn: async () => {
      const { data } = await api.get<ProductsResponse>(`/products?${queryString}`);
      return data;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<CategoriesResponse>('/categories');
      return data.categories;
    },
  });

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    if (key !== 'page') {
      next.set('page', '1');
    }

    setSearchParams(next);
  };

  return (
    <PageTransition>
      <section className="page-shell grid gap-8">
        <SectionHeading
          eyebrow="Shop all"
          title="Filter by category, price, and rating with a fast debounced search."
          description="The catalog API supports pagination, category lookup, price range filters, and sorting so the frontend stays lightweight."
        />

        <Card className="grid gap-4 p-5 lg:grid-cols-[2fr_repeat(4,minmax(0,1fr))] lg:items-center">
          <label className="grid gap-2 text-sm text-text-secondary">
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for a product"
              className="h-12 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-text-secondary">
            Category
            <select
              value={category}
              onChange={(event) => updateParam('category', event.target.value)}
              className="h-12 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none"
            >
              <option value="">All</option>
              {categoriesQuery.data?.map((item) => (
                <option key={item._id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-text-secondary">
            Min price
            <input
              value={minPrice}
              onChange={(event) => updateParam('minPrice', event.target.value)}
              type="number"
              className="h-12 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-text-secondary">
            Max price
            <input
              value={maxPrice}
              onChange={(event) => updateParam('maxPrice', event.target.value)}
              type="number"
              className="h-12 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-text-secondary">
            Sort
            <select
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value)}
              className="h-12 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none"
            >
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
              <option value="ratingDesc">Top rated</option>
            </select>
          </label>
        </Card>

        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <SlidersHorizontal className="h-4 w-4" />
          <span>
            {productsQuery.data?.pagination.total ?? 0} results across the product
            catalog
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {productsQuery.isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[420px] rounded-card" />
              ))
            : productsQuery.data?.products.map((product) => (
                <ProductCard key={product._id} product={product} compact />
              ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => updateParam('page', String(Math.max(page - 1, 1)))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <p className="text-sm text-text-secondary">
            Page {productsQuery.data?.pagination.page ?? 1} of{' '}
            {productsQuery.data?.pagination.totalPages ?? 1}
          </p>
          <Button
            variant="secondary"
            onClick={() => updateParam('page', String(page + 1))}
            disabled={page >= (productsQuery.data?.pagination.totalPages ?? 1)}
          >
            Next
          </Button>
        </div>
      </section>
    </PageTransition>
  );
};
