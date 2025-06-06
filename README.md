# Selector Extractor

This tool extracts useful DOM selectors from a web page using [Playwright](https://playwright.dev/).

## Prerequisites

- Node.js v14 or later
- npm

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the TypeScript source:
   ```bash
   npm run build
   ```

## Usage

Run the extractor and provide the URL of the page to process:

```bash
node dist/index.js <url>
```

Alternatively, you can use the npm start script:

```bash
npm start -- <url>
```

The script prints selectors grouped by how they were discovered. Output will
resemble the following structure:

```json
{
  "ids": ["#main"],
  "testIds": ["[data-testid=\"header\"]"],
  "names": ["input[name=\"search\"]"],
  "text": ["button:has-text(\"Submit\")"],
  "all": ["#main", "[data-testid=\"header\"]", ...]
}
```

## Example

```bash
npm start -- https://example.com
```

This will output selectors found on the page `https://example.com`.

