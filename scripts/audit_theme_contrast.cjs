const fs = require('fs');

function parseHex(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relLum([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(hex1, hex2) {
  const l1 = relLum(parseHex(hex1));
  const l2 = relLum(parseHex(hex2));
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

// Tokens from tokens.css
const paper = {
  bg: '#FFF5F5',
  panel: '#FFFFFF',
  hov: '#FFF0F0',
  ink: '#1C0D0E',
  mut: '#6E5255',
  acc: '#B3152F',
  onacc: '#FFFFFF',
  bd: '#E8D5D3',
  bds: '#A88C89', // updated from #B99A96
  low: '#1F6F45',
  mod: '#8A5A00',
  high: '#B3152F',
};

const monitor = {
  bg: '#08100C',
  panel: '#0C1A13',
  hov: '#11241B',
  ink: '#D8F5E4',
  mut: '#689E80',
  acc: '#3FD08A',
  onacc: '#06130B',
  bd: '#1B3527',
  bds: '#406E59', // updated from #3A6350
  low: '#3FD08A',
  mod: '#FFC24D',
  high: '#FF5C72',
};

const sheet = {
  bg: '#FFFFFF',
  ink: '#241618',
  mut: '#5E4B4E',
  bd: '#D9C3C0',
  low: '#1F6F45',
  mod: '#8A5A00',
  high: '#B3152F',
  acc: '#1D3F8A',
};

console.log('=== PAPER AUDIT ===');
const paperSurfaces = [
  ['--panel', paper.panel],
  ['--hov', paper.hov],
];
for (const [sName, sVal] of paperSurfaces) {
  console.log(`\nSurface ${sName} (${sVal}):`);
  console.log(`  --ink (${paper.ink}): ${contrast(paper.ink, sVal).toFixed(2)}:1 (min 4.5)`);
  console.log(`  --mut (${paper.mut}): ${contrast(paper.mut, sVal).toFixed(2)}:1 (min 4.5)`);
  console.log(`  --acc (${paper.acc}): ${contrast(paper.acc, sVal).toFixed(2)}:1 (min 4.5)`);
  console.log(`  --bds (${paper.bds}): ${contrast(paper.bds, sVal).toFixed(2)}:1 (min 3.0)`);
  console.log(`  --low (${paper.low}): ${contrast(paper.low, sVal).toFixed(2)}:1 (min 3.0)`);
  console.log(`  --mod (${paper.mod}): ${contrast(paper.mod, sVal).toFixed(2)}:1 (min 3.0)`);
  console.log(`  --high (${paper.high}): ${contrast(paper.high, sVal).toFixed(2)}:1 (min 3.0)`);
}
console.log(`\nSpecial Paper pairs:`);
console.log(`  --onacc on --acc: ${contrast(paper.onacc, paper.acc).toFixed(2)}:1 (min 4.5)`);

console.log('\n=== MONITOR AUDIT ===');
const monitorSurfaces = [
  ['--panel', monitor.panel],
  ['--hov', monitor.hov],
];
for (const [sName, sVal] of monitorSurfaces) {
  console.log(`\nSurface ${sName} (${sVal}):`);
  console.log(`  --ink (${monitor.ink}): ${contrast(monitor.ink, sVal).toFixed(2)}:1 (min 4.5)`);
  console.log(`  --mut (${monitor.mut}): ${contrast(monitor.mut, sVal).toFixed(2)}:1 (min 4.5)`);
  console.log(`  --acc (${monitor.acc}): ${contrast(monitor.acc, sVal).toFixed(2)}:1 (min 4.5)`);
  console.log(`  --bds (${monitor.bds}): ${contrast(monitor.bds, sVal).toFixed(2)}:1 (min 3.0)`);
  console.log(`  --low (${monitor.low}): ${contrast(monitor.low, sVal).toFixed(2)}:1 (min 3.0)`);
  console.log(`  --mod (${monitor.mod}): ${contrast(monitor.mod, sVal).toFixed(2)}:1 (min 3.0)`);
  console.log(`  --high (${monitor.high}): ${contrast(monitor.high, sVal).toFixed(2)}:1 (min 3.0)`);
}
console.log(`\nSpecial Monitor pairs:`);
console.log(`  --onacc on --acc: ${contrast(monitor.onacc, monitor.acc).toFixed(2)}:1 (min 4.5)`);

console.log('\n=== SHEET AUDIT (on --s-bg #FFFFFF) ===');
console.log(`  --s-ink (${sheet.ink}): ${contrast(sheet.ink, sheet.bg).toFixed(2)}:1 (min 4.5)`);
console.log(`  --s-mut (${sheet.mut}): ${contrast(sheet.mut, sheet.bg).toFixed(2)}:1 (min 4.5)`);
console.log(`  --s-low (${sheet.low}): ${contrast(sheet.low, sheet.bg).toFixed(2)}:1 (min 3.0)`);
console.log(`  --s-mod (${sheet.mod}): ${contrast(sheet.mod, sheet.bg).toFixed(2)}:1 (min 3.0)`);
console.log(`  --s-high (${sheet.high}): ${contrast(sheet.high, sheet.bg).toFixed(2)}:1 (min 3.0)`);
console.log(`  --s-acc (${sheet.acc}): ${contrast(sheet.acc, sheet.bg).toFixed(2)}:1 (min 4.5)`);
