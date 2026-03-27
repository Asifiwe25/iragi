import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { Plus, TrendingUp, DollarSign, PieChart, Edit2, Trash2, X, Loader2, Eye, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TYPES = ['donation','grant','partnership','fundraising','other'];
const PROGRAMS = ['education','women','community','health','nutrition','general','other'];
const STATUSES = ['pending','received','allocated','spent','cancelled'];
const CURRENCIES = ['EUR','USD','CDF','RWF'];

const COLORS = {
  donation:'badge-gold', grant:'badge-ok', partnership:'badge-blossom',
  fundraising:'badge-noisette', other:'badge-soft',
};

function FinancingModal({ fin=null, onClose, onSubmit, loading }) {
  const { t } = useLang();
  const [form, setForm] = useState(fin || {
    type:'donation', title:'', description:'', amount:'', currency:'EUR',
    donor_name:'', donor_email:'', donor_country:'', purpose:'', program:'general',
    status:'received', receipt_date: new Date().toISOString().split('T')[0], notes:''
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'640px' }}>
        <div className="modal-header">
          <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:700, color:'var(--text-main)' }}>
            {fin ? t('edit') : t('fin_new')}
          </h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={16}/></button>
        </div>
        <form onSubmit={e=>{e.preventDefault();onSubmit(form);}} className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">{t('name')} *</label>
            <input required className="input" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Ex: Don Fondation Ubuntu 2025"/>
          </div>
          <div>
            <label className="label">{t('fin_type')}</label>
            <select className="input" value={form.type} onChange={e=>set('type',e.target.value)}>
              {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('fin_program')}</label>
            <select className="input" value={form.program} onChange={e=>set('program',e.target.value)}>
              {PROGRAMS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('fin_amount')} *</label>
            <input required type="number" min="0" step="0.01" className="input" value={form.amount} onChange={e=>set('amount',e.target.value)}/>
          </div>
          <div>
            <label className="label">Devise</label>
            <select className="input" value={form.currency} onChange={e=>set('currency',e.target.value)}>
              {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('fin_donor')}</label>
            <input className="input" value={form.donor_name} onChange={e=>set('donor_name',e.target.value)} placeholder="Nom du donateur"/>
          </div>
          <div>
            <label className="label">Email donateur</label>
            <input type="email" className="input" value={form.donor_email} onChange={e=>set('donor_email',e.target.value)}/>
          </div>
          <div>
            <label className="label">Pays donateur</label>
            <input className="input" value={form.donor_country} onChange={e=>set('donor_country',e.target.value)}/>
          </div>
          <div>
            <label className="label">{t('fin_status')}</label>
            <select className="input" value={form.status} onChange={e=>set('status',e.target.value)}>
              {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date de réception</label>
            <input type="date" className="input" value={form.receipt_date} onChange={e=>set('receipt_date',e.target.value)}/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Objet / Finalité</label>
            <input className="input" value={form.purpose} onChange={e=>set('purpose',e.target.value)} placeholder="Objectif de ce financement"/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Description</label>
            <textarea rows={3} className="input" style={{ resize:'vertical' }} value={form.description} onChange={e=>set('description',e.target.value)}/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Notes internes</label>
            <textarea rows={2} className="input" style={{ resize:'vertical' }} value={form.notes} onChange={e=>set('notes',e.target.value)}/>
          </div>
        </form>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
          <button onClick={()=>onSubmit(form)} disabled={loading} className="btn-primary">
            {loading && <Loader2 size={15} className="spinner"/>} {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ onConfirm, onCancel, t }) {
  return (
    <div className="confirm-dialog">
      <div className="confirm-box">
        <div style={{ fontSize:'40px', marginBottom:'12px' }}>🗑️</div>
        <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', marginBottom:'8px', color:'var(--text-main)' }}>
          {t('confirm_delete')}
        </h3>
        <p style={{ color:'var(--text-soft)', fontSize:'14px', marginBottom:'24px' }}>Cette action est irréversible.</p>
        <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
          <button onClick={onCancel} className="btn-secondary">{t('cancel')}</button>
          <button onClick={onConfirm} className="btn-danger">{t('delete')}</button>
        </div>
      </div>
    </div>
  );
}

export default function FinancingsPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState({ type:'', status:'', program:'' });

  const { data, isLoading } = useQuery({
    queryKey: ['financings', filter],
    queryFn: () => api.get('/financings', { params: filter }).then(r => r.data),
  });
  const { data: summary } = useQuery({
    queryKey: ['financings-summary'],
    queryFn: () => api.get('/financings/summary').then(r => r.data),
  });

  const createM = useMutation({
    mutationFn: b => api.post('/financings', b),
    onSuccess: () => { toast.success('Financement créé ✓'); qc.invalidateQueries(['financings']); qc.invalidateQueries(['financings-summary']); setModal(null); },
    onError: e => toast.error(e.response?.data?.error || 'Erreur'),
  });
  const updateM = useMutation({
    mutationFn: ({id,...b}) => api.put(`/financings/${id}`, b),
    onSuccess: () => { toast.success('Financement mis à jour ✓'); qc.invalidateQueries(['financings']); qc.invalidateQueries(['financings-summary']); setEditing(null); },
    onError: e => toast.error(e.response?.data?.error || 'Erreur'),
  });
  const deleteM = useMutation({
    mutationFn: id => api.delete(`/financings/${id}`),
    onSuccess: () => { toast.success('Supprimé'); qc.invalidateQueries(['financings']); qc.invalidateQueries(['financings-summary']); setDeleting(null); },
    onError: e => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const fins = data?.data || [];
  const stats = data?.stats || {};
  const sum = summary?.totals || {};

  const fmt = (n,c='EUR') => new Intl.NumberFormat('fr-FR',{style:'currency',currency:c,maximumFractionDigits:0}).format(n||0);

  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'32px', fontWeight:700, color:'var(--text-main)', marginBottom:'4px' }}>{t('fin_title')}</h1>
          <p style={{ color:'var(--text-soft)', fontSize:'14px' }}>Suivi des financements et donations IRAGI</p>
        </div>
        {isAdmin && (
          <button onClick={()=>setModal(true)} className="btn-primary">
            <Plus size={16}/> {t('fin_new')}
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'16px' }}>
        {[
          { label:'Total reçu', value: fmt(sum.grand_total), icon:DollarSign, sub:`${sum.count||0} financement(s)` },
          { label:'Reçu', value: fmt(stats.received), icon:TrendingUp, sub:'Disponible' },
          { label:'Alloué', value: fmt(stats.allocated), icon:PieChart, sub:'En cours' },
          { label:'Dépensé', value: fmt(stats.spent), icon:TrendingUp, sub:'Utilisé' },
        ].map((s,i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(201,168,76,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={18} style={{ color:'var(--caramel)' }}/>
                </div>
                <span style={{ fontSize:'12px', fontWeight:600, color:'var(--noisette)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.label}</span>
              </div>
              <p style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'28px', fontWeight:600, color:'var(--text-main)', lineHeight:1 }}>{s.value}</p>
              <p style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'4px' }}>{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', padding:'16px', background:'var(--white-warm)', borderRadius:'16px', border:'1px solid var(--border)' }}>
        {[
          { k:'type', opts:['','...'].concat(TYPES), labels:['Tous les types',...TYPES] },
          { k:'status', opts:['',...STATUSES], labels:['Tous les statuts',...STATUSES] },
          { k:'program', opts:['',...PROGRAMS], labels:['Tous les programmes',...PROGRAMS] },
        ].map(f => (
          <select key={f.k} className="input" style={{ width:'auto', minWidth:'160px' }}
            value={filter[f.k]} onChange={e=>setFilter(p=>({...p,[f.k]:e.target.value}))}>
            {f.opts.map((o,i)=><option key={o} value={o}>{f.labels[i]}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ padding:'60px', textAlign:'center', color:'var(--akan)' }}>
            <Loader2 size={28} className="spinner" style={{ margin:'0 auto 12px' }}/>
            <p style={{ fontSize:'14px' }}>Chargement...</p>
          </div>
        ) : fins.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={40} style={{ marginBottom:'12px', opacity:0.3 }}/>
            <p style={{ fontSize:'15px', fontWeight:500 }}>Aucun financement</p>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', marginTop:'4px' }}>Ajoutez votre premier financement</p>
          </div>
        ) : (
          <table className="tbl">
            <thead><tr>
              {['Titre','Type','Donateur','Montant','Programme','Statut','Date',isAdmin?'Actions':''].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {fins.map(f => (
                <tr key={f.id}>
                  <td style={{ maxWidth:'200px' }}>
                    <p style={{ fontWeight:600, color:'var(--text-main)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.title}</p>
                    {f.purpose && <p style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.purpose}</p>}
                  </td>
                  <td><span className={`badge ${COLORS[f.type]||'badge-soft'}`}>{f.type}</span></td>
                  <td>
                    <p style={{ fontSize:'13px', fontWeight:500 }}>{f.donor_name||'—'}</p>
                    {f.donor_country && <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{f.donor_country}</p>}
                  </td>
                  <td>
                    <p style={{ fontWeight:700, color:'var(--caramel-dark)', fontSize:'15px' }}>{fmt(f.amount, f.currency)}</p>
                  </td>
                  <td><span className="badge badge-soft">{f.program||'—'}</span></td>
                  <td>
                    <span className={`badge ${f.status==='received'?'badge-ok':f.status==='spent'?'badge-noisette':'badge-soft'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ fontSize:'12px', color:'var(--text-muted)' }}>
                    {f.receipt_date ? new Date(f.receipt_date).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={()=>setEditing(f)} className="btn-ghost btn-sm"><Edit2 size={13}/></button>
                        <button onClick={()=>setDeleting(f.id)} className="btn-ghost btn-sm" style={{ color:'#C0745A' }}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal && <FinancingModal onClose={()=>setModal(null)} onSubmit={b=>createM.mutate(b)} loading={createM.isPending}/>}
      {editing && <FinancingModal fin={editing} onClose={()=>setEditing(null)} onSubmit={b=>updateM.mutate({id:editing.id,...b})} loading={updateM.isPending}/>}
      {deleting && <ConfirmDelete t={t} onCancel={()=>setDeleting(null)} onConfirm={()=>deleteM.mutate(deleting)}/>}
    </div>
  );
}
