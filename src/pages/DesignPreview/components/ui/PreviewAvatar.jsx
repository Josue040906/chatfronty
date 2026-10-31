export default function PreviewAvatar({initials,className='',large=false,label}){
 return <span className={`preview-avatar ${className} ${large?'preview-avatar-large':''}`.trim()} role={label?'img':undefined} aria-label={label}>{initials}</span>;
}
