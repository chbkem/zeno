// Generates the PWA icons, favicon.ico and public/logo.svg from the Zeno logomark.
// Dependency-free: flattens the SVG paths, rasterises them with 4x supersampling
// and writes PNG/ICO files by hand.
//
// Run with: npm run icons

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(root, "public");

const PRIMARY = "#005e35";
const BACKGROUND = "#f9f7ee";

const VIEWBOX = { width: 46, height: 40 };

const PATHS = [
  "M0 33L4.60606 25H12.2448C17.2569 25 21.4947 28.7103 22.1571 33.6784L23 40H13L11.5585 36.6365C10.613 34.4304 8.44379 33 6.04362 33H0Z",
  "M46 33L41.3939 25H33.7552C28.7431 25 24.5053 28.7103 23.8429 33.6784L23 40H33L34.4415 36.6365C35.387 34.4304 37.5562 33 39.9564 33H46Z",
  "M4.60608 25L18.9999 0H23L22.6032 9.52405C22.2608 17.7406 15.7455 24.3596 7.53539 24.8316L4.60608 25Z",
  "M41.3939 25L27.0001 0H23L23.3968 9.52405C23.7392 17.7406 30.2545 24.3596 38.4646 24.8316L41.3939 25Z",
];

/** Splits an SVG path into absolute contours of straight line segments. */
function flattenPath(d, curveSteps = 24) {
  const tokens = d.match(/[MmLlHhVvCcSsZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
  const contours = [];
  let contour = null;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let i = 0;

  const num = () => Number(tokens[i++]);
  const push = (px, py) => contour?.push([px, py]);

  while (i < tokens.length) {
    const command = tokens[i++];
    switch (command) {
      case "M":
      case "m": {
        const nx = num();
        const ny = num();
        x = command === "m" ? x + nx : nx;
        y = command === "m" ? y + ny : ny;
        startX = x;
        startY = y;
        contour = [[x, y]];
        contours.push(contour);
        break;
      }
      case "L":
      case "l": {
        const nx = num();
        const ny = num();
        x = command === "l" ? x + nx : nx;
        y = command === "l" ? y + ny : ny;
        push(x, y);
        break;
      }
      case "H":
      case "h": {
        const nx = num();
        x = command === "h" ? x + nx : nx;
        push(x, y);
        break;
      }
      case "V":
      case "v": {
        const ny = num();
        y = command === "v" ? y + ny : ny;
        push(x, y);
        break;
      }
      case "C":
      case "c": {
        const relative = command === "c";
        const ox = relative ? x : 0;
        const oy = relative ? y : 0;
        const x1 = ox + num();
        const y1 = oy + num();
        const x2 = ox + num();
        const y2 = oy + num();
        const x3 = ox + num();
        const y3 = oy + num();
        const sx = x;
        const sy = y;
        for (let step = 1; step <= curveSteps; step++) {
          const t = step / curveSteps;
          const mt = 1 - t;
          const px =
            mt * mt * mt * sx + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
          const py =
            mt * mt * mt * sy + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
          push(px, py);
        }
        x = x3;
        y = y3;
        break;
      }
      case "Z":
      case "z": {
        if (contour) {
          push(startX, startY);
          contour = null;
        }
        x = startX;
        y = startY;
        break;
      }
      default:
        throw new Error(`Unsupported SVG command: ${command}`);
    }
  }

  return contours.filter((c) => c.length > 2);
}

const CONTOURS = PATHS.flatMap((d) => flattenPath(d));
const BOUNDS = CONTOURS.flat().reduce(
  (acc, [px, py]) => ({
    minX: Math.min(acc.minX, px),
    minY: Math.min(acc.minY, py),
    maxX: Math.max(acc.maxX, px),
    maxY: Math.max(acc.maxY, py),
  }),
  { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
);

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

/**
 * Renders the mark to an RGBA buffer.
 * logoWidthRatio is the mark's width relative to the square canvas.
 */
function renderIcon(
  size,
  { background = null, color = PRIMARY, logoWidthRatio = 0.68, radius = 0 },
) {
  const samples = 4;
  const big = size * samples;
  const logoWidth = size * logoWidthRatio;
  const scale = logoWidth / (BOUNDS.maxX - BOUNDS.minX);
  const logoHeight = (BOUNDS.maxY - BOUNDS.minY) * scale;
  const offsetX = (size - logoWidth) / 2;
  const offsetY = (size - logoHeight) / 2;

  const toCanvas = ([px, py]) => [
    (offsetX + (px - BOUNDS.minX) * scale) * samples,
    (offsetY + (py - BOUNDS.minY) * scale) * samples,
  ];
  const edges = CONTOURS.map((contour) => contour.map(toCanvas));

  const coverage = new Float32Array(size * size);
  const row = new Uint8Array(big);
  const rowCoverage = new Float32Array(size);

  for (let sy = 0; sy < big; sy++) {
    row.fill(0);
    const sampleY = sy + 0.5;
    const crossings = [];

    for (const contour of edges) {
      for (let e = 0; e < contour.length; e++) {
        const [x1, y1] = contour[e];
        const [x2, y2] = contour[(e + 1) % contour.length];
        if (y1 === y2) continue;
        if (sampleY >= Math.min(y1, y2) && sampleY < Math.max(y1, y2)) {
          crossings.push(x1 + ((sampleY - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
    }

    if (crossings.length > 1) {
      crossings.sort((a, b) => a - b);
      for (let c = 0; c + 1 < crossings.length; c += 2) {
        const from = Math.max(0, Math.round(crossings[c]));
        const to = Math.min(big, Math.round(crossings[c + 1]));
        if (to > from) row.fill(1, from, to);
      }
    }

    rowCoverage.fill(0);
    for (let sx = 0; sx < big; sx++) {
      if (row[sx]) rowCoverage[(sx / samples) | 0] += 1;
    }

    const py = (sy / samples) | 0;
    for (let px = 0; px < size; px++) {
      coverage[py * size + px] += rowCoverage[px] / (samples * samples);
    }
  }

  const pixels = Buffer.alloc(size * size * 4);
  const bg = background ? hexToRgb(background) : null;
  const fg = hexToRgb(color);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const index = py * size + px;
      const markAlpha = Math.min(1, coverage[index]);

      // Optional rounded plate behind the mark, antialiased over one pixel.
      let plateAlpha = bg ? 1 : 0;
      if (bg && radius > 0) {
        const dx = Math.max(radius - (px + 0.5), px + 0.5 - (size - radius), 0);
        const dy = Math.max(radius - (py + 0.5), py + 0.5 - (size - radius), 0);
        const distance = Math.hypot(dx, dy);
        plateAlpha = Math.max(0, Math.min(1, radius - distance + 0.5));
      }

      const outAlpha = markAlpha + plateAlpha * (1 - markAlpha);
      const out = index * 4;

      if (outAlpha === 0) {
        pixels[out + 3] = 0;
        continue;
      }

      const mix = (plate, ink) =>
        (ink * markAlpha + plate * plateAlpha * (1 - markAlpha)) / outAlpha;
      pixels[out] = Math.round(bg ? mix(bg[0], fg[0]) : fg[0]);
      pixels[out + 1] = Math.round(bg ? mix(bg[1], fg[1]) : fg[1]);
      pixels[out + 2] = Math.round(bg ? mix(bg[2], fg[2]) : fg[2]);
      pixels[out + 3] = Math.round(outAlpha * 255);
    }
  }

  return encodePng(pixels, size, size);
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(pixels, width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function encodeIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32BE(0, 8);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="40" viewBox="0 0 46 40" fill="none" id="Logo">
  <g id="logomark" fill="${PRIMARY}">
${PATHS.map((d) => `    <path d="${d}"/>`).join("\n")}
  </g>
</svg>
`;

mkdirSync(resolve(publicDir, "icons"), { recursive: true });

writeFileSync(resolve(publicDir, "logo.svg"), logoSvg);
writeFileSync(resolve(publicDir, "favicon.svg"), logoSvg);
writeFileSync(
  resolve(publicDir, "favicon.ico"),
  encodeIco(renderIcon(32, { logoWidthRatio: 0.9 }), 32),
);
writeFileSync(
  resolve(publicDir, "icons/icon-192.png"),
  renderIcon(192, { background: BACKGROUND, radius: 36 }),
);
writeFileSync(
  resolve(publicDir, "icons/icon-512.png"),
  renderIcon(512, { background: BACKGROUND, radius: 96 }),
);
writeFileSync(
  resolve(publicDir, "icons/icon-maskable-512.png"),
  renderIcon(512, { background: PRIMARY, color: BACKGROUND, logoWidthRatio: 0.54 }),
);
writeFileSync(
  resolve(publicDir, "icons/apple-touch-icon.png"),
  renderIcon(180, { background: BACKGROUND, logoWidthRatio: 0.66 }),
);

console.log("Icons written to public/ and public/icons/");
