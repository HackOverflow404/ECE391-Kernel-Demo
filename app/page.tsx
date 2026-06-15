'use client';

import dynamic from 'next/dynamic';

const KernelTerminal = dynamic(
  () => import('./components/KernelTerminal'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#111] p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-white font-mono text-xl mb-3 text-center">
          ECE391 OS — RISC-V Kernel Demo
        </h1>
        <div
          className="rounded-lg overflow-hidden border border-[#333] shadow-2xl"
          style={{ height: '75vh' }}
        >
          <KernelTerminal />
        </div>
        <p className="text-[#555] text-xs font-mono text-center mt-3">
          Running on TinyEMU (RISC-V rv64) compiled to WebAssembly
        </p>
      </div>
    </main>
  );
}
