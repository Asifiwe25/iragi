import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Save, Key, Loader2, User, Mail, Phone, Globe, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const { t } = useLang();
  const qc = useQueryClient();
  const [profile, setProfile] = useState({ name:user?.name||'', phone:user?.phone||'', country:user?.country||'', bio:user?.bio||'', avatar_url:user?.avatar_url||'' });
  const [pwdForm, setPwdForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [tab, setTab] = useState('profile');

  const updateM = useMutation({
    mutationFn: b => api.put('/auth/profile', b),
    onSuccess: (data) => { toast.success('Profil mis à jour ✓'); qc.invalidateQueries(['me']); },
    onError: e => toast.error(e.response?.data?.error||'Erreur'),
  });

  const pwdM = useMutation({
    mutationFn: b => api.put('/auth/change-password', b),
    onSuccess: () => { toast.success('Mot de passe changé ✓'); setPwdForm({ currentPassword:'', newPassword:'', confirm:'' }); },
    onError: e => toast.error(e.response?.data?.error||'Erreur'),
  });

  const handlePwd = (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('Minimum 6 caractères'); return; }
    pwdM.mutate({ currentPassword:pwdForm.currentPassword, newPassword:pwdForm.newPassword });
  };

  const ROLE_LABELS = { admin:'Admin', refugee:'Réfugié', donor:'Donateur', volunteer:'Volontaire', partner:'Partenaire' };

  return (
    <div style={{ maxWidth:'680px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'20px', padding:'28px', background:'var(--white-warm)', borderRadius:'20px', border:'1px solid var(--border)' }}>
        <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,var(--caramel),var(--caramel-dark))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'28px', flexShrink:0, fontFamily:'"Cormorant Garamond",serif' }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'26px', fontWeight:700, color:'var(--text-main)', marginBottom:'4px' }}>{user?.name}</h1>
          <p style={{ fontSize:'13px', color:'var(--text-soft)', marginBottom:'6px' }}>{user?.email}</p>
          <span style={{ fontSize:'11px', background:'rgba(201,168,76,0.12)', color:'var(--caramel-dark)', padding:'3px 10px', borderRadius:'20px', fontWeight:700 }}>{ROLE_LABELS[user?.role]||user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'var(--sand)', borderRadius:'12px', padding:'3px', border:'1px solid var(--border)', gap:'3px' }}>
        {[['profile','Mon profil'],['password','Mot de passe']].map(([key,label]) => (
          <button key={key} onClick={()=>setTab(key)} style={{ flex:1, padding:'9px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600, transition:'all 0.2s', background:tab===key?'linear-gradient(135deg,var(--caramel),var(--caramel-dark))':'transparent', color:tab===key?'white':'var(--noisette)', fontFamily:'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ background:'var(--white-warm)', borderRadius:'20px', border:'1px solid var(--border)', padding:'28px' }}>
          <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:700, color:'var(--text-main)', marginBottom:'24px' }}>Informations personnelles</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {[
              { key:'name',    label:'Nom complet', icon:User,     type:'text', req:true },
              { key:'phone',   label:'Téléphone',   icon:Phone,    type:'tel' },
              { key:'country', label:'Pays',        icon:Globe,    type:'text' },
              { key:'avatar_url', label:'Photo (URL)', icon:User,  type:'url' },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.key}>
                  <label className="label">{f.label}{f.req?' *':''}</label>
                  <div style={{ position:'relative' }}>
                    <Icon size={14} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--akan)' }}/>
                    <input required={f.req} type={f.type} className="input" style={{ paddingLeft:'36px' }}
                      value={profile[f.key]||''} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))}/>
                  </div>
                </div>
              );
            })}
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Bio / Description</label>
              <div style={{ position:'relative' }}>
                <FileText size={14} style={{ position:'absolute', left:'12px', top:'14px', color:'var(--akan)' }}/>
                <textarea rows={4} className="input" style={{ paddingLeft:'36px', resize:'vertical' }}
                  value={profile.bio||''} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} placeholder="Parlez-vous un peu de vous..."/>
              </div>
            </div>
          </div>
          <div style={{ marginTop:'20px', display:'flex', justifyContent:'flex-end' }}>
            <button onClick={()=>updateM.mutate(profile)} disabled={updateM.isPending} className="btn-primary">
              {updateM.isPending ? <Loader2 size={15} className="spinner"/> : <Save size={15}/>} Enregistrer les modifications
            </button>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <form onSubmit={handlePwd} style={{ background:'var(--white-warm)', borderRadius:'20px', border:'1px solid var(--border)', padding:'28px' }}>
          <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:700, color:'var(--text-main)', marginBottom:'24px' }}>Changer le mot de passe</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {[
              { k:'currentPassword', l:'Mot de passe actuel *' },
              { k:'newPassword',     l:'Nouveau mot de passe *' },
              { k:'confirm',         l:'Confirmer le nouveau mot de passe *' },
            ].map(f => (
              <div key={f.k}>
                <label className="label">{f.l}</label>
                <div style={{ position:'relative' }}>
                  <Key size={14} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--akan)' }}/>
                  <input required type="password" minLength={f.k!=='currentPassword'?6:1} className="input" style={{ paddingLeft:'36px' }}
                    value={pwdForm[f.k]} onChange={e=>setPwdForm(p=>({...p,[f.k]:e.target.value}))}/>
                </div>
              </div>
            ))}
            <div style={{ padding:'12px 16px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'12px' }}>
              <p style={{ fontSize:'12px', color:'var(--noisette)' }}>• Minimum 6 caractères · Utilisez lettres, chiffres et symboles pour plus de sécurité</p>
            </div>
          </div>
          <div style={{ marginTop:'20px', display:'flex', justifyContent:'flex-end' }}>
            <button type="submit" disabled={pwdM.isPending} className="btn-primary">
              {pwdM.isPending ? <Loader2 size={15} className="spinner"/> : <Key size={15}/>} Changer le mot de passe
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
