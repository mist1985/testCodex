"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
async function extractSelectors(url) {
    const browser = await playwright_1.chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    // Collect selectors
    const selectors = await page.evaluate(() => {
        const results = [];
        const elements = Array.from(document.querySelectorAll('*'));
        for (const el of elements) {
            if (el.id) {
                results.push(`#${el.id}`);
                continue;
            }
            const testid = el.getAttribute('data-testid');
            if (testid) {
                results.push(`[data-testid="${testid}"]`);
                continue;
            }
            const name = el.getAttribute('name');
            if (name) {
                results.push(`${el.tagName.toLowerCase()}[name="${name}"]`);
                continue;
            }
            const text = el.innerText.trim();
            if (text && text.length < 30) {
                const trimmed = text.replace(/\n+/g, ' ').trim();
                results.push(`${el.tagName.toLowerCase()}:has-text(\"${trimmed}\")`);
            }
        }
        return Array.from(new Set(results));
    });
    await browser.close();
    return selectors;
}
(async () => {
    const url = process.argv[2];
    if (!url) {
        console.error('Usage: node dist/index.js <url>');
        process.exit(1);
    }
    const selectors = await extractSelectors(url);
    console.log('Extracted selectors:\n');
    for (const sel of selectors) {
        console.log(sel);
    }
})();
