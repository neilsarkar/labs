# Playwright WebGPU Screenshot Experiment

Testing whether Playwright can capture WebGPU canvas screenshots in CI environments.

## Results

| Platform | Headless | Headed |
|----------|----------|--------|
| **macOS-latest** | ✅ Works | ✅ Works |
| **ubuntu-latest** | ❌ Blank | ❌ Blank |

**macOS runners successfully capture WebGPU canvas content.** Linux runners produce blank screenshots despite WebGPU being reported as available and tests passing.

## Key Chromium Flags

These flags enable WebGPU rendering in headless Chrome:

```ts
const webgpuFlags = [
  "--enable-unsafe-webgpu",
  "--enable-features=Vulkan",
  "--use-angle=swiftshader",
  "--use-gl=angle",
];

// For headless mode, also add:
"--headless=new"
```

## Local Development

```bash
bun install
bunx playwright install chromium
bunx playwright test           # Run headless + headed tests
bunx playwright test --headed  # Run only headed tests
```

## What's Tested

- Simple WebGPU hello triangle (orange triangle on dark blue background)
- Both headless and headed browser modes
- Canvas element screenshots

## Recommendations

For WebGPU visual regression testing in CI:

1. **Use macOS runners** - They have working GPU support via SwiftShader/ANGLE
2. **Use `--headless=new`** - The newer headless mode has better GPU support
3. **Include SwiftShader flags** - Software rendering works without hardware GPU

Linux runners may work with additional configuration (GPU-enabled runners, different SwiftShader setup), but standard ubuntu-latest does not capture WebGPU canvas content.
