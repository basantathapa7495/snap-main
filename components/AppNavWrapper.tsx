'use client';
import { usePathname } from 'next/navigation';
import MobileNav from './MobileNav';

export default function AppNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public pages (no bottom nav): landing, login/signup, school websites
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/s/');

  return (
    <>
      <div className={isPublic ? undefined : 'pb-16 md:pb-0'}>{children}</div>
      {!isPublic && <MobileNav />}
    </>
  );
}