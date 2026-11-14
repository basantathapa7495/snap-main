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
  const [language, setLanguage] = useState<'eng' | 'nep'>('eng');
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
      <nav aria-label="Main navigation" className="relative mx-auto flex h-[50px] max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-14 lg:px-8">
        <button ref={toggleRef} type="button" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="landing-mobile-menu" onClick={() => setMobileOpen((open) => !open)} className="-ml-2 inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] transition-colors hover:bg-[#F8FAFC] lg:hidden">
          {mobileOpen ? <X className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden="true" /> : <Menu className="h-[18px] w-[18px]" strokeWidth={3} aria-hidden="true" />}
        </button>
        <Link href="/" aria-label="NEPSOM home" className="ml-2 flex min-h-11 shrink-0 items-center lg:static lg:ml-0">
          <Image src="/logo2.png" alt="NEPSOM" width={1035} height={241} sizes="150px" className="h-auto w-[150px] sm:w-[150px] lg:w-[150px]" />
        </Link>
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {navLinks.map(({ href, label }) => <li key={href}><a href={href} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]">{label}</a></li>)}
        </ul>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Switch to ${language === 'eng' ? 'Nepali' : 'English'}`}
            aria-pressed={language === 'nep'}
            onClick={() => setLanguage((current) => current === 'eng' ? 'nep' : 'eng')}
            className="grid h-[30px] w-[72px] grid-cols-2 items-center overflow-hidden rounded-full border border-[#94A3B8] bg-white p-0.5 text-[11px] font-bold uppercase tracking-tight text-[#334155] lg:hidden"
          >
            <span className={`flex h-[24px] items-center justify-center transition-colors ${language === 'eng' ? 'rounded-l-full bg-[#0B5CBD] text-white' : ''}`}>ENG</span>
            <span className={`flex h-[24px] items-center justify-center transition-colors ${language === 'nep' ? 'rounded-r-full bg-[#0B5CBD] text-white' : ''}`}>NEP</span>
          </button>
          <Link href="/auth/login" prefetch={false} className="inline-flex h-[30px] items-center justify-center rounded-lg border border-[#CBD5E1] px-2.5 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] lg:h-10 lg:px-4">Log in</Link>
        </div>
      </nav>
      <div id="landing-mobile-menu" hidden={!mobileOpen} className="absolute inset-x-0 top-full border-b border-[#E2E8F0] bg-white px-4 pb-3 shadow-[0_12px_20px_-18px_rgba(15,23,42,0.45)] sm:px-6 lg:hidden">
        <nav aria-label="Mobile navigation"><ul>
          {navLinks.map(({ href, label }) => <li key={href}><a href={href} onClick={navigateToSection} className="flex min-h-12 items-center border-t border-[#E2E8F0] text-sm font-medium hover:text-[#2563EB]">{label}</a></li>)}
        </ul></nav>
      </div>
    </header>
  );
}
