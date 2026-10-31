import PreviewSidebar from './PreviewSidebar';
import PreviewTopbar from './PreviewTopbar';
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
