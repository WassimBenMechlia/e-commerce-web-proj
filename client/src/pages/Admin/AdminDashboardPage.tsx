import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PageTransition } from '@/components/common/PageTransition';
import { AdminShell } from '@/components/layout/AdminShell';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import type { AnalyticsApiResponse } from '@/types/api';

export const AdminDashboardPage = () => {
  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsApiResponse>('/admin/analytics');
      return data;
    },
  });

  const analytics = analyticsQuery.data;

  return (
    <PageTransition>
      <AdminShell>
        <div className="grid gap-6">
          <div>
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
              Admin overview
            </p>
            <h1 className="mt-2 text-4xl">Sales and inventory dashboard</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {analyticsQuery.isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 rounded-card" />
                ))
              : [
                  { label: 'Revenue', value: formatCurrency(analytics?.stats.revenue ?? 0) },
                  { label: 'Orders', value: String(analytics?.stats.totalOrders ?? 0) },
                  { label: 'Users', value: String(analytics?.stats.totalUsers ?? 0) },
                  { label: 'Products', value: String(analytics?.stats.totalProducts ?? 0) },
                ].map((item) => (
                  <Card key={item.label} className="p-5">
                    <p className="text-sm text-text-secondary">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-text-primary">
                      {item.value}
                    </p>
                  </Card>
                ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-5">
              <h2 className="text-2xl">Revenue trend</h2>
              <div className="mt-6 h-80">
                {analyticsQuery.isLoading ? (
                  <Skeleton className="h-full rounded-card" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.revenueSeries}>
                      <defs>
                        <linearGradient id="desertRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C65D3B" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#C65D3B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="_id" stroke="var(--text-secondary)" />
                      <YAxis stroke="var(--text-secondary)" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#C65D3B"
                        fill="url(#desertRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-2xl">Top products</h2>
              <div className="mt-6 h-80">
                {analyticsQuery.isLoading ? (
                  <Skeleton className="h-full rounded-card" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" />
                      <YAxis stroke="var(--text-secondary)" />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8B9D77" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-2xl">Inventory alerts</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {analytics?.inventoryAlerts.map((item) => (
                <div key={item._id} className="rounded-card bg-background-primary p-4">
                  <p className="font-medium text-text-primary">{item.name}</p>
                  <p className="text-sm text-text-secondary">{item.sku}</p>
                  <p className="mt-2 text-sm text-brand-warning">{item.stock} left in stock</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </AdminShell>
    </PageTransition>
  );
};
