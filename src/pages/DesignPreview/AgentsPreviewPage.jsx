import { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileText, Search, SlidersHorizontal, UserRound, Users, X } from 'lucide-react';
import PreviewLayout from './PreviewLayout';
import './AgentsPreviewPage.css';

const demoAgents = [
 {id:'1',initials:'HR',name:'Hery RANDRIANARISOA',matricule:'DEMO-001',poste:'Chef de service',service:'Administration Générale',direction:'Direction Générale de l’Administration',embauche:'12/05/2012',tone:'sand'},
 {id:'2',initials:'MR',name:'Mialitiana RABE',matricule:'DEMO-002',poste:'Chef de bureau',service:'Administration Générale',direction:'Direction Générale de l’Administration',embauche:'09/03/2014',tone:'gold'},
 {id:'3',initials:'TR',name:'Toky RAZAFINDRAKOTO',matricule:'DEMO-003',poste:'Agent administratif',service:'Administration Générale',direction:'Direction Générale de l’Administration',embauche:'17/08/2018',tone:'blue'},
 {id:'4',initials:'LA',name:'Lova ANDRIAMAHERY',matricule:'SPERS-001',poste:'Chef de service',service:'Personnel',direction:'Direction des Ressources Humaines',embauche:'03/02/2010',tone:'sage'},
 {id:'5',initials:'FR',name:'Faly RAKOTOARISOA',matricule:'SPERS-002',poste:'Chef de bureau',service:'Personnel',direction:'Direction des Ressources Humaines',embauche:'22/11/2016',tone:'sand'},
 {id:'6',initials:'JR',name:'Josette RAZANASOAVINA',matricule:'SPERS-003',poste:'Gestionnaire RH',service:'Personnel',direction:'Direction des Ressources Humaines',embauche:'14/06/2019',tone:'gold'},
 {id:'7',initials:'AR',name:'Andry RAKOTONDRABE',matricule:'SPERS-004',poste:'Gestionnaire RH',service:'Personnel',direction:'Direction des Ressources Humaines',embauche:'11/09/2017',tone:'blue'},
 {id:'8',initials:'MR',name:'Mialy RASOLO',matricule:'DEMO-008',poste:'Attachée d’administration',service:'Budget',direction:'Direction du Budget',embauche:'05/01/2021',tone:'rose'},
 {id:'9',initials:'NR',name:'Nantenaina RAKOTO',matricule:'DEMO-009',poste:'Administrateur civil',service:'Trésor',direction:'Direction du Trésor',embauche:'18/04/2015',tone:'sage'},
 {id:'10',initials:'FA',name:'Fanja ANDRIANJAFY',matricule:'DEMO-010',poste:'Assistante de direction',service:'Budget',direction:'Direction du Budget',embauche:'28/02/2020',tone:'rose'},
 {id:'11',initials:'TR',name:'Tahina RAKOTOMALALA',matricule:'DEMO-011',poste:'Contrôleur',service:'Trésor',direction:'Direction du Trésor',embauche:'07/07/2013',tone:'blue'},
 {id:'12',initials:'RA',name:'Rija ANDRIANASOLO',matricule:'DEMO-012',poste:'Agent administratif',service:'Personnel',direction:'Direction des Ressources Humaines',embauche:'16/10/2022',tone:'gold'},
];
function Avatar({agent,large=false}){return <span className={`ap-avatar ap-${agent.tone}${large?' ap-avatar-large':''}`}>{agent.initials}</span>}

export default function AgentsPreviewPage(){
 const [query,setQuery]=useState('');
 const [service,setService]=useState('Tous les services');
 const [selectedId,setSelectedId]=useState('2');
 const [page,setPage]=useState(1);
 const [filtersOpen,setFiltersOpen]=useState(false);
 const pageSize=6;
 const services=['Tous les services','Administration Générale','Personnel','Budget','Trésor'];
 const filtered=useMemo(()=>demoAgents.filter(a=>(service==='Tous les services'||a.service===service)&&[a.name,a.matricule,a.poste,a.service,a.direction].join(' ').toLowerCase().includes(query.trim().toLowerCase())),[query,service]);
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const currentPage=Math.min(page,pages);
 const visible=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
 const selected=filtered.find(a=>a.id===selectedId)||visible[0]||null;
 const chooseService=v=>{setService(v);setPage(1)};
 return <PreviewLayout section="Agents">\n  <div className="ap-layout">
   <main className="ap-list-area">
    <div className="ap-heading-row"><div><span className="ap-eyebrow"><i/> RESSOURCES HUMAINES</span><h1>Agents</h1><p>Sélectionnez un agent pour voir son résumé sans quitter la liste.</p></div><button className="ap-add"><span>＋</span> Ajouter un agent</button></div>
    <div className="ap-toolbar"><label className="ap-search"><Search size={17}/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Rechercher par nom, matricule, poste..." aria-label="Rechercher un agent"/>{query&&<button onClick={()=>setQuery('')} aria-label="Effacer"><X size={14}/></button>}</label><label className="ap-service-select"><select value={service} onChange={e=>chooseService(e.target.value)} aria-label="Filtrer par service">{services.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={14}/></label><button className={`ap-filter-button${filtersOpen?' active':''}`} onClick={()=>setFiltersOpen(v=>!v)} aria-label="Filtres avancés"><SlidersHorizontal size={16}/></button><span className="ap-result-count">{filtered.length} résultats</span></div>
    {filtersOpen&&<div className="ap-filter-panel"><div><b>Affiner la recherche</b><small>Filtrez les agents par unité organisationnelle.</small></div><button onClick={()=>{setQuery('');chooseService('Tous les services')}}>Réinitialiser</button></div>}
    <section className="ap-table-card"><div className="ap-table-scroll"><table className="ap-table"><thead><tr><th>AGENT</th><th>MATRICULE</th><th>POSTE</th><th>SERVICE</th></tr></thead><tbody>{visible.map(agent=><tr key={agent.id} className={selected?.id===agent.id?'selected':''} onClick={()=>setSelectedId(agent.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedId(agent.id)}}} tabIndex={0}><td><div className="ap-person"><Avatar agent={agent}/><span><b>{agent.name}</b><small>{agent.matricule.startsWith('SPERS')?'SPERS':'SAG'}</small></span></div></td><td><code>{agent.matricule}</code></td><td>{agent.poste}</td><td><span className="ap-service-name">{agent.service}</span></td></tr>)}</tbody></table></div>
     {visible.length===0&&<div className="ap-empty"><Search size={22}/><b>Aucun agent trouvé</b><span>Modifiez les termes de recherche ou le service sélectionné.</span><button onClick={()=>{setQuery('');chooseService('Tous les services')}}>Effacer les filtres</button></div>}
     <footer className="ap-pagination"><span>{filtered.length?((currentPage-1)*pageSize+1):0}–{Math.min(currentPage*pageSize,filtered.length)} sur {filtered.length} agents</span><div><button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft size={14}/> Précédent</button><button disabled={currentPage===pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Suivant <ChevronRight size={14}/></button></div></footer>
    </section>
    <div className="ap-list-foot"><span>Les données affichées sont fictives.</span><span>SYGPERS <i>·</i> Gestion des ressources humaines</span></div>
   </main>
   <aside className="ap-preview">
    {selected?<><div className="ap-profile-top"><Avatar agent={selected} large/><span className="ap-online-dot"/></div><h2>{selected.name}</h2><div className="ap-profile-meta"><code>{selected.matricule}</code><span>{selected.poste}</span></div><div className="ap-details"><div><span>Service</span><b>{selected.service}</b></div><div><span>Direction</span><b>{selected.direction}</b></div><div><span>Embauche</span><b>{selected.embauche}</b></div></div><div className="ap-preview-actions"><button className="ap-profile-primary"><UserRound size={16}/> Voir le profil <ArrowRight size={15}/></button><button><BriefcaseBusiness size={16}/> Analyser la carrière</button><button><FileText size={16}/> Rédiger une demande</button></div><div className="ap-preview-note"><CalendarDays size={14}/> Aperçu rapide · Sélectionnez un autre agent dans la liste</div></>:<div className="ap-no-selection"><Users size={26}/><b>Aucun agent sélectionné</b><span>Choisissez un agent dans la liste pour afficher son résumé.</span></div>}
   </aside>\n  </div>\n </PreviewLayout>;\n}\n