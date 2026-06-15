'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

declare global {
  interface Window {
    term: {
      write: (s: string) => void;
      getSize: () => [number, number];
    };
    update_downloading: (flag: boolean) => void;
    graphic_display: null;
    Module: {
      onRuntimeInitialized?: () => void;
      _baseUrl?: string;
      ccall: (
        name: string,
        returnType: string | null,
        argTypes: string[],
        args: unknown[]
      ) => unknown;
    };
  }
}

// VM is a singleton — only one instance may run per page load.
// This flag prevents React StrictMode's double-invoke from starting it twice.
let _vmStarted = false;

export default function KernelTerminal() {
  const termDivRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'running'>('idle');

  useEffect(() => {
    if (!termDivRef.current) return;

    // Clear any DOM left by a prior mount (React StrictMode double-invokes effects)
    termDivRef.current.innerHTML = '';

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'monospace',
      fontSize: 14,
      theme: { background: '#1a1a1a', foreground: '#e0e0e0' },
      convertEol: false,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termDivRef.current);
    // fit() calls FitAddon then independently verifies the result.
    // FitAddon uses getComputedStyle(parent).height (integer) and xterm's internal
    // cell height; subpixel rounding can make it allocate 1-2 rows that don't visually
    // fit.  We follow up with getBoundingClientRect (fractional-pixel accurate) and
    // xterm's own _charSizeService measurement to compute the true safe row count.
    const fit = () => {
      try { fitAddon.fit(); } catch {}
      const el = termDivRef.current;
      const t = termRef.current;
      if (!el || !t || t.rows < 2) return;
      const containerH = el.getBoundingClientRect().height;
      if (containerH === 0) return;
      // Prefer xterm's own measured cell height; fall back to canvas ratio.
      let cellH = 0;
      try { cellH = (t as any)._core._charSizeService.measurements.height ?? 0; } catch {}
      if (!(cellH > 0)) {
        const canvas = el.querySelector('canvas') as HTMLCanvasElement | null;
        if (canvas && canvas.offsetHeight > 0) cellH = canvas.offsetHeight / t.rows;
      }
      if (!(cellH > 0)) return;
      const safeRows = Math.max(1, Math.floor(containerH / cellH));
      if (safeRows < t.rows) t.resize(t.cols, safeRows);
    };
    // Multiple retries: cell dimensions are measured asynchronously by xterm after
    // the first render frame; inside a lazy-loaded iframe this can be well past 600ms.
    const fitTimers = [50, 200, 600, 1500].map(d => setTimeout(fit, d));
    termRef.current = term;

    // ResizeObserver re-fits whenever the container size changes (e.g. modal resize).
    const resizeObs = new ResizeObserver(fit);
    resizeObs.observe(termDivRef.current!);

    // Provide the globals TinyEMU's lib.js expects
    window.term = {
      write: (s: string) => term.write(s),
      getSize: () => [term.cols, term.rows],
    };
    window.update_downloading = (flag: boolean) => {
      setStatus(flag ? 'loading' : 'running');
    };
    window.graphic_display = null;

    // Build a full http:// URL — TinyEMU's is_url() only accepts http/https/file
    const configUrl = new URL('/emu/temu.cfg', window.location.href).href;
    // Base URL for resolving relative drive image paths in lib.js
    const baseUrl = new URL('/emu/', window.location.href).href;

    const startVm = () => {
      if (_vmStarted) return;
      _vmStarted = true;
      setStatus('loading');
      window.Module._baseUrl = baseUrl;
      window.Module.ccall(
        'vm_start',
        null,
        ['string', 'number', 'string', 'string', 'number', 'number', 'number'],
        [configUrl, 8, '', null, 0, 0, 0]
      );
    };

    // Guard against React StrictMode double-mount loading the script twice
    const SCRIPT_ID = 'tinyemu-wasm-script';
    if (!document.getElementById(SCRIPT_ID)) {
      // Set Module.onRuntimeInitialized BEFORE loading the script
      window.Module = {
        onRuntimeInitialized() { startVm(); },
        _baseUrl: baseUrl,
      } as typeof window.Module;
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = '/emu/riscvemu64-wasm.js';
      document.body.appendChild(script);
    } else if (window.Module && typeof window.Module.ccall === 'function') {
      // WASM already fully loaded from a prior mount — start directly
      startVm();
    } else {
      // Script tag exists but WASM isn't loaded yet.
      // Patch the SAME object in-place — Emscripten captured its reference at
      // script-load time, so replacing window.Module would break the callback.
      window.Module._baseUrl = baseUrl;
      window.Module.onRuntimeInitialized = function() { startVm(); };
    }

    // Forward keyboard input to the VM
    const onKey = term.onKey(({ key }) => {
      if (typeof window.Module?.ccall !== 'function') return;
      for (let i = 0; i < key.length; i++) {
        window.Module.ccall(
          'console_queue_char',
          null,
          ['number'],
          [key.charCodeAt(i)]
        );
      }
    });

    const onResize = () => fitAddon.fit();
    window.addEventListener('resize', onResize);

    return () => {
      fitTimers.forEach(clearTimeout);
      resizeObs.disconnect();
      onKey.dispose();
      window.removeEventListener('resize', onResize);
      term.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border-b border-[#333] text-sm font-mono">
        <span className="text-[#888]">ECE391 Kernel —</span>
        {status === 'loading' && (
          <span className="text-yellow-400 animate-pulse">loading...</span>
        )}
        {status === 'running' && (
          <span className="text-green-400">running</span>
        )}
        {status === 'idle' && (
          <span className="text-[#555]">idle</span>
        )}
      </div>
      <div ref={termDivRef} className="flex-1" />
    </div>
  );
}
