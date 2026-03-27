import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Loader2, AlertCircle, Package, Trash2, Edit2, Download, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const ITEM_TYPES = ['food','water','hygiene','shelter','cash','medical','clothing','school_kit','other'];
const UNITS      = ['kg','g','litres','pièces','kits','packs','sacs','cartons','EUR'];

const TYPE_EMOJI = { food:'🌾', water:'💧', hygiene:'🧼', shelter:'⛺', cash:'💶', medical:'💊', clothing:'👕', school_kit:'🎒', other:'📦' };
const TYPE_COLORS = { food:'badge-gold', water:'badge-noisette', hygiene:'badge-sand', shelter:'badge-blossom', cash:'badge-ok', medical:'badge-warn', clothing:'badge-galet', school_kit:'badge-gold', other:'badge-sand' };

function DistModal({ dist=null, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(dist || {
    refugee_id:'', camp_id:'', item_type:'food', item_name:'', quantity:'', unit:'kg',
    distribution_date: new Date().toISOString().split('T')[0], notes:'',
  });
  const { data:refs }  = useQuery({ queryKey:['refs-dist'],  queryFn:()=>api.get('/refugees',{params:{limit:200}}).then(r=>r.data) });
  const { data:camps } = useQuery({ queryKey:['camps-dist'], queryFn:()=>api.get('/camps').then(r=>r.data) });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{dist?'Modifier la distribution':'Enregistrer une distribution'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Bénéficiaire *</label>
            <select required className="input" value={form.refugee_id} onChange={e=>set('refugee_id',e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {(refs?.data||[]).map(r=><option key={r.id} value={r.id}>{r.first_name} {r.last_name} ({r.rid})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Camp</label>
            <select className="input" value={form.camp_id||''} onChange={e=>set('camp_id',e.target.value)}>
              <option value="">-- Aucun --</option>
              {(camps?.data||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={form.distribution_date} onChange={e=>set('distribution_date',e.target.value)}/>
          </div>

          {/* Item section */}
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:'11px', fontWeight:800, color:'var(--caramel)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px', paddingTop:'6px', borderTop:'1px solid var(--lavezzi)' }}>Article distribué</div>
          </div>
          <div>
            <label className="label">Type d'article *</label>
            <select required className="input" value={form.item_type} onChange={e=>set('item_type',e.target.value)}>
              {ITEM_TYPES.map(t=><option key={t} value={t}>{TYPE_EMOJI[t]} {t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nom / Description</label>
            <input className="input" value={form.item_name||''} onChange={e=>set('item_name',e.target.value)} placeholder="Ex: Riz, Eau minérale, Kit scolaire..."/>
          </div>
          <div>
            <label className="label">Quantité *</label>
            <input required type="number" min="0.01" step="0.01" className="input" value={form.quantity} onChange={e=>set('quantity',e.target.value)}/>
          </div>
          <div>
            <label className="label">Unité</label>
            <select className="input" value={form.unit} onChange={e=>set('unit',e.target.value)}>
              {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Notes</label>
            <textarea rows={2} className="input" style={{ resize:'vertical' }} value={form.notes||''} onChange={e=>set('notes',e.target.value)}/>
          </div>
          <div className="info-box info-box-gold" style={{ gridColumn:'1/-1' }}>
            <AlertCircle size={14} style={{ flexShrink:0, marginTop:'1px', color:'var(--caramel)' }}/>
            <span>Les distributions en double (même bénéficiaire + article + jour) sont automatiquement bloquées.</span>
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

export default function DistributionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ item_type:'', camp_id:'' });

  const { data, isLoading } = useQuery({
    queryKey:['distributions', page, filter],
    queryFn:()=>api.get('/distributions',{ params:{ page, limit:25, ...filter } }).then(r=>r.data),
    keepPreviousData:true,
  });
  const { data:summary } = useQuery({ queryKey:['dist-summary'], queryFn:()=>api.get('/distributions/summary').then(r=>r.data).catch(()=>({})) });
  const { data:camps }   = useQuery({ queryKey:['camps-filter'], queryFn:()=>api.get('/camps').then(r=>r.data) });

  const createM = useMutation({
    mutationFn:b=>api.post('/distributions',b),
    onSuccess:()=>{toast.success('Distribution enregistrée ✓');qc.invalidateQueries(['distributions']);qc.invalidateQueries(['dist-summary']);setModal(null);},
    onError:e=>{ if(e.response?.data?.duplicate) toast.error('⚠️ Double détecté ! Ce bénéficiaire a déjà reçu cet article aujourd\'hui.'); else toast.error(e.response?.data?.error||'Erreur'); }
  });
  const updateM = useMutation({
    mutationFn: ({ id, ...b }) => api.put(`/distributions/${id}`, b),
    onSuccess: () => { toast.success('Mis à jour ✓'); qc.invalidateQueries(['distributions']); setEditing(null); },
    onError: e => toast.error(e.response?.data?.error||'Erreur'),
  });
  const deleteM = useMutation({
    mutationFn:id=>api.delete(`/distributions/${id}`),
    onSuccess:()=>{toast.success('Supprimé');qc.invalidateQueries(['distributions']);setDeleting(null);},
    onError:e=>toast.error(e.response?.data?.error||'Erreur'),
  });

  const isAdmin = ['admin','volunteer'].includes(user?.role);
  const rows  = data?.data || [];
  const total = data?.total || 0;

  // Summary stats
  const todayCount = rows.filter(d => d.distribution_date?.startsWith(new Date().toISOString().split('T')[0])).length;
  const byType = ITEM_TYPES.map(t => ({ type:t, count:rows.filter(d=>d.item_type===t).length })).filter(t=>t.count>0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Distributions d'Aide</h1>
          <p className="page-sub">{total.toLocaleString()} distributions · {todayCount} aujourd'hui</p>
        </div>
        {isAdmin && (
          <div style={{ display:'flex', gap:'8px' }}>
            <button className="btn-secondary btn-sm"><Download size={13}/> Exporter</button>
            <button onClick={()=>setModal(true)} className="btn-primary"><Plus size={14}/> Enregistrer</button>
          </div>
        )}
      </div>

      {/* Type breakdown */}
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
        {byType.map(t => (
          <button key={t.type} onClick={()=>setFilter(f=>({...f,item_type:f.item_type===t.type?'':t.type}))} style={{
            padding:'6px 12px', borderRadius:'100px', border:`1.5px solid ${filter.item_type===t.type?'var(--caramel)':'var(--lavezzi)'}`,
            background:filter.item_type===t.type?'rgba(201,168,76,0.08)':'var(--white-warm)',
            fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
            display:'flex', alignItems:'center', gap:'5px', color:'var(--text-main)',
          }}>
            <span>{TYPE_EMOJI[t.type]}</span>
            <span>{t.type.replace('_',' ')}</span>
            <span style={{ background:'var(--sand)', borderRadius:'10px', padding:'0 5px', fontSize:'11px', color:'var(--noisette)' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', padding:'12px 14px', background:'var(--white-warm)', borderRadius:'14px', border:'1px solid var(--lavezzi)' }}>
        <select className="input" style={{ width:'auto',minWidth:'160px' }} value={filter.item_type} onChange={e=>setFilter(f=>({...f,item_type:e.target.value}))}>
          <option value="">Tous les articles</option>
          {ITEM_TYPES.map(t=><option key={t} value={t}>{TYPE_EMOJI[t]} {t.replace('_',' ')}</option>)}
        </select>
        <select className="input" style={{ width:'auto',minWidth:'160px' }} value={filter.camp_id||''} onChange={e=>setFilter(f=>({...f,camp_id:e.target.value}))}>
          <option value="">Tous les camps</option>
          {(camps?.data||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        {isLoading ? (
          <div style={{ padding:'60px', textAlign:'center' }}><Loader2 size={28} className="spinner" style={{ color:'var(--akan)', margin:'0 auto' }}/></div>
        ) : rows.length===0 ? (
          <div className="empty-state"><Package size={40} style={{ opacity:0.25 }}/><p>Aucune distribution</p></div>
        ) : (
          <table className="tbl">
            <thead><tr>
              {['Date','Bénéficiaire','Article','Quantité','Camp','Distribué par','Actions'].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(d => (
                <tr key={d.id}>
                  <td style={{ fontSize:'12px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                    {new Date(d.distribution_date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
                  </td>
                  <td>
                    <p style={{ fontWeight:600, fontSize:'13px', color:'var(--text-main)' }}>{d.refugee_name||'—'}</p>
                    <p style={{ fontSize:'10px', fontFamily:'monospace', color:'var(--caramel-dark)' }}>{d.rid||''}</p>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ fontSize:'16px' }}>{TYPE_EMOJI[d.item_type]||'📦'}</span>
                      <div>
                        <span className={`badge ${TYPE_COLORS[d.item_type]||'badge-sand'}`} style={{ fontSize:'10px' }}>{d.item_type?.replace('_',' ')}</span>
                        {d.item_name && <p style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>{d.item_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:600, color:'var(--caramel)' }}>{d.quantity}</span>
                    <span style={{ fontSize:'11px', color:'var(--text-muted)', marginLeft:'4px' }}>{d.unit}</span>
                  </td>
                  <td style={{ fontSize:'12px', color:'var(--text-soft)' }}>{d.camp_name||'—'}</td>
                  <td style={{ fontSize:'12px', color:'var(--text-soft)' }}>{d.distributed_by_name||'—'}</td>
                  <td>
                    {isAdmin && (
                      <button onClick={()=>setDeleting(d.id)} className="btn-ghost btn-sm" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--white-warm)', borderRadius:'12px', border:'1px solid var(--lavezzi)' }}>
          <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>Page {page} · {total} distributions</span>
          <div style={{ display:'flex', gap:'6px' }}>
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-secondary btn-sm">Préc.</button>
            <button disabled={page>=Math.ceil(total/25)} onClick={()=>setPage(p=>p+1)} className="btn-secondary btn-sm">Suiv.</button>
          </div>
        </div>
      )}

      {modal   && <DistModal onClose={()=>setModal(null)} onSubmit={b=>createM.mutate(b)} loading={createM.isPending}/>}
      {deleting && (
        <div className="confirm-dialog">
          <div className="confirm-box">
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>🗑️</div>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'20px', marginBottom:'6px', color:'var(--text-main)' }}>Supprimer cette distribution ?</h3>
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
