import { chromium } from 'playwright';

/**
 * Represents the grouped selectors extracted from a page.
 */
export interface SelectorGroups {
  /** Selectors that target elements by id attribute. */
  ids: string[];
  /** Selectors that target elements by data-testid attribute. */
  testIds: string[];
  /** Selectors that target elements by name attribute. */
  names: string[];
  /** Selectors derived from visible text content. */
  text: string[];
  /** All selectors combined without duplicates. */
  all: string[];
}

/**
 * Extracts DOM selectors from the given URL. The selectors are grouped by
 * the attribute or strategy used to locate them. Any error will result in an
 * empty set of selectors but the browser will always close.
 */
export async function extractSelectors(url: string): Promise<SelectorGroups> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(url);
    // Collect selectors grouped by strategy inside the browser context
    const groups = await page.evaluate(() => {
      const ids: string[] = [];
      const testIds: string[] = [];
      const names: string[] = [];
      const text: string[] = [];
      const all: string[] = [];

      const elements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
      for (const el of elements) {
        if (el.id) {
          const sel = `#${el.id}`;
          ids.push(sel);
          all.push(sel);
          continue;
        }

        const testid = el.getAttribute('data-testid');
        if (testid) {
          const sel = `[data-testid="${testid}"]`;
          testIds.push(sel);
          all.push(sel);
          continue;
        }

        const name = el.getAttribute('name');
        if (name) {
          const sel = `${el.tagName.toLowerCase()}[name="${name}"]`;
          names.push(sel);
          all.push(sel);
          continue;
        }

        const innerText = el.innerText.trim();
        if (innerText && innerText.length < 30) {
          // Normalize multi-line text to a single line for stability
          const trimmed = innerText.replace(/\n+/g, ' ').trim();
          const sel = `${el.tagName.toLowerCase()}:has-text(\"${trimmed}\")`;
          text.push(sel);
          all.push(sel);
        }
      }

      // Remove duplicates and return grouped selectors
      const unique = (arr: string[]) => Array.from(new Set(arr));
      return {
        ids: unique(ids),
        testIds: unique(testIds),
        names: unique(names),
        text: unique(text),
        all: unique(all),
      };
    });

    return groups;
  } catch {
    // If any error occurs we return empty groups to avoid throwing
    return { ids: [], testIds: [], names: [], text: [], all: [] };
  } finally {
    await browser.close();
  }
}

// Simple CLI entry point when the file is executed directly
(async () => {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node dist/index.js <url>');
    process.exit(1);
  }
  const selectors = await extractSelectors(url);
  console.log('Extracted selectors grouped by strategy:\n');
  console.log(JSON.stringify(selectors, null, 2));
})();
