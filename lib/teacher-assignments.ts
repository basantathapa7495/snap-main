export const MAX_ASSIGNMENT_FILE=10*1024*1024;
export const ASSIGNMENT_MIMES=['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png','image/webp'];
export function validateAssignmentFile(file:{type:string;size:number}){if(!ASSIGNMENT_MIMES.includes(file.type))return 'Use PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, or WebP.';if(file.size>MAX_ASSIGNMENT_FILE)return 'Files must be 10 MB or smaller.';return ''}
export function assignmentStatus(a:{status:string;due_at:string},submitted=0,total=0,now=new Date()){if(a.status==='completed'||(total>0&&submitted>=total))return'Completed';const due=new Date(a.due_at);if(due<now)return'Overdue';if(due.getTime()-now.getTime()<=48*60*60*1000)return'Pending';return'Active'}
export function formatBytes(size:number){if(size<1024)return `${size} B`;if(size<1048576)return `${(size/1024).toFixed(1)} KB`;return `${(size/1048576).toFixed(1)} MB`}
export function normalizeClass(value:string|null|undefined){return String(value||'').trim().toLowerCase().replace(/^(class|grade)\s+/,'')}
