// frontend/src/pages/RefugeeDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { ArrowLeft, Edit2, Briefcase, Package } from 'lucide-react';
import { useState } from 'react';
import RefugeeModal from '../components/ui/RefugeeModal';
import toast from 'react-hot-toast';

export default function RefugeeDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [editModal, setEditModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['refugee', id],
    queryFn: () => api.get(`/refugees/${id}`).then(r => r.data.data)
  });

  const { data: casesData } = useQuery({
    queryKey: ['cases', 'refugee', id],
    queryFn: () => api.get('/cases', { params: { refugee_id: id } }).then(r => r.data)
  });

  const { data: distData } = useQuery({
    queryKey: ['distributions', 'refugee', id],
    queryFn: () => api.get('/distributions', { params: { refugee_id: id } }).then(r => r.data)
  });

  const updateMutation = useMutation({
    mutationFn: (body) => api.put(`/refugees/${id}`, body),
    onSuccess: () => { toast.success('Updated!'); qc.invalidateQueries(['refugee', id]); setEditModal(false); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error')
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-iragi-700"/></div>;
  if (!data) return <p className="text-center py-20 text-gray-500">Refugee not found</p>;

  const FLAG_LABELS = { unaccompanied_minor:'Unaccompanied Minor', medical_need:'Medical Need', separated_family:'Separated Family', survivor_of_violence:'Survivor of Violence' };
  const STATUS_CLS = { registered:'bg-blue-100 text-blue-700', under_review:'bg-yellow-100 text-yellow-700', verified:'bg-green-100 text-green-700', resettled:'bg-purple-100 text-purple-700', returned:'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/app/refugees" className="btn-secondary py-1.5 px-3 text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{data.first_name} {data.last_name}</h1>
          <p className="text-iragi-600 font-mono text-sm">{data.rid}</p>
        </div>
        <button onClick={() => setEditModal(true)} className="btn-secondary">
          <Edit2 size={16} /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="card md:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Personal Information</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ['Status', <span className={`badge ${STATUS_CLS[data.status]}`}>{data.status?.replace('_',' ')}</span>],
              ['Camp', data.camp_name || '—'],
              ['Gender', data.gender || '—'],
              ['Nationality', data.nationality || '—'],
              ['Date of Birth', data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : '—'],
              ['Arrival Date', data.arrival_date ? new Date(data.arrival_date).toLocaleDateString() : '—'],
              ['Registered By', data.registered_by_name || '—'],
              ['Registered On', new Date(data.created_at).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
          {data.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Flags */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Vulnerability Flags</h3>
          {(data.flags || []).length === 0 ? (
            <p className="text-sm text-gray-400">No flags</p>
          ) : (
            <div className="space-y-2">
              {data.flags.map(f => (
                <span key={f} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
                  ⚠️ {FLAG_LABELS[f] || f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cases */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Briefcase size={18} className="text-iragi-600" /> Cases ({casesData?.total || 0})
          </h3>
          <Link to={`/app/cases?refugee_id=${id}`} className="text-xs text-iragi-600 hover:underline">View all</Link>
        </div>
        {(casesData?.data || []).length === 0 ? (
          <p className="text-sm text-gray-400">No cases</p>
        ) : (
          <div className="space-y-2">
            {casesData.data.map(c => (
              <Link key={c.id} to={`/app/cases/${c.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-8 rounded-full flex-shrink-0 ${
                  c.priority==='critical'?'bg-red-500':c.priority==='high'?'bg-orange-400':'bg-blue-400'}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.case_type} · {c.assigned_to_name || 'Unassigned'}</p>
                </div>
                <span className="text-xs text-gray-500 capitalize">{c.status?.replace('_',' ')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Distributions */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Package size={18} className="text-iragi-600"/> Distribution History
        </h3>
        {(distData?.data || []).length === 0 ? (
          <p className="text-sm text-gray-400">No distributions recorded</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                {['Date','Item','Qty','Distributed By'].map(h => (
                  <th key={h} className="pb-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {distData.data.map(d => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 text-gray-600">{new Date(d.distribution_date).toLocaleDateString()}</td>
                  <td className="py-2">{d.item_name || d.item_type}</td>
                  <td className="py-2">{d.quantity} {d.unit}</td>
                  <td className="py-2 text-gray-600">{d.distributed_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editModal && (
        <RefugeeModal
          initial={data}
          onClose={() => setEditModal(false)}
          onSubmit={updateMutation.mutate}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
