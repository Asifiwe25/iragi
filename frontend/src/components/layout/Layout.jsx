import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import {
  LayoutDashboard, Users, Briefcase, MapPin, Package,
  BarChart3, Settings, LogOut, Menu, MessageSquare,
  Home, BookOpen, DollarSign, BookMarked, User,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { SidebarLogo } from '../ui/AnimatedLogo';

function LangSwitcher() {
  const { lang, changeLang } = useLang();
  return (
    <div style={{ display:'flex', gap:'2px' }}>
      {[['fr','FR'],['en','EN'],['sw','SW']].map(([c,l]) => (
        <button key={c} onClick={()=>changeLang(c)} style={{
          padding:'3px 9px', borderRadius:'8px', fontSize:'11px', fontWeight:700,
          cursor:'pointer', border:'none', fontFamily:'inherit',
          background: c===lang ? 'rgba(201,168,76,0.22)' : 'transparent',
          color: c===lang ? 'var(--caramel)' : 'var(--text-muted)',
          transition:'all 0.2s',
        }}>{l}</button>
      ))}
    </div>
  );
}

function getNavItems(role, t) {
  const ITEMS = [
    { to:'/app', icon:LayoutDashboard, label:'Dashboard', exact:true, roles:['admin','volunteer','partner','donor','refugee'] },
    { divider:'Bénéficiaires', roles:['admin','volunteer'] },
    { to:'/app/refugees',     icon:Users,         label:t('dash_total_refugees'),  roles:['admin','volunteer'] },
    { to:'/app/cases',        icon:Briefcase,     label:'Cas & Suivi',             roles:['admin','volunteer'] },
    { to:'/app/camps',        icon:MapPin,        label:t('dash_camps'),           roles:['admin','volunteer'] },
    { to:'/app/distributions',icon:Package,       label:t('dash_distributions'),   roles:['admin','volunteer'] },
    { divider:'Éducation', roles:['admin','volunteer','refugee'] },
    { to:'/app/courses',      icon:BookOpen,      label:'Cours Enfants',           roles:['admin','volunteer','refugee'] },
    { divider:'Ressources', roles:['admin','donor','partner'] },
    { to:'/app/financings',   icon:DollarSign,    label:'Financements & Dons',     roles:['admin','donor','partner'] },
    { to:'/app/hr',           icon:Users,         label:'Ressources Humaines',     roles:['admin'] },
    { divider:'Contenu', roles:['admin','volunteer'] },
    { to:'/app/stories',      icon:BookMarked,    label:'Témoignages',             roles:['admin','volunteer'] },
    { divider:'Communication', roles:['admin','volunteer','partner','donor','refugee'] },
    { to:'/app/messages',     icon:MessageSquare, label:'Messages', badge:true,    roles:['admin','volunteer','partner','donor','refugee'] },
    { divider:'Analyse', roles:['admin','volunteer'] },
    { to:'/app/reports',      icon:BarChart3,     label:'Rapports',                roles:['admin','volunteer'] },
    { divider:'Administration', roles:['admin'] },
    { to:'/app/users',        icon:Settings,      label:'Utilisateurs',            roles:['admin'] },
  ];
  return ITEMS.filter(item => !item.roles || item.roles.includes(role));
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: unread } = useQuery({
    queryKey:['messages-unread'],
    queryFn:()=>api.get('/messages/unread-count').then(r=>r.data).catch(()=>({count:0})),
    refetchInterval:30000,
  });
  const unreadCount = unread?.count || 0;
  const navItems = getNavItems(user?.role||'volunteer', t);
  const ROLE_LABELS = { admin:'Admin', refugee:'Réfugié', donor:'Donateur', volunteer:'Volontaire', partner:'Partenaire' };

  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--white-warm)', borderRight:'1px solid var(--lavezzi)' }}>
      {/* Logo */}
      <div style={{ padding:'16px 18px 14px', borderBottom:'1px solid var(--lavezzi)' }}>
        <SidebarLogo/>
      </div>
      {/* Home btn */}
      <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--lavezzi)' }}>
        <Link to="/" style={{
          display:'flex', alignItems:'center', gap:'8px',
          padding:'8px 12px', borderRadius:'10px',
          background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.18)',
          color:'var(--caramel)', textDecoration:'none',
          fontSize:'12px', fontWeight:700, transition:'all 0.2s', letterSpacing:'0.03em',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(201,168,76,0.14)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(201,168,76,0.07)'}>
          <Home size={14}/> {t('dash_home_btn')}
        </Link>
      </div>
      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 10px', overflowY:'auto' }}>
        {navItems.map((item, idx) => {
          if (item.divider) return <div key={idx} className="nav-section">{item.divider}</div>;
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.exact}
              onClick={()=>setOpen(false)}
              className={({isActive})=>`nav-link${isActive?' active':''}`}
              style={{ marginBottom:'1px' }}>
              <Icon size={15}/>
              <span style={{ flex:1, fontSize:'13px' }}>{item.label}</span>
              {item.badge && unreadCount>0 && (
                <span style={{ background:'var(--danger)', color:'white', fontSize:'9px', fontWeight:800, padding:'1px 5px', borderRadius:'8px', minWidth:'16px', textAlign:'center' }}>{unreadCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>
      {/* User */}
      <div style={{ padding:'12px', borderTop:'1px solid var(--lavezzi)' }}>
        <LangSwitcher/>
        <Link to="/app/profile" onClick={()=>setOpen(false)}
          style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 8px', borderRadius:'12px', textDecoration:'none', transition:'background 0.2s', margin:'8px 0' }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--sand)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,var(--caramel),var(--caramel-dark))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'14px', flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-main)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</p>
            <span style={{ fontSize:'10px', background:'rgba(201,168,76,0.12)', color:'var(--caramel-dark)', padding:'1px 8px', borderRadius:'20px', fontWeight:700 }}>
              {ROLE_LABELS[user?.role]||user?.role}
            </span>
          </div>
          <User size={13} style={{ color:'var(--akan)', flexShrink:0 }}/>
        </Link>
        <button onClick={()=>{logout();navigate('/login');}}
          style={{ display:'flex', alignItems:'center', gap:'7px', color:'var(--noisette)', fontSize:'12px', cursor:'pointer', background:'none', border:'none', padding:'6px 8px', transition:'all 0.2s', width:'100%', fontFamily:'inherit', borderRadius:'8px' }}
          onMouseEnter={e=>{e.currentTarget.style.color='var(--danger)';e.currentTarget.style.background='var(--danger-bg)'}}
          onMouseLeave={e=>{e.currentTarget.style.color='var(--noisette)';e.currentTarget.style.background='transparent'}}>
          <LogOut size={13}/> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--cream)' }}>
      <aside style={{ width:'240px', flexShrink:0, display:'none' }} id="iragi-sidebar">
        <SidebarContent/>
      </aside>
      <style>{`
        @media(min-width:768px){#iragi-sidebar{display:block!important}}
        #mob-btn{display:block}@media(min-width:768px){#mob-btn{display:none!important}}
      `}</style>
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
          <div style={{ width:'240px', height:'100%', animation:'slideLeft 0.25s ease' }}><SidebarContent/></div>
          <div style={{ flex:1, background:'rgba(61,35,20,0.42)', backdropFilter:'blur(5px)' }} onClick={()=>setOpen(false)}/>
        </div>
      )}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <header style={{ background:'var(--white-warm)', borderBottom:'1px solid var(--lavezzi)', padding:'0 20px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <button id="mob-btn" onClick={()=>setOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--noisette)', padding:'4px' }}><Menu size={20}/></button>
          <div/>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'11px', background:'rgba(201,168,76,0.1)', color:'var(--caramel-dark)', padding:'3px 10px', borderRadius:'20px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>
              {ROLE_LABELS[user?.role]||user?.role}
            </span>
            <span style={{ fontSize:'13px', color:'var(--text-soft)', fontWeight:500, maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</span>
          </div>
        </header>
        <main style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
