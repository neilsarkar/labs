import { dlopen, FFIType, suffix } from "bun:ffi";
const { i32, ptr, u32 } = FFIType;

const path = `libadd.${suffix}`;
const lib = dlopen(path, {
	add: {
		args: [i32, i32],
		returns: i32,
	},

	fill_and_callback: {
		args: [ptr, u32, ptr],
		returns: FFIType.void,
	},
});

console.log(lib.symbols.add(1, 2));
