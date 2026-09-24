'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Stars } from '@/components/Icons';
import { api, ApiError } from '@/lib/api';

interface Review { id: number; rating: number; comment: string; status: 'pending' | 'approved'; product: { name: string }; user: { name: string } }

export default function AdminReviews() {
  const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ['reviews'], queryFn: () => api<Review[]>('/admin/reviews'), retry: false });
  const set = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api(`/admin/reviews/${id}`, { method: 'PUT', body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
  });

  if (error) return <p className="ae-card p-6 text-danger">You do not have permission to moderate reviews.</p>;
  return (
    <div className="space-y-3">
      <h1 className="ae-h">Reviews</h1>
      {data?.length === 0 && <p className="ae-card p-6 text-center text-ink-muted">No reviews yet.</p>}
      <ul className="space-y-2">{data?.map((r) => (
        <li key={r.id} className="ae-card flex flex-wrap items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-semibold text-ink">{r.product.name} <Stars rating={r.rating} /></p>
            <p>{r.comment || <em className="text-ink-muted">No comment</em>} — <span className="text-ink-muted">{r.user.name}</span></p>
          </div>
          <span className="text-[12px] text-ink-muted">{r.status}</span>
          <button className="ae-btn-outline" onClick={() => set.mutate({ id: r.id, status: r.status === 'approved' ? 'pending' : 'approved' })}>{r.status === 'approved' ? 'Hide' : 'Approve'}</button>
        </li>
      ))}</ul>
    </div>
  );
}
