import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Edit2, Trash2, Eye, X, Loader2, ChevronDown, Download, Upload, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['registered','under_review','verified','resettled','returned'];
const GENDERS  = ['male','female','other','unknown'];
const FLAGS    = ['unaccompanied_minor','medical_need','separated_family','survivor_of_violence'];
const LANGS    = ['fr','sw','en','lingala','kikongo'];
const EDU_LEVELS = ['aucun','maternelle','primaire','secondaire','université','formation_pro'];

const STATUS_CONFIG = {
  registered:   { label:'Enregistré',   class:'badge-sand',    icon:Clock },
  under_review: { label:'En révision',  class:'badge-noisette',icon:Clock },
  verified:     { label:'Vérifié',      class:'badge-ok',      icon:CheckCircle },
  resettled:    { label:'Réinstallé',   class:'badge-gold',    icon:CheckCircle },
  returned:     { label:'Retourné',     class:'badge-galet',   icon:CheckCircle },
};
const FLAG_CONFIG = {
  unaccompanied_minor:  { emoji:'👶', label:'Mineur seul', class:'badge-warn' },
  medical_need:         { emoji:'🏥', label:'Besoin médical', class:'badge-warn' },
  separated_family:     { emoji:'👨‍👩‍👧', label:'Famille séparée', class:'badge-blossom' },
  survivor_of_violence: { emoji:'⚠️', label:'Survivant violence', class:'badge-warn' },
};

const DRC_PROVINCES = ['Nord-Kivu','Sud-Kivu','Ituri','Maniema','Kasaï','Kasaï-Central','Kasaï-Oriental','Katanga','Kwango','Kwilu','Lomami','Lualaba','Maï-Ndombe','Mongala','Nord-Ubangi','Sankuru','Sud-Ubangi','Tanganyika','Tshopo','Tshuapa','Équateur','Haut-Katanga','Haut-Lomami','Haut-Uélé','Bas-Uélé','Bas-Congo','Kinshasa','Kongo-Central'];

function RefugeeFormModal({ refugee=null, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(refugee || {
    first_name:'', last_name:'', date_of_birth:'', gender:'unknown',
    nationality:'Congolaise', origin_province:'Nord-Kivu', origin_territory:'',
    origin_village:'', current_camp_id:'', languages:[], arrival_date:new Date().toISOString().split('T')[0],
    status:'registered', flags:[], education_level:'primaire', health_notes:'', notes:'',
  });
  const { data:camps } = useQuery({ queryKey:['camps'], queryFn:()=>api.get('/camps').then(r=>r.data) });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleFlag = (f) => setForm(p=>({ ...p, flags: p.flags.includes(f) ? p.flags.filter(x=>x!==f) : [...p.flags,f] }));

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'700px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{refugee?'Modifier le réfugié':'Inscrire un réfugié'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          {/* Identity */}
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:'11px', fontWeight:800, color:'var(--caramel)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px', paddingBottom:'6px', borderBottom:'1px solid var(--lavezzi)' }}>
              Identité
            </div>
          </div>
          <div><label className="label">Prénom *</label><input required className="input" value={form.first_name} onChange={e=>set('first_name',e.target.value)}/></div>
          <div><label className="label">Nom *</label><input required className="input" value={form.last_name} onChange={e=>set('last_name',e.target.value)}/></div>
          <div><label className="label">Date de naissance</label><input type="date" className="input" value={form.date_of_birth||''} onChange={e=>set('date_of_birth',e.target.value)}/></div>
          <div><label className="label">Genre</label>
            <select className="input" value={form.gender} onChange={e=>set('gender',e.target.value)}>
              {GENDERS.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label">Nationalité</label><input className="input" value={form.nationality||''} onChange={e=>set('nationality',e.target.value)}/></div>
          <div><label className="label">Niveau d'éducation</label>
            <select className="input" value={form.education_level||''} onChange={e=>set('education_level',e.target.value)}>
              {EDU_LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Origin */}
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:'11px', fontWeight:800, color:'var(--caramel)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px', marginTop:'6px', paddingBottom:'6px', borderBottom:'1px solid var(--lavezzi)' }}>
              Origine (DRC)
            </div>
          </div>
          <div><label className="label">Province d'origine</label>
            <select className="input" value={form.origin_province||''} onChange={e=>set('origin_province',e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {DRC_PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div><label className="label">Territoire</label><input className="input" value={form.origin_territory||''} onChange={e=>set('origin_territory',e.target.value)} placeholder="Ex: Rutshuru"/></div>
          <div><label className="label">Village/Ville d'origine</label><input className="input" value={form.origin_village||''} onChange={e=>set('origin_village',e.target.value)} placeholder="Ex: Kibumba"/></div>

          {/* Current */}
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:'11px', fontWeight:800, color:'var(--caramel)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px', marginTop:'6px', paddingBottom:'6px', borderBottom:'1px solid var(--lavezzi)' }}>
              Situation actuelle
            </div>
          </div>
          <div><label className="label">Camp actuel</label>
            <select className="input" value={form.current_camp_id||''} onChange={e=>set('current_camp_id',e.target.value)}>
              <option value="">-- Aucun camp --</option>
              {(camps?.data||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Date d'arrivée</label><input type="date" className="input" value={form.arrival_date||''} onChange={e=>set('arrival_date',e.target.value)}/></div>
          <div><label className="label">Statut</label>
            <select className="input" value={form.status} onChange={e=>set('status',e.target.value)}>
              {STATUSES.map(s=><option key={s} value={s}>{STATUS_CONFIG[s]?.label||s}</option>)}
            </select>
          </div>

          {/* Flags */}
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label" style={{ marginBottom:'8px' }}>Signalements spéciaux</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {FLAGS.map(f => (
                <button key={f} type="button" onClick={()=>toggleFlag(f)} style={{
                  padding:'6px 12px', borderRadius:'100px', border:'1.5px solid', cursor:'pointer', fontSize:'12px', fontWeight:600, fontFamily:'inherit', transition:'all 0.2s',
                  background: form.flags?.includes(f) ? 'rgba(184,112,96,0.12)' : 'transparent',
                  borderColor: form.flags?.includes(f) ? 'var(--danger)' : 'var(--galet)',
                  color: form.flags?.includes(f) ? 'var(--danger)' : 'var(--text-muted)',
                }}>
                  {FLAG_CONFIG[f]?.emoji} {FLAG_CONFIG[f]?.label||f}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes de santé</label>
            <textarea rows={3} className="input" style={{ resize:'vertical' }} value={form.health_notes||''} onChange={e=>set('health_notes',e.target.value)}/>
          </div>
          <div>
            <label className="label">Notes générales</label>
            <textarea rows={3} className="input" style={{ resize:'vertical' }} value={form.notes||''} onChange={e=>set('notes',e.target.value)}/>
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

export default function RefugeesPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey:['refugees', search, status, page],
    queryFn:()=>api.get('/refugees',{ params:{ search, status, page, limit:20 } }).then(r=>r.data),
    keepPreviousData:true,
  });

  const createM = useMutation({ mutationFn:b=>api.post('/refugees',b), onSuccess:()=>{ toast.success('Réfugié inscrit ✓'); qc.invalidateQueries(['refugees']); setModal(null); }, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const updateM = useMutation({ mutationFn:({id,...b})=>api.put(`/refugees/${id}`,b), onSuccess:()=>{ toast.success('Mis à jour ✓'); qc.invalidateQueries(['refugees']); setEditing(null); }, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const deleteM = useMutation({ mutationFn:id=>api.delete(`/refugees/${id}`), onSuccess:()=>{ toast.success('Supprimé'); qc.invalidateQueries(['refugees']); setDeleting(null); }, onError:e=>toast.error(e.response?.data?.error||'Erreur') });

  const isAdmin = ['admin','volunteer'].includes(user?.role);
  const rows = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total/20);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
  const selectAll = () => setSelected(s => s.length===rows.length ? [] : rows.map(r=>r.id));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dash_total_refugees')}</h1>
          <p className="page-sub">{total.toLocaleString()} personnes enregistrées</p>
        </div>
        {isAdmin && (
          <div style={{ display:'flex', gap:'8px' }}>
            <button className="btn-secondary btn-sm"><Upload size={13}/> Importer CSV</button>
            <button className="btn-secondary btn-sm"><Download size={13}/> Exporter</button>
            <button onClick={()=>setModal(true)} className="btn-primary"><Plus size={14}/> Inscrire</button>
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'10px' }}>
        {STATUSES.map(s => {
          const count = rows.filter(r=>r.status===s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s} onClick={()=>setStatus(status===s?'':s)} style={{
              padding:'12px 16px', borderRadius:'14px', border:`1.5px solid ${status===s?'var(--caramel)':'var(--lavezzi)'}`,
              background: status===s ? 'rgba(201,168,76,0.06)' : 'var(--white-warm)',
              cursor:'pointer', textAlign:'left', transition:'all 0.2s', fontFamily:'inherit',
            }}>
              <div style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'28px', fontWeight:600, color:'var(--caramel)', lineHeight:1 }}>{count}</div>
              <div style={{ fontSize:'11px', fontWeight:600, color:'var(--text-soft)', marginTop:'3px' }}>{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap', padding:'14px 16px', background:'var(--white-warm)', borderRadius:'16px', border:'1px solid var(--lavezzi)' }}>
        <div className="search-wrap" style={{ flex:1, minWidth:'200px' }}>
          <Search size={14} className="search-icon"/>
          <input className="search-input" placeholder="Rechercher par nom, RID, province..." value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}/>
        </div>
        <select className="input" style={{ width:'auto',minWidth:'150px' }} value={status} onChange={e=>{ setStatus(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(s=><option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
        </select>
        {selected.length>0 && isAdmin && (
          <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
            <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>{selected.length} sélectionné(s)</span>
            <button className="btn-danger btn-sm"><Trash2 size={12}/> Supprimer</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        {isLoading ? (
          <div style={{ padding:'60px', textAlign:'center' }}>
            <Loader2 size={28} className="spinner" style={{ color:'var(--akan)', margin:'0 auto' }}/>
          </div>
        ) : rows.length===0 ? (
          <div className="empty-state">
            <Users size={40} style={{ opacity:0.25 }}/>
            <p>Aucun réfugié trouvé</p>
            {isAdmin && <button onClick={()=>setModal(true)} className="btn-primary" style={{ marginTop:'14px' }}><Plus size={14}/> Inscrire le premier</button>}
          </div>
        ) : (
          <table className="tbl">
            <thead><tr>
              <th><input type="checkbox" checked={selected.length===rows.length} onChange={selectAll} style={{ accentColor:'var(--caramel)' }}/></th>
              {['RID','Nom complet','Genre','Origine','Camp','Statut','Signalements','Inscrit le','Actions'].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(r => {
                const cfg = STATUS_CONFIG[r.status] || {};
                return (
                  <tr key={r.id} className={selected.includes(r.id)?'selected':''}>
                    <td><input type="checkbox" checked={selected.includes(r.id)} onChange={()=>toggleSelect(r.id)} style={{ accentColor:'var(--caramel)' }}/></td>
                    <td><span style={{ fontFamily:'monospace', fontSize:'11px', fontWeight:700, color:'var(--caramel-dark)', background:'rgba(201,168,76,0.1)', padding:'2px 6px', borderRadius:'5px' }}>{r.rid}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,var(--caramel-soft),var(--caramel))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'12px', flexShrink:0 }}>
                          {r.first_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight:600, fontSize:'13px', color:'var(--text-main)' }}>{r.first_name} {r.last_name}</p>
                          <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{r.nationality||'—'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:'12px' }}>{r.gender==='male'?'♂':r.gender==='female'?'♀':'—'}</td>
                    <td style={{ fontSize:'12px', color:'var(--text-soft)' }}>
                      {r.origin_province||'—'}
                      {r.origin_territory && <span style={{ color:'var(--text-muted)', display:'block', fontSize:'11px' }}>{r.origin_territory}</span>}
                    </td>
                    <td style={{ fontSize:'12px', color:'var(--text-soft)' }}>{r.camp_name||'—'}</td>
                    <td><span className={`badge ${cfg.class||'badge-sand'}`}>{cfg.label||r.status}</span></td>
                    <td>
                      {(r.flags||[]).map(f=>(
                        <span key={f} title={FLAG_CONFIG[f]?.label} style={{ marginRight:'3px', fontSize:'14px' }}>{FLAG_CONFIG[f]?.emoji||'🚩'}</span>
                      ))}
                    </td>
                    <td style={{ fontSize:'11px', color:'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div style={{ display:'flex', gap:'4px' }}>
                        <Link to={`/app/refugees/${r.id}`} className="btn-ghost btn-sm tooltip">
                          <Eye size={13}/><span className="tooltip-text">Voir détails</span>
                        </Link>
                        {isAdmin && <>
                          <button onClick={()=>setEditing(r)} className="btn-ghost btn-sm"><Edit2 size={13}/></button>
                          <button onClick={()=>setDeleting(r.id)} className="btn-ghost btn-sm" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>
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
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'var(--white-warm)', borderRadius:'14px', border:'1px solid var(--lavezzi)' }}>
          <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>Page {page} / {totalPages} · {total} résultats</span>
          <div style={{ display:'flex', gap:'6px' }}>
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-secondary btn-sm">{t('prev')}</button>
            {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
              const p = page<=3 ? i+1 : page+i-2;
              if(p<1||p>totalPages) return null;
              return <button key={p} onClick={()=>setPage(p)} className={p===page?'btn-primary btn-sm':'btn-secondary btn-sm'}>{p}</button>;
            })}
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="btn-secondary btn-sm">{t('next')}</button>
          </div>
        </div>
      )}

      {modal   && <RefugeeFormModal onClose={()=>setModal(null)} onSubmit={b=>createM.mutate(b)} loading={createM.isPending}/>}
      {editing && <RefugeeFormModal refugee={editing} onClose={()=>setEditing(null)} onSubmit={b=>updateM.mutate({id:editing.id,...b})} loading={updateM.isPending}/>}
      {deleting && (
        <div className="confirm-dialog">
          <div className="confirm-box">
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>⚠️</div>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', marginBottom:'6px', color:'var(--text-main)' }}>Supprimer ce réfugié ?</h3>
            <p style={{ color:'var(--text-soft)', fontSize:'13px', marginBottom:'20px' }}>Toutes les données associées seront supprimées.</p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <button onClick={()=>setDeleting(null)} className="btn-secondary">Annuler</button>
              <button onClick={()=>deleteM.mutate(deleting)} className="btn-danger"><Trash2 size={14}/> Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
