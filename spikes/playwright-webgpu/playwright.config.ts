import { defineConfig, devices } from "@playwright/test";

// Common WebGPU flags
const webgpuFlags = [
  "--enable-unsafe-webgpu",
  "--enable-features=Vulkan",
  "--use-angle=swiftshader",
  "--use-gl=angle",
];

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "on",
  },
  projects: [
    {
      name: "chromium-headless",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--headless=new", ...webgpuFlags],
        },
      },
    },
    {
      name: "chromium-headed",
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        launchOptions: {
          args: webgpuFlags,
        },
      },
    },
  ],
  webServer: {
    command: "bun run index.ts",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
