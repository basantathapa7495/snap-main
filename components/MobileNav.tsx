'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, CalendarDays, ClipboardCheck, FileText, Folder, GraduationCap, House, LayoutDashboard, Menu, MessageCircle, UserRound, UsersRound, Wallet } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isPrincipal = pathname.startsWith('/principal');
  const isTeacher = pathname === '/teacher' || pathname.startsWith('/teacher/');
  const isStudent = pathname === '/student' || pathname.startsWith('/student/');

  const defaultNavItems = [
    { href: '/principal', label: 'Home', icon: House },
    { href: '/principal/students', label: 'Students', icon: UsersRound },
    { href: '/principal/attendance', label: 'Attendance', icon: ClipboardCheck },
    { href: '/principal/fees', label: 'Fees', icon: Wallet },
    { href: '/principal/admission', label: 'More', icon: Menu },
  ];
  const principalNavItems = [
    { href: '/principal/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/principal/students', label: 'Students', icon: UsersRound },
    { href: '/principal', label: 'Home', icon: House },
    { href: '/principal/communication', label: 'Communication', icon: MessageCircle },
    { href: '/principal/calendar', label: 'Calendar', icon: CalendarDays },
  ];
  const teacherNavItems = [
    { href: '/teacher/attendance', label: 'Attendance', icon: ClipboardCheck },
    { href: '/teacher/students', label: 'Students', icon: UsersRound },
    { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/classes', label: 'My Classes', icon: BookOpen },
    { href: '/teacher/profile', label: 'My Profile', icon: UserRound },
  ];
  const studentNavItems = [
    { href: '/student', label: 'Home', icon: House },
    { href: '/student/timetable', label: 'Timetable', icon: CalendarDays },
    { href: '/student/subjects', label: 'Students', icon: UsersRound },
    { href: '/student/notices', label: 'Notice', icon: FileText },
    { href: '/student/documents', label: 'Documents', icon: Folder },
  ];
  const navItems = isPrincipal
    ? principalNavItems
    : isTeacher
      ? teacherNavItems
      : isStudent
        ? studentNavItems
        : defaultNavItems;

  if (isPrincipal) {
    return (
      <nav
        aria-label="Principal mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white shadow-[0_-5px_18px_rgba(15,23,42,0.08)] md:hidden"
      >
        <div className="grid h-[64px] grid-cols-5 items-stretch px-1 pb-[env(safe-area-inset-bottom)]">
          {principalNavItems.map((item, index) => {
            const Icon = item.icon;
            const isPortalRoot = item.href === '/principal';
            const isActive =
              pathname === item.href ||
              (!isPortalRoot && pathname.startsWith(`${item.href}/`));

            return (
              <div
                key={item.href}
                className={`relative flex min-w-0 items-center justify-center ${index > 0 ? 'before:absolute before:bottom-2.5 before:left-0 before:top-2.5 before:w-px before:bg-slate-200' : ''}`}
              >
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative z-10 flex h-full w-full min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${isActive ? 'text-blue-700' : 'text-slate-600 active:bg-slate-50'}`}
                >
                  <span className={`flex h-9 w-11 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-transparent text-slate-600'}`}>
                    <Icon
                      className="h-[22px] w-[22px]"
                      strokeWidth={isActive ? 2.6 : 2.25}
                      aria-hidden="true"
                    />
                  </span>
                  <span className={`w-full truncate font-bold leading-none tracking-[-0.02em] ${item.label === 'Communication' ? 'text-[8px] min-[390px]:text-[9px]' : 'text-[10px] min-[390px]:text-[11px]'}`}>
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-[#F8FAFC]/95 shadow-[0_-4px_18px_rgba(15,23,42,0.05)] backdrop-blur-md dark:border-slate-700/70 dark:bg-[#111B2B]/95 md:hidden">
      <div className="grid grid-cols-5 items-center px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isPortalRoot = ['/principal', '/teacher', '/student'].includes(item.href);
          const isActive =
            pathname === item.href ||
            (!isPortalRoot && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-0.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                isActive
                  ? 'text-teal-800 dark:text-teal-200'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <span className={`flex h-7 w-11 items-center justify-center rounded-xl transition-colors ${
                isActive ? 'bg-teal-100 dark:bg-teal-400/15' : 'bg-transparent'
              }`}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.9} aria-hidden="true" />
              </span>
              <span className="w-full truncate text-[10px] font-semibold leading-tight max-[380px]:text-[9px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
