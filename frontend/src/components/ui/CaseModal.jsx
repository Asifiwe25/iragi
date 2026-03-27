// frontend/src/components/ui/CaseModal.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { X, Loader2 } from 'lucide-react';

export default function CaseModal({ onClose, onSubmit, loading, initial }) {
  const [form, setForm] = useState({
    refugee_id: '', case_type: 'medical', priority: 'medium',
    title: '', description: '', assigned_to: '', due_date: '',
    status: 'open', ...initial
  });

  const { data: refugeesData } = useQuery({
    queryKey: ['refugees-search'],
    queryFn: () => api.get('/refugees', { params: { limit: 100 } }).then(r => r.data)
  });
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get('/users').then(r => r.data).catch(() => ({ data: [] }))
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{initial ? 'Update Case' : 'Create New Case'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-4">
          <div>
            <label className="label">Refugee *</label>
            <select className="input" required value={form.refugee_id} onChange={e => set('refugee_id', e.target.value)}>
              <option value="">Select refugee…</option>
              {(refugeesData?.data || []).map(r => (
                <option key={r.id} value={r.id}>{r.first_name} {r.last_name} ({r.rid})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Case Type</label>
              <select className="input" value={form.case_type} onChange={e => set('case_type', e.target.value)}>
                {['medical','legal','psychosocial','family_tracing','resettlement','education'].map(t => (
                  <option key={t} value={t}>{t.replace('_',' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {['critical','high','medium','low'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief case title" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Assign To</label>
              <select className="input" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                <option value="">Unassigned</option>
                {(usersData?.data || []).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>
          {initial && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {['open','in_progress','pending_review','closed'].map(s => (
                  <option key={s} value={s}>{s.replace('_',' ')}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 size={16} className="animate-spin"/>}
              {initial ? 'Update Case' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
