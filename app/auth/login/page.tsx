'use client';

import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Suspense fallback={<p className="text-gray-500">Loading login...</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}