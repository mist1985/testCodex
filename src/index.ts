import path from 'path';

// Lazily require dependencies so we can show a helpful message when they are
// missing (common when `npm install` hasn't been run yet).
let chromium: any;
let chalk: any;

try {
  ({ chromium } = require('playwright'));
} catch {
  console.error(
    'The "playwright" package is required. Please run "npm install" before running this tool.'
  );
  process.exit(1);
}

try {
  chalk = require('chalk');
} catch {
  chalk = {
    blue: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    magenta: (s: string) => s,
    cyan: (s: string) => s,
  };
}

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
  /** Selectors targeting elements by their ARIA role and name. */
  roles: string[];
  /** Selectors derived from visible text content. */
  text: string[];
  /** All selectors combined without duplicates. */
  all: string[];
}

/** Represents a mapping of friendly element names to selectors following the
 * Page Object Model principle. */
export interface PageObject {
  [key: string]: string;
}

export interface ExtractResult extends SelectorGroups {
  /** Mapping of generated page object property names to selectors. */
  pageObject: PageObject;
}

/**
 * Extracts DOM selectors from the given URL. The selectors are grouped by
 * the attribute or strategy used to locate them. Any error will result in an
 * empty set of selectors but the browser will always close.
 */
export async function extractSelectors(url: string): Promise<ExtractResult> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(url);
    // Collect selectors grouped by strategy inside the browser context
    const groups = await page.evaluate(() => {
      const ids: string[] = [];
      const testIds: string[] = [];
      const names: string[] = [];
      const roles: string[] = [];
      const text: string[] = [];
      const all: string[] = [];
      const pageObj: Record<string, string> = {};

      const camel = (str: string) =>
        str
          .toLowerCase()
          .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase());

      const defaultRole = (el: HTMLElement): string | null => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'a') return 'link';
        if (tag === 'button') return 'button';
        if (tag === 'select') return 'combobox';
        if (tag === 'option') return 'option';
        if (tag === 'input') {
          const type = (el.getAttribute('type') || '').toLowerCase();
          if (type === 'checkbox') return 'checkbox';
          if (type === 'radio') return 'radio';
          if (type === 'submit' || type === 'button') return 'button';
          return 'textbox';
        }
        return null;
      };

      const elements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
      let index = 0;
      for (const el of elements) {
        let sel = '';
        let keyBase = '';
        if (el.id) {
          sel = `#${el.id}`;
          ids.push(sel);
          keyBase = el.id;
        } else {
          const testid = el.getAttribute('data-testid');
          if (testid) {
            sel = `[data-testid="${testid}"]`;
            testIds.push(sel);
            keyBase = testid;
          } else {
            const name = el.getAttribute('name');
            if (name) {
              sel = `${el.tagName.toLowerCase()}[name="${name}"]`;
              names.push(sel);
              keyBase = name;
            } else {
              const role = el.getAttribute('role') || defaultRole(el);
              if (role) {
                const label = el.getAttribute('aria-label') || el.innerText.trim();
                if (label && label.length < 30) {
                  const safe = label.replace(/\n+/g, ' ').trim();
                  sel = `role=${role}[name="${safe}"]`;
                  roles.push(sel);
                  keyBase = safe.split(' ').slice(0, 3).join(' ');
                } else {
                  sel = `role=${role}`;
                  roles.push(sel);
                  keyBase = role;
                }
              } else {
                const innerText = el.innerText.trim();
                if (innerText && innerText.length < 30) {
                  const trimmed = innerText.replace(/\n+/g, ' ').trim();
                  sel = `${el.tagName.toLowerCase()}:has-text("${trimmed}")`;
                  text.push(sel);
                  keyBase = trimmed.split(' ').slice(0, 3).join(' ');
                }
              }
            }
          }
        }

        if (sel) {
          all.push(sel);
          let prop = camel(keyBase || `${el.tagName.toLowerCase()}${index}`);
          let suffix = 1;
          while (pageObj[prop]) {
            prop = `${prop}${suffix++}`;
          }
          pageObj[prop] = sel;
        }
        index++;
      }

      // Remove duplicates and return grouped selectors
      const unique = (arr: string[]) => Array.from(new Set(arr));
      return {
        ids: unique(ids),
        testIds: unique(testIds),
        names: unique(names),
        roles: unique(roles),
        text: unique(text),
        all: unique(all),
        pageObject: pageObj,
      };
    });

    const screenshotPath = path.join(
      process.cwd(),
      `screenshot-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(chalk.green(`Screenshot saved to ${screenshotPath}`));

    return groups;
  } catch {
    // If any error occurs we return empty groups to avoid throwing
    return { ids: [], testIds: [], names: [], roles: [], text: [], all: [], pageObject: {} };
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
  console.log(chalk.blue('Extracted selectors grouped by strategy:\n'));
  console.log(chalk.yellow(JSON.stringify({
    ids: selectors.ids,
    testIds: selectors.testIds,
    names: selectors.names,
    roles: selectors.roles,
    text: selectors.text,
    all: selectors.all
  }, null, 2)));

  console.log(chalk.magenta('\nGenerated page object:\n'));
  console.log(chalk.cyan(JSON.stringify(selectors.pageObject, null, 2)));
})();
