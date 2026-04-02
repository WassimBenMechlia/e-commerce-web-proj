import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { PageTransition } from '@/components/common/PageTransition';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/axios';
import { formatCurrency, formatDate, getErrorMessage, getStatusClasses } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Address } from '@/types';
import type { AuthResponse, OrdersResponse } from '@/types/api';

const emptyAddress: Address = {
  label: 'Home',
  fullName: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
};

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [name, setName] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar?.url ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressDraft, setAddressDraft] = useState<Address>(emptyAddress);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatar?.url ?? '');
    }
  }, [user]);

  const ordersQuery = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get<OrdersResponse>('/orders/my-orders');
      return data.orders;
    },
  });

  const defaultAddress = useMemo(
    () => user?.addresses.find((address) => address.isDefault),
    [user?.addresses],
  );

  const openAddressModal = (address?: Address) => {
    setEditingAddress(address ?? null);
    setAddressDraft(address ?? emptyAddress);
    setIsAddressModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);

    try {
      const { data } = await api.put<AuthResponse>('/users/me', {
        name,
        avatar: avatarUrl ? { url: avatarUrl } : undefined,
      });
      setUser(data.user);
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const { data } = editingAddress?._id
        ? await api.put<AuthResponse>(
            `/users/me/addresses/${editingAddress._id}`,
            addressDraft,
          )
        : await api.post<AuthResponse>('/users/me/addresses', addressDraft);
      setUser(data.user);
      setIsAddressModalOpen(false);
      toast.success('Address saved.');
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

  return (
    <PageTransition>
      <section className="page-shell grid gap-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="grid gap-5 p-6">
            <div className="flex items-center gap-4">
              <img
                src={
                  user?.avatar?.url ??
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
                }
                alt={user?.name ?? 'Profile avatar'}
                className="h-20 w-20 rounded-full object-cover"
              />
              <div>
                <p className="text-sm text-text-secondary">Signed in as</p>
                <h1 className="text-3xl">{user?.name}</h1>
                <p className="text-text-secondary">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-4">
              <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input
                label="Avatar URL"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-background-primary text-text-primary">{user?.role}</Badge>
              {user?.isVerified ? (
                <Badge className="bg-brand-accent/10 text-brand-accent">Verified</Badge>
              ) : null}
            </div>
            <Button onClick={handleSaveProfile} isLoading={isSavingProfile}>
              Save Profile
            </Button>
          </Card>

          <Card className="grid gap-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
                  Addresses
                </p>
                <h2 className="mt-2 text-3xl">Shipping book</h2>
              </div>
              <Button variant="secondary" onClick={() => openAddressModal()}>
                Add Address
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {user?.addresses.map((address) => (
                <div key={`${address.label}-${address.line1}`} className="rounded-card border border-border bg-background-primary p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-text-primary">{address.label}</p>
                    {defaultAddress?.line1 === address.line1 ? (
                      <Badge className="bg-brand-accent/10 text-brand-accent">
                        Default
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{address.fullName}</p>
                  <p className="text-sm text-text-secondary">{address.line1}</p>
                  <p className="text-sm text-text-secondary">
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openAddressModal(address)}>
                      Edit
                    </Button>
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
          </Card>
        </div>

        <Card className="grid gap-5 p-6">
          <div>
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
              Orders
            </p>
            <h2 className="mt-2 text-3xl">Order history</h2>
          </div>
          <div className="grid gap-4">
            {ordersQuery.data?.map((order) => (
              <div
                key={order._id}
                className="grid gap-3 rounded-card border border-border bg-background-primary p-4 md:grid-cols-[1.2fr_0.8fr]"
              >
                <div className="space-y-2">
                  <p className="font-medium text-text-primary">{order.orderNumber}</p>
                  <p className="text-sm text-text-secondary">
                    {order.items.length} items • {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge className={getStatusClasses(order.status)}>{order.status}</Badge>
                  <p className="font-medium text-text-primary">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>
            ))}
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
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsAddressModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAddress}>Save Address</Button>
        </div>
      </Modal>
    </PageTransition>
  );
};
