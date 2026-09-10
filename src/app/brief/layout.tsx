import { AppGate } from '@/components/auth/AppGate';

export default function BriefLayout({ children }: { children: React.ReactNode }) {
  return <AppGate>{children}</AppGate>;
}
