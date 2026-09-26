'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, GraduationCap, House, Menu, MessageCircle, UserRound, UsersRound, Wallet } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isPrincipal = pathname.startsWith('/principal');

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
    { href: '/principal/settings', label: 'Account', icon: UserRound },
  ];
  const navItems = isPrincipal ? principalNavItems : defaultNavItems;

  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 md:hidden">
      <div className="grid grid-cols-5 items-center px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/principal' && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                isActive
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span className={`flex h-9 w-12 items-center justify-center rounded-2xl transition-colors ${
                isActive ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-transparent'
              }`}>
                <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
              </span>
              <span className="w-full truncate text-[10px] font-semibold leading-tight max-[380px]:text-[9px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
