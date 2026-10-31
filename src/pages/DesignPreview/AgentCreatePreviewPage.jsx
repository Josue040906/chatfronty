import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, UserRound, MapPin, BriefcaseBusiness, Camera, Upload, CheckCircle2, Info, CalendarDays, Building2, FileText, X } from 'lucide-react';
import PreviewLayout from './PreviewLayout';
import PreviewAvatar from './components/ui/PreviewAvatar';
import './AgentCreatePreviewPage.css';

const services=['Administration Générale','Service du Personnel','Direction du Budget','Direction du Trésor'];
const jobs={'Administration Générale':['Chef de bureau','Agent administratif','Secrétaire'],'Service du Personnel':['Gestionnaire RH','Chef de bureau','Assistant RH'],'Direction du Budget':['Contrôleur','Chargé d’études'],'Direction du Trésor':['Agent comptable','Contrôleur']};
const initial={matricule:'',nom:'',prenom:'',sexe:'',cin:'',telephone:'',dateNaissance:'',lieuNaissance:'',adresse:'',serviceId:'',posteId:'',dateEmbauche:'',lieuTravail:'Antaninarenina, Antananarivo',typeEmploiId:'',categorieId:''};
export default function AgentCreatePreviewPage(){
 const navigate=useNavigate();
 const [form,setForm]=useState(initial);
 const [photo,setPhoto]=useState('');
 const [photoName,setPhotoName]=useState('');
 const [notice,setNotice]=useState('');
 const [errors,setErrors]=useState(false);
 const update=(key,value)=>setForm(v=>({...v,[key]:value,...(key==='serviceId'?{posteId:''}:{})}));
 const submit=e=>{e.preventDefault();setErrors(!form.matricule.trim()||!form.nom.trim()||!form.serviceId||!form.posteId||!form.dateEmbauche);if(!form.matricule.trim()||!form.nom.trim()||!form.serviceId||!form.posteId||!form.dateEmbauche){setNotice('Veuillez renseigner les champs obligatoires.');return;}setNotice('Simulation réussie : aucun agent n’a été envoyé à la base de données.');};
 const file=e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)){setNotice('Format non autorisé. Utilisez JPG, PNG ou WEBP.');return;}if(f.size>5*1024*1024){setNotice('La photo ne doit pas dépasser 5 Mo.');return;}setPhoto(URL.createObjectURL(f));setPhotoName(f.name);setNotice('');};
 const field=(label,key,opts={})=><label className="acp-field"><span>{label}{opts.required&&<i> *</i>}</span>{opts.options?<select required={opts.required} value={form[key]} onChange={e=>update(key,e.target.value)}><option value="">{opts.placeholder||'Sélectionner'}</option>{opts.options.map(v=><option key={v} value={v}>{v}</option>)}</select>:<input required={opts.required} type={opts.type||'text'} value={form[key]} maxLength={opts.maxLength} placeholder={opts.placeholder||''} onChange={e=>update(key,e.target.value)}/>}</label>;
 return <PreviewLayout section="Nouvel agent">
  <div className="acp-page">
   <button className="acp-back" onClick={()=>navigate('/design-preview/agents')}><ArrowLeft size={15}/> Retour aux agents</button>
   <div className="acp-heading"><div><span className="acp-eyebrow"><i/> RESSOURCES HUMAINES · DOSSIER AGENT</span><h1>Ajouter un agent</h1><p>Créez un dossier individuel et renseignez les informations nécessaires à son suivi administratif.</p></div><div className="acp-step-indicator"><span>01</span><div><b>Création du dossier</b><small>Informations initiales de l’agent</small></div></div></div>
   <form className="acp-form" onSubmit={submit}>
    <div className="acp-form-main">
     <section className="acp-card"><header><div className="acp-icon"><UserRound size={17}/></div><div><h2>Identité</h2><p>Les informations permettant d’identifier l’agent.</p></div><span className="acp-section-number">01</span></header>
      <div className="acp-photo-row"><div className="acp-photo-preview">{photo?<img src={photo} alt="Aperçu de la photo sélectionnée"/>:<PreviewAvatar initials="?" large/>}</div><div className="acp-photo-copy"><b>Photo de profil</b><span>Ajoutez une photo pour faciliter l’identification dans le dossier.</span><label className="acp-upload"><Upload size={14}/> Choisir une photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={file}/></label>{photoName&&<small>{photoName}</small>}<small>JPG, PNG ou WEBP · 5 Mo maximum</small></div></div>
      <div className="acp-grid">{field('Matricule','matricule',{required:true,placeholder:'Ex. MEF-001-0123',maxLength:30})}{field('Nom','nom',{required:true,placeholder:'Nom de famille',maxLength:100})}{field('Prénom','prenom',{placeholder:'Prénom(s)',maxLength:100})}{field('Sexe','sexe',{options:['F','M'].map(v=>v==='F'?'Féminin':'Masculin')})}</div>
     </section>
     <section className="acp-card"><header><div className="acp-icon"><MapPin size={17}/></div><div><h2>Coordonnées et naissance</h2><p>Les renseignements civils et les moyens de contact.</p></div><span className="acp-section-number">02</span></header>
      <div className="acp-grid">{field('CIN','cin',{placeholder:'Numéro de carte nationale'})}{field('Téléphone','telephone',{placeholder:'+261 ...'})}{field('Date de naissance','dateNaissance',{type:'date'})}{field('Lieu de naissance','lieuNaissance',{placeholder:'Ville ou commune'})}<div className="acp-field acp-span-two">{field('Adresse de résidence','adresse',{placeholder:'Adresse, quartier, commune'})}</div></div>
     </section>
     <section className="acp-card"><header><div className="acp-icon"><BriefcaseBusiness size={17}/></div><div><h2>Affectation et statut</h2><p>Position administrative initiale de l’agent au sein du ministère.</p></div><span className="acp-section-number">03</span></header>
      <div className="acp-grid">{field('Service','serviceId',{required:true,options:services,placeholder:'Sélectionner un service'})}<label className="acp-field"><span>Poste <i>*</i></span><select required value={form.posteId} disabled={!form.serviceId} onChange={e=>update('posteId',e.target.value)}><option value="">{form.serviceId?'Sélectionner un poste':'Choisir d’abord un service'}</option>{(jobs[form.serviceId]||[]).map(v=><option key={v}>{v}</option>)}</select></label>{field('Date d’embauche','dateEmbauche',{required:true,type:'date'})}{field('Lieu de travail','lieuTravail',{placeholder:'Ville ou site'})}{field('Type d’emploi','typeEmploiId',{options:['Fonctionnaire','Contractuel','Employé']})}{field('Catégorie','categorieId',{options:['A','B','C','D']})}</div>
     </section>
     <div className="acp-notice"><Info size={16}/><span>Les champs marqués d’un astérisque sont obligatoires. Les services, postes et référentiels sont normalement chargés depuis SYGPERS.</span></div>
     {notice&&<div className={notice.startsWith('Simulation')?'acp-feedback success':'acp-feedback'}><Info size={15}/>{notice}<button type="button" onClick={()=>setNotice('')}><X size={14}/></button></div>}
    </div>
    <aside className="acp-side">
     <section className="acp-side-card"><span className="acp-side-label">APERÇU DU DOSSIER</span><div className="acp-side-avatar">{photo?<img src={photo} alt=""/>:<PreviewAvatar initials={(form.prenom?.[0]||'')+(form.nom?.[0]||'')||'?'} large/>}</div><h3>{[form.prenom,form.nom].filter(Boolean).join(' ')||'Nom de l’agent'}</h3><code>{form.matricule||'Matricule à renseigner'}</code><div className="acp-side-divider"/><div className="acp-side-line"><span>Service</span><b>{form.serviceId||'À définir'}</b></div><div className="acp-side-line"><span>Poste</span><b>{form.posteId||'À définir'}</b></div><div className="acp-side-line"><span>Date d’embauche</span><b>{form.dateEmbauche||'À définir'}</b></div></section>
     <section className="acp-help-card"><div><CheckCircle2 size={17}/><b>À retenir</b></div><p>La création du dossier enregistre les informations initiales. Le suivi de carrière et les diplômes pourront être complétés ensuite.</p></section>
    </aside>
   </div>
   <footer className="acp-actions"><span><ShieldIcon/> Enregistrement sécurisé dans SYGPERS</span><div><button type="button" className="acp-cancel" onClick={()=>navigate('/design-preview/agents')}>Annuler</button><button type="submit" className="acp-submit">Créer l’agent <ArrowRight size={15}/></button></div></footer>
   <p className="acp-disclaimer">Maquette interactive · Données fictives · Aucun enregistrement réel n’est effectué.</p>
  </div>
 </PreviewLayout>;
}
function ShieldIcon(){return <CheckCircle2 size={14}/>}
