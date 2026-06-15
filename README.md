# ECE391 Kernel Demo

A RISC-V64 kernel my team built from scratch for UIUC's ECE391 (Computer Systems Engineering), running live in the browser via WebAssembly.

## What it is

The kernel implements:
- VirtIO console driver (keyboard + terminal I/O)
- VirtIO block device driver (filesystem over HTTP)
- KTFS — a custom filesystem
- Page-table-based virtual memory
- Process scheduler
- Full system call interface
- Unix-style shell with N-stage pipeline support (`cmd1 | cmd2 | cmd3`)

The browser embed compiles [TinyEMU](https://bellard.org/tinyemu/) (a RISC-V emulator by Fabrice Bellard) to WebAssembly using Emscripten. The filesystem is split into 64 × 128KB chunks served over HTTP and mounted via the VirtIO block device.

## Try it

```
ls
cat testfile2
cat testfile2 | wc | cat
```

## Dev

```bash
npm install
npm run dev
```

## Stack

- Next.js + TypeScript
- xterm.js
- TinyEMU compiled to WASM via Emscripten
- Tailwind CSS

## Related

- [Portfolio](https://hackoverflow404.github.io) — embedded as an iframe in the ECE391 project entry
- [Kernel source](https://github.com/HackOverflow404/ece391-kernel-demo)
