async function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const errorDiv = document.getElementById("error") as HTMLDivElement;

  if (!navigator.gpu) {
    errorDiv.textContent = "WebGPU not supported";
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    errorDiv.textContent = "No GPU adapter found";
    return;
  }

  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  if (!context) {
    errorDiv.textContent = "Could not get WebGPU context";
    return;
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format });

  const shaderCode = `
    @vertex
    fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
      var pos = array<vec2f, 3>(
        vec2f(0.0, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, -0.5)
      );
      return vec4f(pos[i], 0.0, 1.0);
    }

    @fragment
    fn fs() -> @location(0) vec4f {
      return vec4f(1.0, 0.5, 0.2, 1.0); // Orange color
    }
  `;

  const module = device.createShaderModule({ code: shaderCode });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vs" },
    fragment: {
      module,
      entryPoint: "fs",
      targets: [{ format }],
    },
  });

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });

  pass.setPipeline(pipeline);
  pass.draw(3);
  pass.end();

  device.queue.submit([encoder.finish()]);

  // Signal that rendering is complete
  document.body.setAttribute("data-webgpu-ready", "true");
}

main().catch((err) => {
  const errorDiv = document.getElementById("error") as HTMLDivElement;
  errorDiv.textContent = `Error: ${err.message}`;
});
