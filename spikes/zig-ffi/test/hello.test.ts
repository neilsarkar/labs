import { it, expect } from "bun:test";
// https://github.com/oven-sh/bun/issues/12434
import wasmUrl from "../sum.wasm";

const bytes = await Bun.file(wasmUrl).arrayBuffer();
const wasmModule = await WebAssembly.instantiate(bytes);
const wasm = wasmModule.instance.exports as {
	sum(a: number, b: number): number;
};

it("works", () => {
	expect(1 + 1).toBe(2);
});

it("sums via wasm", () => {
	expect(wasm.sum(3, 4)).toBe(7);
});
