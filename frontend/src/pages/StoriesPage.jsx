import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Loader2, Eye, EyeOff, Edit2, Trash2, Quote, MapPin, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['education','women','displacement','community','youth','hope','other'];
const CAT_EMOJIS = { education:'📚', women:'💜', displacement:'🚶', community:'🤝', youth:'⭐', hope:'🌟', other:'💬' };

function StoryModal({ story=null, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(story || { title:'', content:'', author_name:'', author_age:'', origin:'', category:'education', media_url:'', media_type:'none', is_anonymous:false, language:'fr', is_published:false });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'640px' }}>
        <div className="modal-header">
          <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:700, color:'var(--text-main)' }}>{story?'Modifier le témoignage':'Nouveau témoignage'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={16}/></button>
        </div>
        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Titre</label>
            <input className="input" value={form.title||''} onChange={e=>set('title',e.target.value)} placeholder="Titre du témoignage"/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Témoignage *</label>
            <textarea required rows={6} className="input" style={{ resize:'vertical' }} value={form.content} onChange={e=>set('content',e.target.value)} placeholder="Histoire, expérience, message..."/>
          </div>
          <div>
            <label className="label">Nom de l'auteur</label>
            <input className="input" value={form.author_name||''} onChange={e=>set('author_name',e.target.value)} placeholder="Prénom ou pseudonyme"/>
          </div>
          <div>
            <label className="label">Âge</label>
            <input type="number" className="input" value={form.author_age||''} onChange={e=>set('author_age',e.target.value)} min={1} max={100}/>
          </div>
          <div>
            <label className="label">Origine (Province, DRC)</label>
            <input className="input" value={form.origin||''} onChange={e=>set('origin',e.target.value)} placeholder="Ex: Nord-Kivu, Goma"/>
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select className="input" value={form.category} onChange={e=>set('category',e.target.value)}>
              {CATEGORIES.map(c=><option key={c} value={c}>{CAT_EMOJIS[c]} {c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Langue</label>
            <select className="input" value={form.language} onChange={e=>set('language',e.target.value)}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>
          <div>
            <label className="label">Type de média</label>
            <select className="input" value={form.media_type} onChange={e=>set('media_type',e.target.value)}>
              {['none','image','video','audio'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {form.media_type !== 'none' && (
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">URL du média</label>
              <input className="input" value={form.media_url||''} onChange={e=>set('media_url',e.target.value)} placeholder="https://..."/>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <input type="checkbox" id="anon" checked={form.is_anonymous} onChange={e=>set('is_anonymous',e.target.checked)} style={{ width:'16px', height:'16px', accentColor:'var(--caramel)' }}/>
            <label htmlFor="anon" style={{ fontSize:'13px', color:'var(--text-main)', cursor:'pointer' }}>Publier anonymement</label>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <input type="checkbox" id="pub" checked={form.is_published} onChange={e=>set('is_published',e.target.checked)} style={{ width:'16px', height:'16px', accentColor:'var(--caramel)' }}/>
            <label htmlFor="pub" style={{ fontSize:'13px', color:'var(--text-main)', cursor:'pointer' }}>Publier sur la homepage</label>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={()=>onSubmit(form)} disabled={loading} className="btn-primary">
            {loading&&<Loader2 size={15} className="spinner"/>} Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoriesPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState({ published:'', category:'' });

  const { data, isLoading } = useQuery({
    queryKey:['stories', filter],
    queryFn:()=>api.get('/stories', { params:{ ...filter, published:filter.published||undefined } }).then(r=>r.data),
  });

  const createM = useMutation({ mutationFn:b=>api.post('/stories',b), onSuccess:()=>{toast.success('Témoignage créé ✓');qc.invalidateQueries(['stories']);setModal(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const updateM = useMutation({ mutationFn:({id,...b})=>api.put(`/stories/${id}`,b), onSuccess:()=>{toast.success('Mis à jour ✓');qc.invalidateQueries(['stories']);setEditing(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const publishM = useMutation({ mutationFn:id=>api.put(`/stories/${id}/publish`), onSuccess:()=>{toast.success('Publié ✓');qc.invalidateQueries(['stories']);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const deleteM = useMutation({ mutationFn:id=>api.delete(`/stories/${id}`), onSuccess:()=>{toast.success('Supprimé');qc.invalidateQueries(['stories']);setDeleting(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });

  const stories = data?.data || [];
  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'30px', fontWeight:700, color:'var(--text-main)' }}>Voices of Resilience</h1>
          <p style={{ color:'var(--text-soft)', fontSize:'13px' }}>{data?.total||0} témoignages · {stories.filter(s=>s.is_published).length} publiés</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-primary"><Plus size={15}/> Nouveau témoignage</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
        <select className="input" style={{ width:'auto',minWidth:'140px',fontSize:'13px' }} value={filter.category} onChange={e=>setFilter(p=>({...p,category:e.target.value}))}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{CAT_EMOJIS[c]} {c}</option>)}
        </select>
        {isAdmin && (
          <select className="input" style={{ width:'auto',minWidth:'130px',fontSize:'13px' }} value={filter.published} onChange={e=>setFilter(p=>({...p,published:e.target.value}))}>
            <option value="">Tous</option>
            <option value="true">Publiés</option>
            <option value="false">Brouillons</option>
          </select>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--akan)' }}><Loader2 size={28} className="spinner" style={{ margin:'0 auto' }}/></div>
      ) : stories.length === 0 ? (
        <div className="empty-state"><Quote size={36} style={{ marginBottom:'12px', opacity:0.3 }}/><p>Aucun témoignage</p></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'18px' }}>
          {stories.map(s => (
            <div key={s.id} style={{ background:'var(--white-warm)', border:'1px solid var(--border)', borderRadius:'20px', padding:'24px', position:'relative', transition:'all 0.3s', display:'flex', flexDirection:'column', gap:'14px' }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 12px 36px rgba(74,55,40,0.1)';e.currentTarget.style.borderColor='var(--caramel-soft)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.borderColor='var(--border)'}}>
              {/* Status badge */}
              <div style={{ position:'absolute', top:'14px', right:'14px', display:'flex', gap:'4px' }}>
                {s.is_published ? <span className="badge badge-ok" style={{ fontSize:'10px' }}>Publié</span> : <span className="badge badge-noisette" style={{ fontSize:'10px' }}>Brouillon</span>}
              </div>
              {/* Category */}
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'22px' }}>{CAT_EMOJIS[s.category]||'💬'}</span>
                <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.15em', color:'var(--caramel)', textTransform:'uppercase' }}>{s.category}</span>
                <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>· {s.language?.toUpperCase()}</span>
              </div>
              {/* Title */}
              {s.title && <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)', lineHeight:1.2 }}>{s.title}</h3>}
              {/* Content */}
              <p style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'16px', fontStyle:'italic', color:'var(--text-main)', lineHeight:1.6, flex:1 }}>
                "{s.content.length > 220 ? s.content.slice(0,220)+'...' : s.content}"
              </p>
              <div className="gold-line"/>
              {/* Author */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-main)' }}>
                    {s.is_anonymous ? 'Anonyme' : (s.author_name || 'Inconnu')}
                    {s.author_age ? `, ${s.author_age} ans` : ''}
                  </p>
                  {s.origin && <p style={{ fontSize:'11px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'3px' }}><MapPin size={10}/>{s.origin}</p>}
                </div>
                {/* Actions */}
                {isAdmin && (
                  <div style={{ display:'flex', gap:'4px' }}>
                    {!s.is_published && <button onClick={()=>publishM.mutate(s.id)} className="btn-primary btn-sm" title="Publier"><Check size={12}/></button>}
                    <button onClick={()=>setEditing(s)} className="btn-ghost btn-sm"><Edit2 size={12}/></button>
                    <button onClick={()=>setDeleting(s.id)} className="btn-ghost btn-sm" style={{ color:'#C0745A' }}><Trash2 size={12}/></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal   && <StoryModal onClose={()=>setModal(null)} onSubmit={b=>createM.mutate(b)} loading={createM.isPending}/>}
      {editing && <StoryModal story={editing} onClose={()=>setEditing(null)} onSubmit={b=>updateM.mutate({id:editing.id,...b})} loading={updateM.isPending}/>}
      {deleting && (
        <div className="confirm-dialog">
          <div className="confirm-box">
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>🗑️</div>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'20px', marginBottom:'6px', color:'var(--text-main)' }}>Supprimer ce témoignage ?</h3>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginTop:'20px' }}>
              <button onClick={()=>setDeleting(null)} className="btn-secondary">Annuler</button>
              <button onClick={()=>deleteM.mutate(deleting)} className="btn-danger">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
