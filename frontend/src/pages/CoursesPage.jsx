import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import {
  Plus, X, Loader2, BookOpen, Video, FileText,
  Music, Edit2, Trash2, Eye, EyeOff, Users,
  Play, Upload, Link as LinkIcon, ChevronRight, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

const SUBJECTS = ['literacy','mathematics','language','science','life_skills','digital','arts','other'];
const LEVELS   = ['beginner','intermediate','advanced','all'];
const CONTENT_TYPES = ['video','document','audio','text','quiz','link'];
const SUBJECT_EMOJI = { literacy:'📖', mathematics:'🔢', language:'🌍', science:'🔬', life_skills:'⭐', digital:'💻', arts:'🎨', other:'📚' };
const CONTENT_ICON  = { video:Video, document:FileText, audio:Music, text:FileText, quiz:BookOpen, link:LinkIcon };

function CourseFormModal({ course=null, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(course || {
    title:'', description:'', subject:'literacy', level:'beginner',
    target_age_min:5, target_age_max:18, language:'fr',
    duration_hours:10, cover_url:'', is_published:false
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'580px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{course?'Modifier le cours':'Nouveau cours'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Titre *</label>
            <input required className="input" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Ex: Apprendre à Lire — Niveau 1"/>
          </div>
          <div>
            <label className="label">Matière</label>
            <select className="input" value={form.subject} onChange={e=>set('subject',e.target.value)}>
              {SUBJECTS.map(s=><option key={s} value={s}>{SUBJECT_EMOJI[s]} {s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Niveau</label>
            <select className="input" value={form.level} onChange={e=>set('level',e.target.value)}>
              {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Âge min</label>
            <input type="number" min={1} max={99} className="input" value={form.target_age_min} onChange={e=>set('target_age_min',parseInt(e.target.value))}/>
          </div>
          <div>
            <label className="label">Âge max</label>
            <input type="number" min={1} max={99} className="input" value={form.target_age_max} onChange={e=>set('target_age_max',parseInt(e.target.value))}/>
          </div>
          <div>
            <label className="label">Langue</label>
            <select className="input" value={form.language} onChange={e=>set('language',e.target.value)}>
              <option value="fr">Français</option>
              <option value="sw">Kiswahili</option>
              <option value="en">English</option>
              <option value="ln">Lingala</option>
            </select>
          </div>
          <div>
            <label className="label">Durée totale (heures)</label>
            <input type="number" min={1} className="input" value={form.duration_hours} onChange={e=>set('duration_hours',parseInt(e.target.value))}/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Image de couverture (URL)</label>
            <input className="input" value={form.cover_url||''} onChange={e=>set('cover_url',e.target.value)} placeholder="https://...image.jpg"/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Description</label>
            <textarea rows={3} className="input" style={{ resize:'vertical' }} value={form.description||''} onChange={e=>set('description',e.target.value)}/>
          </div>
          <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:'10px' }}>
            <input type="checkbox" id="pub" checked={form.is_published} onChange={e=>set('is_published',e.target.checked)} style={{ width:'16px', height:'16px', accentColor:'var(--caramel)' }}/>
            <label htmlFor="pub" style={{ fontSize:'13px', cursor:'pointer', color:'var(--text-main)' }}>Publier ce cours (visible aux élèves)</label>
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

function LessonModal({ courseId, lesson=null, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(lesson || {
    title:'', description:'', content_type:'video',
    content_url:'', content_text:'', duration_min:30, is_free:true
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Simulate file upload — in production, use Cloudinary/S3
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Create a local object URL for preview (in production: upload to cloud storage)
      const url = URL.createObjectURL(file);
      set('content_url', url);
      set('item_name', file.name);
      toast.success(`Fichier sélectionné: ${file.name}`);
      // In production with Cloudinary configured:
      // const formData = new FormData();
      // formData.append('file', file);
      // const res = await api.post('/upload', formData);
      // set('content_url', res.data.url);
    } catch(err) { toast.error('Erreur upload'); }
    finally { setUploading(false); }
  };

  const acceptMap = { video:'video/*', document:'.pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt', audio:'audio/*', text:'text/*', link:'*/*' };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'580px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{lesson?'Modifier la leçon':'Nouvelle leçon'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Titre de la leçon *</label>
            <input required className="input" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Ex: Introduction à la lecture"/>
          </div>
          <div>
            <label className="label">Type de contenu</label>
            <select className="input" value={form.content_type} onChange={e=>set('content_type',e.target.value)}>
              {CONTENT_TYPES.map(t => {
                const icons = { video:'🎬', document:'📄', audio:'🎵', text:'📝', quiz:'❓', link:'🔗' };
                return <option key={t} value={t}>{icons[t]} {t}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="label">Durée (minutes)</label>
            <input type="number" min={1} className="input" value={form.duration_min} onChange={e=>set('duration_min',parseInt(e.target.value))}/>
          </div>

          {/* Upload section */}
          {['video','document','audio'].includes(form.content_type) && (
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Contenu ({form.content_type})</label>
              {/* Upload zone */}
              <div
                className="upload-zone"
                onClick={()=>fileRef.current?.click()}
                style={{ marginBottom:'10px' }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={acceptMap[form.content_type]}
                  style={{ display:'none' }}
                  onChange={handleFileUpload}
                />
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>
                  {form.content_type==='video'?'🎬':form.content_type==='audio'?'🎵':'📄'}
                </div>
                {uploading ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}>
                    <Loader2 size={16} className="spinner" style={{ color:'var(--caramel)' }}/>
                    <span style={{ fontSize:'13px', color:'var(--text-soft)' }}>Upload en cours...</span>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize:'14px', fontWeight:600, color:'var(--text-main)', marginBottom:'4px' }}>
                      Cliquer pour uploader un {form.content_type}
                    </p>
                    <p style={{ fontSize:'12px', color:'var(--text-muted)' }}>
                      {form.content_type==='video'?'MP4, AVI, MOV, WebM':form.content_type==='audio'?'MP3, WAV, OGG, M4A':'PDF, Word, PowerPoint, Excel'}
                    </p>
                  </>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'8px 0' }}>
                <div style={{ flex:1, height:'1px', background:'var(--lavezzi)' }}/>
                <span style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600 }}>OU</span>
                <div style={{ flex:1, height:'1px', background:'var(--lavezzi)' }}/>
              </div>
              <label className="label">URL du contenu (YouTube, Drive, etc.)</label>
              <input className="input" value={form.content_url||''} onChange={e=>set('content_url',e.target.value)}
                placeholder={form.content_type==='video'?'https://youtube.com/watch?v=...':'https://drive.google.com/...'}/>
              {form.content_url && form.content_type==='video' && (
                <a href={form.content_url} target="_blank" rel="noreferrer" style={{ fontSize:'12px', color:'var(--caramel)', display:'inline-flex', alignItems:'center', gap:'4px', marginTop:'6px' }}>
                  <Play size={12}/> Prévisualiser
                </a>
              )}
            </div>
          )}

          {['text','quiz'].includes(form.content_type) && (
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Contenu de la leçon</label>
              <textarea rows={6} className="input" style={{ resize:'vertical' }} value={form.content_text||''} onChange={e=>set('content_text',e.target.value)} placeholder="Écrivez le contenu de la leçon ici..."/>
            </div>
          )}

          {form.content_type === 'link' && (
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Lien externe *</label>
              <input className="input" value={form.content_url||''} onChange={e=>set('content_url',e.target.value)} placeholder="https://..."/>
            </div>
          )}

          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Description (optionnel)</label>
            <textarea rows={2} className="input" style={{ resize:'vertical' }} value={form.description||''} onChange={e=>set('description',e.target.value)}/>
          </div>
          <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:'10px' }}>
            <input type="checkbox" id="free" checked={form.is_free} onChange={e=>set('is_free',e.target.checked)} style={{ width:'16px', height:'16px', accentColor:'var(--caramel)' }}/>
            <label htmlFor="free" style={{ fontSize:'13px', cursor:'pointer', color:'var(--text-main)' }}>Leçon gratuite (accessible sans inscription)</label>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={()=>onSubmit(form)} disabled={loading||uploading} className="btn-primary">
            {loading&&<Loader2 size={14} className="spinner"/>} Ajouter la leçon
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [courseModal, setCourseModal] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [lessonModal, setLessonModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState({ subject:'', level:'', published:'' });

  const isAdmin = ['admin','volunteer'].includes(user?.role);

  const { data, isLoading } = useQuery({
    queryKey:['courses',filter],
    queryFn:()=>api.get('/courses',{params:filter}).then(r=>r.data),
  });
  const { data:courseDetail } = useQuery({
    queryKey:['course',selected],
    queryFn:()=>api.get(`/courses/${selected}`).then(r=>r.data.data),
    enabled:!!selected,
  });

  const createM  = useMutation({ mutationFn:b=>api.post('/courses',b), onSuccess:()=>{toast.success('Cours créé ✓');qc.invalidateQueries(['courses']);setCourseModal(null);} });
  const updateM  = useMutation({ mutationFn:({id,...b})=>api.put(`/courses/${id}`,b), onSuccess:()=>{toast.success('Mis à jour ✓');qc.invalidateQueries(['courses']);qc.invalidateQueries(['course',selected]);setEditCourse(null);} });
  const deleteM  = useMutation({ mutationFn:id=>api.delete(`/courses/${id}`), onSuccess:()=>{toast.success('Supprimé');qc.invalidateQueries(['courses']);setDeleting(null);setSelected(null);} });
  const lessonM  = useMutation({ mutationFn:b=>api.post(`/courses/${selected}/lessons`,b), onSuccess:()=>{toast.success('Leçon ajoutée ✓');qc.invalidateQueries(['course',selected]);setLessonModal(false);} });
  const publishM = useMutation({ mutationFn:({id,is_published})=>api.put(`/courses/${id}`,{is_published}), onSuccess:()=>{qc.invalidateQueries(['courses']);qc.invalidateQueries(['course',selected]);} });

  const courses = data?.data || [];

  return (
    <div style={{ display:'grid', gridTemplateColumns:selected?'360px 1fr':'1fr', gap:'20px', minHeight:'calc(100vh - 110px)' }}>
      {/* LEFT: course list */}
      <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
        <div className="page-header" style={{ marginBottom:0 }}>
          <div>
            <h1 className="page-title" style={{ fontSize:'24px' }}>{t('course_title')}</h1>
            <p className="page-sub">{data?.total||0} cours disponibles</p>
          </div>
          {isAdmin && <button onClick={()=>setCourseModal(true)} className="btn-primary btn-sm"><Plus size={13}/> Nouveau</button>}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <select className="input" style={{ flex:1, minWidth:'100px', fontSize:'12px' }} value={filter.subject} onChange={e=>setFilter(f=>({...f,subject:e.target.value}))}>
            <option value="">Toutes matières</option>
            {SUBJECTS.map(s=><option key={s} value={s}>{SUBJECT_EMOJI[s]} {s}</option>)}
          </select>
          <select className="input" style={{ flex:1, minWidth:'100px', fontSize:'12px' }} value={filter.level} onChange={e=>setFilter(f=>({...f,level:e.target.value}))}>
            <option value="">Tous niveaux</option>
            {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Course cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', overflowY:'auto' }}>
          {isLoading ? (
            <div style={{ textAlign:'center', padding:'40px' }}><Loader2 size={24} className="spinner" style={{ color:'var(--akan)', margin:'0 auto' }}/></div>
          ) : courses.map(c => (
            <div key={c.id} onClick={()=>setSelected(c.id===selected?null:c.id)}
              style={{
                background:'var(--white-warm)', border:`1.5px solid ${selected===c.id?'var(--caramel)':'var(--lavezzi)'}`,
                borderRadius:'16px', padding:'14px', cursor:'pointer', transition:'all 0.2s',
                boxShadow: selected===c.id ? '0 4px 16px var(--shadow-md)' : 'none',
              }}
              onMouseEnter={e=>{if(selected!==c.id){e.currentTarget.style.borderColor='var(--caramel-soft)';e.currentTarget.style.boxShadow='0 3px 12px var(--shadow-sm)'}}}
              onMouseLeave={e=>{if(selected!==c.id){e.currentTarget.style.borderColor='var(--lavezzi)';e.currentTarget.style.boxShadow='none'}}}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(201,168,76,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                  {SUBJECT_EMOJI[c.subject]||'📚'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                    <p style={{ fontWeight:700, fontSize:'13px', color:'var(--text-main)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.title}</p>
                    {!c.is_published && <span style={{ fontSize:'9px', background:'var(--blossom)', color:'#7A4030', padding:'1px 5px', borderRadius:'4px', fontWeight:700, flexShrink:0 }}>Brouillon</span>}
                  </div>
                  <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                    <span className="badge badge-sand" style={{ fontSize:'10px' }}>{c.subject}</span>
                    <span className="badge badge-galet" style={{ fontSize:'10px' }}>{c.level}</span>
                    <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>{c.lessons_count||0} leçons · {c.enrollments_count||0} élèves</span>
                  </div>
                </div>
                <ChevronRight size={14} style={{ color:'var(--akan)', flexShrink:0 }}/>
              </div>
            </div>
          ))}
          {courses.length===0 && !isLoading && (
            <div className="empty-state" style={{ padding:'40px' }}>
              <BookOpen size={36} style={{ opacity:0.25 }}/>
              <p>Aucun cours</p>
              {isAdmin && <button onClick={()=>setCourseModal(true)} className="btn-primary" style={{ marginTop:'12px' }}><Plus size={14}/> Premier cours</button>}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: course detail */}
      {selected && courseDetail && (
        <div style={{ background:'var(--white-warm)', border:'1px solid var(--lavezzi)', borderRadius:'20px', overflow:'hidden', display:'flex', flexDirection:'column', animation:'slideLeft 0.3s ease' }}>
          {/* Course header */}
          <div style={{ padding:'20px 24px', background:'var(--cream)', borderBottom:'1px solid var(--lavezzi)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
                <span style={{ fontSize:'28px' }}>{SUBJECT_EMOJI[courseDetail.subject]||'📚'}</span>
                <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:700, color:'var(--text-main)', lineHeight:1.2 }}>{courseDetail.title}</h2>
              </div>
              <button onClick={()=>setSelected(null)} className="btn-ghost btn-sm" style={{ flexShrink:0 }}><X size={15}/></button>
            </div>
            <p style={{ fontSize:'13px', color:'var(--text-soft)', marginBottom:'12px', lineHeight:1.5 }}>{courseDetail.description}</p>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
              <span className="badge badge-sand" style={{ fontSize:'10px' }}>{courseDetail.subject}</span>
              <span className="badge badge-galet" style={{ fontSize:'10px' }}>{courseDetail.level}</span>
              <span className="badge badge-noisette" style={{ fontSize:'10px' }}>{courseDetail.target_age_min}-{courseDetail.target_age_max} ans</span>
              <span className="badge badge-gold" style={{ fontSize:'10px' }}>{courseDetail.language?.toUpperCase()}</span>
              <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>{courseDetail.duration_hours}h</span>
              {isAdmin && (
                <div style={{ marginLeft:'auto', display:'flex', gap:'6px' }}>
                  <button onClick={()=>publishM.mutate({id:courseDetail.id,is_published:!courseDetail.is_published})}
                    className={courseDetail.is_published?'btn-secondary btn-sm':'btn-primary btn-sm'}>
                    {courseDetail.is_published?<><EyeOff size={12}/> Dépublier</>:<><Eye size={12}/> Publier</>}
                  </button>
                  <button onClick={()=>setEditCourse(courseDetail)} className="btn-secondary btn-sm"><Edit2 size={12}/></button>
                  <button onClick={()=>setDeleting(courseDetail.id)} className="btn-ghost btn-sm" style={{ color:'var(--danger)' }}><Trash2 size={12}/></button>
                </div>
              )}
            </div>
          </div>

          {/* Lessons */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'20px', fontWeight:700, color:'var(--text-main)' }}>
                Leçons ({courseDetail.lessons?.length||0})
              </h3>
              {isAdmin && (
                <button onClick={()=>setLessonModal(true)} className="btn-primary btn-sm"><Plus size={13}/> Ajouter</button>
              )}
            </div>

            {(courseDetail.lessons||[]).length===0 ? (
              <div className="empty-state" style={{ padding:'32px' }}>
                <BookOpen size={32} style={{ opacity:0.25 }}/>
                <p style={{ fontSize:'14px' }}>Aucune leçon pour ce cours</p>
                {isAdmin && <button onClick={()=>setLessonModal(true)} className="btn-primary" style={{ marginTop:'12px' }}><Plus size={14}/> Première leçon</button>}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {(courseDetail.lessons||[]).map((l,i) => {
                  const Icon = CONTENT_ICON[l.content_type]||FileText;
                  const icons = { video:'🎬', document:'📄', audio:'🎵', text:'📝', quiz:'❓', link:'🔗' };
                  return (
                    <div key={l.id} style={{ background:'var(--cream)', border:'1px solid var(--lavezzi)', borderRadius:'14px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', transition:'all 0.2s' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--caramel-soft)';e.currentTarget.style.background='var(--powder)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--lavezzi)';e.currentTarget.style.background='var(--cream)'}}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(201,168,76,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontWeight:800, color:'var(--caramel)', fontSize:'13px' }}>{i+1}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:600, fontSize:'13px', color:'var(--text-main)', marginBottom:'2px' }}>{l.title}</p>
                        <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                          <span style={{ fontSize:'12px' }}>{icons[l.content_type]}</span>
                          <span style={{ fontSize:'11px', color:'var(--noisette)' }}>{l.content_type}</span>
                          <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>· {l.duration_min} min</span>
                          {l.is_free && <span className="badge badge-ok" style={{ fontSize:'9px' }}>Gratuit</span>}
                        </div>
                      </div>
                      {l.content_url && (
                        <a href={l.content_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'var(--caramel)', textDecoration:'none', flexShrink:0 }}>
                          {l.content_type==='video'?<><Play size={12}/> Voir</>:<><Eye size={12}/> Ouvrir</>}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Enrollments */}
            {(courseDetail.enrollments||[]).length > 0 && (
              <div style={{ marginTop:'24px' }}>
                <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)', marginBottom:'12px' }}>
                  Élèves inscrits ({courseDetail.enrollments.length})
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {courseDetail.enrollments.map(e => (
                    <div key={e.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'var(--cream)', borderRadius:'10px', border:'1px solid var(--lavezzi)' }}>
                      <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,var(--caramel-soft),var(--caramel))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'12px', flexShrink:0 }}>
                        {e.first_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-main)' }}>{e.first_name} {e.last_name}</p>
                        <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{e.rid}</p>
                      </div>
                      <div style={{ textAlign:'right', minWidth:'70px' }}>
                        <div className="progress" style={{ width:'70px', marginBottom:'3px' }}>
                          <div className="progress-fill" style={{ width:`${e.progress_pct||0}%` }}/>
                        </div>
                        <span style={{ fontSize:'11px', fontWeight:700, color:'var(--caramel-dark)' }}>{e.progress_pct||0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {courseModal  && <CourseFormModal onClose={()=>setCourseModal(null)} onSubmit={b=>createM.mutate(b)} loading={createM.isPending}/>}
      {editCourse   && <CourseFormModal course={editCourse} onClose={()=>setEditCourse(null)} onSubmit={b=>updateM.mutate({id:editCourse.id,...b})} loading={updateM.isPending}/>}
      {lessonModal  && selected && <LessonModal courseId={selected} onClose={()=>setLessonModal(false)} onSubmit={b=>lessonM.mutate(b)} loading={lessonM.isPending}/>}
      {deleting && (
        <div className="confirm-dialog">
          <div className="confirm-box">
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>🗑️</div>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'20px', marginBottom:'6px', color:'var(--text-main)' }}>Supprimer ce cours ?</h3>
            <p style={{ color:'var(--text-soft)', fontSize:'13px', marginBottom:'16px' }}>Toutes les leçons seront supprimées.</p>
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
