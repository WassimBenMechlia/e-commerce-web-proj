import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { PageTransition } from '@/components/common/PageTransition';
import { AdminShell } from '@/components/layout/AdminShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { formatDate, getErrorMessage } from '@/lib/utils';
import type { User } from '@/types';

export const AdminUsersPage = () => {
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get<{ users: User[] }>('/admin/users');
      return data.users;
    },
  });

  const toggleBanState = async (user: User) => {
    try {
      await api.patch(`/admin/users/${user.id}/ban`, {
        isBanned: !user.isBanned,
      });
      toast.success('User status updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <PageTransition>
      <AdminShell>
        <div className="grid gap-6">
          <div>
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
              Customer access
            </p>
            <h1 className="mt-2 text-4xl">User management and moderation</h1>
          </div>

          <div className="grid gap-4">
            {usersQuery.data?.map((user) => (
              <Card key={user.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-text-primary">{user.name}</p>
                    <Badge className="bg-background-primary text-text-primary">
                      {user.role}
                    </Badge>
                    {user.isVerified ? (
                      <Badge className="bg-brand-accent/10 text-brand-accent">
                        Verified
                      </Badge>
                    ) : null}
                    {user.isBanned ? (
                      <Badge className="bg-brand-error/10 text-brand-error">Banned</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-text-secondary">{user.email}</p>
                  <p className="text-sm text-text-secondary">
                    Joined {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Button
                    variant={user.isBanned ? 'secondary' : 'danger'}
                    onClick={() => toggleBanState(user)}
                  >
                    {user.isBanned ? 'Restore Access' : 'Ban User'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </AdminShell>
    </PageTransition>
  );
};
