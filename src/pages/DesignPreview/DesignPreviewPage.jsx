import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness,
  Building2, CalendarDays, ChevronDown, CircleHelp, FileText, LayoutDashboard,
  Search, Settings2, ShieldCheck, Users, WalletCards
} from 'lucide-react';
import './DesignPreviewPage.css';

const navGroups = [
  { title: 'ESPACE RH', items: [
    ['Vue d’ensemble', LayoutDashboard, true],
    ['Organisation', Building2],
    ['Agents', Users],
    ['Carrières', BriefcaseBusiness],
  ]},
  { title: 'SUIVI & DOCUMENTS', items: [
    ['Documents RH', FileText],
    ['Activités', Activity],
  ]},
];
const employees = [
  { initials: 'RA', name: 'RAKOTO Andry', role: 'Directeur des ressources humaines', service: 'Direction des ressources humaines', status: 'En activité', tone: 'sage' },
  { initials: 'RF', name: 'RAZAFINDRAKOTO Fara', role: 'Chef de service', service: 'Administration générale', status: 'En activité', tone: 'sand' },
  { initials: 'RA', name: 'RANDRIAMAMPIANINA Aina', role: 'Administrateur civil', service: 'Gestion du personnel', status: 'En activité', tone: 'rose' },
  { initials: 'MR', name: 'MAMY Rija', role: 'Attaché d’administration', service: 'Solde et pensions', status: 'En activité', tone: 'blue' },
];

function Avatar({ initials, tone = 'sage', small = false }) {
  return <span className={`dp-avatar dp-avatar-${tone}${small ? ' dp-avatar-small' : ''}`}>{initials}</span>;
}

export default function DesignPreviewPage() {
  return (
    <div className="dp-shell">
      <aside className="dp-sidebar">
        <div className="dp-brand">
          <div className="dp-brand-mark">SY</div>
          <div><strong>SYGPERS</strong><span>GESTION DES RESSOURCES HUMAINES</span></div>
        </div>
        <div className="dp-workspace"><span className="dp-workspace-dot" /> MINISTÈRE DE L’ÉCONOMIE<br/> <b>ET DES FINANCES</b></div>
        <nav className="dp-nav">
          {navGroups.map(group => <section key={group.title}>
            <p className="dp-nav-label">{group.title}</p>
            {group.items.map(([label, Icon, active]) => <div key={label} className={`dp-nav-item${active ? ' is-active' : ''}`}><Icon size={17}/><span>{label}</span>{active && <i/>}</div>)}
          </section>)}
        </nav>
        <div className="dp-sidebar-bottom">
          <div className="dp-help"><CircleHelp size={17}/><span><b>Besoin d’aide ?</b><small>Consulter le guide SYGPERS</small></span><ArrowRight size={14}/></div>
          <div className="dp-user"><Avatar initials="JT" tone="gold"/><span><b>Josué TSIVOERY</b><small>Agent du personnel</small></span><ChevronDown size={15}/></div>
        </div>
      </aside>

      <main className="dp-main">
        <header className="dp-topbar">
          <div className="dp-breadcrumb">Espace RH <span>/</span> <b>Vue d’ensemble</b></div>
          <div className="dp-top-actions"><span className="dp-date"><CalendarDays size={15}/> Dimanche 1 novembre 2026</span><button className="dp-icon-button" aria-label="Recherche"><Search size={18}/></button><button className="dp-icon-button dp-bell" aria-label="Notifications"><Bell size={18}/><i/></button><span className="dp-top-avatar">JT</span></div>
        </header>
        <div className="dp-content">
          <div className="dp-preview-note"><span/> PRÉVISUALISATION DU NOUVEAU DESIGN <span className="dp-note-right">Données de démonstration</span></div>
          <section className="dp-welcome">
            <div><p className="dp-eyebrow">DIMANCHE 1 NOVEMBRE 2026 <span>•</span> ESPACE RH</p><h1>Bonjour, Josué <span>✦</span></h1><p>Voici un aperçu de la gestion des ressources humaines aujourd’hui.</p></div>
            <button className="dp-primary"><span>＋</span> Nouvel agent</button>
          </section>

          <section className="dp-stats">
            <article className="dp-stat-card dp-stat-featured"><div className="dp-stat-top"><span>Effectif total</span><span className="dp-stat-icon"><Users size={18}/></span></div><div className="dp-stat-value">1 284</div><div className="dp-stat-foot"><span className="dp-positive"><ArrowUpRight size={13}/> 3,2 %</span> <span>par rapport à 2025</span></div><div className="dp-stat-decoration"/></article>
            <article className="dp-stat-card"><div className="dp-stat-top"><span>Directions</span><span className="dp-stat-icon"><Building2 size={18}/></span></div><div className="dp-stat-value">12</div><div className="dp-stat-foot"><span>Structures administratives</span></div></article>
            <article className="dp-stat-card"><div className="dp-stat-top"><span>Services</span><span className="dp-stat-icon"><WalletCards size={18}/></span></div><div className="dp-stat-value">48</div><div className="dp-stat-foot"><span>Unités organisationnelles</span></div></article>
            <article className="dp-stat-card"><div className="dp-stat-top"><span>Documents en cours</span><span className="dp-stat-icon"><FileText size={18}/></span></div><div className="dp-stat-value">36</div><div className="dp-stat-foot"><span className="dp-neutral">À suivre</span><span> demandes récentes</span></div></article>
          </section>

          <section className="dp-main-grid">
            <article className="dp-panel dp-chart-panel">
              <div className="dp-panel-heading"><div><p className="dp-eyebrow">VUE STATISTIQUE</p><h2>Répartition des effectifs</h2><p>Distribution des agents par direction</p></div><button className="dp-select">Par direction <ChevronDown size={14}/></button></div>
              <div className="dp-chart-area">
                <div className="dp-donut-wrap"><div className="dp-donut"><div><strong>1 284</strong><small>AGENTS</small></div></div></div>
                <div className="dp-legend">
                  { [['Administration générale','34 %','brown'],['Budget et finances','26 %','gold'],['Trésor','18 %','sage'],['Économie','13 %','blue'],['Autres directions','9 %','pale']].map(([n,v,c])=><div className="dp-legend-row" key={n}><i className={`dp-dot ${c}`}/><span>{n}</span><b>{v}</b></div>)}
                </div>
              </div>
              <div className="dp-panel-foot">Répartition indicative — données de démonstration</div>
            </article>
            <article className="dp-panel dp-activity-panel">
              <div className="dp-panel-heading"><div><p className="dp-eyebrow">SUIVI RÉCENT</p><h2>Activité du personnel</h2><p>Évolution des mouvements récents</p></div><button className="dp-more">•••</button></div>
              <div className="dp-activity-list">
                <div className="dp-activity-item"><span className="dp-activity-icon sage"><Users size={16}/></span><span><b>Nouvel agent enregistré</b><small>Direction des ressources humaines</small></span><time>Aujourd’hui</time></div>
                <div className="dp-activity-item"><span className="dp-activity-icon gold"><FileText size={16}/></span><span><b>Document créé</b><small>Demande d’attestation de travail</small></span><time>Hier</time></div>
                <div className="dp-activity-item"><span className="dp-activity-icon blue"><ShieldCheck size={16}/></span><span><b>Profil mis à jour</b><small>Informations administratives</small></span><time>30 oct.</time></div>
                <div className="dp-activity-item"><span className="dp-activity-icon rose"><BriefcaseBusiness size={16}/></span><span><b>Évolution de carrière</b><small>Avancement enregistré</small></span><time>29 oct.</time></div>
              </div>
              <button className="dp-text-link">Consulter toutes les activités <ArrowRight size={14}/></button>
            </article>
          </section>

          <section className="dp-panel dp-employees-panel">
            <div className="dp-panel-heading dp-employee-heading"><div><p className="dp-eyebrow">ANNUAIRE DU PERSONNEL</p><h2>Agents récemment consultés</h2><p>Accès rapide aux fiches individuelles</p></div><button className="dp-outline">Voir tous les agents <ArrowRight size={14}/></button></div>
            <div className="dp-table-wrap"><table className="dp-table"><thead><tr><th>AGENT</th><th>FONCTION</th><th>SERVICE</th><th>STATUT</th><th/></tr></thead><tbody>{employees.map(e=><tr key={e.name}><td><div className="dp-person"><Avatar initials={e.initials} tone={e.tone} small/><b>{e.name}</b></div></td><td>{e.role}</td><td>{e.service}</td><td><span className="dp-status"><i/>{e.status}</span></td><td><button className="dp-row-action"><ArrowRight size={16}/></button></td></tr>)}</tbody></table></div>
          </section>
          <footer className="dp-footer"><span>SYGPERS <i>•</i> Gestion des ressources humaines</span><span>Ministère de l’Économie et des Finances <b>—</b> Madagascar</span></footer>
        </div>
      </main>
    </div>
  );
}
