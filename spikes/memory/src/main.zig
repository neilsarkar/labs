const std = @import("std");
const memory = @import("memory");

const Cool = struct {
    x: i32,
    y: i32,
};

const Nice = struct {
    a: f32,
};

pub fn main() !void {
    // Prints to stderr, ignoring potential errors.
    const cool = Cool{ .x = 10, .y = 20 };
    const nice = Nice{ .a = 3.14 };

    // Convert to byte arrays and concatenate
    const cool_bytes = std.mem.asBytes(&cool);
    const nice_bytes = std.mem.asBytes(&nice);
    const buffer = cool_bytes.* ++ nice_bytes.*;

    std.debug.print("Copied cool and nice into buffer ({} bytes)\n", .{buffer.len});

    // Reconstruct structs from buffer
    const cool_offset = 0;
    const cool_size = @sizeOf(Cool);
    const nice_offset = cool_size;
    const nice_size = @sizeOf(Nice);
    const cool_reconstructed = std.mem.bytesAsValue(Cool, buffer[cool_offset .. cool_offset + cool_size]).*;
    const nice_reconstructed = std.mem.bytesAsValue(Nice, buffer[nice_offset .. nice_offset + nice_size]).*;

    std.debug.print("Original cool: x={}, y={}\n", .{ cool.x, cool.y });
    std.debug.print("Reconstructed cool: x={}, y={}\n", .{ cool_reconstructed.x, cool_reconstructed.y });
    std.debug.print("Original nice: a={}\n", .{nice.a});
    std.debug.print("Reconstructed nice: a={}\n", .{nice_reconstructed.a});

    std.debug.print("All your {s} are belong to us.\n", .{"codebase"});
    try memory.bufferedPrint();
}

test "simple test" {
    const gpa = std.testing.allocator;
    var list: std.ArrayList(i32) = .empty;
    defer list.deinit(gpa); // Try commenting this out and see if zig detects the memory leak!
    try list.append(gpa, 42);
    try std.testing.expectEqual(@as(i32, 42), list.pop());
}

test "fuzz example" {
    const Context = struct {
        fn testOne(context: @This(), input: []const u8) anyerror!void {
            _ = context;
            // Try passing `--fuzz` to `zig build test` and see if it manages to fail this test case!
            try std.testing.expect(!std.mem.eql(u8, "canyoufindme", input));
        }
    };
    try std.testing.fuzz(Context{}, Context.testOne, .{});
}
