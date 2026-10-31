import PreviewSidebar from './components/layout/PreviewSidebar';
import PreviewTopbar from './components/layout/PreviewTopbar';
import './PreviewLayout.css';

export default function PreviewLayout({children,section='Tableau de bord'}){
 return <div className="pv-shell">
  <PreviewSidebar/>
  <main className="pv-main">
   <PreviewTopbar section={section}/>
   <div className="pv-page-content">{children}</div>
  </main>
 </div>;
}
