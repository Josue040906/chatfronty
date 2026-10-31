import { useMemo, useState } from 'react';
import { Building2, ChevronDown, Crosshair, Maximize, Minus, Plus, Search, Users, X } from 'lucide-react';
import PreviewLayout from './PreviewLayout';
import PreviewAvatar from './components/ui/PreviewAvatar';
import './OrganisationPreviewPage.css';

const directions=[
 {id:'dga',name:"Direction Générale de l’Administration",short:'DGA',count:20,services:3,color:'brown',serviceList:[
  {id:'spers',code:'SPERS',name:'Service du Personnel',head:'Lova ANDRIANINAY',count:11,team:[['LA','Lova ANDRIANINAY','Chef de service'],['HR','Hery RANDRIANARISOA','Chef de bureau'],['MR','Mialitiana RABE','Gestionnaire RH'],['JR','Josette RAZANASOAVINA','Gestionnaire RH']]},
  {id:'sag',code:'SAG',name:"Service de l’Administration Générale",head:'Hery RANDRIANARISOA',count:6,team:[['HR','Hery RANDRIANARISOA','Chef de service'],['TR','Toky RAZAFINDRAKOTO','Agent administratif']]},
  {id:'sform',code:'SFORM',name:'Service de la Formation',head:'Non renseigné',count:3,team:[['MF','Miora FANILO','Gestionnaire de formation']]}
 ]},
 {id:'sdi',name:"Direction des Systèmes d’Information",short:'DSI',count:6,services:2,color:'ochre',serviceList:[
  {id:'sinfra',code:'SINFRA',name:'Service des Infrastructures',head:'Hanta RAKOTOZAFY',count:3,team:[['HR','Hanta RAKOTOZAFY','Chef de service'],['RA','Rija ANDRIANASOLO','Technicien'] ]},
  {id:'sdev',code:'SDEV',name:'Service du Développement',head:'Tiana ANDRIAMIHARISOA',count:3,team:[['TA','Tiana ANDRIAMIHARISOA','Chef de service'],['FA','Faly RAKOTOARISOA','Développeur']]}
 ]},
 {id:'df',name:'Direction Financière',short:'DF',count:4,services:2,color:'green',serviceList:[
  {id:'scompt',code:'SCOMPT',name:'Service de la Comptabilité',head:'Non renseigné',count:2,team:[['MR','Mialy RASOLO','Comptable'],['NR','Nantenaina RAKOTO','Comptable']]},
  {id:'sbud',code:'SBUD',name:'Service du Budget',head:'Non renseigné',count:2,team:[['FA','Fanja ANDRIANJAFY','Gestionnaire'],['TR','Tahina RAKOTOMALALA','Gestionnaire']]}
 ]}
];
const loose={id:'snr',code:'SNR',name:'Service non rattaché',head:'Non renseigné',count:2,team:[['AR','Andry RAKOTONDRABE','Agent administratif'],['RA','Rija ANDRIANASOLO','Agent administratif']]};
const allServices=[...directions.flatMap(d=>d.serviceList),loose];
export default function OrganisationPreviewPage(){
 const [query,setQuery]=useState('');
 const [zoom,setZoom]=useState(1);
 const [selected,setSelected]=useState(null);
 const [fit,setFit]=useState(true);
 const matches=useMemo(()=>query.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').trim(),[query]);
 const visibleDirections=useMemo(()=>directions.map(d=>({...d,serviceList:d.serviceList.filter(s=>!matches||[d.name,s.name,s.code,s.head].join(' ').toLocaleLowerCase('fr').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').includes(matches))})).filter(d=>!matches||d.name.toLocaleLowerCase('fr').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').includes(matches)||d.serviceList.length),[matches]);
 const serviceVisible=s=>!matches||[s.name,s.code,s.head].join(' ').toLocaleLowerCase('fr').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').includes(matches);
 const updateZoom=v=>{setZoom(Math.max(.7,Math.min(1.35,Number((zoom+v).toFixed(2)))));setFit(false)};
 const current=selected?allServices.find(s=>s.id===selected):null;
 return <PreviewLayout section="Organisation">
  <div className="op-page">
   <div className="op-heading">
    <div><span className="op-eyebrow"><i/> STRUCTURE</span><h1>Organigramme</h1><p>Cliquez sur un service pour ouvrir son équipe. Zoomez, rétrécissez, ou faites glisser le fond pour naviguer.</p></div>
    <div className="op-totals"><span><b>3</b> directions</span><i/><span><b>8</b> services</span><i/><span><b>32</b> agents</span></div>
   </div>
   <div className="op-toolbar">
    <label className="op-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une direction ou un service..." aria-label="Rechercher dans l'organigramme"/>{query&&<button onClick={()=>setQuery('')} aria-label="Effacer"><X size={14}/></button>}</label>
    <div className="op-zoom"><button onClick={()=>updateZoom(-.1)} aria-label="Dézoomer"><Minus size={15}/></button><span className="op-zoom-track"><i style={{left:`${(zoom-.7)/.65*100}%`}}/></span><button onClick={()=>updateZoom(.1)} aria-label="Zoomer"><Plus size={15}/></button><b>{Math.round(zoom*100)} %</b></div>
    <button className="op-fit" onClick={()=>{setZoom(1);setFit(true)}}><Maximize size={14}/> Tout voir</button>
    <span className="op-scale-label">Taille normale</span>
   </div>
   <div className="op-legend"><span><i className="brown"/> Administration</span><span><i className="ochre"/> Systèmes d'information</span><span><i className="green"/> Finances</span></div>
   <div className="op-canvas">
    <div className="op-canvas-grid" style={{transform:`scale(${zoom})`}}>
     <svg className="op-connectors" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
      <path d="M235 350 C280 350 270 180 325 180" className="op-link op-link-brown"/>
      <path d="M235 350 C280 350 270 350 325 350" className="op-link op-link-ochre"/>
      <path d="M235 350 C280 350 270 520 325 520" className="op-link op-link-green"/>
      <path d="M560 180 C610 180 610 70 665 70 M560 180 C610 180 610 180 665 180 M560 180 C610 180 610 290 665 290" className="op-link op-link-brown"/>
      <path d="M560 350 C610 350 610 410 665 410 M560 350 C610 350 610 500 665 500" className="op-link op-link-ochre"/>
      <path d="M560 520 C610 520 610 585 665 585 M560 520 C610 520 610 665 665 665" className="op-link op-link-green"/>
      <circle cx="235" cy="350" r="4" className="op-joint"/><circle cx="325" cy="180" r="4" className="op-joint"/><circle cx="325" cy="350" r="4" className="op-joint"/><circle cx="325" cy="520" r="4" className="op-joint"/>
     </svg>
     <div className="op-root"><span className="op-root-icon"><Building2 size={19}/></span><b>Ministère de l’Économie et des Finances</b><small>32 agents · 3 directions</small></div>
     <div className="op-direction op-direction-dga"><div><b>Direction Générale de l’Administration</b><small>3 services</small></div><strong>20</strong></div>
     <div className="op-direction op-direction-sdi"><div><b>Direction des Systèmes d’Information</b><small>2 services</small></div><strong>6</strong></div>
     <div className="op-direction op-direction-df"><div><b>Direction Financière</b><small>2 services</small></div><strong>4</strong></div>
     <div className="op-service-stack op-stack-dga">{directions[0].serviceList.filter(serviceVisible).map(s=><ServiceCard key={s.id} service={s} onClick={()=>setSelected(s.id)} selected={selected===s.id}/>)}</div>
     <div className="op-service-stack op-stack-sdi">{directions[1].serviceList.filter(serviceVisible).map(s=><ServiceCard key={s.id} service={s} onClick={()=>setSelected(s.id)} selected={selected===s.id}/>)}</div>
     <div className="op-service-stack op-stack-df">{directions[2].serviceList.filter(serviceVisible).map(s=><ServiceCard key={s.id} service={s} onClick={()=>setSelected(s.id)} selected={selected===s.id}/>)}</div>
     {serviceVisible(loose)&&<div className="op-loose"><ServiceCard service={loose} onClick={()=>setSelected(loose.id)} selected={selected===loose.id}/></div>}
    </div>
    {matches&&visibleDirections.length===0&&!serviceVisible(loose)&&<div className="op-no-results">Aucune direction ou service ne correspond à « {query} ».</div>}
   </div>
   <div className="op-footnote"><span>Les données de cet écran sont fictives et servent uniquement à la prévisualisation.</span><button onClick={()=>{setQuery('');setSelected(null);setZoom(1);setFit(true)}}><Crosshair size={13}/> Réinitialiser la vue</button></div>
  </div>
  {current&&<div className="op-drawer-backdrop" onClick={()=>setSelected(null)}><aside className="op-drawer" onClick={e=>e.stopPropagation()}><div className="op-drawer-head"><div><span className={`op-drawer-code ${current.id==='sinfra'||current.id==='sdev'?'ochre':current.id==='scompt'||current.id==='sbud'?'green':''}`}>{current.code}</span><h2>{current.name}</h2><p>Équipe du service · {current.count} agents</p></div><button onClick={()=>setSelected(null)} aria-label="Fermer"><X size={18}/></button></div><div className="op-drawer-summary"><div><b>{current.count}</b><span>Agents affectés</span></div><div><b>{current.head}</b><span>Responsable du service</span></div></div><h3>Membres de l’équipe</h3><div className="op-team">{current.team.map(([initials,name,role],i)=><div className="op-team-member" key={name}><PreviewAvatar initials={initials} className={`op-team-avatar tone-${i%4}`}/><span><b>{name}</b><small>{role}</small></span><span className="op-member-status">Actif</span></div>)}</div><p className="op-demo-note">Aperçu de démonstration — les profils et effectifs seront reliés aux données SYGPERS lors de l’intégration métier.</p></aside></div>}
 </PreviewLayout>;
}
function ServiceCard({service,onClick,selected}){
 const tone=service.id==='sinfra'||service.id==='sdev'?'ochre':service.id==='scompt'||service.id==='sbud'?'green':service.id==='snr'?'neutral':'brown';
 return <button className={`op-service-card tone-${tone} ${selected?'selected':''}`} onClick={onClick}><span className="op-service-info"><small>{service.code}</small><b>{service.name}</b><em>Chef : {service.head}</em><i style={{width:`${Math.max(12,service.count/11*100)}%`}}/></span><strong>{service.count}</strong></button>;
}
