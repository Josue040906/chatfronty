import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import PreviewLayout from './PreviewLayout';

const labels={organisation:'Organisation',carrieres:'Carrières',activites:'Mes activités',documents:'Documents RH',administration:'Administration'};
export default function PreviewSectionPage(){
 const {pathname}=useLocation();
 const key=pathname.split('/').filter(Boolean).at(-1);
 const title=labels[key]||'Prévisualisation';
 return <PreviewLayout section={title}><div className="dp-content pv-coming-soon"><span><Sparkles size={15}/> ESPACE DE PRÉVISUALISATION</span><h1>{title}</h1><p>Cette page sera conçue à partir de sa maquette de référence, en réutilisant le même cadre de navigation.</p></div></PreviewLayout>;
}
