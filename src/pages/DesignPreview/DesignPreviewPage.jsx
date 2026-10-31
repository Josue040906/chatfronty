import PreviewLayout from './PreviewLayout';
import './DesignPreviewPage.css';

export default function DesignPreviewPage() {
  return (
    <PreviewLayout section="Tableau de bord">
        <div className="dp-content">
          <div className="dp-preview-note"><span/> PRÉVISUALISATION DU NOUVEAU DESIGN <span className="dp-note-right">Données de démonstration</span></div>
          <section className="dp-welcome">
            <div><p className="dp-eyebrow">DIMANCHE 1 NOVEMBRE 2026 <span>•</span> ESPACE RH</p><h1>Bonjour, Josué <span>✦</span></h1><p>Voici un aperçu de la gestion des ressources humaines aujourd’hui.</p></div>
            <button className="dp-primary"><span>＋</span> Nouvel agent</button>
          </section>

          <section className="dp-stats">
            <article className="dp-stat-card"><div className="dp-stat-top"><span>Agents</span><span className="dp-stat-icon"><Users size={18}/></span></div><div className="dp-stat-value">32</div><div className="dp-stat-foot"><span>Agents enregistrés</span></div></article>
            <article className="dp-stat-card"><div className="dp-stat-top"><span>Directions</span><span className="dp-stat-icon"><Building2 size={18}/></span></div><div className="dp-stat-value">3</div><div className="dp-stat-foot"><span>Directions dans l’organigramme</span></div></article>
            <article className="dp-stat-card"><div className="dp-stat-top"><span>Services</span><span className="dp-stat-icon"><Layers3 size={18}/></span></div><div className="dp-stat-value">8</div><div className="dp-stat-foot"><span>Services référencés</span></div></article>
            <article className="dp-stat-card"><div className="dp-stat-top"><span>Postes</span><span className="dp-stat-icon"><Briefcase size={18}/></span></div><div className="dp-stat-value">34</div><div className="dp-stat-foot"><span>Postes référencés</span></div></article>
          </section>

          <section className="dp-main-grid dp-reference-grid">
            <article className="dp-panel dp-chart-panel dp-service-panel">
              <div className="dp-panel-heading"><div><p className="dp-eyebrow">ORGANISATION</p><h2>Effectifs par service</h2></div><div className="dp-tabs"><button className="active">Par service</button><button>Par direction</button></div></div>
              <div className="dp-service-list">
                { [['Service du Personnel',11],['Service de l’Administration Générale',6],['Service de la Formation',3],['Service des Infrastructures',3],['Service du Développement',3],['Service de la Comptabilité',2],['Service du Budget',2],['Service non rattaché',2] ].map(([name,value])=><div className="dp-service-row" key={name}><div><span>{name}</span><b>{value}<small>{Math.round(value/32*100)} %</small></b></div><i><span style={{width:(value/11*100)+'%'}}/></i></div>)}
              </div>
            </article>
            <article className="dp-panel dp-chart-panel dp-hiring-panel">
              <div className="dp-panel-heading"><div><p className="dp-eyebrow">RECRUTEMENT</p><h2>Agents recrutés par année</h2></div><span className="dp-chart-pill">Pic : 3 par an</span></div>
              <div className="dp-bar-chart">
                { [['06',1],['07',0],['08',1],['09',1],['10',2],['11',2],['12',2],['13',2],['14',3],['15',2],['16',3],['17',2],['18',3],['19',2],['20',1],['21',2],['22',1],['23',1],['24',1] ].map(([year,value])=><div className="dp-bar-col" key={year}><b>{value||''}</b><i style={{height:(value/3*100)+'%'}}/><span>’{year}</span></div>)}
              </div>
              <p className="dp-chart-caption">Les années sans recrutement restent visibles sur l’axe (2007).</p>
            </article>
          </section>

          <section className="dp-bottom-grid">
            <article className="dp-panel dp-todo-panel">
              <div className="dp-panel-heading"><h2>À traiter</h2><span className="dp-count-pill">2 éléments</span></div>
              <div className="dp-todo-item"><span className="dp-todo-icon amber"><ChartNoAxesColumnIncreasing size={18}/></span><div><b>Condition d’ancienneté remplie</b><p>Andry RAKOTONDRABE · SPERS-004 · 2e classe, échelon 1, éligible le 11/09/2026</p><small>27 oct. 2026, 15:57</small></div><button>Voir la carrière</button></div>
              <div className="dp-todo-item"><span className="dp-todo-icon blue"><FileText size={18}/></span><div><b>Demande d’avancement en brouillon</b><p>Josette RAZANASOAVINA · DOC-2026-00003</p><small>Créée le 07/10/2026</small></div><button>Ouvrir</button></div>
            </article>
            <article className="dp-panel dp-docs-panel">
              <div className="dp-panel-heading"><h2>Documents récents</h2><button className="dp-text-link">Tout voir <ArrowRight size={14}/></button></div>
              <table className="dp-doc-table"><thead><tr><th>DOCUMENT</th><th>AGENT</th><th>STATUT</th></tr></thead><tbody>
                <tr><td><b>Demande d’avancement</b><small>DOC-2026-00003</small></td><td>Josette RAZANASO...</td><td><span>Brouillon</span></td></tr>
                <tr><td><b>Demande de congé</b><small>DOC-2026-00002</small></td><td>Mialitiana RABE</td><td><span>Brouillon</span></td></tr>
                <tr><td><b>Demande d’avancement</b><small>DOC-2026-00001</small></td><td>Mialitiana RABE</td><td><span>Brouillon</span></td></tr>
              </tbody></table>
            </article>
          </section>
          <footer className="dp-footer"><span>SYGPERS <i>•</i> Gestion des ressources humaines</span><span>Ministère de l’Économie et des Finances <b>—</b> Madagascar</span></footer>
    </PreviewLayout>
  );
}
