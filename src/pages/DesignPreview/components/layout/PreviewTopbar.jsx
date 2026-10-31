import { Bell, ChevronDown, Search } from 'lucide-react';
import './PreviewTopbar.css';

export default function PreviewTopbar({section='Tableau de bord'}){
 return <header className="pv-topbar">
  <div className="pv-breadcrumb">Espace RH <span>/</span> <b>{section}</b></div>
  <div className="pv-top-actions">
   <button className="pv-assistant">✦ <span>Assistant RH</span></button>
   <button className="pv-icon-button" aria-label="Recherche"><Search size={17}/></button>
   <button className="pv-icon-button pv-notification" aria-label="Notifications"><Bell size={17}/><i/></button>
   <span className="pv-top-avatar">JT</span><span className="pv-top-user"><b>Josué TSIVOERY</b><small>Agent du personnel</small></span><ChevronDown size={14}/>
  </div>
 </header>;
}
