import { Link, useLocation } from 'react-router-dom';
import { Activity, BriefcaseBusiness, Building2, CircleHelp, FileText, LayoutDashboard, Settings, Users } from 'lucide-react';
import './PreviewSidebar.css';

const groups=[
 {label:'GESTION RH',items:[['Tableau de bord','/design-preview',LayoutDashboard],['Organisation','/design-preview/organisation',Building2],['Agents','/design-preview/agents',Users],['Carrières','/design-preview/carrieres',BriefcaseBusiness],['Mes activités','/design-preview/activites',Activity]]},
 {label:'DOCUMENTS',items:[['Documents RH','/design-preview/documents',FileText]]},
 {label:'CONFIGURATION',items:[['Administration','/design-preview/administration',Settings]]},
];

export default function PreviewSidebar(){
 const {pathname}=useLocation();
 return <aside className="pv-sidebar">
  <Link to="/design-preview" className="pv-brand"><span className="pv-brand-mark">SY</span><span><b>SYGPERS</b><small>GESTION DES RESSOURCES HUMAINES</small></span></Link>
  <div className="pv-workspace"><span className="pv-workspace-dot"/><span>MINISTÈRE DE L’ÉCONOMIE<br/><b>ET DES FINANCES</b></span></div>
  <nav className="pv-nav">{groups.map(group=><section key={group.label}><p>{group.label}</p>{group.items.map(([label,path,Icon])=><Link key={path} to={path} className={pathname===path?'active':''}><Icon size={17}/><span>{label}</span></Link>)}</section>)}</nav>
  <div className="pv-sidebar-bottom"><div className="pv-help"><CircleHelp size={17}/><span><b>Besoin d’aide ?</b><small>Consulter le guide SYGPERS</small></span></div><div className="pv-user"><span className="pv-user-avatar">JT</span><span><b>Josué TSIVOERY</b><small>Agent du personnel</small></span><span className="pv-user-chevron">⌄</span></div></div>
 </aside>;
}
