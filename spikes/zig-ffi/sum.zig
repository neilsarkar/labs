extern "env" fn console_log(ptr: [*]const u8, len: usize) void;

pub export fn sum(a: i32, b: i32) i32 {
    return a + b;
}

pub export fn sum_all(ptr: u32, len: u32) u32 {
    const p: [*]u32 = @ptrFromInt(ptr);
    var total: u32 = 0;
    var i: u32 = 0;
    while (i < len) : (i += 1) total += p[i];
    return total;
}
