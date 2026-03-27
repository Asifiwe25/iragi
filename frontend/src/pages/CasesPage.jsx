import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, Eye, X, Loader2, AlertTriangle, Clock, CheckCircle, ChevronRight, Filter, Briefcase } from "lucide-react";;
import toast from 'react-hot-toast';

const PRIORITIES = ['critical','high','medium','low'];
const STATUSES   = ['open','in_progress','pending_review','closed'];
const TYPES      = ['medical','legal','psychosocial','family_tracing','resettlement','education','protection','nutrition'];

const PRIORITY_CFG = {
  critical: { label:'Critique',   class:'badge-warn',     dot:'#B87060' },
  high:     { label:'Élevé',      class:'badge-blossom',  dot:'#C8A882' },
  medium:   { label:'Moyen',      class:'badge-noisette', dot:'#9B7D60' },
  low:      { label:'Faible',     class:'badge-sand',     dot:'#D4C4B0' },
};
const STATUS_CFG = {
  open:           { label:'Ouvert',        class:'badge-ok',       icon:Clock },
  in_progress:    { label:'En cours',      class:'badge-gold',     icon:Clock },
  pending_review: { label:'En révision',   class:'badge-noisette', icon:Clock },
  closed:         { label:'Fermé',         class:'badge-galet',    icon:CheckCircle },
};

function CaseModal({ cas=null, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(cas || { refugee_id:'', case_type:'medical', priority:'medium', status:'open', title:'', description:'', due_date:'' });
  const { data:refs } = useQuery({ queryKey:['refugees-list'], queryFn:()=>api.get('/refugees',{params:{limit:100}}).then(r=>r.data) });
  const { data:users } = useQuery({ queryKey:['users-list'], queryFn:()=>api.get('/users').then(r=>r.data) });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'640px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{cas?'Modifier le cas':'Nouveau cas'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Réfugié concerné *</label>
            <select required className="input" value={form.refugee_id||''} onChange={e=>set('refugee_id',e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {(refs?.data||[]).map(r=><option key={r.id} value={r.id}>{r.first_name} {r.last_name} — {r.rid}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Titre du cas *</label>
            <input required className="input" value={form.title||''} onChange={e=>set('title',e.target.value)} placeholder="Ex: Besoin de soins médicaux urgents"/>
          </div>
          <div>
            <label className="label">Type de cas</label>
            <select className="input" value={form.case_type||''} onChange={e=>set('case_type',e.target.value)}>
              {TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priorité</label>
            <select className="input" value={form.priority} onChange={e=>set('priority',e.target.value)}>
              {PRIORITIES.map(p=><option key={p} value={p}>{PRIORITY_CFG[p]?.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input" value={form.status} onChange={e=>set('status',e.target.value)}>
              {STATUSES.map(s=><option key={s} value={s}>{STATUS_CFG[s]?.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assigné à</label>
            <select className="input" value={form.assigned_to||''} onChange={e=>set('assigned_to',e.target.value)}>
              <option value="">-- Non assigné --</option>
              {(users?.data||[]).filter(u=>['admin','volunteer'].includes(u.role)).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date d'échéance</label>
            <input type="date" className="input" value={form.due_date||''} onChange={e=>set('due_date',e.target.value)}/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Description</label>
            <textarea rows={4} className="input" style={{ resize:'vertical' }} value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Décrivez le cas en détail..."/>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={()=>onSubmit(form)} disabled={loading} className="btn-primary">
            {loading&&<Loader2 size={14} className="spinner"/>} Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const [sp] = useSearchParams();
  const { t } = useLang();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [status, setStatus] = useState(sp.get('status')||'');
  const [priority, setPriority] = useState(sp.get('priority')||'');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey:['cases', status, priority, search, page],
    queryFn:()=>api.get('/cases',{ params:{ status, priority, page, limit:20 } }).then(r=>r.data),
    keepPreviousData:true,
  });

  const createM = useMutation({ mutationFn:b=>api.post('/cases',b), onSuccess:()=>{toast.success('Cas créé ✓');qc.invalidateQueries(['cases']);setModal(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const updateM = useMutation({ mutationFn:({id,...b})=>api.put(`/cases/${id}`,b), onSuccess:()=>{toast.success('Mis à jour ✓');qc.invalidateQueries(['cases']);setEditing(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const deleteM = useMutation({ mutationFn:id=>api.delete(`/cases/${id}`), onSuccess:()=>{toast.success('Supprimé');qc.invalidateQueries(['cases']);setDeleting(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });

  const isAdmin = ['admin','volunteer'].includes(user?.role);
  const rows = data?.data || [];
  const total = data?.total || 0;

  const quickStats = PRIORITIES.map(p => ({
    ...PRIORITY_CFG[p],
    key:p,
    count: rows.filter(r=>r.priority===p&&r.status!=='closed').length,
  }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cas de Support</h1>
          <p className="page-sub">{total} cas enregistrés</p>
        </div>
        {isAdmin && (
          <button onClick={()=>setModal(true)} className="btn-primary"><Plus size={14}/> Nouveau cas</button>
        )}
      </div>

      {/* Priority quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
        {quickStats.map(s => (
          <button key={s.key} onClick={()=>setPriority(priority===s.key?'':s.key)} style={{
            padding:'14px', borderRadius:'14px', border:`1.5px solid ${priority===s.key?'var(--caramel)':'var(--lavezzi)'}`,
            background:priority===s.key?'rgba(201,168,76,0.06)':'var(--white-warm)', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all 0.2s',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:s.dot }}/>
              <span style={{ fontSize:'11px', fontWeight:600, color:'var(--noisette)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</span>
            </div>
            <div style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'32px', fontWeight:600, color:s.key==='critical'?'var(--danger)':'var(--caramel)', lineHeight:1 }}>{s.count}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', padding:'14px 16px', background:'var(--white-warm)', borderRadius:'16px', border:'1px solid var(--lavezzi)' }}>
        <div className="search-wrap" style={{ flex:1, minWidth:'200px' }}>
          <Search size={14} className="search-icon"/>
          <input className="search-input" placeholder="Rechercher un cas..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="input" style={{ width:'auto', minWidth:'140px' }} value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(s=><option key={s} value={s}>{STATUS_CFG[s]?.label}</option>)}
        </select>
        <select className="input" style={{ width:'auto', minWidth:'130px' }} value={priority} onChange={e=>setPriority(e.target.value)}>
          <option value="">Toutes priorités</option>
          {PRIORITIES.map(p=><option key={p} value={p}>{PRIORITY_CFG[p]?.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        {isLoading ? (
          <div style={{ padding:'60px', textAlign:'center' }}><Loader2 size={28} className="spinner" style={{ color:'var(--akan)', margin:'0 auto' }}/></div>
        ) : rows.length===0 ? (
          <div className="empty-state">
            <Briefcase size={40} style={{ opacity:0.25 }}/>
            <p>Aucun cas trouvé</p>
          </div>
        ) : (
          <table className="tbl">
            <thead><tr>
              {['Réfugié','Titre','Type','Priorité','Statut','Assigné','Échéance','Actions'].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(c => {
                const pCfg = PRIORITY_CFG[c.priority]||{};
                const sCfg = STATUS_CFG[c.status]||{};
                const isOverdue = c.due_date && new Date(c.due_date) < new Date() && c.status!=='closed';
                return (
                  <tr key={c.id}>
                    <td>
                      <p style={{ fontWeight:600, fontSize:'13px', color:'var(--text-main)' }}>{c.refugee_name||'—'}</p>
                      <p style={{ fontSize:'10px', fontFamily:'monospace', color:'var(--caramel-dark)' }}>{c.rid||''}</p>
                    </td>
                    <td style={{ maxWidth:'200px' }}>
                      <p style={{ fontWeight:500, fontSize:'13px', color:'var(--text-main)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.title}</p>
                      <span className="badge badge-galet" style={{ fontSize:'10px', marginTop:'2px' }}>{c.case_type?.replace('_',' ')}</span>
                    </td>
                    <td><span className="badge badge-sand" style={{ fontSize:'10px' }}>{c.case_type?.replace('_',' ')}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:pCfg.dot, flexShrink:0 }}/>
                        <span className={`badge ${pCfg.class}`} style={{ fontSize:'10px' }}>{pCfg.label}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${sCfg.class}`} style={{ fontSize:'10px' }}>{sCfg.label}</span></td>
                    <td style={{ fontSize:'12px', color:'var(--text-soft)' }}>{c.assigned_to_name||'—'}</td>
                    <td style={{ fontSize:'11px', color:isOverdue?'var(--danger)':'var(--text-muted)' }}>
                      {c.due_date ? (
                        <span style={{ fontWeight:isOverdue?700:400 }}>
                          {isOverdue&&'⚠️ '}{new Date(c.due_date).toLocaleDateString('fr-FR')}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:'4px' }}>
                        <Link to={`/app/cases/${c.id}`} className="btn-ghost btn-sm"><Eye size={13}/></Link>
                        {isAdmin && <>
                          <button onClick={()=>setEditing(c)} className="btn-ghost btn-sm"><Edit2 size={13}/></button>
                          <button onClick={()=>setDeleting(c.id)} className="btn-ghost btn-sm" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--white-warm)', borderRadius:'12px', border:'1px solid var(--lavezzi)' }}>
          <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>Page {page} · {total} cas</span>
          <div style={{ display:'flex', gap:'6px' }}>
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-secondary btn-sm">Préc.</button>
            <button disabled={page>=Math.ceil(total/20)} onClick={()=>setPage(p=>p+1)} className="btn-secondary btn-sm">Suiv.</button>
          </div>
        </div>
      )}

      {modal   && <CaseModal onClose={()=>setModal(null)} onSubmit={b=>createM.mutate(b)} loading={createM.isPending}/>}
      {editing && <CaseModal cas={editing} onClose={()=>setEditing(null)} onSubmit={b=>updateM.mutate({id:editing.id,...b})} loading={updateM.isPending}/>}
      {deleting && (
        <div className="confirm-dialog">
          <div className="confirm-box">
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>⚠️</div>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'20px', marginBottom:'8px', color:'var(--text-main)' }}>Supprimer ce cas ?</h3>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginTop:'16px' }}>
              <button onClick={()=>setDeleting(null)} className="btn-secondary">Annuler</button>
              <button onClick={()=>deleteM.mutate(deleting)} className="btn-danger">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
