'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Add shadow + stronger blur once the user scrolls
 useEffect(() => {
  const sectionIds = ['features', 'how', 'video', 'pricing', 'faq'];

  const handleScroll = () => {
    let current = '';

    for (const id of sectionIds) {
      const section = document.getElementById(id);

      if (section) {
        const rect = section.getBoundingClientRect();

        if (rect.top <= 140 && rect.bottom >= 140) {
          current = id;
          break;
        }
      }
    }

    setActiveSection(current);
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll);

  return () => window.removeEventListener('scroll', handleScroll);
}, []);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      mobileOpen &&
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(event.target as Node)
    ) {
      setMobileOpen(false);
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setMobileOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleEscape);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
  };
}, [mobileOpen]);

  const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '/solutions', label: 'Solutions' },
  { href: '#how', label: 'How It Works' },
  { href: '#video', label: 'Demo' },
  { href: '#pricing', label: 'Pricing' },
  { href: '/schoolslist', label: 'View Schools' },
  { href: '#faq', label: 'FAQ' },
];

  return (
    <header
    ref={mobileMenuRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-gray-200/70 bg-white/90 shadow-[0_1px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl'
          : 'border-b border-transparent bg-white/60 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-[72px] lg:px-8">
        {/* ===== Logo (left) ===== */}
        {/* logo1 stays on the left with hamburger */}
<Link href="/" className="flex items-center gap-2.5">
  
  <img src="/logo2.png" alt="snap" className="hidden h-20 w-auto md:block" />
</Link>

{/* logo2 centered — mobile only */}
<Link
  href="/"
  className="pointer-events-auto absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 md:hidden"
>
  <img
    src="/logo2.png"
    alt="SNAP"
    className="h-10 w-auto transition-transform duration-200 hover:scale-105"
  />
</Link>

        {/* ===== Desktop links (center) ===== */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
  href={link.href}
  className={`group relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    activeSection === link.href.replace('#', '')
      ? 'text-blue-700'
      : 'text-gray-600 hover:text-gray-900'
  }`}
>
  {link.label}

  <span
    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-300 ${
      activeSection === link.href.replace('#', '')
        ? 'w-6'
        : 'w-0 group-hover:w-18'
    }`}
  />
</a>
            </li>
          ))}
        </ul>

        {/* ===== Desktop actions (right) ===== */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/auth/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
          >
            Register your school
          </Link>
        </div>

        {/* ===== Mobile hamburger ===== */}
        <button
  type="button"
  onClick={() => setMobileOpen((prev) => !prev)}
  className="relative z-20 inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 active:scale-90 md:hidden"
  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
  aria-expanded={mobileOpen}
  aria-controls="mobile-menu"
>
  {mobileOpen ? (
    <svg
      className="h-6 w-6 transition-transform duration-200"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ) : (
    <svg
      className="h-6 w-6 transition-transform duration-200"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  )}
</button>
      </nav>

      {/* ===== Mobile slide-down menu ===== */}
      <div
  id="mobile-menu"
  className={`overflow-hidden bg-white transition-all duration-300 ease-out md:hidden ${
    mobileOpen
      ? 'max-h-[500px] translate-y-0 border-t border-gray-100 opacity-100'
      : 'pointer-events-none max-h-0 -translate-y-2 opacity-0'
  }`}
>
        <div className="space-y-1 px-4 pb-4 pt-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-blue-50 hover:pl-5 hover:text-blue-700 active:scale-[0.98]"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-4">
  <Link
    href="/auth/login"
    onClick={() => setMobileOpen(false)}
    className="px-4 py-2.5 text-center text-sm font-medium text-gray-600 transition-colors hover:text-gray-950"
  >
    Log in
  </Link>

  <Link
    href="/auth/signup"
    onClick={() => setMobileOpen(false)}
    className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99]"
  >
    Register your school
  </Link>
</div>
        </div>
      </div>
    </header>
  );
}