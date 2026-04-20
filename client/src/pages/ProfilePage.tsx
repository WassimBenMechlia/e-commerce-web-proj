import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock3,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/axios';
import {
  formatCurrency,
  formatDate,
  getErrorMessage,
  getStatusClasses,
} from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Address, OrderStatus, PaymentStatus } from '@/types';
import type { AuthResponse, OrdersResponse } from '@/types/api';

type ProfileSection = 'overview' | 'orders' | 'addresses' | 'security';
type OrderStatusFilter = 'all' | OrderStatus;
type PaymentStatusFilter = 'all' | PaymentStatus;

interface PasswordResetResponse {
  message: string;
  resetUrl?: string;
}

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read image file.'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };

    reader.readAsDataURL(file);
  });

const emptyAddress: Address = {
  label: 'Home',
  fullName: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
  isDefault: false,
};

const sectionItems: Array<{
  key: ProfileSection;
  title: string;
  description: string;
}> = [
  {
    key: 'overview',
    title: 'Overview',
    description: 'Account summary, profile, and quick actions.',
  },
  {
    key: 'orders',
    title: 'Orders',
    description: 'Track purchases, payments, and delivery progress.',
  },
  {
    key: 'addresses',
    title: 'Addresses',
    description: 'Manage shipping details and default destination.',
  },
  {
    key: 'security',
    title: 'Security',
    description: 'Verification and password reset actions.',
  },
];

const orderStatusFilters: Array<{ value: OrderStatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

const paymentStatusFilters: Array<{ value: PaymentStatusFilter; label: string }> = [
  { value: 'all', label: 'All payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const sanitizeAddress = (address: Address): Address => ({
  label: address.label.trim(),
  fullName: address.fullName.trim(),
  line1: address.line1.trim(),
  line2: address.line2?.trim() ? address.line2.trim() : undefined,
  city: address.city.trim(),
  state: address.state.trim(),
  postalCode: address.postalCode.trim(),
  country: address.country.trim(),
  phone: address.phone.trim(),
  isDefault: Boolean(address.isDefault),
});

const isAddressValid = (address: Address) =>
  Boolean(
    address.label.trim() &&
      address.fullName.trim() &&
      address.line1.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      address.postalCode.trim() &&
      address.country.trim() &&
      address.phone.trim().length >= 6,
  );

const StatCard = ({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) => (
  <Card className="grid gap-3 p-5">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-text-secondary">{title}</p>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background-primary text-text-secondary">
        {icon}
      </div>
    </div>
    <p className="text-2xl text-text-primary">{value}</p>
    <p className="text-sm text-text-secondary">{helper}</p>
  </Card>
);

export const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [activeSection, setActiveSection] = useState<ProfileSection>('overview');
  const [name, setName] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar?.url ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressDraft, setAddressDraft] = useState<Address>(emptyAddress);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] =
    useState<OrderStatusFilter>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>('all');
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);
  const [passwordResetLink, setPasswordResetLink] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (avatarPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    },
    [avatarPreviewUrl],
  );

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatar?.url ?? '');
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current);
        }

        return null;
      });
    }
  }, [user]);

  const ordersQuery = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get<OrdersResponse>('/orders/my-orders');
      return data.orders;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (ordersQuery.error) {
      toast.error(getErrorMessage(ordersQuery.error));
    }
  }, [ordersQuery.error]);

  const sortedOrders = useMemo(
    () =>
      [...(ordersQuery.data ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [ordersQuery.data],
  );

  const defaultAddress = useMemo(
    () =>
      user?.addresses.find((address) => address.isDefault) ??
      user?.addresses[0] ??
      null,
    [user],
  );

  const totalSpent = useMemo(
    () => sortedOrders.reduce((total, order) => total + order.totalAmount, 0),
    [sortedOrders],
  );

  const activeOrdersCount = useMemo(
    () =>
      sortedOrders.filter(
        (order) =>
          order.status === 'pending' ||
          order.status === 'processing' ||
          order.status === 'shipped',
      ).length,
    [sortedOrders],
  );

  const paidOrdersCount = useMemo(
    () => sortedOrders.filter((order) => order.paymentStatus === 'paid').length,
    [sortedOrders],
  );

  const profileCompletion = useMemo(() => {
    const completed = [
      Boolean(user?.avatar?.url),
      Boolean(user?.addresses.length),
      Boolean(user?.isVerified),
      sortedOrders.length > 0,
    ].filter(Boolean).length;

    return Math.round((completed / 4) * 100);
  }, [sortedOrders.length, user]);

  const filteredOrders = useMemo(
    () =>
      sortedOrders.filter((order) => {
        const statusMatches =
          orderStatusFilter === 'all' || order.status === orderStatusFilter;
        const paymentMatches =
          paymentStatusFilter === 'all' ||
          order.paymentStatus === paymentStatusFilter;

        const searchValue = orderSearch.trim().toLowerCase();
        const searchMatches =
          searchValue.length === 0 ||
          order.orderNumber.toLowerCase().includes(searchValue) ||
          order.items.some((item) => item.name.toLowerCase().includes(searchValue));

        return statusMatches && paymentMatches && searchMatches;
      }),
    [orderSearch, orderStatusFilter, paymentStatusFilter, sortedOrders],
  );

  const recentOrders = useMemo(() => sortedOrders.slice(0, 3), [sortedOrders]);

  const memberSince = user ? formatDate(user.createdAt) : '';

  const displayAvatarUrl =
    avatarPreviewUrl ?? (avatarUrl.trim() || user?.avatar?.url || '');

  const openAddressModal = (address?: Address) => {
    setEditingAddress(address ?? null);
    setAddressDraft(
      address
        ? { ...address }
        : { ...emptyAddress, isDefault: (user?.addresses.length ?? 0) === 0 },
    );
    setIsAddressModalOpen(true);
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error('Please choose an image smaller than 5MB.');
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setSelectedAvatarFile(file);
    setAvatarPreviewUrl((current) => {
      if (current?.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }

      return nextPreviewUrl;
    });

    event.currentTarget.value = '';
  };

  const handleResetAvatarSelection = () => {
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl((current) => {
      if (current?.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }

      return null;
    });
    setAvatarUrl(user?.avatar?.url ?? '');
  };

  const uploadAvatarIfNeeded = async () => {
    if (!selectedAvatarFile) {
      return avatarUrl.trim() ? { url: avatarUrl.trim() } : undefined;
    }

    const formData = new FormData();
    formData.append('image', selectedAvatarFile);

    try {
      const { data } = await api.post<{ image: { url: string; publicId?: string } }>(
        '/uploads/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      return data.image;
    } catch (error) {
      const message = getErrorMessage(error);

      if (message.includes('Cloudinary is not configured')) {
        const dataUrl = await fileToDataUrl(selectedAvatarFile);
        toast.success('Cloudinary is not configured, avatar saved locally.');
        return {
          url: dataUrl,
        };
      }

      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const avatar = await uploadAvatarIfNeeded();
      const { data } = await api.put<AuthResponse>('/users/me', {
        name: name.trim(),
        avatar,
      });
      setUser(data.user);
      setAvatarUrl(data.user.avatar?.url ?? '');
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current);
        }

        return null;
      });
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = async () => {
    const payload = sanitizeAddress(addressDraft);

    if (!isAddressValid(payload)) {
      toast.error('Please complete every required address field.');
      return;
    }

    setIsSavingAddress(true);

    try {
      const { data } = editingAddress?._id
        ? await api.put<AuthResponse>(
            `/users/me/addresses/${editingAddress._id}`,
            payload,
          )
        : await api.post<AuthResponse>('/users/me/addresses', payload);
      setUser(data.user);
      setIsAddressModalOpen(false);
      toast.success('Address saved.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (address: Address) => {
    if (!address._id || address.isDefault) {
      return;
    }

    try {
      const { data } = await api.put<AuthResponse>(
        `/users/me/addresses/${address._id}`,
        sanitizeAddress({ ...address, isDefault: true }),
      );
      setUser(data.user);
      toast.success('Default address updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteAddress = async (addressId?: string) => {
    if (!addressId) {
      return;
    }

    try {
      const { data } = await api.delete<AuthResponse>(`/users/me/addresses/${addressId}`);
      setUser(data.user);
      toast.success('Address removed.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSendPasswordResetLink = async () => {
    if (!user) {
      return;
    }

    setIsSendingResetLink(true);

    try {
      const { data } = await api.post<PasswordResetResponse>('/auth/forgot-password', {
        email: user.email,
      });
      setPasswordResetLink(data.resetUrl ?? null);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSendingResetLink(false);
    }
  };

  const handleCopyResetLink = async () => {
    if (!passwordResetLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(passwordResetLink);
      toast.success('Reset link copied.');
    } catch {
      toast.error('Unable to copy the reset link.');
    }
  };

  const resetOrderFilters = () => {
    setOrderSearch('');
    setOrderStatusFilter('all');
    setPaymentStatusFilter('all');
  };

  if (!user) {
    return null;
  }

  return (
    <PageTransition>
      <section className="page-shell grid gap-8">
        <Card className="grid gap-6 p-6 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center gap-4">
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt={user.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background-primary text-text-secondary">
                <User className="h-10 w-10" />
              </div>
            )}
            <div>
              <p className="text-sm text-text-secondary">Member since {memberSince}</p>
              <h1 className="text-3xl">{user.name}</h1>
              <p className="text-text-secondary">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-card border border-border bg-background-primary p-4">
              <p className="text-sm text-text-secondary">Profile completeness</p>
              <p className="mt-1 text-2xl">{profileCompletion}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-background-tertiary">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
            <div className="rounded-card border border-border bg-background-primary p-4">
              <p className="text-sm text-text-secondary">Account status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className="bg-background-secondary text-text-primary">
                  {user.role}
                </Badge>
                <Badge
                  className={
                    user.isVerified
                      ? 'bg-brand-accent/15 text-brand-accent'
                      : 'bg-brand-warning/15 text-brand-warning'
                  }
                >
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
            <Button variant="secondary" onClick={() => navigate('/cart')}>
              View Cart
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={String(sortedOrders.length)}
            helper="Complete purchase history"
            icon={<ShoppingBag className="h-4 w-4" />}
          />
          <StatCard
            title="Total Spent"
            value={formatCurrency(totalSpent)}
            helper="Lifetime gross spend"
            icon={<CreditCard className="h-4 w-4" />}
          />
          <StatCard
            title="Active Orders"
            value={String(activeOrdersCount)}
            helper="Pending, processing, or shipped"
            icon={<Clock3 className="h-4 w-4" />}
          />
          <StatCard
            title="Paid Orders"
            value={String(paidOrdersCount)}
            helper="Orders with confirmed payment"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </div>

        <Card className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
          {sectionItems.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`rounded-card border px-4 py-3 text-left transition ${
                activeSection === item.key
                  ? 'border-brand-primary bg-brand-primary/10'
                  : 'border-border bg-background-primary hover:bg-background-secondary'
              }`}
            >
              <p className="font-medium text-text-primary">{item.title}</p>
              <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
            </button>
          ))}
        </Card>

        {activeSection === 'overview' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="grid gap-5 p-6">
              <div>
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
                  Profile
                </p>
                <h2 className="mt-2 text-3xl">Personal details</h2>
              </div>
              <div className="grid gap-4">
                <Input
                  label="Full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <Input label="Email" value={user.email} disabled />
                <Input
                  label="Avatar URL"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                />
                <div className="grid gap-3 rounded-card border border-border bg-background-primary p-4">
                  <p className="text-sm font-medium text-text-primary">Avatar image</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-button bg-background-secondary px-4 text-sm font-medium text-text-primary transition hover:bg-background-tertiary">
                      Select From Device
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                    </label>
                    {selectedAvatarFile ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResetAvatarSelection}
                      >
                        Cancel Selected File
                      </Button>
                    ) : null}
                  </div>
                  {selectedAvatarFile ? (
                    <p className="text-xs text-text-secondary">
                      Selected file: {selectedAvatarFile.name}
                    </p>
                  ) : null}
                  <p className="text-xs text-text-secondary">
                    Use JPG, PNG, or WEBP up to 5MB.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} isLoading={isSavingProfile}>
                  Save Profile
                </Button>
              </div>
            </Card>

            <div className="grid gap-6">
              <Card className="grid gap-4 p-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-2xl">Default shipping address</h3>
                </div>
                {defaultAddress ? (
                  <div className="rounded-card border border-border bg-background-primary p-4 text-sm text-text-secondary">
                    <p className="font-medium text-text-primary">{defaultAddress.label}</p>
                    <p>{defaultAddress.fullName}</p>
                    <p>{defaultAddress.line1}</p>
                    <p>
                      {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
                    </p>
                    <p>{defaultAddress.country}</p>
                    <p className="mt-1">{defaultAddress.phone}</p>
                  </div>
                ) : (
                  <EmptyState
                    eyebrow="Address book"
                    title="No shipping address yet"
                    description="Add your default shipping address to speed up checkout."
                    actionLabel="Add Address"
                    onAction={() => {
                      setActiveSection('addresses');
                      openAddressModal();
                    }}
                  />
                )}
              </Card>

              <Card className="grid gap-4 p-6">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-2xl">Recent orders</h3>
                </div>

                {ordersQuery.isLoading ? (
                  <div className="grid gap-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : recentOrders.length ? (
                  <div className="grid gap-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order._id}
                        className="rounded-card border border-border bg-background-primary p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-text-primary">{order.orderNumber}</p>
                          <p className="text-sm text-text-secondary">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge className={getStatusClasses(order.status)}>
                            {order.status}
                          </Badge>
                          <Badge className={getStatusClasses(order.paymentStatus)}>
                            {order.paymentStatus}
                          </Badge>
                          <span className="text-sm text-text-secondary">
                            {order.items.length} items
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    eyebrow="Orders"
                    title="No orders yet"
                    description="Your purchases will appear here after checkout."
                    actionLabel="Shop now"
                    onAction={() => navigate('/shop')}
                  />
                )}
              </Card>
            </div>
          </div>
        ) : null}

        {activeSection === 'orders' ? (
          <Card className="grid gap-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
                  Orders
                </p>
                <h2 className="mt-2 text-3xl">Order center</h2>
                <p className="text-text-secondary">
                  Filter by fulfillment, payment, or search by order number.
                </p>
              </div>
              <Button variant="secondary" onClick={resetOrderFilters}>
                Reset filters
              </Button>
            </div>

            <div className="grid gap-4">
              <Input
                label="Search orders"
                placeholder="Order number or item name"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <p className="text-sm font-medium text-text-primary">Order status</p>
                  <div className="flex flex-wrap gap-2">
                    {orderStatusFilters.map((status) => (
                      <button
                        type="button"
                        key={status.value}
                        onClick={() => setOrderStatusFilter(status.value)}
                        className={`rounded-full px-3 py-1 text-xs transition ${
                          orderStatusFilter === status.value
                            ? 'bg-brand-primary text-white'
                            : 'bg-background-primary text-text-secondary hover:bg-background-tertiary'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-medium text-text-primary">Payment status</p>
                  <div className="flex flex-wrap gap-2">
                    {paymentStatusFilters.map((status) => (
                      <button
                        type="button"
                        key={status.value}
                        onClick={() => setPaymentStatusFilter(status.value)}
                        className={`rounded-full px-3 py-1 text-xs transition ${
                          paymentStatusFilter === status.value
                            ? 'bg-brand-primary text-white'
                            : 'bg-background-primary text-text-secondary hover:bg-background-tertiary'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {ordersQuery.isLoading ? (
              <div className="grid gap-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : filteredOrders.length ? (
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order._id}
                    className="grid gap-4 rounded-card border border-border bg-background-primary p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">{order.orderNumber}</p>
                        <p className="text-sm text-text-secondary">
                          {formatDate(order.createdAt)} - {order.items.length} items
                        </p>
                      </div>
                      <p className="text-lg text-text-primary">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusClasses(order.status)}>{order.status}</Badge>
                      <Badge className={getStatusClasses(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </div>

                    <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
                      <p>
                        Shipping to {order.shippingAddress.city}, {order.shippingAddress.country}
                      </p>
                      <p>
                        Items: {order.items.slice(0, 2).map((item) => item.name).join(', ')}
                        {order.items.length > 2 ? ' ...' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                eyebrow="Orders"
                title="No matching orders"
                description="Try changing your filters or search term to find an order."
                actionLabel="Clear filters"
                onAction={resetOrderFilters}
              />
            )}
          </Card>
        ) : null}

        {activeSection === 'addresses' ? (
          <Card className="grid gap-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
                  Addresses
                </p>
                <h2 className="mt-2 text-3xl">Address book</h2>
                <p className="text-text-secondary">
                  Save multiple delivery addresses and set one default destination.
                </p>
              </div>
              <Button variant="secondary" onClick={() => openAddressModal()}>
                Add Address
              </Button>
            </div>

            {user.addresses.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {user.addresses.map((address) => (
                  <div
                    key={address._id ?? `${address.label}-${address.line1}`}
                    className="rounded-card border border-border bg-background-primary p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-text-primary">{address.label}</p>
                      {address.isDefault ? (
                        <Badge className="bg-brand-accent/10 text-brand-accent">
                          Default
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{address.fullName}</p>
                    <p className="text-sm text-text-secondary">{address.line1}</p>
                    {address.line2 ? (
                      <p className="text-sm text-text-secondary">{address.line2}</p>
                    ) : null}
                    <p className="text-sm text-text-secondary">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-sm text-text-secondary">{address.country}</p>
                    <p className="text-sm text-text-secondary">{address.phone}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openAddressModal(address)}
                      >
                        Edit
                      </Button>
                      {!address.isDefault ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefaultAddress(address)}
                        >
                          Set as default
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                eyebrow="Address book"
                title="No saved addresses"
                description="Add your first shipping address so checkout can be completed faster."
                actionLabel="Add address"
                onAction={() => openAddressModal()}
              />
            )}
          </Card>
        ) : null}

        {activeSection === 'security' ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="grid gap-5 p-6">
              <div>
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
                  Security
                </p>
                <h2 className="mt-2 text-3xl">Account protection</h2>
              </div>

              <div className="grid gap-3 rounded-card border border-border bg-background-primary p-4 text-sm text-text-secondary">
                <p>
                  <span className="font-medium text-text-primary">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-medium text-text-primary">Verification:</span>{' '}
                  {user.isVerified ? 'Verified' : 'Pending verification'}
                </p>
                <p>
                  <span className="font-medium text-text-primary">Role:</span> {user.role}
                </p>
                <p>
                  <span className="font-medium text-text-primary">Saved addresses:</span>{' '}
                  {user.addresses.length}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSendPasswordResetLink}
                  isLoading={isSendingResetLink}
                >
                  Send Password Reset Link
                </Button>
                <Button variant="secondary" onClick={() => navigate('/forgot-password')}>
                  Open Reset Form
                </Button>
              </div>
            </Card>

            <Card className="grid gap-5 p-6">
              <h3 className="text-2xl">Password reset delivery</h3>
              <p className="text-text-secondary">
                In local development, the API may return a direct reset URL so you can
                test end-to-end account recovery without SMTP.
              </p>

              {passwordResetLink ? (
                <div className="grid gap-3 rounded-card border border-border bg-background-primary p-4">
                  <p className="text-sm text-text-secondary">Generated reset URL</p>
                  <p className="break-all text-sm text-text-primary">{passwordResetLink}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCopyResetLink}>
                      Copy link
                    </Button>
                    <a
                      href={passwordResetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-button bg-background-secondary px-4 text-sm font-medium text-text-primary hover:bg-background-tertiary"
                    >
                      Open link
                    </a>
                  </div>
                </div>
              ) : (
                <EmptyState
                  eyebrow="Password reset"
                  title="No reset link generated"
                  description="Use the action on the left to request a reset link for this account."
                />
              )}
            </Card>
          </div>
        ) : null}

        <Card className="grid gap-5 p-6">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-brand-primary" />
            <h2 className="text-2xl">Shopping insights</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-card border border-border bg-background-primary p-4">
              <p className="text-sm text-text-secondary">Most recent order</p>
              <p className="mt-1 font-medium text-text-primary">
                {sortedOrders[0]?.orderNumber ?? 'No orders yet'}
              </p>
            </div>
            <div className="rounded-card border border-border bg-background-primary p-4">
              <p className="text-sm text-text-secondary">Preferred destination</p>
              <p className="mt-1 font-medium text-text-primary">
                {defaultAddress
                  ? `${defaultAddress.city}, ${defaultAddress.country}`
                  : 'No address saved'}
              </p>
            </div>
            <div className="rounded-card border border-border bg-background-primary p-4">
              <p className="text-sm text-text-secondary">Delivery in progress</p>
              <p className="mt-1 font-medium text-text-primary">
                {activeOrdersCount > 0
                  ? `${activeOrdersCount} active shipment(s)`
                  : 'Nothing in transit'}
              </p>
            </div>
          </div>
          </Card>
      </section>

      <Modal
        open={isAddressModalOpen}
        title={editingAddress ? 'Edit address' : 'Add address'}
        onClose={() => setIsAddressModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Label"
            value={addressDraft.label}
            onChange={(event) =>
              setAddressDraft((current) => ({ ...current, label: event.target.value }))
            }
          />
          <Input
            label="Full Name"
            value={addressDraft.fullName}
            onChange={(event) =>
              setAddressDraft((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
          />
          <Input
            label="Line 1"
            value={addressDraft.line1}
            onChange={(event) =>
              setAddressDraft((current) => ({ ...current, line1: event.target.value }))
            }
          />
          <Input
            label="Line 2"
            value={addressDraft.line2 ?? ''}
            onChange={(event) =>
              setAddressDraft((current) => ({ ...current, line2: event.target.value }))
            }
          />
          <Input
            label="City"
            value={addressDraft.city}
            onChange={(event) =>
              setAddressDraft((current) => ({ ...current, city: event.target.value }))
            }
          />
          <Input
            label="State"
            value={addressDraft.state}
            onChange={(event) =>
              setAddressDraft((current) => ({ ...current, state: event.target.value }))
            }
          />
          <Input
            label="Postal Code"
            value={addressDraft.postalCode}
            onChange={(event) =>
              setAddressDraft((current) => ({
                ...current,
                postalCode: event.target.value,
              }))
            }
          />
          <Input
            label="Country"
            value={addressDraft.country}
            onChange={(event) =>
              setAddressDraft((current) => ({ ...current, country: event.target.value }))
            }
          />
          <Input
            label="Phone"
            value={addressDraft.phone}
            onChange={(event) =>
              setAddressDraft((current) => ({ ...current, phone: event.target.value }))
            }
          />
          <label className="flex items-center gap-3 text-sm text-text-primary md:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(addressDraft.isDefault)}
              onChange={(event) =>
                setAddressDraft((current) => ({
                  ...current,
                  isDefault: event.target.checked,
                }))
              }
            />
            Make this my default delivery address
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsAddressModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAddress} isLoading={isSavingAddress}>
            Save Address
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
};
