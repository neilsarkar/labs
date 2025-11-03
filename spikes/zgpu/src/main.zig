// modified from https://github.com/zig-gamedev/zig-gamedev/blob/main/samples/triangle_wgpu/src/triangle_wgpu.zig
const std = @import("std");
const zgpu = @import("zgpu");
const zglfw = @import("zglfw");
const window_title = "triangle";

// zig fmt: off
const wgsl_vs =
\\  @vertex
\\  fn main(
\\      @builtin(vertex_index) vertex_index: u32
\\  ) -> @builtin(position) vec4<f32> {
\\    var pos = array<vec2<f32>, 3>(
\\        vec2<f32>(0.0, 0.5),
\\        vec2<f32>(-0.5, -0.5),
\\        vec2<f32>(0.5, -0.5),
\\    );
\\    return vec4<f32>(pos[vertex_index], 0.0, 1.0);
\\  }
;
const wgsl_fs =
\\  @fragment fn main(
\\  ) -> @location(0) vec4<f32> {
\\      return vec4(1.0, 0.0, 1.0, 1.0);
\\  }
// zig fmt: on
;

pub fn main() !void {
    try zglfw.init();
    defer zglfw.terminate();

    zglfw.windowHint(.client_api, .no_api);

    const window = try zglfw.Window.create(1600, 1000, window_title, null);
    defer window.destroy();

    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    const allocator = gpa.allocator();

    const gctx = try zgpu.GraphicsContext.create(
        allocator,
        .{
            .window = window,
            .fn_getTime = @ptrCast(&zglfw.getTime),
            .fn_getFramebufferSize = @ptrCast(&zglfw.Window.getFramebufferSize),
            .fn_getWin32Window = @ptrCast(&zglfw.getWin32Window),
            .fn_getX11Display = @ptrCast(&zglfw.getX11Display),
            .fn_getX11Window = @ptrCast(&zglfw.getX11Window),
            .fn_getWaylandDisplay = @ptrCast(&zglfw.getWaylandDisplay),
            .fn_getWaylandSurface = @ptrCast(&zglfw.getWaylandWindow),
            .fn_getCocoaWindow = @ptrCast(&zglfw.getCocoaWindow),
        },
        .{},
    );
    errdefer gctx.destroy(allocator);

    const pipeline_layout = gctx.createPipelineLayout(&.{});
    defer gctx.releaseResource(pipeline_layout);

    const pipeline_handle = pipeline: {
        const vs_module = zgpu.createWgslShaderModule(gctx.device, wgsl_vs, "vs");
        defer vs_module.release();

        const fs_module = zgpu.createWgslShaderModule(gctx.device, wgsl_fs, "fs");
        defer fs_module.release();

        const color_targets = [_]zgpu.wgpu.ColorTargetState{.{
            .format = zgpu.GraphicsContext.swapchain_format,
        }};

        const pipeline_descriptor = zgpu.wgpu.RenderPipelineDescriptor{ .vertex = zgpu.wgpu.VertexState{
            .module = vs_module,
            .entry_point = "main",
            .buffer_count = 0,
            .buffers = null,
        }, .primitive = zgpu.wgpu.PrimitiveState{
            .front_face = .ccw,
            .cull_mode = .none,
            .topology = .triangle_list,
        }, .fragment = &zgpu.wgpu.FragmentState{
            .module = fs_module,
            .entry_point = "main",
            .target_count = color_targets.len,
            .targets = &color_targets,
        } };
        break :pipeline gctx.createRenderPipeline(pipeline_layout, pipeline_descriptor);
    };

    while (!window.shouldClose()) {
        zglfw.pollEvents();
        const back_buffer_view = gctx.swapchain.getCurrentTextureView();
        defer back_buffer_view.release();

        const commands = commands: {
            const encoder = gctx.device.createCommandEncoder(null);
            defer encoder.release();

            {
                const color_attachments = [_]zgpu.wgpu.RenderPassColorAttachment{.{ .view = back_buffer_view, .load_op = .clear, .store_op = .store, .clear_value = .{ .r = 0.3, .g = 0.3, .b = 0.3, .a = 1.0 } }};

                const render_pass_info = zgpu.wgpu.RenderPassDescriptor{
                    .color_attachment_count = color_attachments.len,
                    .color_attachments = &color_attachments,
                    .label = "Main Render Pass",
                };
                const pass = encoder.beginRenderPass(render_pass_info);
                defer {
                    pass.end();
                    pass.release();
                }

                const pipeline = gctx.lookupResource(pipeline_handle) orelse unreachable;

                pass.setPipeline(pipeline);
                pass.draw(3, 1, 0, 0);
            }

            break :commands encoder.finish(.{});
        };
        defer commands.release();

        gctx.queue.submit(&.{commands});
        if (gctx.present() == .normal_execution) {
            std.debug.print("Frame presented\n", .{});
        } else {
            std.debug.print("Window resized\n", .{});
        }
        // window.swapBuffers();
    }
}
