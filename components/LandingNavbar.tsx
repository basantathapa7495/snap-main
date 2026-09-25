'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '/solutions', label: 'Solutions' },
  { href: '#how', label: 'How It Works' },
  { href: '#video', label: 'Demo' },
  { href: '/schoolslist', label: 'View Schools' },
  { href: '#faq', label: 'FAQ' },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const navbarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sectionIds = ['features', 'how', 'video', 'faq'];

    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
      const current = sectionIds.find((id) => {
        const section = document.getElementById(id);
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= 140 && rect.bottom >= 140;
      });
      setActiveSection(current ?? '');
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={navbarRef}
      className={`sticky top-0 z-50 border-b bg-white transition-shadow duration-200 ${
        scrolled ? 'border-gray-200 shadow-sm' : 'border-gray-100'
      }`}
    >
      <nav className="relative mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6 xl:h-[72px] lg:px-8" aria-label="Main navigation">
        <Link href="/" className="absolute left-1/2 flex -translate-x-1/2 shrink-0 items-center xl:static xl:translate-x-0" aria-label="NEPSOM home">
          <Image src="/logo2.png" alt="NEPSOM" width={150} height={64} priority className="h-10 w-auto max-w-[148px] object-contain sm:h-12 xl:h-16 xl:max-w-none" />
        </Link>

        <ul className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) => {
            const isActive = link.href.startsWith('#') && activeSection === link.href.slice(1);
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-2 xl:flex">
          <Link href="/auth/login" className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100">
            Log in
          </Link>
          <Link href="/auth/signup" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            Register your school
          </Link>
        </div>

        <div className="flex w-full items-center justify-between xl:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link
            href="/auth/login"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-green-200 bg-green-50 px-3 text-[13px] font-semibold leading-none text-green-700 shadow-sm transition-colors hover:border-green-300 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            Log in
          </Link>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={`absolute left-4 top-[calc(100%+0.5rem)] w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl transition duration-200 sm:left-6 xl:hidden ${
          mobileOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
        }`}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <nav className="px-3 py-2" aria-label="Mobile navigation">
          <ul className="divide-y divide-gray-100">
            {navLinks
              .filter((link) => !['#video', '/solutions', '/schoolslist'].includes(link.href))
              .map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center justify-between py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
