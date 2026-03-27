import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { Plus, X, Loader2, Check, Ban, Trash2, Edit2, UserCheck, UserX, Key, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['admin','volunteer','donor','partner','refugee'];
const STATUSES = ['pending','approved','rejected','suspended'];
const ROLE_COLORS = { admin:'badge-gold', volunteer:'badge-ok', donor:'badge-blossom', partner:'badge-noisette', refugee:'badge-soft' };
const STATUS_COLORS = { approved:'badge-ok', pending:'badge-noisette', rejected:'badge-warn', suspended:'badge-soft' };

function UserModal({ user=null, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(user || { name:'', email:'', password:'', role:'volunteer', phone:'', country:'', bio:'', is_active:true, status:'approved' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'580px' }}>
        <div className="modal-header">
          <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:700, color:'var(--text-main)' }}>{user?'Modifier l\'utilisateur':'Nouvel utilisateur'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={16}/></button>
        </div>
        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <div>
            <label className="label">Nom complet *</label>
            <input required className="input" value={form.name} onChange={e=>set('name',e.target.value)}/>
          </div>
          <div>
            <label className="label">Email *</label>
            <input required type="email" className="input" value={form.email} onChange={e=>set('email',e.target.value)}/>
          </div>
          {!user && (
            <div>
              <label className="label">Mot de passe *</label>
              <input required type="password" minLength={6} className="input" value={form.password} onChange={e=>set('password',e.target.value)}/>
            </div>
          )}
          <div>
            <label className="label">Rôle *</label>
            <select className="input" value={form.role} onChange={e=>set('role',e.target.value)}>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.phone||''} onChange={e=>set('phone',e.target.value)}/>
          </div>
          <div>
            <label className="label">Pays</label>
            <input className="input" value={form.country||''} onChange={e=>set('country',e.target.value)}/>
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input" value={form.status} onChange={e=>set('status',e.target.value)}>
              {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <input type="checkbox" id="active" checked={form.is_active} onChange={e=>set('is_active',e.target.checked)} style={{ width:'16px', height:'16px', accentColor:'var(--caramel)' }}/>
            <label htmlFor="active" style={{ fontSize:'14px', color:'var(--text-main)', cursor:'pointer' }}>Compte actif</label>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Bio / Notes</label>
            <textarea rows={3} className="input" style={{ resize:'vertical' }} value={form.bio||''} onChange={e=>set('bio',e.target.value)}/>
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

function ResetPassModal({ user, onClose, onSubmit, loading }) {
  const [pwd, setPwd] = useState('');
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'400px' }}>
        <div className="modal-header">
          <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'20px', fontWeight:700, color:'var(--text-main)' }}>Réinitialiser le mot de passe</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={16}/></button>
        </div>
        <div className="modal-body">
          <p style={{ color:'var(--text-soft)', fontSize:'14px', marginBottom:'12px' }}>Nouveau mot de passe pour <strong>{user.name}</strong></p>
          <label className="label">Nouveau mot de passe *</label>
          <input type="password" minLength={6} className="input" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Min. 6 caractères"/>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={()=>onSubmit(pwd)} disabled={loading||pwd.length<6} className="btn-primary">
            {loading&&<Loader2 size={15} className="spinner"/>} <Key size={14}/> Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', tab, search, roleFilter],
    queryFn: () => api.get('/users', { params: { status:tab==='pending'?'pending':tab==='all'?'':tab, search, role:roleFilter } }).then(r=>r.data),
  });

  const createM = useMutation({ mutationFn:b=>api.post('/users',b), onSuccess:()=>{toast.success('Utilisateur créé ✓');qc.invalidateQueries(['users']);setModal(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const updateM = useMutation({ mutationFn:({id,...b})=>api.put(`/users/${id}`,b), onSuccess:()=>{toast.success('Mis à jour ✓');qc.invalidateQueries(['users']);setEditing(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const approveM = useMutation({ mutationFn:id=>api.put(`/users/${id}/approve`), onSuccess:()=>{toast.success('✅ Utilisateur approuvé');qc.invalidateQueries(['users']);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const rejectM  = useMutation({ mutationFn:id=>api.put(`/users/${id}/reject`), onSuccess:()=>{toast.success('Utilisateur rejeté');qc.invalidateQueries(['users']);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const suspendM = useMutation({ mutationFn:id=>api.put(`/users/${id}/suspend`), onSuccess:()=>{toast.success('Suspendu');qc.invalidateQueries(['users']);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const resetM   = useMutation({ mutationFn:({id,pwd})=>api.put(`/users/${id}/reset-password`,{newPassword:pwd}), onSuccess:()=>{toast.success('Mot de passe réinitialisé');setResetting(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const deleteM  = useMutation({ mutationFn:id=>api.delete(`/users/${id}`), onSuccess:()=>{toast.success('Supprimé');qc.invalidateQueries(['users']);setDeleting(null);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });

  const users = data?.data || [];
  const stats = data?.stats || [];
  const pending = stats.filter(s=>s.status==='pending').reduce((a,s)=>a+parseInt(s.count),0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'30px', fontWeight:700, color:'var(--text-main)' }}>{t('users_title')}</h1>
          <p style={{ color:'var(--text-soft)', fontSize:'13px' }}>{data?.total||0} utilisateurs · {pending} en attente</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-primary"><Plus size={15}/>{t('users_new')}</button>
      </div>

      {/* Stats by role */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'10px' }}>
        {ROLES.map(role => {
          const count = stats.filter(s=>s.role===role).reduce((a,s)=>a+parseInt(s.count),0);
          return (
            <div key={role} style={{ background:'var(--white-warm)', border:'1px solid var(--border)', borderRadius:'14px', padding:'14px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', borderColor:roleFilter===role?'var(--caramel)':'var(--border)' }}
              onClick={()=>setRoleFilter(roleFilter===role?'':role)}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--caramel-soft)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor=roleFilter===role?'var(--caramel)':'var(--border)'}>
              <div style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'28px', fontWeight:600, color:'var(--caramel)', lineHeight:1 }}>{count}</div>
              <div style={{ fontSize:'11px', fontWeight:600, color:'var(--noisette)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:'4px' }}>{role}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs + search */}
      <div style={{ display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', background:'var(--sand)', borderRadius:'12px', padding:'3px', border:'1px solid var(--border)' }}>
          {[['all','Tous'],['pending','En attente'],['approved','Approuvés'],['suspended','Suspendus']].map(([key,label]) => (
            <button key={key} onClick={()=>setTab(key)} style={{ padding:'7px 14px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600, transition:'all 0.2s', background:tab===key?'linear-gradient(135deg,var(--caramel),var(--caramel-dark))':'transparent', color:tab===key?'white':'var(--noisette)', position:'relative' }}>
              {label}
              {key==='pending' && pending>0 && <span style={{ position:'absolute', top:'-4px', right:'-4px', background:'#C0745A', color:'white', fontSize:'9px', fontWeight:700, padding:'1px 4px', borderRadius:'6px', minWidth:'14px', textAlign:'center' }}>{pending}</span>}
            </button>
          ))}
        </div>
        <input className="input" style={{ maxWidth:'240px', fontSize:'13px' }} placeholder={t('search')} value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ padding:'60px', textAlign:'center', color:'var(--akan)' }}>
            <Loader2 size={28} className="spinner" style={{ margin:'0 auto 12px' }}/>
          </div>
        ) : users.length===0 ? (
          <div className="empty-state"><p>Aucun utilisateur</p></div>
        ) : (
          <table className="tbl">
            <thead><tr>
              {['Utilisateur','Rôle','Statut','Pays','Dernière connexion','Actions'].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,var(--caramel),var(--caramel-dark))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'14px', flexShrink:0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight:600, color:'var(--text-main)', fontSize:'13px' }}>{u.name}</p>
                        <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{u.email}</p>
                        {u.phone && <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{u.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${ROLE_COLORS[u.role]||'badge-soft'}`}>{u.role}</span></td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[u.status]||'badge-soft'}`}>{u.status}</span>
                    {!u.email_verified && <span className="badge badge-warn" style={{ marginLeft:'4px', fontSize:'10px' }}>Email non vérifié</span>}
                  </td>
                  <td style={{ fontSize:'13px', color:'var(--text-soft)' }}>{u.country||'—'}</td>
                  <td style={{ fontSize:'12px', color:'var(--text-muted)' }}>
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      {u.status==='pending' && (
                        <>
                          <button onClick={()=>approveM.mutate(u.id)} disabled={approveM.isPending} className="btn-primary btn-sm" title="Approuver"><Check size={12}/></button>
                          <button onClick={()=>rejectM.mutate(u.id)} className="btn-danger btn-sm" title="Rejeter"><UserX size={12}/></button>
                        </>
                      )}
                      {u.status==='approved' && <button onClick={()=>suspendM.mutate(u.id)} className="btn-secondary btn-sm" title="Suspendre"><Ban size={12}/></button>}
                      {u.status==='suspended' && <button onClick={()=>approveM.mutate(u.id)} className="btn-primary btn-sm" title="Réactiver"><UserCheck size={12}/></button>}
                      <button onClick={()=>setEditing(u)} className="btn-ghost btn-sm" title="Modifier"><Edit2 size={12}/></button>
                      <button onClick={()=>setResetting(u)} className="btn-ghost btn-sm" title="Réinitialiser mot de passe"><Key size={12}/></button>
                      <button onClick={()=>setDeleting(u.id)} className="btn-ghost btn-sm" style={{ color:'#C0745A' }} title="Supprimer"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal    && <UserModal onClose={()=>setModal(null)} onSubmit={b=>createM.mutate(b)} loading={createM.isPending}/>}
      {editing  && <UserModal user={editing} onClose={()=>setEditing(null)} onSubmit={b=>updateM.mutate({id:editing.id,...b})} loading={updateM.isPending}/>}
      {resetting && <ResetPassModal user={resetting} onClose={()=>setResetting(null)} onSubmit={pwd=>resetM.mutate({id:resetting.id,pwd})} loading={resetM.isPending}/>}
      {deleting && (
        <div className="confirm-dialog">
          <div className="confirm-box">
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>⚠️</div>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'20px', marginBottom:'6px', color:'var(--text-main)' }}>Supprimer cet utilisateur ?</h3>
            <p style={{ color:'var(--text-soft)', fontSize:'13px', marginBottom:'20px' }}>Cette action est irréversible.</p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <button onClick={()=>setDeleting(null)} className="btn-secondary">Annuler</button>
              <button onClick={()=>deleteM.mutate(deleting)} className="btn-danger">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
