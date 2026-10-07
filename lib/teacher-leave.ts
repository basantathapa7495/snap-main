export const LEAVE_MIMES=['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp'];
export function validateLeaveFile(file:{type:string;size:number}){if(!LEAVE_MIMES.includes(file.type))return'Use PDF, DOC, DOCX, JPG, PNG, or WebP.';if(file.size>10*1024*1024)return'Files must be 10 MB or smaller.';return''}
export function calendarDays(start:string,end:string){if(!start||!end||end<start)return 0;return Math.floor((new Date(end+'T12:00:00').getTime()-new Date(start+'T12:00:00').getTime())/86400000)+1}
export function formatBytes(n:number){return n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(1)} MB`}
