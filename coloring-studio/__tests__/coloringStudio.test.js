const path = require('path');
const fs = require('fs');
const { TextEncoder, TextDecoder } = require('util');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

const { JSDOM } = require('jsdom');

async function loadColoringStudio() {
  const filePath = path.join(__dirname, '..', 'index.html');
  let html = await fs.promises.readFile(filePath, 'utf8');

  const mockScript = `
    <script>
      if (typeof SVGElement.prototype.getBBox === 'undefined') {
        SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 });
      }
    </script>
  `;
  html = html.replace('</head>', `${mockScript}</head>`);

  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
  });

  if (dom.window.document.readyState !== 'complete') {
    await new Promise((resolve) => {
      dom.window.addEventListener('load', resolve);
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 0));

  const artboard = dom.window.document.getElementById('artboard');
  if (!artboard.querySelector('.paint-cell')) {
    throw new Error('Failed to generate paintable regions for the coloring studio artboard.');
  }

  return dom;
}

describe('Coloring Studio paint-by-numbers experience', () => {
  let dom;
  let window;
  let document;

  beforeEach(async () => {
    dom = await loadColoringStudio();
    window = dom.window;
    document = window.document;
  });

  afterEach(() => {
    dom.window.close();
  });

  test('renders a palette swatch for every color option', () => {
    const swatches = document.querySelectorAll('.color-swatch');
    expect(swatches.length).toBeGreaterThan(0);

    swatches.forEach((swatch) => {
      expect(swatch.dataset.color).toBeTruthy();
      expect(swatch.textContent.trim()).not.toHaveLength(0);
    });
  });

  test('allows each color to be selected from the palette', () => {
    const swatches = Array.from(document.querySelectorAll('.color-swatch'));
    expect(swatches.length).toBeGreaterThan(1);

    swatches.forEach((swatch, index) => {
      swatch.dispatchEvent(new window.Event('click', { bubbles: true }));
      expect(swatch.classList.contains('is-selected')).toBe(true);

      swatches.forEach((other, otherIndex) => {
        if (otherIndex === index) return;
        expect(other.classList.contains('is-selected')).toBe(false);
      });
    });
  });

  test('fills a paint cell using the currently selected color', () => {
    const swatches = Array.from(document.querySelectorAll('.color-swatch'));
    expect(swatches.length).toBeGreaterThan(1);

    const targetSwatch = swatches[1];
    targetSwatch.dispatchEvent(new window.Event('click', { bubbles: true }));
    const expectedColor = targetSwatch.dataset.color;

    const cell = document.querySelector('.paint-cell');
    expect(cell).not.toBeNull();
    expect(cell.getAttribute('fill')).toBe('#ffffff');

    cell.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));

    expect(cell.getAttribute('fill')).toBe(expectedColor);
  });

  test('clear button resets every painted region to white', () => {
    const swatches = Array.from(document.querySelectorAll('.color-swatch'));
    const targetSwatch = swatches[2] || swatches[0];
    targetSwatch.dispatchEvent(new window.Event('click', { bubbles: true }));
    const paintedColor = targetSwatch.dataset.color;

    const cells = Array.from(document.querySelectorAll('.paint-cell')).slice(0, 3);
    cells.forEach((cell) => {
      cell.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));
      expect(cell.getAttribute('fill')).toBe(paintedColor);
    });

    const clearButton = document.getElementById('clear');
    clearButton.dispatchEvent(new window.Event('click', { bubbles: true }));

    cells.forEach((cell) => {
      expect(cell.getAttribute('fill')).toBe('#ffffff');
    });
  });

  test('limits generated pattern to at most 50 paintable regions', () => {
    const paintCells = document.querySelectorAll('.paint-cell');
    expect(paintCells.length).toBeGreaterThan(0);
    expect(paintCells.length).toBeLessThanOrEqual(50);
  });

  test('mobile layout locks the viewport and keeps the studio content visible without scrolling', () => {
    const styles = Array.from(document.querySelectorAll('style'))
      .map((styleTag) => styleTag.textContent)
      .join('\n');

    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*body\s*{[\s\S]*overflow:\s*hidden/i);
    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*main\s*{[\s\S]*height:\s*100dvh/i);
    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*main\s*{[\s\S]*overflow:\s*hidden/i);
    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.studio\s*{[\s\S]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s*auto/i);
    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.canvas-area\s*{[\s\S]*min-height:\s*0/i);
    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.canvas-wrapper\s*{[\s\S]*display:\s*flex/i);
  });

  test('mobile header switches to a compact horizontal layout with accessible title treatment', () => {
    const styles = Array.from(document.querySelectorAll('style'))
      .map((styleTag) => styleTag.textContent)
      .join('\n');

    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*header\s*{[\s\S]*flex-direction:\s*row/i);
    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*header\s*{[\s\S]*align-items:\s*center/i);
    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.header-title\s*{[\s\S]*clip:\s*rect\(0,\s*0,\s*0,\s*0\)/i);
    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.header-label\s*{[\s\S]*display:\s*inline-flex/i);
    expect(styles).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.header-actions\s*{[\s\S]*gap:\s*0\.4rem/i);
    expect(styles).toMatch(/\.header-icon-button\s*{[\s\S]*width:\s*2\.75rem/i);

    const header = document.querySelector('header');
    const headerActions = header.querySelector('.header-actions');
    const regenerateButton = document.getElementById('regenerate');
    const clearButton = document.getElementById('clear');

    expect(headerActions).not.toBeNull();
    expect(headerActions.contains(regenerateButton)).toBe(true);
    expect(headerActions.contains(clearButton)).toBe(true);
    expect(regenerateButton.querySelector('.visually-hidden').textContent).toMatch(/new pattern/i);
    expect(clearButton.querySelector('.visually-hidden').textContent).toMatch(/clear colors/i);
  });
});
