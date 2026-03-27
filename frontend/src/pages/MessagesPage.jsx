import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { Send, Plus, X, Loader2, MessageSquare, Inbox, Reply, Trash2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

function timeAgo(d) {
  try {
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
    return new Date(d).toLocaleDateString('fr-FR');
  } catch { return ''; }
}

function NewMsgModal({ onClose, onSubmit, loading, users }) {
  const { t } = useLang();
  const [form, setForm] = useState({ to_user_id:'', subject:'', body:'' });
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:700, color:'var(--text-main)' }}>{t('msg_new')}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={16}/></button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div>
            <label className="label">{t('msg_to')} *</label>
            <select className="input" value={form.to_user_id} onChange={e=>setForm(f=>({...f,to_user_id:e.target.value}))}>
              <option value="">-- Sélectionner un destinataire --</option>
              {(users||[]).map(u=><option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('msg_subject')} *</label>
            <input className="input" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/>
          </div>
          <div>
            <label className="label">{t('msg_body')} *</label>
            <textarea className="input" rows={5} style={{ resize:'vertical' }} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}/>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
          <button onClick={()=>onSubmit(form)} disabled={loading||!form.to_user_id||!form.subject||!form.body} className="btn-primary">
            {loading?<Loader2 size={15} className="spinner"/>:<Send size={15}/>} {t('msg_send')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('inbox');
  const [selected, setSelected] = useState(null);
  const [newMsg, setNewMsg] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const { data:inbox }   = useQuery({ queryKey:['messages-inbox'],   queryFn:()=>api.get('/messages/inbox').then(r=>r.data).catch(()=>({data:[]})) });
  const { data:sent }    = useQuery({ queryKey:['messages-sent'],    queryFn:()=>api.get('/messages/sent').then(r=>r.data).catch(()=>({data:[]})) });
  const { data:publicM } = useQuery({ queryKey:['messages-public'],  queryFn:()=>api.get('/messages/public-list').then(r=>r.data).catch(()=>({data:[]})), enabled:isAdmin });
  const { data:users }   = useQuery({ queryKey:['users-list'],       queryFn:()=>api.get('/users').then(r=>r.data).catch(()=>({data:[]})) });

  const sendM   = useMutation({ mutationFn:b=>api.post('/messages',b), onSuccess:()=>{toast.success('Message envoyé ✓');qc.invalidateQueries(['messages-inbox','messages-sent']);setNewMsg(false);}, onError:e=>toast.error(e.response?.data?.error||'Erreur') });
  const readM   = useMutation({ mutationFn:id=>api.put(`/messages/${id}/read`), onSuccess:()=>qc.invalidateQueries(['messages-inbox','messages-unread']) });
  const deleteM = useMutation({ mutationFn:id=>api.delete(`/messages/${id}`), onSuccess:()=>{toast.success('Supprimé');qc.invalidateQueries(['messages-inbox','messages-sent','messages-public']);setSelected(null);} });

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    setReplyLoading(true);
    try {
      await api.post(`/messages/${selected.id}/reply`, { reply_body:replyBody });
      toast.success('Réponse envoyée par email ✓');
      setReplyBody('');
      qc.invalidateQueries(['messages-public','messages-inbox']);
    } catch(e) { toast.error(e.response?.data?.error||'Erreur'); }
    finally { setReplyLoading(false); }
  };

  const getMessages = () => {
    if (tab==='inbox')  return inbox?.data  || [];
    if (tab==='sent')   return sent?.data   || [];
    if (tab==='public') return publicM?.data || [];
    return [];
  };

  const msgs = getMessages();
  const tabs = [
    { key:'inbox',  label:t('msg_inbox'),     count:(inbox?.data||[]).filter(m=>!m.read_at).length },
    { key:'sent',   label:t('msg_sent') },
    ...(isAdmin ? [{ key:'public', label:t('msg_from_site'), count:(publicM?.data||[]).filter(m=>!m.read_at&&!m.replied_at).length }] : []),
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'20px', height:'calc(100vh - 110px)' }}>
      {/* Left: list */}
      <div style={{ background:'var(--white-warm)', borderRadius:'20px', border:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'18px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'20px', fontWeight:700, color:'var(--text-main)' }}>{t('dash_messages')}</h2>
            <button onClick={()=>setNewMsg(true)} className="btn-primary btn-sm"><Plus size={13}/></button>
          </div>
          <div style={{ display:'flex', gap:'4px', background:'var(--sand)', borderRadius:'10px', padding:'3px' }}>
            {tabs.map(tb => (
              <button key={tb.key} onClick={()=>setTab(tb.key)} style={{ flex:1, padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, transition:'all 0.2s', background:tab===tb.key?'linear-gradient(135deg,var(--caramel),var(--caramel-dark))':'transparent', color:tab===tb.key?'white':'var(--noisette)', fontFamily:'inherit', position:'relative' }}>
                {tb.label}
                {tb.count>0 && <span style={{ position:'absolute', top:'-3px', right:'-3px', background:'#C0745A', color:'white', fontSize:'9px', fontWeight:700, padding:'1px 4px', borderRadius:'6px', minWidth:'14px', textAlign:'center', lineHeight:'12px' }}>{tb.count}</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {msgs.length===0 ? (
            <div className="empty-state" style={{ padding:'40px 20px' }}>
              <MessageSquare size={28} style={{ marginBottom:'8px', opacity:0.3 }}/>
              <p style={{ fontSize:'13px' }}>Aucun message</p>
            </div>
          ) : msgs.map(msg => {
            const isUnread = !msg.read_at && tab==='inbox';
            const needsReply = tab==='public' && !msg.replied_at;
            return (
              <button key={msg.id} onClick={()=>{ setSelected(msg); if(isUnread) readM.mutate(msg.id); }} style={{
                width:'100%', padding:'14px 18px', textAlign:'left', border:'none', cursor:'pointer',
                borderBottom:'1px solid var(--lavezzi)', transition:'background 0.15s',
                background: selected?.id===msg.id ? 'rgba(201,168,76,0.08)' : isUnread ? 'rgba(201,168,76,0.04)' : 'transparent',
              }}
              onMouseEnter={e=>{ if(selected?.id!==msg.id) e.currentTarget.style.background='rgba(201,168,76,0.06)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background=selected?.id===msg.id?'rgba(201,168,76,0.08)':isUnread?'rgba(201,168,76,0.04)':'transparent' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                  <span style={{ fontSize:'13px', fontWeight:isUnread?700:500, color:'var(--text-main)' }}>
                    {tab==='inbox' ? (msg.from_user_name||msg.from_name||'Inconnu') : tab==='public' ? (msg.from_name||msg.from_email) : msg.to_user_name}
                  </span>
                  <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>{timeAgo(msg.created_at)}</span>
                </div>
                <p style={{ fontSize:'12px', fontWeight:600, color:'var(--text-soft)', marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{msg.subject}</p>
                <p style={{ fontSize:'11px', color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{msg.body?.slice(0,60)}...</p>
                <div style={{ display:'flex', gap:'4px', marginTop:'4px' }}>
                  {isUnread && <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--caramel)', display:'inline-block' }}/>}
                  {needsReply && <span style={{ fontSize:'9px', background:'rgba(192,116,90,0.12)', color:'#8B3A2C', padding:'1px 6px', borderRadius:'4px', fontWeight:700 }}>Sans réponse</span>}
                  {msg.replied_at && <span style={{ fontSize:'9px', background:'rgba(122,158,100,0.12)', color:'#3D6A2C', padding:'1px 6px', borderRadius:'4px', fontWeight:700 }}>Répondu</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: detail */}
      <div style={{ background:'var(--white-warm)', borderRadius:'20px', border:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {selected ? (
          <>
            <div style={{ padding:'24px', borderBottom:'1px solid var(--border)', background:'var(--cream)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:700, color:'var(--text-main)', marginBottom:'6px' }}>{selected.subject}</h3>
                  <p style={{ fontSize:'13px', color:'var(--text-soft)' }}>
                    {tab==='inbox' || tab==='public' ? `De: ${selected.from_user_name||selected.from_name||selected.from_email||'Inconnu'}` : `À: ${selected.to_user_name}`}
                    {selected.from_email && tab==='public' && ` <${selected.from_email}>`}
                    &nbsp;· {timeAgo(selected.created_at)}
                  </p>
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={()=>deleteM.mutate(selected.id)} className="btn-ghost btn-sm" style={{ color:'#C0745A' }} title="Supprimer"><Trash2 size={14}/></button>
                  <button onClick={()=>setSelected(null)} className="btn-ghost btn-sm"><X size={14}/></button>
                </div>
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>
              <p style={{ color:'var(--text-main)', lineHeight:1.8, fontSize:'15px', whiteSpace:'pre-wrap' }}>{selected.body}</p>

              {/* Show previous reply if exists */}
              {selected.reply_body && (
                <div style={{ marginTop:'24px', padding:'18px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'14px' }}>
                  <p style={{ fontSize:'11px', fontWeight:700, color:'var(--caramel)', marginBottom:'8px', letterSpacing:'0.08em', textTransform:'uppercase' }}>Réponse envoyée le {new Date(selected.replied_at).toLocaleDateString('fr-FR')}</p>
                  <p style={{ color:'var(--text-main)', fontSize:'14px', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{selected.reply_body}</p>
                </div>
              )}
            </div>

            {/* Reply box (admin only, for public messages or inbox) */}
            {isAdmin && (tab==='public' || tab==='inbox') && (
              <div style={{ padding:'20px', borderTop:'1px solid var(--border)', background:'var(--cream)' }}>
                {tab==='public' && <p style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'8px', display:'flex', alignItems:'center', gap:'4px' }}><Globe size={12}/> La réponse sera envoyée par email à <strong>{selected.from_email}</strong></p>}
                <div style={{ display:'flex', gap:'10px' }}>
                  <textarea className="input" rows={3} style={{ resize:'none', flex:1 }} placeholder="Écrire votre réponse..." value={replyBody} onChange={e=>setReplyBody(e.target.value)}/>
                  <button onClick={handleReply} disabled={replyLoading||!replyBody.trim()} className="btn-primary" style={{ alignSelf:'flex-end', flexShrink:0 }}>
                    {replyLoading ? <Loader2 size={15} className="spinner"/> : <Reply size={15}/>} Répondre
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state" style={{ flex:1 }}>
            <MessageSquare size={44} style={{ marginBottom:'14px', opacity:0.25 }}/>
            <p style={{ fontSize:'15px', fontWeight:500 }}>Sélectionner un message</p>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', marginTop:'4px' }}>Choisissez un message dans la liste</p>
          </div>
        )}
      </div>

      {newMsg && <NewMsgModal onClose={()=>setNewMsg(false)} onSubmit={b=>sendM.mutate(b)} loading={sendM.isPending} users={users?.data||[]}/>}
    </div>
  );
}
