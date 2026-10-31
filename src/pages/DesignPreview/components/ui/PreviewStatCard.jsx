export default function PreviewStatCard({label,value,icon,foot,className='',children}){
 return <article className={className}>
  <div className="dp-stat-top"><span>{label}</span><span className="dp-stat-icon">{icon}</span></div>
  <div className="dp-stat-value">{value}</div>
  {foot&&<div className="dp-stat-foot">{foot}</div>}
  {children}
 </article>;
}
