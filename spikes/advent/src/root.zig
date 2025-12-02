//! By convention, root.zig is the root source file when making a library.
const std = @import("std");

pub fn one(path: []const u8) !u32 {
    const contents = try std.fs.cwd().readFileAlloc(path, std.heap.page_allocator, .unlimited);
    defer std.heap.page_allocator.free(contents);

    var lines = std.mem.tokenizeScalar(u8, contents, '\n');

    var dial: i32 = 50;
    var zero_count: u32 = 0;

    while (lines.next()) |line| {
        const num = try std.fmt.parseInt(u32, line[1..], 10);
        const was: u32 = @intCast(dial);
        switch (line[0]) {
            'L' => dial -= @intCast(num),
            'R' => dial += @intCast(num),
            else => return error.InvalidDirection,
        }
        const delta = count_zeroes(was, dial);
        dial = @mod(dial, 100);
        zero_count += delta;
    }
    return zero_count;
}

pub fn two(path: []const u8) !u64 {
    const contents = try std.fs.cwd().readFileAlloc(path, std.heap.page_allocator, .unlimited);
    defer std.heap.page_allocator.free(contents);

    var ranges = std.mem.tokenizeScalar(u8, contents, ',');
    var sum: u64 = 0;
    while (ranges.next()) |range| {
        var nice = std.mem.splitScalar(u8, range, '-');
        const start_str = nice.next() orelse return error.InvalidRange;
        const end_str = nice.next() orelse return error.InvalidRange;

        std.debug.print("|{s}|\n", .{start_str});
        const start_num = try std.fmt.parseInt(u64, std.mem.trim(u8, start_str, " \t\n\r"), 10);
        const end_num = try std.fmt.parseInt(u64, std.mem.trim(u8, end_str, " \t\n\r"), 10);
        var num = start_num;
        while (num <= end_num) : (num += 1) {
            const id_str = std.fmt.allocPrint(std.heap.page_allocator, "{d}", .{num}) catch return error.AllocationFailed;
            defer std.heap.page_allocator.free(id_str);

            if (is_invalid_id(id_str)) {
                std.debug.print("Invalid ID: {s}\n", .{id_str});
                sum += num;
            }
        }
    }
    return sum;
}

fn is_invalid_id(id: []const u8) bool {
    var i: u32 = 0;
    while (i < id.len / 2) : (i += 1) {
        const pattern = id[0 .. i + 1];
        var seq = std.mem.tokenizeSequence(u8, id, pattern);
        if (seq.peek() == null) {
            return true;
        }
    }
    return false;
}

fn count_zeroes(start: u32, end: i32) u32 {
    var count: u32 = 0;
    const multi_wrap = @abs(@divTrunc(end, 100));
    count += @intCast(multi_wrap);

    if (start > 0 and end < 0) {
        count += 1;
    }
    if (multi_wrap == 0 and end == 0) {
        count += 1;
    }
    return count;
}

test "day 1" {
    // const result = try one("data/1.sample.txt");
    // try std.testing.expectEqual(3, result);

    const result2 = try one("data/1.txt");
    std.debug.print("Day 1 result: {}\n", .{result2});
}

test "day 2" {
    const result = try two("data/2.txt");
    std.debug.print("Day 2 result: {}\n", .{result});
}

test "edge cases" {
    const test_cases = .{
        .{ 50, 99, 0 },
        .{ 50, 100, 1 },
        .{ 50, 101, 1 },
        .{ 50, -1, 1 },
        .{ 50, 0, 1 },
        .{ 50, 250, 2 },
        .{ 50, -250, 3 },
        .{ 50, 200, 2 },
        .{ 50, -150, 2 },
        .{ 0, -200, 2 },
        .{ 1, -200, 3 },
        .{ 1, -199, 2 },
    };

    inline for (test_cases) |tc| {
        const a: u32 = tc[0];
        const b: i32 = tc[1];
        const expected: u32 = tc[2];
        const c = count_zeroes(@intCast(a), b);
        // std.debug.print("{d} @abs(@divTrunc) {d} = {d} (expected {d})\n", .{ a, b, c, expected });
        try std.testing.expectEqual(expected, c);
    }
}

test "huh" {
    const id0 = "1698522";
    const id1 = "1698528";
    _ = try std.fmt.parseInt(u32, id0, 10);
    _ = try std.fmt.parseInt(u32, id1, 10);
}
