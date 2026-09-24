'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, ApiError } from '@/lib/api';

interface Customer { id: number; name: string; email: string; banned: boolean; createdAt: string; _count: { orders: number } }

export default function AdminCustomers() {
  const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ['customers'], queryFn: () => api<Customer[]>('/admin/customers'), retry: false });
  const ban = useMutation({
    mutationFn: ({ id, banned }: { id: number; banned: boolean }) => api(`/admin/customers/${id}/ban`, { method: 'PUT', body: { banned } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'ไม่สำเร็จ'),
  });

  if (error) return <p className="ae-card p-6 text-danger">คุณไม่มีสิทธิ์จัดการลูกค้า</p>;
  return (
    <div className="space-y-3">
      <h1 className="ae-h">ลูกค้า</h1>
      <div className="ae-card overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead className="border-b border-line text-ink"><tr><th className="p-3">ชื่อ</th><th>อีเมล</th><th>คำสั่งซื้อ</th><th>สมัครเมื่อ</th><th /></tr></thead>
          <tbody>{data?.map((c) => (
            <tr key={c.id} className="border-b border-line last:border-0">
              <td className="p-3 font-semibold text-ink">{c.name}{c.banned && <span className="ml-2 rounded bg-danger/20 px-1.5 text-[11px] text-danger">ถูกระงับ</span>}</td>
              <td>{c.email}</td><td>{c._count.orders}</td><td>{c.createdAt.slice(0, 10)}</td>
              <td><button className="text-primary" onClick={() => ban.mutate({ id: c.id, banned: !c.banned })}>{c.banned ? 'ยกเลิกระงับ' : 'ระงับ'}</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
