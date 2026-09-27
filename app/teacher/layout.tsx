import type { ReactNode } from 'react';
import PortalAccessGate from '@/components/PortalAccessGate';
export default function TeacherLayout({ children }: { children: ReactNode }) { return <PortalAccessGate role="teacher">{children}</PortalAccessGate>; }
