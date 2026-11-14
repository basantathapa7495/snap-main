'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

const desktopNavLinks = [
  { href: '#features', label: 'Features' },
  { href: '#portals', label: 'Portals' },
  { href: '#how', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
];

const mobileNavLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
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
    const handleResize = () => {
      if (desktop.matches) setMobileOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    desktop.addEventListener('change', handleResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      desktop.removeEventListener('change', handleResize);
    };
  }, [mobileOpen]);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  function languageButtonClass(value: 'eng' | 'nep') {
    return [
      'inline-flex min-h-11 min-w-10 items-center justify-center rounded-md px-2 text-[11px] font-bold uppercase transition-colors',
      language === value ? 'bg-[#1E3A8A] text-white' : 'bg-white text-[#475569]',
    ].join(' ');
  }

  return (
    <header
      ref={navbarRef}
      className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setMobileOpen(false);
      }}
    >
      <nav aria-label="Main navigation" className="relative mx-auto flex h-[60px] max-w-[1180px] items-center justify-between gap-3 px-4 sm:h-14 sm:px-6 lg:px-8">
        <Link href="/" aria-label="NEPSOM home" className="flex min-h-11 shrink-0 items-center sm:absolute sm:left-[46%] sm:-translate-x-1/2 lg:static lg:translate-x-0">
          <span className="flex h-10 w-[150px] items-center overflow-hidden sm:hidden">
            <Image
              src="/logo2.png"
              alt="NEPSOM"
              width={1035}
              height={241}
              sizes="150px"
              className="h-auto w-[150px] [clip-path:inset(0_0_18%_0)]"
            />
          </span>
          <Image
            src="/logo2.png"
            alt="NEPSOM"
            width={1035}
            height={241}
            sizes="150px"
            className="hidden h-auto w-[150px] sm:block"
          />
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {desktopNavLinks.map(({ href, label }) => (
            <li key={href}>
              <a href={href} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]">
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex min-h-11 items-center rounded-lg border border-[#94A3B8] bg-white p-0.5 lg:hidden" role="group" aria-label="Language">
            <button type="button" aria-pressed={language === 'eng'} onClick={() => setLanguage('eng')} className={languageButtonClass('eng')}>
              ENG
            </button>
            <button type="button" aria-pressed={language === 'nep'} onClick={() => setLanguage('nep')} className={languageButtonClass('nep')}>
              NEP
            </button>
          </div>

          <Link href="/auth/login" prefetch={false} className="hidden min-h-11 items-center justify-center rounded-lg border border-[#CBD5E1] px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] sm:inline-flex lg:px-4">
            Log in
          </Link>

          <Link href="/auth/signup" prefetch={false} className="hidden min-h-11 items-center justify-center rounded-lg bg-[#1E3A8A] px-4 text-sm font-semibold text-white hover:bg-[#172F70] lg:inline-flex">
            Register
          </Link>

          <button
            ref={toggleRef}
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#0F172A] hover:bg-[#F8FAFC] lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <div id="landing-mobile-menu" hidden={!mobileOpen} className="absolute inset-x-0 top-full border-b border-[#E2E8F0] bg-white shadow-[0_14px_28px_-20px_rgba(15,23,42,0.5)] lg:hidden">
        <nav aria-label="Mobile navigation" className="px-4 pb-4 sm:px-6">
          <ul>
            {mobileNavLinks.map(({ href, label }) => (
              <li key={href}>
                <a href={href} onClick={closeMobileMenu} className="flex min-h-11 items-center border-b border-[#E2E8F0] text-sm font-medium text-[#0F172A] hover:text-[#2563EB]">
                  {label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/auth/login" prefetch={false} onClick={closeMobileMenu} className="flex min-h-11 items-center border-b border-[#E2E8F0] text-sm font-medium text-[#0F172A] hover:text-[#2563EB]">
                Log in
              </Link>
            </li>
          </ul>
          <Link href="/auth/signup" prefetch={false} onClick={closeMobileMenu} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1E3A8A] px-4 text-sm font-semibold text-white hover:bg-[#172F70]">
            Register your school
          </Link>
        </nav>
      </div>
    </header>
  );
}
