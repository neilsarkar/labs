import wasmUrl from "./sum.wasm";

const bytes = await Bun.file(wasmUrl).arrayBuffer();
const wasm = await WebAssembly.instantiate(bytes);

console.log(wasm.instance.exports.sum(1, 2));
