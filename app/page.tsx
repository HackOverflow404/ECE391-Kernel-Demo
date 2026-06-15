'use client';

import dynamic from 'next/dynamic';

const KernelTerminal = dynamic(
  () => import('./components/KernelTerminal'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="h-screen bg-[#111] overflow-hidden">
      <KernelTerminal />
    </main>
  );
}
