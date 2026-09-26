'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ClipboardCheck, GraduationCap, Home, Menu, UserRound, Users, Wallet } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const defaultNavItems = [
    { href: '/principal', label: 'Home', icon: Home },
    { href: '/principal/students', label: 'Students', icon: Users },
    { href: '/principal/attendance', label: 'Attendance', icon: ClipboardCheck },
    { href: '/principal/fees', label: 'Fees', icon: Wallet },
    { href: '/principal/admission', label: 'More', icon: Menu },
  ];
  const principalNavItems = [
    { href: '/principal/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/principal/students', label: 'Students', icon: Users },
    { href: '/principal', label: 'Home', icon: Home },
    { href: '/principal/communication', label: 'Communication', icon: Bell },
    { href: '/principal/settings', label: 'Account', icon: UserRound },
  ];
  const navItems = pathname.startsWith('/principal') ? principalNavItems : defaultNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/principal' && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center px-2 py-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1 h-1 w-8 rounded-b-full bg-blue-600" />
              )}
              <Icon className="mb-0.5 h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
