import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard = ({ product, compact = false }: ProductCardProps) => (
  <Card className="group overflow-hidden">
    <Link to={`/products/${product._id}`} className="block">
      <div className={compact ? 'aspect-[4/4.6] overflow-hidden' : 'aspect-[4/4.8] overflow-hidden'}>
        <img
          src={product.images[0]?.url}
          alt={product.images[0]?.alt ?? product.name}
          className="h-full w-full object-cover saturate-[0.8] transition duration-500 group-hover:scale-105"
        />
      </div>
    </Link>
    <div className="grid gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">{product.category?.name}</p>
          <Link
            to={`/products/${product._id}`}
            className="inline-flex items-center gap-2 font-heading text-xl text-text-primary transition hover:text-brand-primary"
          >
            {product.name}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {product.ecoBadge ? (
          <Badge className="bg-brand-accent/10 text-brand-accent">{product.ecoBadge}</Badge>
        ) : null}
      </div>
      {!compact ? (
        <p className="line-clamp-2 text-sm text-text-secondary">{product.description}</p>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-text-primary">
            {formatCurrency(product.price)}
          </p>
          <p className="text-sm text-text-secondary">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
        </div>
        <Button size="sm" variant="secondary" type="button">
          <ShoppingBag className="h-4 w-4" />
          View
        </Button>
      </div>
    </div>
  </Card>
);
