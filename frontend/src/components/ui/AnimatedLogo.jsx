// components/ui/AnimatedLogo.jsx — Real IRAGI logo with animations

const LOGO = '/iragi-logo-400.png';
const LOGO_BG = '/iragi-logo-bg.png'; // with brown background

/* ═══════════════════════════════════════════════
   SPLASH SCREEN — shown once at app launch
   ═══════════════════════════════════════════════ */
export function SplashScreen({ onComplete }) {
  return (
    <div id="iragi-splash" style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(145deg, #3D1A08 0%, #6B2E10 35%, #8B4818 65%, #A86A30 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      animation: 'splashExit 0.6s ease 3.2s forwards',
    }} onAnimationEnd={onComplete}>
      {/* Animated background particles */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', opacity:0.3 }}>
        {Array.from({length:20},(_,i)=>(
          <div key={i} style={{
            position:'absolute',
            left:`${5+Math.random()*90}%`, top:`${5+Math.random()*90}%`,
            width:`${4+i%4*2}px`, height:`${4+i%4*2}px`,
            borderRadius:'50%', background:'#C9A84C',
            animation:`floatDot ${6+i%4}s ease-in-out infinite`,
            animationDelay:`${-i*0.4}s`, opacity:0.4+Math.random()*0.4,
          }}/>
        ))}
      </div>

      {/* Logo container with glow */}
      <div style={{
        position:'relative',
        animation: 'splashLogoReveal 1s cubic-bezier(0.16,1,0.3,1) 0.2s both',
      }}>
        {/* Outer glow rings */}
        <div style={{ position:'absolute', inset:'-50px', borderRadius:'50%', border:'1px solid rgba(201,168,76,0.2)', animation:'ringExpand 3s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', inset:'-30px', borderRadius:'50%', border:'1px solid rgba(201,168,76,0.35)', animation:'ringExpand 3s ease-in-out infinite', animationDelay:'0.5s' }}/>
        <div style={{ position:'absolute', inset:'-10px', borderRadius:'50%', border:'1.5px solid rgba(201,168,76,0.5)', animation:'ringExpand 3s ease-in-out infinite', animationDelay:'1s' }}/>

        {/* The Logo */}
        <div style={{
          width:'260px', height:'260px',
          borderRadius:'50%', overflow:'hidden',
          boxShadow:'0 0 80px rgba(201,168,76,0.5), 0 0 160px rgba(201,168,76,0.25), 0 20px 60px rgba(0,0,0,0.5)',
          animation:'logoFloat 4s ease-in-out 1.2s infinite',
        }}>
          <img src={LOGO_BG} alt="IRAGI" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ marginTop:'40px', textAlign:'center', animation:'fadeUpIn 0.8s ease 1.4s both' }}>
        <p style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize:'13px', letterSpacing:'0.35em',
          color:'rgba(240,200,120,0.85)', textTransform:'uppercase',
          fontWeight:400,
        }}>Ensemble. Nous Bâtissons l'Espoir.</p>
      </div>

      {/* Loading dots */}
      <div style={{ display:'flex', gap:'8px', marginTop:'32px', animation:'fadeUpIn 0.6s ease 1.8s both' }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{
            width:'8px', height:'8px', borderRadius:'50%',
            background:'rgba(201,168,76,0.6)',
            animation:`loadDot 1.2s ease-in-out infinite`,
            animationDelay:`${i*0.2}s`,
          }}/>
        ))}
      </div>

      <style>{`
        @keyframes splashExit     { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.04);pointer-events:none} }
        @keyframes splashLogoReveal{ from{opacity:0;transform:scale(0.5) rotate(-10deg)} to{opacity:1;transform:scale(1) rotate(0deg)} }
        @keyframes ringExpand     { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.12);opacity:0.15} }
        @keyframes logoFloat      { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(2deg)} }
        @keyframes fadeUpIn       { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatDot       { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.3)} }
        @keyframes loadDot        { 0%,80%,100%{transform:scale(0.6);opacity:0.3} 40%{transform:scale(1.2);opacity:1} }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE LOADER — shown during data loading
   ═══════════════════════════════════════════════ */
export function PageLoader({ size = 60 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px', padding:'60px' }}>
      <div style={{ position:'relative', width:`${size}px`, height:`${size}px` }}>
        {/* Spinning ring */}
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          border:`3px solid var(--sand)`,
          borderTop:`3px solid var(--caramel)`,
          animation:'spin 0.9s linear infinite',
        }}/>
        {/* Logo in center */}
        <div style={{
          position:'absolute', inset:'6px', borderRadius:'50%', overflow:'hidden',
          boxShadow:'0 2px 8px rgba(201,168,76,0.2)',
        }}>
          <img src={LOGO_BG} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SIDEBAR LOGO
   ═══════════════════════════════════════════════ */
export function SidebarLogo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <div style={{
        width:'42px', height:'42px', borderRadius:'12px',
        overflow:'hidden', flexShrink:0,
        boxShadow:'0 3px 12px rgba(201,168,76,0.3)',
        transition:'all 0.3s',
      }}>
        <img src={LOGO_BG} alt="IRAGI" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
      </div>
      <div>
        <p style={{ fontFamily:'"Cormorant Garamond",serif', fontWeight:700, color:'var(--text-main)', fontSize:'21px', lineHeight:1 }}>IRAGI</p>
        <p style={{ color:'var(--caramel)', fontSize:'9px', letterSpacing:'0.1em', fontWeight:700, textTransform:'uppercase' }}>Management</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NAVBAR LOGO (public homepage)
   ═══════════════════════════════════════════════ */
export function NavLogo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
      <div style={{
        width:'36px', height:'36px', borderRadius:'10px',
        overflow:'hidden', boxShadow:'0 2px 10px rgba(201,168,76,0.25)',
        transition:'transform 0.3s',
        cursor:'pointer',
      }}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08) rotate(3deg)'}
        onMouseLeave={e=>e.currentTarget.style.transform='scale(1) rotate(0deg)'}>
        <img src={LOGO_BG} alt="IRAGI" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
      </div>
      <span style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:700, color:'var(--text-main)', letterSpacing:'0.02em' }}>
        IRAGI
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LOGIN LOGO
   ═══════════════════════════════════════════════ */
export function LoginLogo() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
      <div style={{
        width:'90px', height:'90px', borderRadius:'22px',
        overflow:'hidden',
        boxShadow:'0 8px 32px rgba(201,168,76,0.4), 0 0 0 1px rgba(201,168,76,0.15)',
        animation:'loginLogoFloat 5s ease-in-out infinite',
      }}>
        <img src={LOGO_BG} alt="IRAGI" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
      </div>
      <h1 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'36px', fontWeight:700, color:'var(--text-main)', margin:0, letterSpacing:'0.03em' }}>
        IRAGI
      </h1>
      <style>{`
        @keyframes loginLogoFloat {
          0%,100%{transform:translateY(0) scale(1);box-shadow:0 8px 32px rgba(201,168,76,0.4)}
          50%{transform:translateY(-8px) scale(1.02);box-shadow:0 16px 48px rgba(201,168,76,0.55)}
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FAVICON / SMALL ICON
   ═══════════════════════════════════════════════ */
export function LogoIcon({ size = 32 }) {
  return (
    <div style={{
      width:`${size}px`, height:`${size}px`,
      borderRadius:`${size*0.28}px`,
      overflow:'hidden',
      boxShadow:`0 2px ${size*0.2}px rgba(201,168,76,0.25)`,
      flexShrink:0,
    }}>
      <img src={LOGO_BG} alt="IRAGI" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
    </div>
  );
}

export default SplashScreen;

/* ═══════════════════════════════════════════════
   DASHBOARD LOGO — floating animated
   ═══════════════════════════════════════════════ */
export function DashLogo({ size = 52 }) {
  return (
    <div style={{
      width:`${size}px`, height:`${size}px`,
      borderRadius:`${size*0.28}px`,
      overflow:'hidden',
      boxShadow:`0 4px 16px rgba(201,168,76,0.28)`,
      animation:'dashLogoFloat 5s ease-in-out infinite',
      flexShrink:0,
    }}>
      <img src="/iragi-logo-bg.png" alt="IRAGI"
        style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
      <style>{`
        @keyframes dashLogoFloat {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-4px) rotate(1deg)}
        }
      `}</style>
    </div>
  );
}
