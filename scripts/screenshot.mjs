import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';

async function takeScreenshot(url, outputPath) {
  const browser = await puppeteer.launch({
    executablePath: '/nix/store/wsdanhm606q4wzv2y98bxc5hpfbi3sap-idx-builtins/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log(`Navigating to ${url}...`);
    // Wait for network to be idle to ensure the Next.js app is loaded
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Additional wait for any client-side hydration/animations
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(`Screenshot saved to ${outputPath}`);
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
}

const url = process.argv[2] || 'http://localhost:9002';
const outputPath = process.argv[3] || 'screenshot.png';

takeScreenshot(url, outputPath);
