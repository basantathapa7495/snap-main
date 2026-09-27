import type { ReactNode } from 'react';
import PortalAccessGate from '@/components/PortalAccessGate';
export default function StudentLayout({ children }: { children: ReactNode }) { return <PortalAccessGate role="student">{children}</PortalAccessGate>; }
