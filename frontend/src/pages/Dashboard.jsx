import { DashLogo } from '../components/ui/AnimatedLogo';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import { Users, Briefcase, MapPin, Package, MessageSquare, Heart, TrendingUp, BookOpen, DollarSign, Home, ChevronRight, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const BEIGE = ['#C9A84C','#C8A882','#A8892A','#9B7D60','#D4C4B0','#E8D5B7'];

function CustomTooltip({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{ background:'var(--white-warm)', border:'1px solid var(--lavezzi)', borderRadius:'10px', padding:'10px 14px' }}>
      <p style={{ fontWeight:600, fontSize:'12px', color:'var(--text-main)', marginBottom:'2px' }}>{label}</p>
      <p style={{ color:'var(--caramel)', fontSize:'13px', fontWeight:700 }}>{payload[0].value?.toLocaleString()}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const { data, isLoading } = useQuery({ queryKey:['dashboard'], queryFn:()=>api.get('/dashboard').then(r=>r.data) });

  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'48px', height:'48px', borderRadius:'50%', border:'3px solid var(--sand)', borderTop:'3px solid var(--caramel)', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:'var(--text-muted)', fontSize:'14px' }}>Chargement...</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const d = data || {};

  const stats = [
    { label:t('dash_total_refugees'), value:d.refugees?.total||0,      icon:Users,      color:'var(--caramel)',      link:'/app/refugees' },
    { label:t('dash_active_cases'),   value:d.cases?.open||0,           icon:Briefcase,  color:'var(--noisette)',     link:'/app/cases' },
    { label:t('dash_critical'),       value:d.cases?.critical||0,       icon:AlertTriangle,color:'var(--danger)',     link:'/app/cases' },
    { label:t('dash_camps'),          value:d.camps?.total||0,          icon:MapPin,     color:'var(--tan)',           link:'/app/camps' },
    { label:t('dash_distributions'),  value:d.distributions?.today||0,  icon:Package,    color:'var(--caramel-soft)',  link:'/app/distributions' },
    { label:'Volontaires',            value:d.users?.volunteers||0,     icon:Heart,      color:'var(--noisette)',      link:'/app/hr' },
    { label:t('dash_messages'),       value:d.messages?.unread||0,      icon:MessageSquare,color:'var(--caramel)',     link:'/app/messages' },
    { label:'Financements',           value:d.financings?.count||0,     icon:DollarSign, color:'var(--caramel-dark)', link:'/app/financings' },
  ];

  const occupancyData = (d.campOccupancy||[]).map(c=>({ name:c.name.replace(' Camp',''), pct:parseFloat(c.pct)||0 }));
  const statusData    = [{ name:'Enregistrés', value:parseInt(d.refugees?.registered)||0 },{ name:'Vérifiés', value:parseInt(d.refugees?.verified)||0 }];
  const finByProg     = (d.financingByProgram||[]).map(p=>({ name:p.program||'—', value:parseFloat(p.total||0) }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'22px' }}>

      {/* Header with logo */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <DashLogo size={52} />
          <div>
            <h1 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'28px', fontWeight:700, color:'var(--text-main)', lineHeight:1.1 }}>
              {t('dash_welcome')}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color:'var(--text-soft)', fontSize:'13px', marginTop:'2px' }}>IRAGI Management System · Tableau de bord</p>
          </div>
        </div>
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'9px 18px', borderRadius:'100px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', color:'var(--caramel)', textDecoration:'none', fontSize:'12px', fontWeight:700, transition:'all 0.2s', letterSpacing:'0.03em' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(201,168,76,0.15)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(201,168,76,0.08)'}>
          <Home size={14}/> {t('dash_home_btn')}
        </Link>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px' }}>
        {stats.map(({ label, value, icon:Icon, color, link }) => (
          <Link key={label} to={link} style={{ textDecoration:'none' }}>
            <div className="stat-card" style={{ padding:'18px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:`${color}1A`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={18} style={{ color }}/>
                </div>
                <ChevronRight size={14} style={{ color:'var(--akan)' }}/>
              </div>
              <div className="stat-num" style={{ fontSize:'38px', color }}>{value.toLocaleString()}</div>
              <div className="stat-label" style={{ fontSize:'12px' }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px' }}>
        {/* Camp occupancy */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)' }}>Occupation des camps</h3>
            <Link to="/app/camps" style={{ fontSize:'12px', color:'var(--caramel)', textDecoration:'none', fontWeight:600 }}>Voir tout →</Link>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={occupancyData} barCategoryGap="35%">
              <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--noisette)' }}/>
              <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'var(--noisette)' }} unit="%"/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="pct" fill="var(--caramel)" radius={[6,6,0,0]}>
                {occupancyData.map((entry,i) => (
                  <Cell key={i} fill={entry.pct>=90?'var(--danger)':entry.pct>=75?'var(--tan)':'var(--caramel)'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)' }}>Statut des réfugiés</h3>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={4}>
                  {statusData.map((_,i)=><Cell key={i} fill={BEIGE[i%BEIGE.length]}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {statusData.map((item,i) => (
                <div key={item.name} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:BEIGE[i], flexShrink:0 }}/>
                  <span style={{ fontSize:'12px', color:'var(--text-soft)', flex:1 }}>{item.name}</span>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'var(--text-main)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent + Critical */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px' }}>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)' }}>Inscriptions récentes</h3>
            <Link to="/app/refugees" style={{ fontSize:'12px', color:'var(--caramel)', textDecoration:'none', fontWeight:600 }}>Voir tout →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {(d.recentRegistrations||[]).slice(0,5).map(r => (
              <Link key={r.id} to={`/app/refugees/${r.id}`} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'12px', background:'var(--cream)', textDecoration:'none', transition:'all 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(201,168,76,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--cream)'}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,var(--caramel-soft),var(--caramel))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'12px', flexShrink:0 }}>
                  {r.first_name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-main)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.first_name} {r.last_name}</p>
                  <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{r.rid} · {r.camp_name||'—'}</p>
                </div>
                <span className={`badge ${r.status==='verified'?'badge-ok':'badge-sand'}`} style={{ fontSize:'10px' }}>{r.status?.replace('_',' ')}</span>
              </Link>
            ))}
            {(d.recentRegistrations||[]).length===0 && <div className="empty-state" style={{ padding:'24px' }}><p style={{ fontSize:'13px' }}>Aucune inscription récente</p></div>}
          </div>
        </div>

        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)' }}>Cas critiques</h3>
            <Link to="/app/cases" style={{ fontSize:'12px', color:'var(--caramel)', textDecoration:'none', fontWeight:600 }}>Voir tout →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {(d.criticalCases||[]).length===0 ? (
              <div className="empty-state" style={{ padding:'24px' }}>
                <span style={{ fontSize:'24px' }}>🎉</span>
                <p style={{ fontSize:'13px', color:'var(--success)' }}>Aucun cas critique</p>
              </div>
            ) : (d.criticalCases||[]).map(c => (
              <Link key={c.id} to={`/app/cases/${c.id}`} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'12px', background:'var(--danger-bg)', border:'1px solid rgba(184,112,96,0.15)', textDecoration:'none', transition:'all 0.2s' }}>
                <div style={{ width:'4px', height:'36px', borderRadius:'2px', background:'var(--danger)', flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-main)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.title}</p>
                  <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{c.refugee_name}</p>
                </div>
                <span style={{ fontSize:'10px', background:'rgba(184,112,96,0.15)', color:'var(--danger)', padding:'2px 8px', borderRadius:'20px', fontWeight:700, flexShrink:0 }}>Critique</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent financings */}
      {(d.recentFinancings||[]).length > 0 && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)' }}>Derniers financements</h3>
            <Link to="/app/financings" style={{ fontSize:'12px', color:'var(--caramel)', textDecoration:'none', fontWeight:600 }}>Voir tout →</Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'10px' }}>
            {(d.recentFinancings||[]).slice(0,4).map(f => (
              <div key={f.id} style={{ padding:'14px', background:'var(--cream)', borderRadius:'12px', border:'1px solid var(--lavezzi)' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'var(--text-main)', marginBottom:'4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.title}</p>
                <p style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'22px', fontWeight:600, color:'var(--caramel)', lineHeight:1 }}>
                  {new Intl.NumberFormat('fr-FR',{style:'currency',currency:f.currency||'EUR',maximumFractionDigits:0}).format(f.amount)}
                </p>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                  <span className="badge badge-sand" style={{ fontSize:'10px' }}>{f.type}</span>
                  <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>{new Date(f.receipt_date).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes logoFloat {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-4px) rotate(1deg)}
        }
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
