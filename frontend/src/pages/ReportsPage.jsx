import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { Download, FileText, BarChart2, Calendar, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const BEIGE_PALETTE = ['#C9A84C','#C8A882','#A8892A','#8B6F55','#DDD5C8','#E5D5B8'];

export default function ReportsPage() {
  const { t } = useLang();
  const [period, setPeriod] = useState('monthly');
  const [exporting, setExporting] = useState(null);

  const { data:stats }  = useQuery({ queryKey:['refugee-stats'], queryFn:()=>api.get('/refugees/stats').then(r=>r.data) });
  const { data:dash }   = useQuery({ queryKey:['dashboard'],     queryFn:()=>api.get('/dashboard').then(r=>r.data) });
  const { data:finSum } = useQuery({ queryKey:['fin-summary'],   queryFn:()=>api.get('/financings/summary').then(r=>r.data).catch(()=>({})) });

  const getPeriodLabel = () => {
    const d = new Date();
    if (period==='daily')   return `Rapport Journalier — ${d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
    if (period==='monthly') return `Rapport Mensuel — ${d.toLocaleString('fr-FR',{month:'long',year:'numeric'})}`;
    return `Rapport Annuel — ${d.getFullYear()}`;
  };

  const exportPDF = async () => {
    setExporting('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      // ── HEADER ──────────────────────────────────────
      doc.setFillColor(237, 224, 204); // sand beige
      doc.rect(0, 0, W, 42, 'F');
      doc.setFillColor(201, 168, 76);  // caramel accent bar
      doc.rect(0, 0, 5, 42, 'F');

      // Logo circle
      doc.setFillColor(201, 168, 76);
      doc.circle(22, 21, 9, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(14); doc.setFont('helvetica','bold');
      doc.text('I', 22, 25, { align:'center' });

      // Org name
      doc.setTextColor(74, 55, 40);
      doc.setFontSize(18); doc.setFont('helvetica','bold');
      doc.text('IRAGI', 36, 19);
      doc.setFontSize(9); doc.setFont('helvetica','normal');
      doc.setTextColor(139, 111, 85);
      doc.text('Gestion des Réfugiés — République Démocratique du Congo', 36, 26);
      doc.text('alicebunani5@gmail.com · +250 791 431 851', 36, 32);

      // Report title on right
      doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.setTextColor(74, 55, 40);
      doc.text(getPeriodLabel(), W - 10, 19, { align:'right' });
      doc.setFontSize(8); doc.setFont('helvetica','normal');
      doc.setTextColor(139, 111, 85);
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, W - 10, 26, { align:'right' });
      doc.text(`Par: Système IRAGI`, W - 10, 32, { align:'right' });

      // Gold separator line
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.5);
      doc.line(10, 45, W - 10, 45);

      let y = 52;

      // ── SUMMARY TABLE ────────────────────────────────
      doc.setFontSize(12); doc.setFont('helvetica','bold');
      doc.setTextColor(74, 55, 40);
      doc.text('1. Statistiques Générales', 10, y); y += 6;

      const summaryData = [
        ['Total Réfugiés inscrits', (dash?.refugees?.total||0).toString()],
        ['Réfugiés vérifiés',       (dash?.refugees?.verified||0).toString()],
        ['Cas actifs ouverts',       (dash?.cases?.open||0).toString()],
        ['Cas critiques',            (dash?.cases?.critical||0).toString()],
        ['Camps actifs',             (dash?.camps?.total||0).toString()],
        ['Distributions aujourd\'hui',(dash?.distributions?.today||0).toString()],
        ['Volontaires',              (dash?.users?.volunteers||0).toString()],
        ['Donateurs',                (dash?.users?.donors||0).toString()],
        ['Total financements (EUR)', new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(finSum?.totals?.grand_total||0)],
        ['Cours publiés',            (dash?.courses?.published||0).toString()],
        ['Témoignages publiés',      (dash?.stories?.published||0).toString()],
      ];

      autoTable(doc, {
        startY: y, head:[['Indicateur','Valeur']], body: summaryData,
        theme:'striped',
        headStyles:{ fillColor:[201,168,76], textColor:[74,55,40], fontStyle:'bold', fontSize:10 },
        alternateRowStyles:{ fillColor:[245,239,230] },
        styles:{ textColor:[74,55,40], fontSize:10 },
        columnStyles:{ 0:{fontStyle:'bold'}, 1:{halign:'right',fontStyle:'bold'} },
        margin:{ left:10, right:10 },
      });
      y = doc.lastAutoTable.finalY + 12;

      // ── NATIONALITY TABLE ─────────────────────────────
      if ((stats?.byNationality||[]).length > 0) {
        if (y > H - 60) { doc.addPage(); y = 20; }
        doc.setFontSize(12); doc.setFont('helvetica','bold');
        doc.setTextColor(74, 55, 40);
        doc.text('2. Répartition par Nationalité', 10, y); y += 6;
        autoTable(doc, {
          startY: y, head:[['Nationalité','Nombre','%']],
          body: (stats.byNationality||[]).map(n => {
            const pct = dash?.refugees?.total ? ((n.count/dash.refugees.total)*100).toFixed(1)+'%' : '—';
            return [n.nationality||'Inconnue', n.count.toString(), pct];
          }),
          theme:'striped',
          headStyles:{ fillColor:[200,168,130], textColor:[74,55,40], fontStyle:'bold', fontSize:10 },
          alternateRowStyles:{ fillColor:[250,246,240] },
          styles:{ textColor:[74,55,40], fontSize:10 },
          columnStyles:{ 1:{halign:'center'}, 2:{halign:'center'} },
          margin:{ left:10, right:10 },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      // ── ORIGIN TABLE ─────────────────────────────────
      if ((stats?.byOrigin||[]).length > 0) {
        if (y > H - 60) { doc.addPage(); y = 20; }
        doc.setFontSize(12); doc.setFont('helvetica','bold');
        doc.setTextColor(74, 55, 40);
        doc.text('3. Provinces d\'origine (DRC)', 10, y); y += 6;
        autoTable(doc, {
          startY: y, head:[['Province d\'origine','Nombre']],
          body: (stats.byOrigin||[]).map(o => [o.origin_province||'Inconnue', o.count.toString()]),
          theme:'striped',
          headStyles:{ fillColor:[200,168,130], textColor:[74,55,40], fontStyle:'bold', fontSize:10 },
          alternateRowStyles:{ fillColor:[250,246,240] },
          styles:{ textColor:[74,55,40], fontSize:10 },
          margin:{ left:10, right:10 },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      // ── FINANCING TABLE ──────────────────────────────
      if ((finSum?.byProgram||[]).length > 0) {
        if (y > H - 60) { doc.addPage(); y = 20; }
        doc.setFontSize(12); doc.setFont('helvetica','bold');
        doc.setTextColor(74, 55, 40);
        doc.text('4. Financements par Programme', 10, y); y += 6;
        autoTable(doc, {
          startY: y, head:[['Programme','Total (EUR)']],
          body: (finSum.byProgram||[]).map(p => [p.program||'—', new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(p.total||0)+' €']),
          theme:'striped',
          headStyles:{ fillColor:[200,168,130], textColor:[74,55,40], fontStyle:'bold', fontSize:10 },
          alternateRowStyles:{ fillColor:[250,246,240] },
          styles:{ textColor:[74,55,40], fontSize:10 },
          columnStyles:{ 1:{halign:'right'} },
          margin:{ left:10, right:10 },
        });
      }

      // ── FOOTER (all pages) ───────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Footer line
        doc.setDrawColor(201, 168, 76);
        doc.setLineWidth(0.3);
        doc.line(10, H - 18, W - 10, H - 18);
        // Footer text
        doc.setFontSize(7); doc.setFont('helvetica','normal');
        doc.setTextColor(160, 128, 96);
        doc.text('IRAGI — République Démocratique du Congo — Document Confidentiel', 10, H - 12);
        doc.text(`Page ${i} / ${pageCount}`, W - 10, H - 12, { align:'right' });
        doc.text(`Généré: ${new Date().toLocaleString('fr-FR')}`, W / 2, H - 12, { align:'center' });
      }

      doc.save(`IRAGI_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('📄 Rapport PDF téléchargé !');
    } catch(e) { toast.error('Erreur PDF: '+e.message); console.error(e); }
    finally { setExporting(null); }
  };

  const exportWord = async () => {
    setExporting('word');
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType, PageNumber } = await import('docx');
      const b = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: 'DDD5C8'
};
      const bord = { top:b, bottom:b, left:b, right:b };
      const mkRow = (cells, header=false) => new TableRow({
        children: cells.map((c,i) => new TableCell({
          borders:bord,
          width:{ size:i===0?6000:3360, type:WidthType.DXA },
          shading:{ fill:header?'C9A84C':(cells.indexOf(c)%2===0?'FAF6F0':'FFFFFF'), type:ShadingType.CLEAR },
          margins:{ top:80, bottom:80, left:120, right:120 },
          children:[new Paragraph({ children:[new TextRun({ text:String(c)||'—', bold:header, color:header?'3D2314':'3D2314', size:20, font:'Arial' })] })],
        }))
      });

      const doc = new Document({
        sections:[{ children:[
          // Title block
          new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:120},
            children:[new TextRun({ text:'IRAGI', bold:true, size:48, font:'"Cormorant Garamond", Arial', color:'3D2314' })] }),
          new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:80},
            children:[new TextRun({ text:'République Démocratique du Congo · Gestion Humanitaire', size:22, font:'Arial', color:'8B6F55' })] }),
          new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:80},
            children:[new TextRun({ text:'alicebunani5@gmail.com · +250 791 431 851', size:18, font:'Arial', color:'A08060' })] }),
          new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:40,after:200},
            border:{ bottom:{style:BorderStyle.SINGLE,size:4,color:'C9A84C',space:4} },
            children:[new TextRun({ text:getPeriodLabel(), bold:true, size:26, font:'Arial', color:'C9A84C' })] }),

          // Summary
          new Paragraph({ spacing:{before:200,after:120}, children:[new TextRun({ text:'1. Statistiques Générales', bold:true, size:26, font:'Arial', color:'3D2314' })] }),
          new Table({ width:{size:9360,type:WidthType.DXA}, columnWidths:[6000,3360], rows:[
            mkRow(['Indicateur','Valeur'],true),
            mkRow(['Total Réfugiés',(dash?.refugees?.total||0).toString()]),
            mkRow(['Réfugiés vérifiés',(dash?.refugees?.verified||0).toString()]),
            mkRow(['Cas actifs',(dash?.cases?.open||0).toString()]),
            mkRow(['Cas critiques',(dash?.cases?.critical||0).toString()]),
            mkRow(['Camps actifs',(dash?.camps?.total||0).toString()]),
            mkRow(['Total financements',new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(finSum?.totals?.grand_total||0)+' EUR']),
          ]}),

          // Footer note
          new Paragraph({ spacing:{before:400,after:80},
            border:{ top:{style:BorderStyle.SINGLE,size:2,color:'C9A84C',space:4} },
            children:[new TextRun({ text:`Document généré le ${new Date().toLocaleString('fr-FR')} par le Système IRAGI — Confidentiel`, size:16, font:'Arial', color:'A08060', italics:true })] }),
        ]}]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url;
      a.download=`IRAGI_${period}_${new Date().toISOString().split('T')[0]}.docx`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('📝 Rapport Word téléchargé !');
    } catch(e) { toast.error('Erreur Word: '+e.message); console.error(e); }
    finally { setExporting(null); }
  };

  const natData = (stats?.byNationality||[]).map(n=>({ name:n.nationality||'?', value:parseInt(n.count) }));
  const statusData = (stats?.byStatus||[]).map(s=>({ name:s.status?.replace('_',' ')||'?', value:parseInt(s.count) }));
  const genderData = (stats?.byGender||[]).map(g=>({ name:g.gender||'?', value:parseInt(g.count) }));
  const finByProg = (finSum?.byProgram||[]).map(p=>({ name:p.program||'—', value:parseFloat(p.total||0) }));

  const TT = ({active,payload,label}) => {
    if(!active||!payload?.length) return null;
    return <div style={{ background:'var(--white-warm)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'var(--text-main)' }}><p style={{ fontWeight:600, marginBottom:'2px' }}>{label}</p><p style={{ color:'var(--caramel)' }}>{payload[0].value}</p></div>;
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'30px', fontWeight:700, color:'var(--text-main)' }}>{t('dash_reports')}</h1>
          <p style={{ color:'var(--text-soft)', fontSize:'13px' }}>Données en temps réel</p>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
          {/* Period selector */}
          <div style={{ display:'flex', background:'var(--sand)', borderRadius:'12px', padding:'3px', border:'1px solid var(--border)' }}>
            {[['daily',t('rep_daily')],['monthly',t('rep_monthly')],['annual',t('rep_annual')]].map(([k,l]) => (
              <button key={k} onClick={()=>setPeriod(k)} style={{ padding:'8px 14px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, transition:'all 0.2s', background:period===k?'linear-gradient(135deg,var(--caramel),var(--caramel-dark))':'transparent', color:period===k?'white':'var(--noisette)', fontFamily:'inherit' }}>{l}</button>
            ))}
          </div>
          <button onClick={exportPDF} disabled={!!exporting} className="btn-primary" style={{ gap:'6px' }}>
            {exporting==='pdf'?<Loader2 size={14} className="spinner"/>:<Download size={14}/>} {t('rep_export_pdf')}
          </button>
          <button onClick={exportWord} disabled={!!exporting} className="btn-secondary" style={{ gap:'6px' }}>
            {exporting==='word'?<Loader2 size={14} className="spinner"/>:<FileText size={14}/>} {t('rep_export_word')}
          </button>
        </div>
      </div>

      {/* Period badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 16px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.22)', borderRadius:'10px', width:'fit-content' }}>
        <Calendar size={14} style={{ color:'var(--caramel)' }}/>
        <span style={{ fontSize:'13px', color:'var(--noisette)', fontWeight:600 }}>{getPeriodLabel()}</span>
      </div>

      {/* KPI summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'12px' }}>
        {[
          {l:'Réfugiés',   v:dash?.refugees?.total||0},
          {l:'Cas actifs', v:dash?.cases?.open||0},
          {l:'Critiques',  v:dash?.cases?.critical||0},
          {l:'Camps',      v:dash?.camps?.total||0},
          {l:'Volontaires',v:dash?.users?.volunteers||0},
          {l:'Donateurs',  v:dash?.users?.donors||0},
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{ padding:'16px', textAlign:'center' }}>
            <div style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'36px', fontWeight:600, color:'var(--caramel)', lineHeight:1 }}>{s.v.toLocaleString()}</div>
            <div style={{ fontSize:'11px', fontWeight:600, color:'var(--noisette)', marginTop:'4px', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        {[
          { title:'Par Nationalité', data:natData, type:'bar-h' },
          { title:'Par Statut',      data:statusData, type:'pie' },
          { title:'Par Genre',       data:genderData, type:'pie' },
          { title:'Financements par Programme (EUR)', data:finByProg, type:'bar' },
        ].map((chart,i) => (
          <div key={i} style={{ background:'var(--white-warm)', border:'1px solid var(--border)', borderRadius:'20px', padding:'22px' }}>
            <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:'18px', fontWeight:700, color:'var(--text-main)', marginBottom:'18px' }}>{chart.title}</h3>
            <ResponsiveContainer width="100%" height={200}>
              {chart.type==='bar-h' ? (
                <BarChart data={chart.data} layout="vertical">
                  <XAxis type="number" tick={{ fontSize:10, fill:'var(--noisette)' }}/>
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:'var(--noisette)' }} width={70}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="value" fill="var(--caramel)" radius={[0,4,4,0]}/>
                </BarChart>
              ) : chart.type==='bar' ? (
                <BarChart data={chart.data}>
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--noisette)' }}/>
                  <YAxis tick={{ fontSize:10, fill:'var(--noisette)' }}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="value" fill="var(--caramel)" radius={[6,6,0,0]}/>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie data={chart.data} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" paddingAngle={3}
                    label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                    {chart.data.map((_,i)=><Cell key={i} fill={BEIGE_PALETTE[i%BEIGE_PALETTE.length]}/>)}
                  </Pie>
                  <Tooltip content={<TT/>}/>
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
