// frontend/src/components/ui/RefugeeModal.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { X, Loader2 } from 'lucide-react';

const FLAGS = ['unaccompanied_minor','medical_need','separated_family','survivor_of_violence'];

export default function RefugeeModal({ onClose, onSubmit, loading, initial }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '', gender: '',
    nationality: '', arrival_date: new Date().toISOString().split('T')[0],
    camp_id: '', status: 'registered', flags: [], notes: '',
    ...initial
  });

  const { data: campsData } = useQuery({
    queryKey: ['camps-list'],
    queryFn: () => api.get('/camps').then(r => r.data)
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleFlag = (f) => setForm(p => ({
    ...p, flags: p.flags.includes(f) ? p.flags.filter(x => x !== f) : [...p.flags, f]
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial ? 'Edit Refugee' : 'Register New Refugee'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input className="input" required value={form.first_name}
                onChange={e => set('first_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input" required value={form.last_name}
                onChange={e => set('last_name', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={form.date_of_birth}
                onChange={e => set('date_of_birth', e.target.value)} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nationality</label>
              <input className="input" placeholder="e.g. DRC, Burundi…" value={form.nationality}
                onChange={e => set('nationality', e.target.value)} />
            </div>
            <div>
              <label className="label">Arrival Date</label>
              <input type="date" className="input" value={form.arrival_date}
                onChange={e => set('arrival_date', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Camp</label>
              <select className="input" value={form.camp_id} onChange={e => set('camp_id', e.target.value)}>
                <option value="">No camp assigned</option>
                {(campsData?.data || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="registered">Registered</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Verified</option>
                <option value="resettled">Resettled</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Vulnerability Flags</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {FLAGS.map(f => (
                <button key={f} type="button"
                  onClick={() => toggleFlag(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${form.flags.includes(f)
                      ? 'bg-iragi-700 text-white border-iragi-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-iragi-400'}`}>
                  {f.replace(/_/g,' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} placeholder="Additional notes…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {initial ? 'Save Changes' : 'Register Refugee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
