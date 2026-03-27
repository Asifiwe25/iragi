// frontend/src/pages/CaseDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../utils/api';
import { ArrowLeft, Edit2, MessageSquare, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CaseModal from '../components/ui/CaseModal';

export default function CaseDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [editModal, setEditModal] = useState(false);

  const { data: c, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => api.get(`/cases/${id}`).then(r => r.data.data)
  });

  const noteMutation = useMutation({
    mutationFn: (content) => api.post(`/cases/${id}/notes`, { content }),
    onSuccess: () => { toast.success('Note added'); qc.invalidateQueries(['case', id]); setNote(''); },
  });

  const updateMutation = useMutation({
    mutationFn: (body) => api.put(`/cases/${id}`, body),
    onSuccess: () => { toast.success('Case updated!'); qc.invalidateQueries(['case', id]); setEditModal(false); },
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-iragi-700"/></div>;
  if (!c) return <p className="text-center py-20 text-gray-500">Case not found</p>;

  const PRIORITY_CLS = { critical:'bg-red-100 text-red-700', high:'bg-orange-100 text-orange-700', medium:'bg-blue-100 text-blue-700', low:'bg-gray-100 text-gray-600' };
  const STATUS_CLS   = { open:'bg-green-100 text-green-700', in_progress:'bg-blue-100 text-blue-700', pending_review:'bg-yellow-100 text-yellow-700', closed:'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/app/cases" className="btn-secondary py-1.5 px-3 text-sm"><ArrowLeft size={16}/> Back</Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{c.title}</h1>
          <Link to={`/app/refugees/${c.refugee_id}`} className="text-sm text-iragi-600 hover:underline">
            {c.refugee_name} · {c.rid}
          </Link>
        </div>
        <button onClick={() => setEditModal(true)} className="btn-secondary"><Edit2 size={16}/> Edit</button>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <span className={`badge ${PRIORITY_CLS[c.priority]} capitalize`}>{c.priority} priority</span>
          <span className={`badge ${STATUS_CLS[c.status]} capitalize`}>{c.status?.replace('_',' ')}</span>
          <span className="badge bg-gray-100 text-gray-600 capitalize">{c.case_type?.replace('_',' ')}</span>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Assigned To', c.assigned_to_name || 'Unassigned'],
            ['Due Date', c.due_date ? new Date(c.due_date).toLocaleDateString() : '—'],
            ['Created', new Date(c.created_at).toLocaleDateString()],
            ['Last Updated', new Date(c.updated_at).toLocaleDateString()],
          ].map(([k,v]) => (
            <div key={k}><dt className="text-gray-500">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
        {c.description && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-700">{c.description}</p>
          </div>
        )}
      </div>

      {/* Notes timeline */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare size={18} className="text-iragi-600"/> Activity Log ({(c.notes||[]).length})
        </h3>
        <div className="space-y-4 mb-6">
          {(c.notes || []).length === 0 ? (
            <p className="text-sm text-gray-400">No notes yet.</p>
          ) : c.notes.map(n => (
            <div key={n.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-iragi-100 flex items-center justify-center text-iragi-700 font-semibold text-xs flex-shrink-0">
                {n.author_name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{n.author_name}</span>
                  <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{n.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 border-t pt-4">
          <textarea className="input flex-1 resize-none" rows={2}
            placeholder="Add a note…" value={note} onChange={e => setNote(e.target.value)} />
          <button className="btn-primary px-4 self-end" disabled={!note.trim() || noteMutation.isPending}
            onClick={() => noteMutation.mutate(note)}>
            {noteMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
          </button>
        </div>
      </div>

      {editModal && (
        <CaseModal initial={c} onClose={() => setEditModal(false)}
          onSubmit={updateMutation.mutate} loading={updateMutation.isPending} />
      )}
    </div>
  );
}
