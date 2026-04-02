import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { PageTransition } from '@/components/common/PageTransition';
import { AdminShell } from '@/components/layout/AdminShell';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { formatCurrency, formatDate, getErrorMessage, getStatusClasses } from '@/lib/utils';
import type { OrderStatus } from '@/types';
import type { OrdersResponse } from '@/types/api';

export const AdminOrdersPage = () => {
  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await api.get<OrdersResponse>('/orders');
      return data.orders;
    },
  });

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
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
              Order operations
            </p>
            <h1 className="mt-2 text-4xl">Track and update fulfillment states</h1>
          </div>

          <div className="grid gap-4">
            {ordersQuery.data?.map((order) => (
              <Card key={order._id} className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-2">
                  <p className="font-medium text-text-primary">{order.orderNumber}</p>
                  <p className="text-sm text-text-secondary">
                    {order.items.length} items • {formatDate(order.createdAt)}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <Badge className={getStatusClasses(order.status)}>{order.status}</Badge>
                  <select
                    value={order.status}
                    onChange={(event) =>
                      handleStatusChange(order._id, event.target.value as OrderStatus)
                    }
                    className="h-11 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none"
                  >
                    {['pending', 'processing', 'shipped', 'delivered'].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </AdminShell>
    </PageTransition>
  );
};
