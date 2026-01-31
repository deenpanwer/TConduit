import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROMIUM_PATH = '/nix/store/wsdanhm606q4wzv2y98bxc5hpfbi3sap-idx-builtins/bin/chromium';
const USER_DATA_DIR = path.resolve('.gemini/browser-session');

async function run() {
  const args = process.argv.slice(2);
  const actions = JSON.parse(args[0]); // Expects '[{"cmd":"goto","val":"url"},{"cmd":"type","sel":"#id","val":"txt"}]'

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    userDataDir: USER_DATA_DIR,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = (await browser.pages())[0] || await browser.newPage();

  try {
    for (const action of actions) {
      console.log(`Executing ${action.cmd} on ${action.sel || action.val}...`);
      switch (action.cmd) {
        case 'goto':
          await page.goto(action.val, { waitUntil: 'networkidle2' });
          break;
        case 'click':
          if (action.text) {
            console.log(`Clicking element with text: ${action.text}...`);
            await page.evaluate((text) => {
              const elements = Array.from(document.querySelectorAll('button, a, span, div, p'));
              const target = elements.find(el => el.innerText && el.innerText.toUpperCase().includes(text.toUpperCase()));
              if (target) {
                target.click();
              } else {
                const all = elements.filter(e => e.tagName === 'BUTTON').map(e => e.innerText);
                throw new Error(`Text "${text}" not found. Available buttons: ${all.join(', ')}`);
              }
            }, action.text);
          } else {
            await page.waitForSelector(action.sel, { timeout: 10000 });
            await page.click(action.sel);
          }
          break;
        case 'type':
          await page.waitForSelector(action.sel, { timeout: 10000 });
          await page.type(action.sel, action.val);
          break;
        case 'wait':
          await new Promise(r => setTimeout(r, action.val || 2000));
          break;
        case 'screenshot':
          await page.screenshot({ path: action.val || 'public/browser-snapshot.png', fullPage: true });
          break;
      }
    }
  } catch (err) {
    console.error(`Error during actions:`, err.message);
    await page.screenshot({ path: 'public/browser-error.png' });
  } finally {
    await browser.close();
  }
}

run();
