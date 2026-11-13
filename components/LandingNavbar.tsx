'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#portals', label: 'Portals' },
  { href: '#how', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
];

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navbarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!navbarRef.current?.contains(event.target as Node)) setMobileOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const handleResize = () => { if (desktop.matches) setMobileOpen(false); };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    desktop.addEventListener('change', handleResize);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      desktop.removeEventListener('change', handleResize);
    };
  }, [mobileOpen]);

  function navigateToSection() {
    setMobileOpen(false);
    // Avoid leaving keyboard focus in the now-hidden navigation panel.
    toggleRef.current?.focus();
  }

  return (
    <header ref={navbarRef} className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setMobileOpen(false);
    }}>
      <nav aria-label="Main navigation" className="relative mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
        <button ref={toggleRef} type="button" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="landing-mobile-menu" onClick={() => setMobileOpen((open) => !open)} className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#0F172A] hover:bg-[#F8FAFC] lg:hidden">
          {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
        <Link href="/" aria-label="NEPSOM home" className="absolute left-1/2 flex min-h-11 -translate-x-1/2 items-center lg:static lg:translate-x-0">
          <Image src="/logo2.png" alt="NEPSOM" width={1035} height={241} sizes="152px" className="h-auto w-[150px] sm:w-[150px] lg:w-[152px]" />
        </Link>
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {navLinks.map(({ href, label }) => <li key={href}><a href={href} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]">{label}</a></li>)}
        </ul>
        <Link href="/auth/login" prefetch={false} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#CBD5E1] px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] lg:px-5">Log in</Link>
      </nav>
      <div id="landing-mobile-menu" hidden={!mobileOpen} className="absolute inset-x-0 top-full border-b border-[#E2E8F0] bg-white px-4 pb-3 shadow-[0_12px_20px_-18px_rgba(15,23,42,0.45)] sm:px-6 lg:hidden">
        <nav aria-label="Mobile navigation"><ul>
          {navLinks.map(({ href, label }) => <li key={href}><a href={href} onClick={navigateToSection} className="flex min-h-12 items-center border-t border-[#E2E8F0] text-sm font-medium hover:text-[#2563EB]">{label}</a></li>)}
        </ul></nav>
      </div>
    </header>
  );
}
