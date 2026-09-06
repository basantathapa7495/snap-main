'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Add shadow + stronger blur once the user scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how', label: 'How it works' },
    { href: '#video', label: 'video guide' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <header
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
  <img src="/logo1.png" alt="snap logo" className="h-14 w-auto" />
  <img src="/logo2.png" alt="snap" className="hidden h-14 w-auto md:block" />
</Link>

{/* logo2 centered — mobile only */}
<Link href="/" className="absolute left-1/2 top-8 -translate-x-1/2 -translate-y-1/2 md:hidden">
  <img src="/logo2.png" alt="snap" className="h-18 w-auto" />
</Link>

        {/* ===== Desktop links (center) ===== */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {link.label}
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
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* ===== Mobile slide-down menu ===== */}
      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          mobileOpen ? 'max-h-96 border-t border-gray-100 bg-white' : 'max-h-0'
        }`}
      >
        <div className="space-y-1 px-4 pb-4 pt-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Register your school
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}