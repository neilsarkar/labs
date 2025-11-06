import wasmUrl from "./sum.wasm";

export type WasmEngine = {
	sum(a: number, b: number): number;
	step(): void;
};

export async function mount(): Promise<WasmEngine> {
	// https://github.com/oven-sh/bun/issues/12434
	const bytes = await Bun.file(wasmUrl).arrayBuffer();
	const wasmInstantiatedSource = await WebAssembly.instantiate(bytes, {
		env: {
			__cb: function (a: number) {
				console.log("called __cb", a);
			},
		},
	});
	const wasm = wasmInstantiatedSource.instance.exports as WasmEngine;
	return wasm;
}
