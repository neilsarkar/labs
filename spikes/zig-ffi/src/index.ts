import { mount } from "./lib";

const wasm = await mount();
console.log(wasm.sum(1, 1));

wasm.step();
