import { it, expect } from "bun:test";
import { mount } from "../src/lib";

it("works", () => {
	expect(1 + 1).toBe(2);
});

it("sums via wasm", async () => {
	const wasm = await mount();
	expect(wasm.sum(3, 4)).toBe(7);
});
