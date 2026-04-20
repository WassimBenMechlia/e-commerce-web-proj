import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { ProductCard } from '@/components/common/ProductCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import type { CartResponse, ProductDetailResponse } from '@/types/api';
import { reviewFormSchema } from '@/validation/forms';

export const ProductPage = () => {
  const { id = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const setServerCart = useCartStore((state) => state.setServerCart);
  const addGuestItem = useCartStore((state) => state.addGuestItem);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get<ProductDetailResponse>(`/products/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  const product = productQuery.data?.product;

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    try {
      if (user) {
        const { data } = await api.post<CartResponse>('/cart/add', {
          productId: product._id,
          quantity,
        });
        setServerCart(data.cart);
      } else {
        addGuestItem({
          id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          image: product.images[0]?.url ?? '',
          isActive: product.isActive,
          quantity,
        });
      }

      toast.success('Added to cart.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSubmitReview = async () => {
    const parsedReview = reviewFormSchema.safeParse({
      rating,
      comment,
    });

    if (!parsedReview.success) {
      const nextError =
        parsedReview.error.flatten().fieldErrors.comment?.[0] ??
        parsedReview.error.issues[0]?.message ??
        'Add a valid review.';
      setReviewError(nextError);
      toast.error(nextError);
      return;
    }

    setReviewError(null);

    setIsSavingReview(true);

    try {
      await api.post(`/products/${id}/reviews`, {
        ...parsedReview.data,
      });
      setComment('');
      toast.success('Review saved.');
      await queryClient.invalidateQueries({ queryKey: ['product', id] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingReview(false);
    }
  };

  if (productQuery.isLoading || !product) {
    return (
      <section className="page-shell grid gap-6 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] rounded-card" />
        <Skeleton className="h-[520px] rounded-card" />
      </section>
    );
  }

  return (
    <PageTransition>
      <section className="page-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4">
          <div className="overflow-hidden rounded-card border border-border shadow-soft">
            <img
              src={product.images[0]?.url}
              alt={product.images[0]?.alt ?? product.name}
              className="aspect-[4/5] w-full object-cover saturate-[0.85]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {product.images.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="overflow-hidden rounded-card border border-border"
              >
                <img
                  src={image.url}
                  alt={image.alt ?? `${product.name} thumbnail ${index + 1}`}
                  className="aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-background-secondary text-text-secondary">
                {product.category.name}
              </Badge>
              {product.ecoBadge ? (
                <Badge className="bg-brand-accent/10 text-brand-accent">
                  {product.ecoBadge}
                </Badge>
              ) : null}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl">{product.name}</h1>
              <p className="mt-3 max-w-2xl text-lg text-text-secondary">
                {product.description}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-semibold text-text-primary">
                {formatCurrency(product.price)}
              </p>
              {product.compareAtPrice ? (
                <p className="text-text-secondary line-through">
                  {formatCurrency(product.compareAtPrice)}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Star className="h-4 w-4 fill-brand-warning text-brand-warning" />
              <span>
                {product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)
              </span>
            </div>
          </div>

          <Card className="grid gap-5 p-6">
            <div className="flex items-center justify-between">
              <p className="font-medium text-text-primary">Quantity</p>
              <div className="inline-flex items-center gap-3 rounded-full border border-border bg-background-primary px-3 py-2">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(product.stock, value + 1))
                  }
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              {product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}
            </p>
            <Button onClick={handleAddToCart} disabled={product.stock === 0}>
              Add To Cart
            </Button>
          </Card>

          <Card className="grid gap-4 p-6">
            <h2 className="text-2xl">Reviews</h2>
            {product.reviews.length === 0 ? (
              <p className="text-text-secondary">No reviews yet.</p>
            ) : (
              <div className="grid gap-4">
                {product.reviews.map((review) => (
                  <div key={review._id} className="rounded-card bg-background-primary p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-text-primary">{review.name}</p>
                      <p className="text-sm text-text-secondary">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-brand-warning">
                      {'★'.repeat(review.rating)}
                    </p>
                    <p className="mt-2 text-text-secondary">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {user ? (
              <div className="grid gap-3 rounded-card border border-border bg-background-primary p-4">
                <div className="grid gap-2">
                  <label className="text-sm text-text-secondary">Rating</label>
                  <select
                    value={rating}
                    onChange={(event) => {
                      setRating(Number(event.target.value));
                      setReviewError(null);
                    }}
                    className="h-11 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} stars
                      </option>
                    ))}
                  </select>
                </div>
                <label className="grid gap-2 text-sm text-text-secondary">
                  Review
                  <textarea
                    value={comment}
                    onChange={(event) => {
                      setComment(event.target.value);
                      setReviewError(null);
                    }}
                    rows={4}
                    className="rounded-input border border-border bg-background-primary px-4 py-3 text-text-primary outline-none"
                  />
                  {reviewError ? <span className="text-sm text-brand-error">{reviewError}</span> : null}
                </label>
                <Button onClick={handleSubmitReview} isLoading={isSavingReview}>
                  Submit Review
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </section>

      <section className="page-shell grid gap-6">
        <h2 className="text-3xl">Related products</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {(productQuery.data?.relatedProducts ?? []).map((relatedProduct) => (
            <ProductCard key={relatedProduct._id} product={relatedProduct} compact />
          ))}
        </div>
      </section>
    </PageTransition>
  );
};
