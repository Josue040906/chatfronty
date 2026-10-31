import { Search, X } from 'lucide-react';

export default function PreviewSearchField({value,onChange,placeholder='Rechercher...',ariaLabel='Rechercher',className='',onClear}){
 return <label className={className}>
  <Search size={17}/>
  <input value={value} onChange={event=>onChange(event.target.value)} placeholder={placeholder} aria-label={ariaLabel}/>
  {value&&<button type="button" onClick={()=>onClear?onClear():onChange('')} aria-label="Effacer la recherche"><X size={14}/></button>}
 </label>;
}
