import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { X, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const SKILLS = ['enseignement','traduction','médecine','psychologie','informatique','logistique','administration','communication','droit','finance','construction','agriculture','artisanat','autre'];
const AVAILABILITY = ['temps_plein','temps_partiel','week_end','occasionnel','urgence'];
const VOL_STATUSES = ['active','inactive','suspended'];

function VolunteerModal({ vol=null, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(
    vol || { user_id:'', skills:[], availability:'temps_partiel', languages:[], experience:'', camp_id:'', status:'active' }
  );

  const { data:users } = useQuery({
    queryKey:['users'],
    queryFn:()=>api.get('/users').then(r=>r.data)
  });

  const { data:camps } = useQuery({
    queryKey:['camps'],
    queryFn:()=>api.get('/camps').then(r=>r.data)
  });

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const toggleSkill = (s) =>
    setForm(f=>({
      ...f,
      skills: f.skills.includes(s)
        ? f.skills.filter(x=>x!==s)
        : [...f.skills,s]
    }));

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'580px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{vol?'Modifier le volontaire':'Ajouter un volontaire'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={15}/></button>
        </div>

        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          {!vol && (
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Utilisateur *</label>
              <select required className="input" value={form.user_id} onChange={e=>set('user_id',e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {(users?.data||[]).filter(u=>u.role==='volunteer').map(u=>(
                  <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Disponibilité</label>
            <select className="input" value={form.availability||''} onChange={e=>set('availability',e.target.value)}>
              {AVAILABILITY.map(a=>(
                <option key={a} value={a}>{a.replace('_',' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Camp assigné</label>
            <select className="input" value={form.camp_id||''} onChange={e=>set('camp_id',e.target.value)}>
              <option value="">-- Aucun --</option>
              {(camps?.data||[]).map(c=>(
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Statut</label>
            <select className="input" value={form.status} onChange={e=>set('status',e.target.value)}>
              {VOL_STATUSES.map(s=>(
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn:'1/-1' }}>
            <label className="label" style={{ marginBottom:'8px' }}>Compétences</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {SKILLS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={()=>toggleSkill(s)}
                  style={{
                    padding:'5px 11px',
                    borderRadius:'100px',
                    border:'1.5px solid',
                    cursor:'pointer',
                    fontSize:'12px',
                    fontWeight:600,
                    fontFamily:'inherit',
                    background: form.skills?.includes(s) ? 'rgba(201,168,76,0.15)' : 'transparent',
                    borderColor: form.skills?.includes(s) ? 'var(--caramel)' : 'var(--galet)',
                    color: form.skills?.includes(s) ? 'var(--caramel-dark)' : 'var(--text-muted)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Expérience / Bio</label>
            <textarea
              rows={3}
              className="input"
              style={{ resize:'vertical' }}
              value={form.experience||''}
              onChange={e=>set('experience',e.target.value)}
              placeholder="Décrivez l'expérience du volontaire..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={()=>onSubmit(form)} disabled={loading} className="btn-primary">
            {loading && <Loader2 size={14} className="spinner"/>}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HRPage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const [tab, setTab] = useState('volunteers');

  const approveM = useMutation({
    mutationFn: id => api.put(`/users/${id}/approve`),
    onSuccess: () => {
      toast.success('✅ Approuvé');
      qc.invalidateQueries(['users-all']);
    },
    onError: e => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const suspendM = useMutation({
    mutationFn: id => api.put(`/users/${id}/suspend`), // ✅ FIXED
    onSuccess: () => {
      toast.success('Suspendu');
      qc.invalidateQueries(['users-all']);
    },
    onError: e => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const { data:users, isLoading } = useQuery({
    queryKey:['users-all'],
    queryFn:()=>api.get('/users').then(r=>r.data),
  });

  const roleGroups = {
    volunteer: (users?.data||[]).filter(u=>u.role==='volunteer'),
    partner:   (users?.data||[]).filter(u=>u.role==='partner'),
    donor:     (users?.data||[]).filter(u=>u.role==='donor'),
    refugee:   (users?.data||[]).filter(u=>u.role==='refugee'),
  };

  const totalActive = (users?.data||[])
    .filter(u=>u.is_active && u.status==='approved').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div className="page-header">
        <h1 className="page-title">Ressources Humaines</h1>
        <p className="page-sub">Gestion des équipes IRAGI</p>
      </div>

      <div className="tabs">
        {[['volunteers','Volontaires'],['partners','Partenaires'],['donors','Donateurs'],['refugees','Bénéficiaires']].map(([key,label]) => (
          <button
            key={key}
            onClick={()=>setTab(key)}
            className={`tab-btn ${tab === key ? 'active' : ''}`}
          >
            {label} ({roleGroups[key === 'volunteers' ? 'volunteer' : key]?.length || 0})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign:'center', padding:'60px' }}>
          <Loader2 size={28} className="spinner"/>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'14px' }}>
          {(roleGroups[tab === 'volunteers' ? 'volunteer' : tab] || []).map(person => (
            <div key={person.id} className="card">
              <p>{person.name}</p>
              <p>{person.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}