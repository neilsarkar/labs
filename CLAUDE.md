# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Experimental monorepo exploring Bun, Zig, WebAssembly, and WebRTC technologies. Organized as a Bun workspace with independent spike projects in `spikes/`.

## Commands

```bash
bun install              # Install all dependencies
bun test                 # Run all tests
bun run build            # Build all spikes
bun run ci:tsc           # TypeScript type checking across all spikes
bun run dev              # Start dev servers for all spikes
```

For Zig projects (aoc25, memory, zgpu):
```bash
zig build                # Build
zig build run            # Build and run
zig build test           # Run tests
```

## Use Bun Instead of Node.js

- Use `bun <file>` instead of `node` or `ts-node`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm/yarn/pnpm install`
- Bun automatically loads `.env` files

### Bun APIs

- `Bun.serve()` for HTTP/WebSocket servers (not express)
- `bun:sqlite` for SQLite (not better-sqlite3)
- `Bun.file` over `node:fs` readFile/writeFile
- `Bun.$\`cmd\`` instead of execa
- Built-in `WebSocket` (not ws package)

### Testing with Bun

```ts
import { test, expect } from "bun:test";

test("example", () => {
  expect(1).toBe(1);
});
```

### Frontend with Bun

Use HTML imports with `Bun.serve()` routes instead of Vite:

```ts
import index from "./index.html"

Bun.serve({
  routes: { "/": index },
  development: { hmr: true, console: true }
})
```

HTML files can directly import .tsx/.jsx/.js files and Bun's bundler handles transpilation.

## Architecture

- **spikes/aoc25**: Advent of Code 2025 solutions in Zig
- **spikes/bun-ffi**: Bun FFI calling native Zig libraries
- **spikes/zig-ffi**: Zig compiled to WebAssembly, loaded in Bun
- **spikes/webrtc**: Full-stack WebRTC demo with Bun server + Alpine.js frontend
- **spikes/memory, zgpu**: Zig systems programming experiments
