# Selector Extractor

This tool extracts useful DOM selectors from a web page using [Playwright](https://playwright.dev/). It also generates a Page Object Model mapping and saves a screenshot of the page.
## Prerequisites

- Node.js v14 or later
- npm

## Installation

1. Install dependencies (this will install Playwright and other required packages):
   ```bash
   npm install
   ```
2. Build the TypeScript source:
   ```bash
   npm run build
   ```
   If you get a "Cannot find module 'playwright'" error when running the tool,
   ensure that `npm install` completed successfully.

## Usage

Run the extractor and provide the URL of the page to process:

```bash
node dist/index.js <url>
```

Alternatively, you can use the npm start script:

```bash
npm start -- <url>
```

The script prints selectors grouped by how they were discovered and also
generates a mapping that can be used in Page Object Models. Each element's ARIA
role and accessible name are considered to produce Playwright `getByRole`
selectors when possible. A screenshot is saved in the current directory. The
output structure is as follows:

```json
{
  "ids": ["#main"],
  "testIds": ["[data-testid=\"header\"]"],
  "names": ["input[name=\"search\"]"],
  "roles": ["role=button[name=\"Submit\"]"],
  "text": ["button:has-text(\"Submit\")"],
  "all": ["#main", "[data-testid=\"header\"]", ...],
  "pageObject": {
    "main": "#main",
    "header": "[data-testid=\"header\"]",
    "searchInput": "input[name=\"search\"]",
    "submitButton": "button:has-text(\"Submit\")"
  }
}
```

## Example

```bash
npm start -- https://example.com
```

This will output selectors found on the page `https://example.com`.

