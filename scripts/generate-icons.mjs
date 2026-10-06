import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Build ICO file containing PNG streams
function createIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // count

  const entries = [];
  for (let i = 0; i < count; i++) {
    const entry = Buffer.alloc(dirEntrySize);
    const { width, height } = sizes[i];
    entry.writeUInt8(width === 256 ? 0 : width, 0);
    entry.writeUInt8(height === 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(pngBuffers[i].length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += pngBuffers[i].length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

async function generate() {
  const targetDirs = [
    path.resolve('apps/web/public'),
    path.resolve('public'),
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 1. Generate ICO sizes
  const svg16 = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16">
      <rect width="32" height="32" rx="6" fill="#1D3F8A"/>
      <polyline points="3,17 10,17 12.5,17 15,7 18,26 20.5,17 29,17" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const buf16 = await sharp(Buffer.from(svg16)).png().toBuffer();

  const svg32 = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <rect width="32" height="32" rx="6" fill="#1D3F8A"/>
      <polyline points="3,17 10,17 12.5,17 15,7 18,26 20.5,17 29,17" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const buf32 = await sharp(Buffer.from(svg32)).png().toBuffer();

  const svg48 = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="48" height="48">
      <rect width="32" height="32" rx="6" fill="#1D3F8A"/>
      <polyline points="3,17 10,17 12.5,17 15,7 18,26 20.5,17 29,17" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const buf48 = await sharp(Buffer.from(svg48)).png().toBuffer();

  const icoBuf = createIco([buf16, buf32, buf48], [
    { width: 16, height: 16 },
    { width: 32, height: 32 },
    { width: 48, height: 48 },
  ]);

  // 2. apple-touch-icon.png (180x180, opaque, full-bleed #1D3F8A, trace centred, white stroke)
  const svgApple = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="180" height="180">
      <rect width="32" height="32" fill="#1D3F8A"/>
      <polyline points="3,17 10,17 12.5,17 15,7 18,26 20.5,17 29,17" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const appleBuf = await sharp(Buffer.from(svgApple)).png().toBuffer();

  // 3. icon-192.png (192x192, opaque, full-bleed square)
  const svg192 = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="192" height="192">
      <rect width="32" height="32" fill="#1D3F8A"/>
      <polyline points="3,17 10,17 12.5,17 15,7 18,26 20.5,17 29,17" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const buf192 = await sharp(Buffer.from(svg192)).png().toBuffer();

  // 4. icon-512.png (512x512, opaque, full-bleed square)
  const svg512 = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="512" height="512">
      <rect width="32" height="32" fill="#1D3F8A"/>
      <polyline points="3,17 10,17 12.5,17 15,7 18,26 20.5,17 29,17" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const buf512 = await sharp(Buffer.from(svg512)).png().toBuffer();

  // 5. icon-512-maskable.png (full-bleed #1D3F8A square, trace scaled to 60% of width and centred)
  const scale = (512 * 0.6) / 26; // 26 units wide
  const svgMaskable = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <rect width="512" height="512" fill="#1D3F8A"/>
      <g transform="translate(256, 256) scale(${scale}) translate(-16, -16.5)">
        <polyline points="3,17 10,17 12.5,17 15,7 18,26 20.5,17 29,17" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  `;
  const bufMaskable = await sharp(Buffer.from(svgMaskable)).png().toBuffer();

  for (const dir of targetDirs) {
    fs.writeFileSync(path.join(dir, 'favicon.ico'), icoBuf);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), appleBuf);
    fs.writeFileSync(path.join(dir, 'icon-192.png'), buf192);
    fs.writeFileSync(path.join(dir, 'icon-512.png'), buf512);
    fs.writeFileSync(path.join(dir, 'icon-512-maskable.png'), bufMaskable);
    console.log(`Generated icons in ${dir}`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
