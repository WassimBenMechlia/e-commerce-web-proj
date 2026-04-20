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
import { productDraftSchema } from '@/validation/forms';
import type { ProductDraftFormValues } from '@/validation/forms';

type ProductDraft = ProductDraftFormValues;
type ProductDraftErrors = Partial<Record<keyof ProductDraftFormValues, string>>;

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
  const [errors, setErrors] = useState<ProductDraftErrors>({});

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
    setErrors({});
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
    setErrors({});
    setIsModalOpen(true);
  };

  const updateDraftField = <K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const uploadImageIfNeeded = async (parsedDraft: ProductDraft) => {
    if (!selectedFile) {
      return {
        url: parsedDraft.imageUrl ?? '',
        alt: parsedDraft.imageAlt,
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
      alt: parsedDraft.imageAlt,
    };
  };

  const handleSave = async () => {
    setIsSaving(true);

    const parsedDraft = productDraftSchema.safeParse(draft);

    if (!parsedDraft.success) {
      const fieldErrors = parsedDraft.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        description: fieldErrors.description?.[0],
        price: fieldErrors.price?.[0],
        compareAtPrice: fieldErrors.compareAtPrice?.[0],
        category: fieldErrors.category?.[0],
        stock: fieldErrors.stock?.[0],
        sku: fieldErrors.sku?.[0],
        tags: fieldErrors.tags?.[0],
        ecoBadge: fieldErrors.ecoBadge?.[0],
        imageUrl: fieldErrors.imageUrl?.[0],
        imageAlt: fieldErrors.imageAlt?.[0],
      });
      toast.error(parsedDraft.error.issues[0]?.message ?? 'Enter valid product details.');
      setIsSaving(false);
      return;
    }

    if (!selectedFile && !parsedDraft.data.imageUrl) {
      setErrors((current) => ({
        ...current,
        imageUrl: 'Add an image URL or upload an image.',
      }));
      toast.error('Add an image URL or upload an image.');
      setIsSaving(false);
      return;
    }

    setErrors({});

    try {
      const image = await uploadImageIfNeeded(parsedDraft.data);
      const payload = {
        name: parsedDraft.data.name,
        description: parsedDraft.data.description,
        price: Number(parsedDraft.data.price),
        compareAtPrice: parsedDraft.data.compareAtPrice
          ? Number(parsedDraft.data.compareAtPrice)
          : undefined,
        images: [image],
        category: parsedDraft.data.category,
        stock: Number(parsedDraft.data.stock),
        sku: parsedDraft.data.sku,
        tags: (parsedDraft.data.tags ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        ecoBadge: parsedDraft.data.ecoBadge,
        isActive: parsedDraft.data.isActive,
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
            error={errors.name}
            onChange={(event) => updateDraftField('name', event.target.value)}
          />
          <Input
            label="SKU"
            value={draft.sku}
            error={errors.sku}
            onChange={(event) => updateDraftField('sku', event.target.value)}
          />
          <label className="grid gap-2 text-sm text-text-secondary md:col-span-2">
            Description
            <textarea
              value={draft.description}
              onChange={(event) => updateDraftField('description', event.target.value)}
              rows={4}
              className="rounded-input border border-border bg-background-primary px-4 py-3 text-text-primary outline-none"
            />
            {errors.description ? <span className="text-sm text-brand-error">{errors.description}</span> : null}
          </label>
          <Input
            label="Price"
            type="number"
            value={draft.price}
            error={errors.price}
            onChange={(event) => updateDraftField('price', event.target.value)}
          />
          <Input
            label="Compare-at price"
            type="number"
            value={draft.compareAtPrice}
            error={errors.compareAtPrice}
            onChange={(event) => updateDraftField('compareAtPrice', event.target.value)}
          />
          <label className="grid gap-2 text-sm text-text-secondary">
            Category
            <select
              value={draft.category}
              onChange={(event) => updateDraftField('category', event.target.value)}
              className="h-12 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none"
            >
              {categories.map((category: Category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category ? <span className="text-sm text-brand-error">{errors.category}</span> : null}
          </label>
          <Input
            label="Stock"
            type="number"
            value={draft.stock}
            error={errors.stock}
            onChange={(event) => updateDraftField('stock', event.target.value)}
          />
          <Input
            label="Image URL"
            value={draft.imageUrl}
            error={errors.imageUrl}
            onChange={(event) => updateDraftField('imageUrl', event.target.value)}
          />
          <Input
            label="Image alt"
            value={draft.imageAlt}
            error={errors.imageAlt}
            onChange={(event) => updateDraftField('imageAlt', event.target.value)}
          />
          <label className="grid gap-2 text-sm text-text-secondary">
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setErrors((current) => ({ ...current, imageUrl: undefined }));
              }}
              className="h-12 rounded-input border border-border bg-background-primary px-4 py-3 text-text-primary outline-none"
            />
          </label>
          <Input
            label="Tags"
            value={draft.tags}
            error={errors.tags}
            onChange={(event) => updateDraftField('tags', event.target.value)}
            placeholder="botanical, bestseller"
          />
          <Input
            label="Eco badge"
            value={draft.ecoBadge}
            error={errors.ecoBadge}
            onChange={(event) => updateDraftField('ecoBadge', event.target.value)}
          />
          <label className="flex items-center gap-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => updateDraftField('isActive', event.target.checked)}
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
