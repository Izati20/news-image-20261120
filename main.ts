// news-image-20261120 — "Sum up 20 November's world news in one image"
//
// Bundled beside this file is entry.png (1024x1024): the front page for
// Friday 20 November 2026. A Houthi missile hitting Riyadh's tallest
// tower and a burning tanker off Hormuz lead the page, followed by the
// S&P 500's fifth straight loss on the day of Anthropic's record debut,
// the Shenzhen declaration in which Trump, Xi and Putin said a nuclear
// war must never be fought, ballistic missiles on Kyiv, the COP31
// outcry in Antalya over fossil fuels vanishing from the draft deal,
// California's probe into Nvidia, GTA VI's $2.3bn first day, and
// Israel's ground operation in central Gaza.
//
// The harness runs this program twice, offline, and expects both runs
// to agree. So the program keeps to one deterministic job: check the
// bundled picture is a genuine PNG within the gate's size limits, then
// copy it unchanged into the output directory under the name entry.png.
//
//   node main.ts                            (writes /output/entry.png)
//   MAKEFUN_OUTPUT_DIR=out node main.ts     (writes out/entry.png)

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BYTE_LIMIT = 1_048_576; // 1 MiB, the gate's ceiling for the image
const SIDE_LIMIT = 1024; // no side of the picture may exceed this
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function pngDimensions(bytes) {
  const magicOk = PNG_MAGIC.every((value, index) => bytes[index] === value);
  if (!magicOk) {
    throw new Error('entry.png does not start with the PNG signature');
  }
  // The first chunk is always IHDR; its width and height fields are
  // big-endian 32-bit integers living at offsets 16 and 20.
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width > SIDE_LIMIT || height > SIDE_LIMIT) {
    throw new Error(
      `entry.png measures ${width}x${height}, beyond the ${SIDE_LIMIT}px side limit`,
    );
  }
  return { width, height };
}

function fingerprint(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const bundledPath = new URL('./entry.png', import.meta.url);
const bundledBytes = readFileSync(bundledPath);
if (bundledBytes.length === 0 || bundledBytes.length > BYTE_LIMIT) {
  throw new Error(`entry.png has an unacceptable size: ${bundledBytes.length} bytes`);
}
pngDimensions(bundledBytes);

const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(targetDir, { recursive: true });

const targetPath = join(targetDir, 'entry.png');
copyFileSync(bundledPath, targetPath);

// A byte count alone cannot prove the copy survived intact — two
// different files can share a length. Compare SHA-256 digests of the
// source and the delivered file instead, and re-check the PNG header
// on what was actually written.
const deliveredBytes = readFileSync(targetPath);
if (fingerprint(deliveredBytes) !== fingerprint(bundledBytes)) {
  throw new Error('delivered entry.png does not match the bundled original');
}
pngDimensions(deliveredBytes);
