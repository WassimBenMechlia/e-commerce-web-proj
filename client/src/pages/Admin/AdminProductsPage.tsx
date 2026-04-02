import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { PageTransition } from '@/components/common/PageTransition';
import { AdminShell } from '@/components/layout/AdminShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import type { Category, Product } from '@/types';
import type { CategoriesResponse, ProductsResponse } from '@/types/api';

interface ProductDraft {
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  category: string;
  stock: string;
  sku: string;
  tags: string;
  ecoBadge: string;
  isActive: boolean;
  imageUrl: string;
  imageAlt: string;
}

const emptyDraft: ProductDraft = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  category: '',
  stock: '',
  sku: '',
  tags: '',
  ecoBadge: '',
  isActive: true,
  imageUrl: '',
  imageAlt: '',
};

export const AdminProductsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<CategoriesResponse>('/categories');
      return data.categories;
    },
  });

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await api.get<ProductsResponse>('/products?limit=50&sort=newest');
      return data.products;
    },
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setDraft({
      ...emptyDraft,
      category: categories[0]?._id ?? '',
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setDraft({
      name: product.name,
      description: product.description,
      price: String(product.price),
      compareAtPrice: String(product.compareAtPrice ?? ''),
      category: product.category._id,
      stock: String(product.stock),
      sku: product.sku,
      tags: product.tags.join(', '),
      ecoBadge: product.ecoBadge ?? '',
      isActive: product.isActive,
      imageUrl: product.images[0]?.url ?? '',
      imageAlt: product.images[0]?.alt ?? '',
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const uploadImageIfNeeded = async () => {
    if (!selectedFile) {
      return {
        url: draft.imageUrl,
        alt: draft.imageAlt,
      };
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    const { data } = await api.post<{ image: { url: string; publicId?: string } }>(
      '/uploads/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return {
      ...data.image,
      alt: draft.imageAlt,
    };
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const image = await uploadImageIfNeeded();
      const payload = {
        name: draft.name,
        description: draft.description,
        price: Number(draft.price),
        compareAtPrice: draft.compareAtPrice
          ? Number(draft.compareAtPrice)
          : undefined,
        images: [image],
        category: draft.category,
        stock: Number(draft.stock),
        sku: draft.sku,
        tags: draft.tags
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        ecoBadge: draft.ecoBadge || undefined,
        isActive: draft.isActive,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      toast.success(editingProduct ? 'Product updated.' : 'Product created.');
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      await queryClient.invalidateQueries({ queryKey: ['home-products'] });
      await queryClient.invalidateQueries({ queryKey: ['shop-products'] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product removed.');
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <PageTransition>
      <AdminShell>
        <div className="grid gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
                Product editor
              </p>
              <h1 className="mt-2 text-4xl">Catalog CRUD and media management</h1>
            </div>
            <Button onClick={openCreateModal}>Add Product</Button>
          </div>

          <div className="grid gap-4">
            {productsQuery.data?.map((product) => (
              <Card key={product._id} className="grid gap-4 p-5 md:grid-cols-[120px_1fr_auto]">
                <img
                  src={product.images[0]?.url}
                  alt={product.name}
                  className="h-28 w-full rounded-card object-cover"
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-text-primary">{product.name}</p>
                    {product.ecoBadge ? (
                      <Badge className="bg-brand-accent/10 text-brand-accent">
                        {product.ecoBadge}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-text-secondary">{product.category.name}</p>
                  <p className="text-sm text-text-secondary">
                    {formatCurrency(product.price)} • {product.stock} in stock
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <Button variant="secondary" onClick={() => openEditModal(product)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(product._id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </AdminShell>

      <Modal
        open={isModalOpen}
        title={editingProduct ? 'Edit product' : 'Create product'}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Product name"
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
          />
          <Input
            label="SKU"
            value={draft.sku}
            onChange={(event) =>
              setDraft((current) => ({ ...current, sku: event.target.value }))
            }
          />
          <label className="grid gap-2 text-sm text-text-secondary md:col-span-2">
            Description
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              className="rounded-input border border-border bg-background-primary px-4 py-3 text-text-primary outline-none"
            />
          </label>
          <Input
            label="Price"
            type="number"
            value={draft.price}
            onChange={(event) =>
              setDraft((current) => ({ ...current, price: event.target.value }))
            }
          />
          <Input
            label="Compare-at price"
            type="number"
            value={draft.compareAtPrice}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                compareAtPrice: event.target.value,
              }))
            }
          />
          <label className="grid gap-2 text-sm text-text-secondary">
            Category
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({ ...current, category: event.target.value }))
              }
              className="h-12 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none"
            >
              {categories.map((category: Category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Stock"
            type="number"
            value={draft.stock}
            onChange={(event) =>
              setDraft((current) => ({ ...current, stock: event.target.value }))
            }
          />
          <Input
            label="Image URL"
            value={draft.imageUrl}
            onChange={(event) =>
              setDraft((current) => ({ ...current, imageUrl: event.target.value }))
            }
          />
          <Input
            label="Image alt"
            value={draft.imageAlt}
            onChange={(event) =>
              setDraft((current) => ({ ...current, imageAlt: event.target.value }))
            }
          />
          <label className="grid gap-2 text-sm text-text-secondary">
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="h-12 rounded-input border border-border bg-background-primary px-4 py-3 text-text-primary outline-none"
            />
          </label>
          <Input
            label="Tags"
            value={draft.tags}
            onChange={(event) =>
              setDraft((current) => ({ ...current, tags: event.target.value }))
            }
            placeholder="botanical, bestseller"
          />
          <Input
            label="Eco badge"
            value={draft.ecoBadge}
            onChange={(event) =>
              setDraft((current) => ({ ...current, ecoBadge: event.target.value }))
            }
          />
          <label className="flex items-center gap-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) =>
                setDraft((current) => ({ ...current, isActive: event.target.checked }))
              }
            />
            Product is active
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Product
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
};
