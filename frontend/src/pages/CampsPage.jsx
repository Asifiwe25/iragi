import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, Users, Plus, Edit2, Trash2, X, Loader2, Package, AlertTriangle, TrendingUp, ChevronRight, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const DRC_PROVINCES = ['Nord-Kivu','Sud-Kivu','Ituri','Maniema','Kasaï','Katanga','Équateur','Kinshasa','Kongo-Central','Haut-Katanga','Tanganyika','Haut-Uélé','Bas-Uélé','Tshopo'];

function CampModal({ camp=null, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(camp || {
    name:'', region:'Nord-Kivu', territory:'', country:'République Démocratique du Congo',
    capacity:0, current_occupancy:0, description:'', latitude:'', longitude:'',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{camp?'Modifier le camp':'Nouveau camp'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Nom du camp *</label>
            <input required className="input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ex: Camp Mugunga"/>
          </div>
          <div>
            <label className="label">Province (DRC)</label>
            <select className="input" value={form.region||''} onChange={e=>set('region',e.target.value)}>
              {DRC_PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Territoire</label>
            <input className="input" value={form.territory||''} onChange={e=>set('territory',e.target.value)} placeholder="Ex: Goma"/>
          </div>
          <div>
            <label className="label">Capacité totale</label>
            <input type="number" min={0} className="input" value={form.capacity} onChange={e=>set('capacity',parseInt(e.target.value)||0)}/>
          </div>
          <div>
            <label className="label">Occupation actuelle</label>
            <input type="number" min={0} className="input" value={form.current_occupancy} onChange={e=>set('current_occupancy',parseInt(e.target.value)||0)}/>
          </div>
          <div>
            <label className="label">Latitude</label>
            <input type="number" step="0.0001" className="input" value={form.latitude||''} onChange={e=>set('latitude',e.target.value)} placeholder="-1.6833"/>
          </div>
          <div>
            <label className="label">Longitude</label>
            <input type="number" step="0.0001" className="input" value={form.longitude||''} onChange={e=>set('longitude',e.target.value)} placeholder="29.2167"/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Description</label>
            <textarea rows={3} className="input" style={{ resize:'vertical' }} value={form.description||''} onChange={e=>set('description',e.target.value)}/>
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

export default function CampsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('grid');

  const { data, isLoading } = useQuery({ queryKey:['camps'], queryFn:()=>api.get('/camps').then(r=>r.data) });

  const createM = useMutation({ mutationFn:b=>api.post('/camps',b), onSuccess:()=>{toast.success('Camp créé ✓');qc.invalidateQueries(['camps']);setModal(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const updateM = useMutation({ mutationFn:({id,...b})=>api.put(`/camps/${id}`,b), onSuccess:()=>{toast.success('Mis à jour ✓');qc.invalidateQueries(['camps']);setEditing(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const deleteM = useMutation({ mutationFn:id=>api.delete(`/camps/${id}`), onSuccess:()=>{toast.success('Supprimé');qc.invalidateQueries(['camps']);setDeleting(null);setSelected(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });

  const isAdmin = ['admin','volunteer'].includes(user?.role);
  const camps = data?.data || [];
  const totalCap = camps.reduce((a,c)=>a+(c.capacity||0),0);
  const totalOcc = camps.reduce((a,c)=>a+(c.current_occupancy||0),0);
  const avgOcc   = totalCap ? Math.round(totalOcc/totalCap*100) : 0;
  const critical  = camps.filter(c=>(parseFloat(c.occupancy_pct)||0)>=90).length;

  const getBar = (pct) => {
    if(pct >= 90) return 'var(--danger)';
    if(pct >= 75) return 'var(--tan)';
    return 'var(--caramel)';
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Camps & Centres</h1>
          <p className="page-sub">{camps.length} camps actifs · DRC</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <div style={{ display:'flex', background:'var(--sand)', borderRadius:'10px', padding:'3px', border:'1px solid var(--lavezzi)' }}>
            {[['grid','⊞'],['list','≡']].map(([v,icon]) => (
              <button key={v} onClick={()=>setView(v)} style={{ padding:'5px 10px', borderRadius:'7px', border:'none', cursor:'pointer', fontSize:'16px', transition:'all 0.2s', background:view===v?'linear-gradient(135deg,var(--caramel),var(--caramel-dark))':'transparent', color:view===v?'white':'var(--noisette)', fontFamily:'inherit' }}>{icon}</button>
            ))}
          </div>
          {isAdmin && <button onClick={()=>setModal(true)} className="btn-primary"><Plus size={14}/> Nouveau camp</button>}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px' }}>
        {[
          { label:'Total camps', value:camps.length, icon:'🏕️' },
          { label:'Capacité totale', value:totalCap.toLocaleString(), icon:'👥' },
          { label:'Occupation totale', value:totalOcc.toLocaleString(), icon:'🏠' },
          { label:'Taux moyen', value:`${avgOcc}%`, icon:'📊' },
          { label:'Camps critiques (>90%)', value:critical, icon:'⚠️' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{ padding:'16px' }}>
            <div style={{ fontSize:'24px', marginBottom:'6px' }}>{s.icon}</div>
            <div className="stat-num" style={{ fontSize:'28px' }}>{s.value}</div>
            <div className="stat-label" style={{ fontSize:'11px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        isLoading ? (
          <div style={{ textAlign:'center', padding:'60px' }}><Loader2 size={28} className="spinner" style={{ color:'var(--akan)', margin:'0 auto' }}/></div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px' }}>
            {camps.map(camp => {
              const pct = parseFloat(camp.occupancy_pct)||0;
              const barColor = getBar(pct);
              return (
                <div key={camp.id} style={{
                  background:'var(--white-warm)', border:`1px solid ${selected===camp.id?'var(--caramel)':'var(--lavezzi)'}`,
                  borderRadius:'20px', padding:'22px', cursor:'pointer',
                  transition:'all 0.3s', boxShadow:selected===camp.id?'0 8px 28px var(--shadow-md)':'none',
                }}
                onClick={()=>setSelected(selected===camp.id?null:camp.id)}
                onMouseEnter={e=>{if(selected!==camp.id){e.currentTarget.style.boxShadow='0 6px 24px var(--shadow-md)';e.currentTarget.style.borderColor='var(--caramel-soft)'}}}
                onMouseLeave={e=>{if(selected!==camp.id){e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='var(--lavezzi)'}}}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(201,168,76,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <MapPin size={18} style={{ color:'var(--caramel)' }}/>
                      </div>
                      <div>
                        <h3 style={{ fontWeight:700, fontSize:'15px', color:'var(--text-main)', marginBottom:'2px' }}>{camp.name}</h3>
                        <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{camp.region}, DRC</p>
                      </div>
                    </div>
                    {pct >= 90 && <span className="badge badge-warn" style={{ fontSize:'10px' }}><AlertTriangle size={10}/> Plein</span>}
                  </div>

                  {/* Occupancy bar */}
                  <div style={{ marginBottom:'14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>Occupation</span>
                      <span style={{ fontSize:'12px', fontWeight:700, color:pct>=90?'var(--danger)':'var(--text-main)' }}>{pct}%</span>
                    </div>
                    <div className="progress" style={{ height:'8px' }}>
                      <div className="progress-fill" style={{ width:`${Math.min(pct,100)}%`, background:`linear-gradient(90deg,${barColor}88,${barColor})` }}/>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' }}>
                    {[
                      { l:'Occupants', v:(camp.current_occupancy||0).toLocaleString() },
                      { l:'Capacité',  v:(camp.capacity||0).toLocaleString() },
                    ].map(s => (
                      <div key={s.l} style={{ background:'var(--cream)', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
                        <div style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:600, color:'var(--caramel)', lineHeight:1 }}>{s.v}</div>
                        <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'2px' }}>{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {camp.description && <p style={{ fontSize:'12px', color:'var(--text-soft)', lineHeight:1.5, marginBottom:'12px' }}>{camp.description.slice(0,80)}{camp.description.length>80?'...':''}</p>}

                  {/* Actions */}
                  {isAdmin && (
                    <div style={{ display:'flex', gap:'6px', justifyContent:'flex-end' }}>
                      <button onClick={e=>{e.stopPropagation();setEditing(camp);}} className="btn-secondary btn-sm"><Edit2 size={12}/> Modifier</button>
                      <button onClick={e=>{e.stopPropagation();setDeleting(camp.id);}} className="btn-ghost btn-sm" style={{ color:'var(--danger)' }}><Trash2 size={12}/></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              {['Nom','Province','Occupation','Capacité','%','Territoire','Actions'].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {camps.map(c => {
                const pct = parseFloat(c.occupancy_pct)||0;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(201,168,76,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <MapPin size={14} style={{ color:'var(--caramel)' }}/>
                        </div>
                        <span style={{ fontWeight:600, fontSize:'13px' }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:'12px', color:'var(--text-soft)' }}>{c.region}</td>
                    <td style={{ fontSize:'13px', fontWeight:600 }}>{(c.current_occupancy||0).toLocaleString()}</td>
                    <td style={{ fontSize:'13px', color:'var(--text-muted)' }}>{(c.capacity||0).toLocaleString()}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div className="progress" style={{ width:'80px', height:'6px' }}>
                          <div className="progress-fill" style={{ width:`${Math.min(pct,100)}%`, background:getBar(pct) }}/>
                        </div>
                        <span style={{ fontSize:'12px', fontWeight:700, color:pct>=90?'var(--danger)':'var(--text-main)', minWidth:'32px' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize:'12px', color:'var(--text-muted)' }}>{c.territory||'—'}</td>
                    <td>
                      {isAdmin && (
                        <div style={{ display:'flex', gap:'4px' }}>
                          <button onClick={()=>setEditing(c)} className="btn-ghost btn-sm"><Edit2 size={12}/></button>
                          <button onClick={()=>setDeleting(c.id)} className="btn-ghost btn-sm" style={{ color:'var(--danger)' }}><Trash2 size={12}/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal   && <CampModal onClose={()=>setModal(null)} onSubmit={b=>createM.mutate(b)} loading={createM.isPending}/>}
      {editing && <CampModal camp={editing} onClose={()=>setEditing(null)} onSubmit={b=>updateM.mutate({id:editing.id,...b})} loading={updateM.isPending}/>}
      {deleting && (
        <div className="confirm-dialog">
          <div className="confirm-box">
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>🗑️</div>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'20px', marginBottom:'6px', color:'var(--text-main)' }}>Supprimer ce camp ?</h3>
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
