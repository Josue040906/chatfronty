import { Link, useLocation } from 'react-router-dom';
import { Activity, Bell, BriefcaseBusiness, Building2, ChevronDown, CircleHelp, FileText, LayoutDashboard, Search, Settings, Users } from 'lucide-react';
import './PreviewLayout.css';

const groups=[
 {label:'GESTION RH',items:[['Tableau de bord','/design-preview',LayoutDashboard],['Organisation','/design-preview/organisation',Building2],['Agents','/design-preview/agents',Users],['Carrières','/design-preview/carrieres',BriefcaseBusiness],['Mes activités','/design-preview/activites',Activity]]},
 {label:'DOCUMENTS',items:[['Documents RH','/design-preview/documents',FileText]]},
 {label:'CONFIGURATION',items:[['Administration','/design-preview/administration',Settings]]},
];

export default function PreviewLayout({children,section='Tableau de bord'}){
 const location=useLocation();
 return <div className="pv-shell">
  <aside className="pv-sidebar">
   <Link to="/design-preview" className="pv-brand"><span className="pv-brand-mark">SY</span><span><b>SYGPERS</b><small>GESTION DES RESSOURCES HUMAINES</small></span></Link>
   <div className="pv-workspace"><span className="pv-workspace-dot"/><span>MINISTÈRE DE L’ÉCONOMIE<br/><b>ET DES FINANCES</b></span></div>
   <nav className="pv-nav">{groups.map(group=><section key={group.label}><p>{group.label}</p>{group.items.map(([label,path,Icon])=><Link key={path} to={path} className={location.pathname===path?'active':''}><Icon size={17}/><span>{label}</span></Link>)}</section>)}</nav>
   <div className="pv-sidebar-bottom"><div className="pv-help"><CircleHelp size={17}/><span><b>Besoin d’aide ?</b><small>Consulter le guide SYGPERS</small></span></div><div className="pv-user"><span className="pv-user-avatar">JT</span><span><b>Josué TSIVOERY</b><small>Agent du personnel</small></span><ChevronDown size={15}/></div></div>
  </aside>
  <main className="pv-main">
   <header className="pv-topbar"><div className="pv-breadcrumb">Espace RH <span>/</span> <b>{section}</b></div><div className="pv-top-actions"><button className="pv-assistant">✦ <span>Assistant RH</span></button><button className="pv-icon-button" aria-label="Recherche"><Search size={17}/></button><button className="pv-icon-button pv-notification" aria-label="Notifications"><Bell size={17}/><i/></button><span className="pv-top-avatar">JT</span><span className="pv-top-user"><b>Josué TSIVOERY</b><small>Agent du personnel</small></span><ChevronDown size={14}/></div></header>
   <div className="pv-page-content">{children}</div>
  </main>
 </div>;
}
