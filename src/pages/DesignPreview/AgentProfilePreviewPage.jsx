import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, UserRound, BriefcaseBusiness, CalendarDays, MapPin, Phone, Mail, IdCard, GraduationCap, Building2, ShieldCheck, Clock3, ChevronRight, FileText } from 'lucide-react';
import PreviewLayout from './PreviewLayout';
import PreviewAvatar from './components/ui/PreviewAvatar';
import './AgentProfilePreviewPage.css';

const demo = {
  name: 'Mialitiana RABE', initials: 'MR', matricule: 'DEMO-002',
  poste: 'Chef de bureau', service: 'Service de l’Administration Générale',
  direction: 'Direction Générale de l’Administration', status: 'En activité',
  sexe: 'Féminin', naissance: '18 juin 1987', lieu: 'Antananarivo',
  adresse: 'Ankadifotsy, Antananarivo', telephone: '+261 34 12 345 67',
  email: 'mialitiana.rabe@exemple.mg', cin: '201  xxx xxx xxx',
  embauche: '09 mars 2014', anciennete: '12 ans et 8 mois',
  lieuTravail: 'Antaninarenina, Antananarivo',
  categorie: 'Catégorie 3', corps: 'Attaché d’administration',
  grade: '3e classe', echelon: '2e échelon',
  diplome: 'Master en Gestion des Ressources Humaines',
};
const tabs = ['Vue d’ensemble', 'Informations personnelles', 'Carrière & diplômes'];
export default function AgentProfilePreviewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tab, setTab] = useState(tabs[0]);
  return <PreviewLayout section="Profil agent">
    <div className="appv-page">
      <button className="appv-back" onClick={() => navigate('/design-preview/agents')}><ArrowLeft size={16}/> Retour aux agents</button>
      <section className="appv-hero">
        <div className="appv-identity">
          <PreviewAvatar initials={demo.initials} large className="appv-avatar"/>
          <div className="appv-identity-copy">
            <div className="appv-kicker"><span/> DOSSIER INDIVIDUEL <i>·</i> {demo.matricule}</div>
            <h1>{demo.name}</h1>
            <p>{demo.poste} <span>·</span> {demo.service}</p>
            <div className="appv-status"><i/> {demo.status}</div>
          </div>
        </div>
        <button className="appv-edit"><Pencil size={15}/> Modifier le profil</button>
      </section>
      <div className="appv-context">
        <div><Building2 size={16}/><span><small>Direction</small><b>{demo.direction}</b></span></div>
        <div><BriefcaseBusiness size={16}/><span><small>Poste actuel</small><b>{demo.poste}</b></span></div>
        <div><CalendarDays size={16}/><span><small>Date d’embauche</small><b>{demo.embauche}</b></span></div>
        <div><Clock3 size={16}/><span><small>Ancienneté</small><b>{demo.anciennete}</b></span></div>
      </div>
      <nav className="appv-tabs" aria-label="Sections du profil">{tabs.map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</nav>
      {tab===tabs[0]&&<div className="appv-overview">
        <div className="appv-main-column">
          <section className="appv-card">
            <header><div className="appv-card-icon"><UserRound size={17}/></div><div><h2>Informations personnelles</h2><p>Les principales informations d’identification de l’agent.</p></div><button onClick={()=>setTab(tabs[1])}>Tout voir <ChevronRight size={14}/></button></header>
            <div className="appv-info-grid">
              <Info label="Nom complet" value={demo.name}/><Info label="Sexe" value={demo.sexe}/><Info label="Date de naissance" value={demo.naissance}/><Info label="Lieu de naissance" value={demo.lieu}/><Info label="Téléphone" value={demo.telephone}/><Info label="Adresse" value={demo.adresse}/>
            </div>
          </section>
          <section className="appv-card">
            <header><div className="appv-card-icon"><BriefcaseBusiness size={17}/></div><div><h2>Situation administrative</h2><p>Aperçu de la position professionnelle enregistrée.</p></div><button onClick={()=>setTab(tabs[2])}>Voir la carrière <ChevronRight size={14}/></button></header>
            <div className="appv-career-grid"><Info label="Catégorie" value={demo.categorie}/><Info label="Corps" value={demo.corps}/><Info label="Grade" value={demo.grade}/><Info label="Échelon" value={demo.echelon}/></div>
          </section>
        </div>
        <aside className="appv-side-column">
          <section className="appv-side-card"><span className="appv-side-eyebrow">REPÈRES DU DOSSIER</span><div className="appv-side-stat"><b>12<span> ans</span></b><small>d’ancienneté au MEF</small></div><div className="appv-side-line"/><div className="appv-side-row"><span>Matricule</span><b>{demo.matricule}</b></div><div className="appv-side-row"><span>Lieu de travail</span><b>{demo.lieuTravail}</b></div><div className="appv-side-row"><span>Statut</span><b className="appv-active">En activité</b></div></section>
          <section className="appv-side-card appv-diploma"><div className="appv-diploma-icon"><GraduationCap size={19}/></div><span className="appv-side-eyebrow">DIPLÔME PRINCIPAL</span><b>{demo.diplome}</b><small>Diplôme déclaré dans le dossier agent</small><button onClick={()=>setTab(tabs[2])}>Consulter les diplômes <ChevronRight size={14}/></button></section>
        </aside>
      </div>}
      {tab===tabs[1]&&<section className="appv-card appv-full-card"><header><div className="appv-card-icon"><UserRound size={17}/></div><div><h2>Informations personnelles</h2><p>Identité, coordonnées et informations civiles.</p></div></header><div className="appv-info-grid appv-expanded"><Info label="Nom complet" value={demo.name}/><Info label="Matricule" value={demo.matricule}/><Info label="Sexe" value={demo.sexe}/><Info label="Date de naissance" value={demo.naissance}/><Info label="Lieu de naissance" value={demo.lieu}/><Info label="CIN" value={demo.cin}/><Info label="Téléphone" value={demo.telephone}/><Info label="Adresse e-mail" value={demo.email}/><Info label="Adresse" value={demo.adresse}/><Info label="Lieu de travail" value={demo.lieuTravail}/></div></section>}
      {tab===tabs[2]&&<div className="appv-career-page"><section className="appv-card"><header><div className="appv-card-icon"><BriefcaseBusiness size={17}/></div><div><h2>Situation administrative actuelle</h2><p>Dernière situation de carrière connue dans le dossier.</p></div></header><div className="appv-career-grid"><Info label="Catégorie" value={demo.categorie}/><Info label="Corps" value={demo.corps}/><Info label="Grade" value={demo.grade}/><Info label="Échelon" value={demo.echelon}/></div></section><section className="appv-card"><header><div className="appv-card-icon"><GraduationCap size={17}/></div><div><h2>Diplômes & formations</h2><p>Qualifications déclarées par l’agent.</p></div></header><div className="appv-diploma-row"><div className="appv-diploma-icon"><GraduationCap size={19}/></div><span><b>{demo.diplome}</b><small>Diplôme de niveau Master · Domaine : Gestion</small></span><ShieldCheck size={17}/></div></section><section className="appv-card"><header><div className="appv-card-icon"><CalendarDays size={17}/></div><div><h2>Parcours professionnel</h2><p>Repères chronologiques du parcours.</p></div></header><div className="appv-timeline"><div><i/><span><b>Situation actuelle</b><small>{demo.grade} · {demo.echelon}</small></span><time>En cours</time></div><div><i/><span><b>Recrutement au MEF</b><small>Entrée dans l’administration</small></span><time>{demo.embauche}</time></div></div></section></div>}
      <div className="appv-disclaimer"><ShieldCheck size={15}/> Maquette de démonstration — les informations affichées sont fictives et ne proviennent pas de la base SYGPERS.</div>
    </div>
  </PreviewLayout>;
}
function Info({label,value}){return <div className="appv-info"><span>{label}</span><b>{value||'—'}</b></div>}
