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
});
