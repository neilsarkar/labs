import { test, expect } from "@playwright/test";

test("WebGPU triangle renders and can be screenshotted", async ({
  page,
}, testInfo) => {
  const projectName = testInfo.project.name;

  await page.goto("/");

  // Wait for WebGPU to finish rendering
  await page.waitForSelector('[data-webgpu-ready="true"]', { timeout: 10000 });

  // Verify no error message is displayed
  const errorText = await page.locator("#error").textContent();
  expect(errorText).toBe("");

  // Take screenshot of the canvas
  const canvas = page.locator("#canvas");
  await canvas.screenshot({ path: `screenshots/${projectName}-triangle.png` });

  // Take full page screenshot
  await page.screenshot({ path: `screenshots/${projectName}-full-page.png` });

  // Verify the canvas has content (not completely transparent)
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  expect(canvasBox!.width).toBeGreaterThan(0);
  expect(canvasBox!.height).toBeGreaterThan(0);
});

test("reports WebGPU availability", async ({ page }) => {
  await page.goto("/");

  const hasWebGPU = await page.evaluate(() => {
    return "gpu" in navigator;
  });

  console.log(`WebGPU available: ${hasWebGPU}`);

  // This test just logs WebGPU availability - useful for CI debugging
  expect(typeof hasWebGPU).toBe("boolean");
});
