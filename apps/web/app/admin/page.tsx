'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/api';
import { usePrice } from '@/lib/hooks';
import { deliveryLabel } from '@/lib/labels';

interface Dash {
  salesToday: number;
  ordersToday: number;
  salesMonth: number;
  ordersMonth: number;
  ordersByStatus: Record<string, number>;
  newCustomers: number;
  monthlySales: { month: string; total: number }[];
  topProducts: { id: number; name: string; numOfSale: number }[];
  lowStock: { id: number; name: string; currentStock: number }[];
}

const COLORS = ['#E62E04', '#FFA707', '#0ABB75', '#4A4A5A', '#EF486A', '#8A8A9A'];

export default function Dashboard() {
  const fmt = usePrice();
  const { data, error, isLoading } = useQuery({ queryKey: ['dash'], queryFn: () => api<Dash>('/admin/dashboard') });

  if (isLoading) return <div className="ae-card h-40 animate-pulse" />;
  if (error || !data) return <p className="ae-card p-6 text-danger">คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ด</p>;

  const kpi = [
    ['ยอดขายวันนี้', fmt(data.salesToday)],
    ['ออเดอร์วันนี้', String(data.ordersToday)],
    ['ยอดขายเดือนนี้', fmt(data.salesMonth)],
    ['ลูกค้าใหม่', String(data.newCustomers)],
  ];
  const pie = Object.entries(data.ordersByStatus).map(([name, value]) => ({ name: deliveryLabel(name), value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi.map(([label, v]) => (
          <div key={label} className="ae-card p-4"><p className="text-ink-muted">{label}</p><p className="mt-1 text-2xl font-bold text-ink">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="ae-card p-4">
          <h2 className="ae-h mb-2">ยอดขาย — 12 เดือนล่าสุด</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total" fill="#E62E04" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="ae-card p-4">
          <h2 className="ae-h mb-2">ออเดอร์แยกตามสถานะ</h2>
          {pie.length === 0 ? <p className="text-ink-muted">ยังไม่มีออเดอร์</p> : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} label>
                    {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="ae-card p-4">
          <h2 className="ae-h mb-2">สินค้าขายดี</h2>
          <ol className="list-decimal space-y-1 pl-5">{data.topProducts.map((p) => <li key={p.id}>{p.name} <span className="text-ink-muted">(ขายแล้ว {p.numOfSale} ชิ้น)</span></li>)}</ol>
        </section>
        <section className="ae-card p-4">
          <h2 className="ae-h mb-2">สินค้าใกล้หมด</h2>
          {data.lowStock.length === 0 ? <p className="text-ink-muted">สต็อกสินค้ายังเพียงพอทุกรายการ</p> : (
            <ul className="space-y-1">{data.lowStock.map((p) => <li key={p.id} className="flex justify-between"><span>{p.name}</span><span className="font-bold text-danger">{p.currentStock}</span></li>)}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
