export type Period = { id:string; name:string; kind:'lesson'|'break'; position:number; start_time:string; end_time:string; academic_year:number };
export type Assignment = { id:string; class_id:string; class_name:string|null; subject:string; period_id:string|null; weekday:number|null; academic_year:string|null };
export const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export function isoDate(d:Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function addDays(value:string,n:number) { const d=new Date(`${value}T12:00:00`); d.setDate(d.getDate()+n); return isoDate(d); }
export function minutes(time:string) { const [h,m]=time.slice(0,5).split(':').map(Number); return h*60+m; }
export function formatTime(time:string) { const [h,m]=time.slice(0,5).split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; }
export function kathmanduNow(now=new Date()) { const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kathmandu',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(part=>[part.type,part.value])); return {date:`${parts.year}-${parts.month}-${parts.day}`,minutes:Number(parts.hour)*60+Number(parts.minute)}; }
export function statusFor(date:string,start:string,end:string,now=new Date()):'Completed'|'Now'|'Upcoming' { const local=kathmanduNow(now); if(date<local.date)return 'Completed'; if(date>local.date)return 'Upcoming'; return local.minutes>=minutes(end)?'Completed':local.minutes>=minutes(start)?'Now':'Upcoming'; }
export function weekStart(value:string) { const d=new Date(`${value}T12:00:00`); d.setDate(d.getDate()-d.getDay()); return isoDate(d); }
