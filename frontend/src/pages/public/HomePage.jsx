// Full updated HomePage with real logo - importing NavLogo
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { NavLogo } from '../../components/ui/AnimatedLogo';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowRight, BookOpen, Heart, Users, Globe, ChevronDown, Quote, Send, MapPin, Phone, Mail, MessageCircle, X, Loader2 } from 'lucide-react';

function LangSwitcher() {
  const { lang, changeLang } = useLang();
  return (
    <div style={{ display:'flex', gap:'3px' }}>
      {[['fr','FR'],['en','EN'],['sw','SW']].map(([c,l]) => (
        <button key={c} onClick={()=>changeLang(c)} style={{
          padding:'4px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700,
          cursor:'pointer', border:'1px solid', fontFamily:'inherit',
          background: lang===c ? 'var(--caramel)' : 'transparent',
          borderColor: lang===c ? 'var(--caramel)' : 'rgba(61,35,20,0.15)',
          color: lang===c ? 'white' : 'var(--noisette)',
          transition:'all 0.2s',
        }}>{l}</button>
      ))}
    </div>
  );
}

function Counter({ target, suffix='', duration=2200 }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const s = Date.now();
        const step = () => {
          const p = Math.min((Date.now()-s)/duration, 1);
          setN(Math.floor((1-Math.pow(1-p,3))*target));
          if (p<1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold:0.5 });
    if (ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);} }),
      { threshold:0.08, rootMargin:'0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el=>obs.observe(el));
    return ()=>obs.disconnect();
  }, []);
}

function ContactModal({ onClose, t }) {
  const [form, setForm] = useState({ from_name:'', from_email:'', subject:'', body:'' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/messages/public', form);
      setDone(true);
    } catch { setDone(true); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:'520px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Nous contacter</h3>
          <button onClick={onClose} className="btn-ghost btn-sm"><X size={16}/></button>
        </div>
        {done ? (
          <div style={{ padding:'48px', textAlign:'center' }}>
            <div style={{ fontSize:'52px', marginBottom:'14px' }}>✅</div>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'26px', color:'var(--text-main)', marginBottom:'8px' }}>Message envoyé !</h3>
            <p style={{ color:'var(--text-soft)', fontSize:'14px' }}>L'équipe IRAGI vous répondra par email sous 48h.</p>
            <button onClick={onClose} className="btn-primary btn-round" style={{ marginTop:'20px' }}>Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div><label className="label">Votre nom *</label><input required className="input" value={form.from_name} onChange={e=>setForm(f=>({...f,from_name:e.target.value}))}/></div>
              <div><label className="label">Votre email *</label><input required type="email" className="input" value={form.from_email} onChange={e=>setForm(f=>({...f,from_email:e.target.value}))}/></div>
            </div>
            <div><label className="label">Sujet *</label><input required className="input" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/></div>
            <div><label className="label">Message *</label><textarea required rows={5} className="input" style={{ resize:'vertical' }} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}/></div>
            <div className="modal-footer" style={{ padding:0, border:'none' }}>
              <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading?<Loader2 size={15} className="spinner"/>:<Send size={15}/>} Envoyer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  useReveal();
  const { t } = useLang();
  const heroRef = useRef(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [regForm, setRegForm] = useState({ name:'', email:'', password:'', phone:'', role:'volunteer', country:'', message:'' });
  const [regLoading, setRegLoading] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    const onScroll = () => { if(heroRef.current) heroRef.current.style.transform=`translateY(${window.scrollY*0.15}px)`; };
    window.addEventListener('scroll', onScroll, { passive:true });
    return ()=>window.removeEventListener('scroll', onScroll);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password.length < 6) { toast.error('Mot de passe: minimum 6 caractères'); return; }
    setRegLoading(true);
    try {
      await api.post('/auth/register', regForm);
      setRegStep(2);
      toast.success('Vérifiez votre email pour le code de confirmation.');
    } catch(err) { toast.error(err.response?.data?.error || 'Erreur d\'inscription'); }
    finally { setRegLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifyLoading(true);
    try {
      await api.post('/auth/verify-email', { email:regForm.email, code:verifyCode });
      setRegStep(3);
    } catch(err) { toast.error(err.response?.data?.error || 'Code invalide'); }
    finally { setVerifyLoading(false); }
  };

  const programs = [
    { emoji:'📚', label:t('prog1_label'), title:t('prog1_title'), desc:t('prog1_desc') },
    { emoji:'💜', label:t('prog2_label'), title:t('prog2_title'), desc:t('prog2_desc') },
    { emoji:'🤝', label:t('prog3_label'), title:t('prog3_title'), desc:t('prog3_desc') },
    { emoji:'🌍', label:t('prog4_label'), title:t('prog4_title'), desc:t('prog4_desc') },
  ];

  const stories = [
    { name:'Fatima O., 13 ans', origin:'Rutshuru, Nord-Kivu', cat:t('prog1_label'), text:'"J\'ai dû fuir ma maison à 9 ans. Pendant deux ans, je n\'avais pas accès à l\'école. Grâce à IRAGI, j\'ai appris à lire. Je veux devenir médecin."' },
    { name:'Marie B., 24 ans', origin:'Bukavu, Sud-Kivu', cat:t('prog2_label'), text:'"On m\'a écoutée pour la première fois depuis que j\'ai fui. Les équipes IRAGI ont documenté mon histoire. Je ne suis plus invisible."' },
    { name:'Espoir K., 17 ans', origin:'Beni, Nord-Kivu', cat:t('prog4_label'), text:'"Le cours d\'informatique m\'a donné un futur. J\'ai appris à utiliser un ordinateur et maintenant je veux étudier l\'ingénierie."' },
    { name:'Hassan M., 15 ans', origin:'Uvira, Sud-Kivu', cat:t('prog1_label'), text:'"Baada ya miaka miwili bila shule, IRAGI ilinisaidia kupata elimu. Sasa nasoma vizuri na nataka kuwa mwalimu."' },
  ];

  const inputSt = { width:'100%', padding:'11px 14px', borderRadius:'12px', border:'1.5px solid var(--galet)', background:'var(--white-warm)', color:'var(--text-main)', fontSize:'14px', outline:'none', transition:'border-color 0.2s', fontFamily:'inherit', boxSizing:'border-box' };
  const focusStyle = (e) => { e.target.style.borderColor='var(--caramel)'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.1)'; };
  const blurStyle  = (e) => { e.target.style.borderColor='var(--galet)'; e.target.style.boxShadow='none'; };

  const sectionBg = (bg) => ({ padding:'90px 40px', background:bg });
  const maxW = { maxWidth:'1160px', margin:'0 auto' };
  const card = { background:'var(--white-warm)', border:'1px solid var(--lavezzi)', borderRadius:'20px', padding:'30px', transition:'all 0.4s cubic-bezier(0.16,1,0.3,1)' };

  return (
    <div style={{ background:'var(--cream)', color:'var(--text-main)', fontFamily:'"DM Sans",sans-serif', overflowX:'hidden' }}>
      <div className="grain-overlay"/>

      {/* NAVBAR */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'13px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(250,246,240,0.94)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(221,213,200,0.4)' }}>
        <NavLogo/>
        <div style={{ display:'flex', gap:'22px', alignItems:'center' }} id="hp-nav-links">
          {[['#mission',t('nav_mission')],['#programs',t('nav_programs')],['#stories',t('nav_stories')],['#register',t('nav_register')]].map(([h,l]) => (
            <a key={h} href={h} style={{ color:'var(--noisette)', fontSize:'14px', textDecoration:'none', fontWeight:500, transition:'color 0.2s' }}
              onMouseEnter={e=>e.target.style.color='var(--caramel)'} onMouseLeave={e=>e.target.style.color='var(--noisette)'}>{l}</a>
          ))}
          <button onClick={()=>setContactOpen(true)} style={{ color:'var(--noisette)', fontSize:'14px', background:'none', border:'none', cursor:'pointer', fontWeight:500, fontFamily:'inherit', display:'flex', alignItems:'center', gap:'4px', transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--caramel)'} onMouseLeave={e=>e.currentTarget.style.color='var(--noisette)'}>
            <MessageCircle size={14}/> Contact
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <LangSwitcher/>
          <Link to="/login" style={{ padding:'9px 22px', borderRadius:'100px', background:'linear-gradient(135deg,var(--caramel),var(--caramel-dark))', color:'white', textDecoration:'none', fontSize:'13px', fontWeight:700, boxShadow:'0 4px 14px rgba(201,168,76,0.28)', letterSpacing:'0.02em', transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(201,168,76,0.4)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 14px rgba(201,168,76,0.28)'}}>
            {t('nav_login')} →
          </Link>
        </div>
        <style>{`@media(max-width:768px){#hp-nav-links{display:none!important}}`}</style>
      </nav>

      {/* HERO */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', overflow:'hidden', background:'linear-gradient(145deg,var(--cream) 0%,var(--sand) 55%,var(--warm) 100%)' }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:'12%', right:'8%', width:'320px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle,rgba(201,168,76,0.09) 0%,transparent 70%)', animation:'float 8s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', bottom:'20%', left:'3%', width:'240px', height:'240px', borderRadius:'50%', background:'radial-gradient(circle,rgba(200,168,130,0.07) 0%,transparent 70%)', animation:'float 11s ease-in-out infinite', animationDelay:'-4s' }}/>

        {/* Big logo in hero background */}
        <div style={{ position:'absolute', right:'-5%', top:'50%', transform:'translateY(-50%)', width:'50%', maxWidth:'520px', opacity:0.08, pointerEvents:'none' }}>
          <img src="/iragi-logo-bg.png" alt="" style={{ width:'100%', height:'auto', filter:'sepia(1) saturate(2)' }}/>
        </div>

        <div ref={heroRef} style={{ position:'relative', zIndex:2, ...maxW, padding:'120px 40px 80px' }}>
          {/* Tag */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'7px 16px', borderRadius:'100px', border:'1px solid rgba(201,168,76,0.3)', background:'rgba(201,168,76,0.07)', marginBottom:'28px', animation:'heroReveal 0.7s both' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'var(--caramel)', display:'inline-block', animation:'pulse-gold 2s infinite' }}/>
            <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.18em', color:'var(--caramel)', textTransform:'uppercase' }}>{t('hero_tag')}</span>
          </div>

          <h1 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'clamp(48px,8vw,92px)', fontWeight:600, lineHeight:1.02, marginBottom:'20px', maxWidth:'800px' }}>
            <span className="hero-word" style={{ display:'block', color:'var(--text-main)', animationDelay:'0.2s' }}>{t('hero_title1')}</span>
            <span className="hero-word" style={{ display:'block', animationDelay:'0.4s' }}><span className="gold-text">{t('hero_title2')}</span></span>
          </h1>

          <p style={{ fontSize:'clamp(15px,2vw,18px)', color:'var(--noisette)', maxWidth:'500px', lineHeight:1.75, marginBottom:'40px', fontWeight:300, animation:'heroReveal 1s both', animationDelay:'0.6s' }}>
            {t('hero_sub')}
          </p>

          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', animation:'heroReveal 1s both', animationDelay:'0.8s' }}>
            <a href="#programs" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'14px 28px', borderRadius:'100px', background:'linear-gradient(135deg,var(--caramel),var(--caramel-dark))', color:'white', textDecoration:'none', fontSize:'15px', fontWeight:700, boxShadow:'0 8px 24px rgba(201,168,76,0.30)', transition:'all 0.3s' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow='0 12px 32px rgba(201,168,76,0.44)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 8px 24px rgba(201,168,76,0.30)'}}>
              {t('hero_btn1')} <ArrowRight size={16}/>
            </a>
            <a href="#register" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'14px 28px', borderRadius:'100px', border:'2px solid rgba(201,168,76,0.28)', color:'var(--text-main)', textDecoration:'none', fontSize:'15px', fontWeight:600, background:'rgba(255,255,255,0.5)', transition:'all 0.3s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(201,168,76,0.07)';e.currentTarget.style.borderColor='var(--caramel)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.5)';e.currentTarget.style.borderColor='rgba(201,168,76,0.28)'}}>
              {t('hero_btn2')} ↓
            </a>
          </div>
        </div>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'60px', background:'linear-gradient(to bottom,transparent,var(--cream))' }}/>
        <div style={{ position:'absolute', bottom:'20px', left:'50%', transform:'translateX(-50%)', color:'var(--akan)' }}>
          <ChevronDown size={20} style={{ animation:'float 2.2s ease-in-out infinite' }}/>
        </div>
      </section>

      {/* STATS */}
      <section style={sectionBg('var(--sand)')} id="impact">
        <div style={maxW}>
          <div className="gold-line" style={{ marginBottom:'44px' }}/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'16px' }}>
            {[
              {v:500,s:'+',l:t('stat1_label'),sub:t('stat1_sub')},
              {v:200,s:'+',l:t('stat2_label'),sub:t('stat2_sub')},
              {v:50, s:'+',l:t('stat3_label'),sub:t('stat3_sub')},
              {v:5,  s:'', l:t('stat4_label'),sub:t('stat4_sub')},
            ].map((s,i) => (
              <div key={i} className="reveal" style={{ ...card, transitionDelay:`${i*0.08}s` }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow='0 16px 40px rgba(74,55,40,0.1)';e.currentTarget.style.borderColor='var(--caramel-soft)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';e.currentTarget.style.borderColor='var(--lavezzi)'}}>
                <div style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'52px', fontWeight:600, color:'var(--caramel)', lineHeight:1, marginBottom:'8px' }}>
                  <Counter target={s.v} suffix={s.s}/>
                </div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text-main)', marginBottom:'3px' }}>{s.l}</div>
                <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="gold-line" style={{ marginTop:'44px' }}/>
        </div>
      </section>

      {/* MISSION */}
      <section style={sectionBg('var(--cream)')} id="mission">
        <div style={{ ...maxW, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'center' }}>
          <div className="reveal-left">
            <div style={{ borderRadius:'24px', background:'linear-gradient(135deg,var(--sand),var(--warm))', aspectRatio:'4/5', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'32px' }}>
              {/* Logo watermark */}
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-60%)', width:'70%', opacity:0.15 }}>
                <img src="/iragi-logo-bg.png" alt="" style={{ width:'100%', height:'auto' }}/>
              </div>
              <div style={{ background:'rgba(250,246,240,0.93)', border:'1px solid rgba(201,168,76,0.22)', borderRadius:'16px', padding:'22px', position:'relative', zIndex:2 }}>
                <Quote size={20} style={{ color:'var(--caramel)', marginBottom:'10px' }}/>
                <p style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'19px', fontStyle:'italic', color:'var(--text-main)', lineHeight:1.5, marginBottom:'14px' }}>
                  "Chaque enfant qui apprend à lire aujourd'hui est un leader qui changera l'Afrique demain."
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'22px', height:'2px', background:'var(--caramel)' }}/>
                  <span style={{ fontSize:'11px', color:'var(--text-soft)', letterSpacing:'0.08em' }}>Alice Iragi Bunani, Fondatrice</span>
                </div>
              </div>
            </div>
          </div>
          <div className="reveal-right">
            <p className="section-tag">{t('mission_tag')}</p>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'clamp(34px,4vw,56px)', fontWeight:600, lineHeight:1.05, color:'var(--text-main)', marginBottom:'20px' }}>
              {t('mission_title1')}<br/><span className="gold-text">{t('mission_title2')}</span>
            </h2>
            <p style={{ color:'var(--noisette)', lineHeight:1.78, marginBottom:'14px', fontSize:'16px', fontWeight:300 }}>{t('mission_p1')}</p>
            <p style={{ color:'var(--noisette)', lineHeight:1.78, marginBottom:'14px', fontSize:'16px', fontWeight:300 }}>{t('mission_p2')}</p>
            <p style={{ color:'var(--noisette)', lineHeight:1.78, marginBottom:'28px', fontSize:'16px', fontWeight:300 }}>{t('mission_p3')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {['🎯 Dignité avant charité','🤝 Embauche locale','📊 Tout documenter','✨ Impact mesurable'].map(p => (
                <span key={p} style={{ padding:'6px 14px', borderRadius:'100px', border:'1px solid rgba(201,168,76,0.28)', color:'var(--noisette)', fontSize:'12px', fontWeight:500, background:'rgba(201,168,76,0.05)' }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section style={sectionBg('var(--sand)')} id="programs">
        <div style={maxW}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'50px' }}>
            <p className="section-tag">{t('programs_tag')}</p>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'clamp(34px,5vw,60px)', fontWeight:600, color:'var(--text-main)', lineHeight:1.05 }}>
              {t('programs_title1')}<br/><span className="gold-text">{t('programs_title2')}</span>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'16px' }}>
            {programs.map((prog,i) => (
              <div key={i} className="reveal" style={{ ...card, transitionDelay:`${i*0.1}s` }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-7px) scale(1.01)';e.currentTarget.style.boxShadow='0 20px 48px rgba(74,55,40,0.12)';e.currentTarget.style.borderColor='var(--caramel)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';e.currentTarget.style.borderColor='var(--lavezzi)'}}>
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px', fontSize:'22px' }}>{prog.emoji}</div>
                <p style={{ fontSize:'10px', fontWeight:800, letterSpacing:'0.22em', color:'var(--caramel)', textTransform:'uppercase', marginBottom:'7px' }}>{prog.label}</p>
                <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:600, color:'var(--text-main)', marginBottom:'10px', lineHeight:1.2 }}>{prog.title}</h3>
                <p style={{ fontSize:'14px', color:'var(--noisette)', lineHeight:1.7, fontWeight:300 }}>{prog.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORIES */}
      <section style={sectionBg('var(--cream)')} id="stories">
        <div style={maxW}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'50px' }}>
            <p className="section-tag">{t('stories_tag')}</p>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'clamp(34px,5vw,60px)', fontWeight:600, color:'var(--text-main)', lineHeight:1.05 }}>
              {t('stories_title1')}<br/><span className="gold-text">{t('stories_title2')}</span>
            </h2>
            <p style={{ fontSize:'13px', color:'var(--text-soft)', marginTop:'10px', fontStyle:'italic' }}>{t('stories_note')}</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'16px' }}>
            {stories.map((s,i) => (
              <div key={i} className="reveal" style={{ ...card, transitionDelay:`${i*0.12}s` }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 14px 40px rgba(74,55,40,0.1)';e.currentTarget.style.borderColor='var(--caramel)'}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.borderColor='var(--lavezzi)'}}>
                <Quote size={20} style={{ color:'rgba(201,168,76,0.35)', marginBottom:'14px' }}/>
                <p style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontStyle:'italic', color:'var(--text-main)', lineHeight:1.55, marginBottom:'18px' }}>{s.text}</p>
                <div className="gold-line" style={{ marginBottom:'14px' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text-main)' }}>{s.name}</div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'3px' }}><MapPin size={10}/>{s.origin}</div>
                  </div>
                  <span style={{ padding:'4px 10px', borderRadius:'100px', background:'rgba(201,168,76,0.09)', border:'1px solid rgba(201,168,76,0.2)', fontSize:'10px', color:'var(--caramel-dark)', fontWeight:700 }}>{s.cat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGISTER */}
      <section style={sectionBg('var(--sand)')} id="register">
        <div style={{ ...maxW, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'flex-start' }}>
          <div className="reveal-left">
            <p className="section-tag">{t('reg_tag')}</p>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'clamp(32px,4vw,52px)', fontWeight:600, color:'var(--text-main)', lineHeight:1.05, marginBottom:'16px' }}>
              {t('reg_title')}<br/><span className="gold-text">{t('reg_title2')}</span>
            </h2>
            <p style={{ color:'var(--noisette)', lineHeight:1.75, marginBottom:'28px', fontSize:'15px', fontWeight:300 }}>{t('mission_p1')}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'28px' }}>
              {[{icon:Mail,text:'alicebunani5@gmail.com'},{icon:Phone,text:'+250 791 431 851'},{icon:MapPin,text:'République Démocratique du Congo'}].map(({icon:Icon,text}) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(201,168,76,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={16} style={{ color:'var(--caramel)' }}/>
                  </div>
                  <span style={{ color:'var(--text-soft)', fontSize:'14px' }}>{text}</span>
                </div>
              ))}
            </div>
            {/* Logo in sidebar */}
            <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', background:'var(--white-warm)', borderRadius:'16px', border:'1px solid var(--lavezzi)' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'12px', overflow:'hidden', flexShrink:0 }}>
                <img src="/iragi-logo-bg.png" alt="IRAGI" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
              </div>
              <div>
                <p style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)' }}>IRAGI</p>
                <p style={{ fontSize:'12px', color:'var(--noisette)', fontStyle:'italic' }}>Ensemble, nous bâtissons l'espoir.</p>
              </div>
            </div>
          </div>

          <div className="reveal-right">
            {regStep===1 && (
              <form onSubmit={handleRegister} style={{ ...card, display:'flex', flexDirection:'column', gap:'14px' }}>
                <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', color:'var(--text-main)' }}>Créer un compte</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--noisette)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{t('reg_name')} *</label>
                    <input required style={inputSt} value={regForm.name} onChange={e=>setRegForm(p=>({...p,name:e.target.value}))} onFocus={focusStyle} onBlur={blurStyle}/>
                  </div>
                  {[{k:'email',l:t('reg_email'),t:'email',req:true},{k:'password',l:t('reg_password'),t:'password',req:true},{k:'phone',l:t('reg_phone'),t:'tel'},{k:'country',l:t('reg_country'),t:'text'}].map(f=>(
                    <div key={f.k}>
                      <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--noisette)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{f.l}{f.req?' *':''}</label>
                      <input required={f.req} type={f.t} style={inputSt} value={regForm[f.k]||''} onChange={e=>setRegForm(p=>({...p,[f.k]:e.target.value}))} onFocus={focusStyle} onBlur={blurStyle}/>
                    </div>
                  ))}
                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--noisette)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{t('reg_role')} *</label>
                    <select required style={{ ...inputSt, cursor:'pointer' }} value={regForm.role} onChange={e=>setRegForm(p=>({...p,role:e.target.value}))}>
                      <option value="volunteer">{t('reg_role_volunteer')}</option>
                      <option value="partner">{t('reg_role_partner')}</option>
                      <option value="donor">{t('reg_role_donor')}</option>
                      <option value="refugee">{t('reg_role_beneficiary')}</option>
                    </select>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--noisette)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{t('reg_message')}</label>
                    <textarea rows={3} style={{ ...inputSt, resize:'vertical' }} value={regForm.message} onChange={e=>setRegForm(p=>({...p,message:e.target.value}))} onFocus={focusStyle} onBlur={blurStyle}/>
                  </div>
                </div>
                <button type="submit" disabled={regLoading} style={{ padding:'13px', borderRadius:'100px', border:'none', cursor:'pointer', background:'linear-gradient(135deg,var(--caramel),var(--caramel-dark))', color:'white', fontWeight:700, fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 16px rgba(201,168,76,0.28)', transition:'all 0.3s', fontFamily:'inherit', opacity:regLoading?0.7:1 }}>
                  {regLoading?<Loader2 size={16} className="spinner"/>:<Send size={15}/>} {t('reg_submit')}
                </button>
                <p style={{ fontSize:'12px', color:'var(--text-muted)', textAlign:'center' }}>
                  Déjà un compte? <Link to="/login" style={{ color:'var(--caramel)', fontWeight:600 }}>{t('nav_login')}</Link>
                </p>
              </form>
            )}
            {regStep===2 && (
              <form onSubmit={handleVerify} style={{ ...card, textAlign:'center' }}>
                <div style={{ fontSize:'52px', marginBottom:'16px' }}>📧</div>
                <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'26px', color:'var(--text-main)', marginBottom:'10px' }}>Vérifiez votre email</h3>
                <p style={{ color:'var(--text-soft)', fontSize:'14px', marginBottom:'24px', lineHeight:1.6 }}>Code envoyé à<br/><strong style={{ color:'var(--text-main)' }}>{regForm.email}</strong></p>
                <input required maxLength={6} style={{ ...inputSt, textAlign:'center', fontSize:'28px', fontWeight:700, letterSpacing:'12px', padding:'16px' }} value={verifyCode} onChange={e=>setVerifyCode(e.target.value.replace(/\D/g,''))} placeholder="000000" onFocus={focusStyle} onBlur={blurStyle}/>
                <button type="submit" disabled={verifyLoading||verifyCode.length!==6} style={{ marginTop:'16px', width:'100%', padding:'13px', borderRadius:'100px', border:'none', cursor:'pointer', background:'linear-gradient(135deg,var(--caramel),var(--caramel-dark))', color:'white', fontWeight:700, fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity:(verifyLoading||verifyCode.length!==6)?0.5:1, fontFamily:'inherit' }}>
                  {verifyLoading?<Loader2 size={16} className="spinner"/>:'✓'} Vérifier le code
                </button>
              </form>
            )}
            {regStep===3 && (
              <div style={{ ...card, textAlign:'center' }}>
                <div style={{ width:'80px', height:'80px', borderRadius:'20px', overflow:'hidden', margin:'0 auto 20px', boxShadow:'0 8px 32px rgba(201,168,76,0.3)' }}>
                  <img src="/iragi-logo-bg.png" alt="IRAGI" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
                </div>
                <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'28px', color:'var(--text-main)', marginBottom:'10px' }}>Bienvenue dans IRAGI !</h3>
                <p style={{ color:'var(--text-soft)', fontSize:'14px', marginBottom:'8px', lineHeight:1.7 }}>Votre email est vérifié. Votre compte est en attente d'approbation par l'équipe IRAGI.</p>
                <p style={{ color:'var(--text-muted)', fontSize:'13px', marginBottom:'24px' }}>Vous recevrez un email dès que votre compte sera activé.</p>
                <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'12px 28px', borderRadius:'100px', background:'linear-gradient(135deg,var(--caramel),var(--caramel-dark))', color:'white', textDecoration:'none', fontWeight:700, fontSize:'14px' }}>
                  Se connecter <ArrowRight size={14}/>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...sectionBg('var(--cream)'), position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 70%)' }}/>
        <div className="reveal" style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:'560px', margin:'0 auto' }}>
          <p className="section-tag">{t('cta_tag')}</p>
          <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'clamp(36px,5vw,62px)', fontWeight:600, color:'var(--text-main)', lineHeight:1.05, marginBottom:'14px' }}>
            {t('cta_title')}<br/><span className="gold-text">{t('cta_title2')}</span>
          </h2>
          <p style={{ fontSize:'16px', color:'var(--noisette)', lineHeight:1.7, marginBottom:'36px', fontWeight:300 }}>{t('cta_sub')}</p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'15px 34px', borderRadius:'100px', background:'linear-gradient(135deg,var(--caramel),var(--caramel-dark))', color:'white', textDecoration:'none', fontSize:'15px', fontWeight:700, boxShadow:'0 8px 24px rgba(201,168,76,0.30)', transition:'all 0.3s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              {t('cta_btn1')} <ArrowRight size={16}/>
            </Link>
            <button onClick={()=>setContactOpen(true)} style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'15px 34px', borderRadius:'100px', border:'2px solid rgba(201,168,76,0.3)', color:'var(--text-main)', fontSize:'15px', fontWeight:600, background:'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.3s', fontFamily:'inherit' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(201,168,76,0.07)';e.currentTarget.style.borderColor='var(--caramel)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.5)';e.currentTarget.style.borderColor='rgba(201,168,76,0.3)'}}>
              <MessageCircle size={15}/>{t('cta_btn2')}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid var(--lavezzi)', padding:'40px', background:'var(--sand)' }}>
        <div style={{ ...maxW, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'10px', overflow:'hidden', boxShadow:'0 2px 10px rgba(201,168,76,0.22)' }}>
              <img src="/iragi-logo-bg.png" alt="IRAGI" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
            </div>
            <div>
              <div style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)' }}>IRAGI</div>
              <div style={{ fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase' }}>R.D. Congo · Éducation & Dignité</div>
            </div>
          </div>
          <LangSwitcher/>
          <div style={{ display:'flex', gap:'20px', alignItems:'center' }}>
            <a href="mailto:alicebunani5@gmail.com" style={{ color:'var(--text-muted)', fontSize:'12px', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px', transition:'color 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--caramel)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
              <Mail size={12}/> alicebunani5@gmail.com
            </a>
            <span style={{ color:'var(--text-muted)', fontSize:'12px' }}>© 2025 IRAGI</span>
          </div>
        </div>
      </footer>

      {contactOpen && <ContactModal onClose={()=>setContactOpen(false)} t={t}/>}

      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes heroReveal{from{opacity:0;transform:translateY(36px);filter:blur(4px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
        @keyframes shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes grain{0%,100%{transform:translate(0,0)}20%{transform:translate(-4%,-8%)}40%{transform:translate(6%,-20%)}60%{transform:translate(-4%,20%)}80%{transform:translate(12%,-4%)} }
        @keyframes pulse-gold{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.35)}50%{box-shadow:0 0 0 6px rgba(201,168,76,0)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .section-tag{font-size:10px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:var(--caramel);margin-bottom:12px;display:block}
        .gold-text{background:linear-gradient(135deg,#E8C44A,#C9A84C,#D4A843,#A8892A);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s ease infinite}
        .gold-line{height:1px;background:linear-gradient(90deg,transparent,var(--caramel),transparent)}
        .grain-overlay{position:fixed;inset:-50%;width:200%;height:200%;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");opacity:0.02;pointer-events:none;z-index:998;animation:grain 8s steps(10) infinite}
        .reveal{opacity:0;transform:translateY(28px);transition:all 0.8s cubic-bezier(0.16,1,0.3,1)}.reveal.visible{opacity:1;transform:translateY(0)}
        .reveal-left{opacity:0;transform:translateX(-28px);transition:all 0.8s cubic-bezier(0.16,1,0.3,1)}.reveal-left.visible{opacity:1;transform:translateX(0)}
        .reveal-right{opacity:0;transform:translateX(28px);transition:all 0.8s cubic-bezier(0.16,1,0.3,1)}.reveal-right.visible{opacity:1;transform:translateX(0)}
        .hero-word{display:inline-block;animation:heroReveal 0.9s cubic-bezier(0.16,1,0.3,1) both}
        .spinner{animation:spin 0.8s linear infinite}
      `}</style>
    </div>
  );
}
