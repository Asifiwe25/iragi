import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { LoginLogo } from '../components/ui/AnimatedLogo';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { lang, changeLang } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [show, setShow] = useState(false);

  const L = {
    fr:{ title:'Connexion', sub:'Accédez à votre espace IRAGI', email:'Email', pwd:'Mot de passe', btn:'Se connecter', demo:'Comptes démo' },
    en:{ title:'Login', sub:'Access your IRAGI account', email:'Email', pwd:'Password', btn:'Login', demo:'Demo accounts' },
    sw:{ title:'Ingia', sub:'Fikia akaunti yako ya IRAGI', email:'Barua pepe', pwd:'Nenosiri', btn:'Ingia', demo:'Akaunti za maonyesho' },
  }[lang] || { title:'Connexion', sub:'Accédez à votre espace IRAGI', email:'Email', pwd:'Mot de passe', btn:'Se connecter', demo:'Comptes démo' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await login(form.email, form.password); navigate('/app'); }
    catch(err) { toast.error(err.response?.data?.error || 'Identifiants incorrects'); }
  };

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(145deg, var(--cream) 0%, var(--sand) 45%, var(--warm) 100%)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
      fontFamily:'"DM Sans",sans-serif',
    }}>
      {/* Decorative bg circles */}
      <div style={{ position:'fixed', top:'10%', right:'10%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'15%', left:'5%', width:'250px', height:'250px', borderRadius:'50%', background:'radial-gradient(circle, rgba(200,168,130,0.07) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:'420px', position:'relative', zIndex:1 }}>
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'6px', color:'var(--noisette)', textDecoration:'none', fontSize:'13px', marginBottom:'28px', transition:'color 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--caramel)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--noisette)'}>
          <ArrowLeft size={14}/> Retour à l'accueil
        </Link>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <LoginLogo/>
          <p style={{ color:'var(--text-soft)', fontSize:'14px', marginTop:'8px' }}>{L.sub}</p>
        </div>

        {/* Card */}
        <div style={{ background:'var(--white-warm)', borderRadius:'24px', padding:'32px', border:'1px solid var(--lavezzi)', boxShadow:'0 20px 60px rgba(74,55,40,0.09)' }}>
          {/* Language switcher */}
          <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginBottom:'24px' }}>
            {[['fr','Français'],['en','English'],['sw','Kiswahili']].map(([c,l]) => (
              <button key={c} onClick={()=>changeLang(c)} style={{
                padding:'5px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:700,
                cursor:'pointer', border:'1.5px solid', fontFamily:'inherit', transition:'all 0.2s',
                background: lang===c ? 'var(--caramel)' : 'transparent',
                borderColor: lang===c ? 'var(--caramel)' : 'var(--galet)',
                color: lang===c ? 'white' : 'var(--noisette)',
              }}>{l}</button>
            ))}
          </div>

          <h2 style={{ fontSize:'20px', fontWeight:700, color:'var(--text-main)', marginBottom:'22px', fontFamily:'"Cormorant Garamond",serif' }}>{L.title}</h2>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label className="label">{L.email}</label>
              <input type="email" className="input" required
                value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                placeholder="vous@iragi.org"/>
            </div>
            <div>
              <label className="label">{L.pwd}</label>
              <div style={{ position:'relative' }}>
                <input type={show?'text':'password'} className="input" required
                  style={{ paddingRight:'44px' }}
                  value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  placeholder="••••••••"/>
                <button type="button" onClick={()=>setShow(s=>!s)}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--akan)' }}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary btn-round" style={{ padding:'13px', justifyContent:'center', fontSize:'15px', marginTop:'4px' }}>
              {loading && <Loader2 size={16} className="spinner"/>}
              {L.btn}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:'16px', fontSize:'13px', color:'var(--text-muted)' }}>
            Pas encore de compte?{' '}
            <Link to="/#register" style={{ color:'var(--caramel)', fontWeight:600, textDecoration:'none' }}>S'inscrire</Link>
          </p>

          {/* Demo accounts */}
          <div style={{ marginTop:'20px', padding:'16px', background:'var(--cream)', borderRadius:'14px', border:'1px solid var(--lavezzi)' }}>
            <p style={{ fontSize:'10px', fontWeight:800, color:'var(--caramel)', marginBottom:'10px', letterSpacing:'0.1em', textTransform:'uppercase' }}>{L.demo}</p>
            {[
              ['Admin Principal','alicebunani5@gmail.com'],
              ['Admin IRAGI','admin@iragi.org'],
              ['Volontaire','volunteer@iragi.org'],
              ['Donateur','donor@iragi.org'],
              ['Partenaire','partner@iragi.org'],
            ].map(([role,email]) => (
              <button key={email} type="button"
                onClick={()=>setForm({email,password:'iragi2025'})}
                style={{ display:'block', width:'100%', textAlign:'left', fontSize:'12px', color:'var(--text-soft)', background:'none', border:'none', cursor:'pointer', padding:'3px 0', transition:'color 0.2s', fontFamily:'inherit' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--caramel)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-soft)'}>
                <span style={{ fontWeight:600, display:'inline-block', minWidth:'100px' }}>{role}:</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px' }}>{email}</span>
              </button>
            ))}
            <p style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'8px' }}>Mot de passe: <code style={{ background:'var(--sand)', padding:'1px 5px', borderRadius:'4px' }}>iragi2025</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
