//! By convention, root.zig is the root source file when making a library.
const std = @import("std");

pub fn four(path: []const u8, multi_pass: bool) !u32 {
    const contents = try std.fs.cwd().readFileAlloc(path, std.heap.page_allocator, .unlimited);
    defer std.heap.page_allocator.free(contents);

    var lines = std.mem.tokenizeScalar(u8, contents, '\n');
    var cols: usize = 0;
    var rows: usize = 0;
    var rolls = try std.ArrayList(u8).initCapacity(std.heap.page_allocator, 1024);
    defer rolls.deinit(std.heap.page_allocator);

    var index: usize = 0;
    while (lines.next()) |line| {
        const trimmed = std.mem.trim(u8, line, " \t\r\n");
        for (trimmed) |c| {
            switch (c) {
                '.' => try rolls.append(std.heap.page_allocator, 0),
                '@' => try rolls.append(std.heap.page_allocator, 1),
                else => @panic("Invalid character in input"),
            }
            index += 1;
        }
        if (rows == 0) {
            rows = rolls.items.len;
        }
        cols += 1;
    }

    std.debug.print("rows={d} cols={d}\n", .{ rows, cols });

    var count: u32 = 0;

    var indices_to_remove = try std.ArrayList(usize).initCapacity(std.heap.page_allocator, 1024);
    defer indices_to_remove.deinit(std.heap.page_allocator);
    outer: while (true) {
        for (rolls.items, 0..) |roll, i| {
            if ((i) % cols == 0) {
                std.debug.print("\n", .{});
            }

            if (roll == 0) {
                std.debug.print(".", .{});
                continue;
            }
            const score = try get_roll_score(rolls.items, rows, cols, i);
            if (score < 4) {
                try indices_to_remove.append(std.heap.page_allocator, i);
                count += 1;
            }
            const c: u8 = if (score < 4) 'X' else '@';
            std.debug.print("{c}", .{c});
        }

        if (!multi_pass or indices_to_remove.items.len == 0) {
            std.debug.print("BREAKING OUTER {}", .{indices_to_remove.items.len});
            break :outer;
        }

        for (indices_to_remove.items) |i| {
            rolls.items[i] = 0;
        }
        indices_to_remove.clearRetainingCapacity();
    }
    return count;
}

fn get_roll_score(rolls: []const u8, rows: usize, cols: usize, index: usize) !u8 {
    const width: i32 = @intCast(cols);

    const deltas = [_][2]i32{
        .{ -1, -1 }, .{ -1, 0 }, .{ -1, 1 },
        .{ 0, -1 },  .{ 0, 1 },  .{ 1, -1 },
        .{ 1, 0 },   .{ 1, 1 },
    };

    const row: i32 = @intCast(index / cols);
    const col: i32 = @intCast(index % cols);

    var score: u8 = 0;
    for (deltas) |d| {
        const target_row = row + d[0];
        const target_col = col + d[1];
        if (target_row < 0 or target_row >= rows) continue;
        if (target_col < 0 or target_col >= cols) continue;

        const target_index: usize = @intCast(target_row * width + target_col);
        score += if (rolls[target_index] > 0) 1 else 0;
    }

    return score;
}

test "day 4" {
    {
        const result = try four("data/4.sample.txt", false);
        try std.testing.expectEqual(13, result);
    }

    {
        const result = try four("data/4.txt", false);
        try std.testing.expectEqual(1449, result);
    }

    {
        const result = try four("data/4.sample.txt", true);
        try std.testing.expectEqual(43, result);
    }

    {
        const result = try four("data/4.txt", true);
        try std.testing.expectEqual(8746, result);
    }
}

pub fn three(path: []const u8, comptime num_batteries: usize) !u64 {
    const contents = try std.fs.cwd().readFileAlloc(path, std.heap.page_allocator, .unlimited);
    defer std.heap.page_allocator.free(contents);

    var lines = std.mem.tokenizeScalar(u8, contents, '\n');
    var joltages = try std.ArrayList(u64).initCapacity(std.heap.page_allocator, 1024);
    defer joltages.deinit(std.heap.page_allocator);

    while (lines.next()) |line| {
        const trimmed = std.mem.trim(u8, line, " \t\r\n");
        var start_index: usize = 0;
        var end_index = trimmed.len - num_batteries + 1;
        var bank: [num_batteries]u64 = undefined;
        @memset(&bank, 0);
        for (0..num_batteries) |battery_index| {
            const result = try find_max_digit(trimmed, start_index, end_index);
            // std.debug.print("battery_index={d} result={} start_index={d} end_index={d}\n", .{ battery_index, result, start_index, end_index });
            bank[battery_index] = result.value;
            start_index = result.index + 1;
            end_index += 1;
        }
        var result: u64 = 0;
        for (bank, 0..) |b, i| {
            result += b * std.math.pow(u64, 10, @intCast(num_batteries - i - 1));
        }
        try joltages.append(std.heap.page_allocator, result);
        // std.debug.print("trimmed={s} number={d}\n", .{ trimmed, result });
    }

    var sum: u64 = 0;
    for (joltages.items) |j| {
        sum += @intCast(j);
        // std.debug.print("Joltage: {d}\n", .{j});
    }
    return sum;
}

const MaxDigitResult = struct {
    value: u32,
    index: usize,
};

fn find_max_digit(num_str: []const u8, start_index: usize, end_index: usize) !MaxDigitResult {
    var result: MaxDigitResult = .{ .value = 0, .index = 0 };
    var i: usize = start_index;
    while (i < end_index) : (i += 1) {
        const c = num_str[i];
        if (!std.ascii.isDigit(c)) @panic("Non-digit character encountered");
        const digit = c - '0';
        // std.debug.print("i={d} c={c} digit={d}\n", .{ i, c, digit });
        if (digit > result.value) {
            result.value = digit;
            result.index = i;
        }
    }
    return result;
}

test "day 3" {
    {
        const result = try three("data/3.sample.txt", 2);
        try std.testing.expectEqual(357, result);
    }

    {
        const result = try three("data/3.txt", 2);
        try std.testing.expectEqual(17281, result);
    }

    {
        const result = try three("data/3.sample.txt", 12);
        try std.testing.expectEqual(3121910778619, result);
    }

    {
        const result = try three("data/3.txt", 12);
        try std.testing.expectEqual(171388730430281, result);
    }
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

// test "day 2" {
//     const result = try two("data/2.txt");
//     std.debug.print("Day 2 result: {}\n", .{result});
// }

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

// test "day 1" {
//     const result = try one("data/1.sample.txt");
//     try std.testing.expectEqual(3, result);

//     const result2 = try one("data/1.txt");
//     std.debug.print("Day 1 result: {}\n", .{result2});
// }

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
