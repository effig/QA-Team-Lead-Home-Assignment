# QA Team Lead – Playwright exercise

## Tests
1. **Best Value** — ties, null/invalid values, and the all-invalid case.
2. **Snapshot version ordering** — older and equal versions are ignored; displayed data remains from v12.

## Run
Requires Node.js 18+.
```bash
npm install
npx playwright install chromium
npm test
```
The test opens the local `widget.html` directly (no server/network required) and uses its documented fixture API: `window.qaWidget.update(snapshot)`. The fixture is copied unchanged.

## AI disclosure
ChatGPT assisted with structuring the assignment response and drafting/reviewing the Playwright test scaffold. The author is responsible for final decisions and code.
