/**
 * Build optimized homepage hero slides from full-resolution sources.
 *
 * Sources (in order of preference):
 *   1. public/images/src/hero/_DSC*.jpg
 *   2. public/images/hero/_DSC*.jpg
 *
 *   npm run hero:optimize
 */
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const OUT_DIR = path.join(IMAGES_DIR, 'hero');
const SRC_DIR = path.join(IMAGES_DIR, 'src', 'hero');

const MAX_WIDTH = 2560;
const JPEG_QUALITY = 92;

/** Full-res sources for the homepage hero carousel (order = slide order). */
const HERO_SOURCES = [
  '_DSC8537.jpg',
  '_DSC9003.jpg',
  '_DSC8855.jpg',
  '_DSC8306.jpg',
] as const;

function resolveInput(name: string): string | null {
  const fromSrc = path.join(SRC_DIR, name);
  if (existsSync(fromSrc)) return fromSrc;

  const fromHero = path.join(OUT_DIR, name);
  if (existsSync(fromHero)) return fromHero;

  return null;
}

async function optimizeSlide(input: string, output: string, label: string): Promise<void> {
  const metaIn = await sharp(input).metadata();

  await sharp(input)
    .rotate()
    .resize(MAX_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true })
    .toFile(output);

  const metaOut = await sharp(output).metadata();
  const { size } = await import('node:fs/promises').then((fs) => fs.stat(output));

  console.log(
    `${label}: ${metaIn.width}×${metaIn.height} → ${metaOut.width}×${metaOut.height}, ${(size / 1024).toFixed(0)} KB`,
  );
}

async function main(): Promise<void> {
  await mkdir(SRC_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  let processed = 0;

  for (let i = 0; i < HERO_SOURCES.length; i++) {
    const name = HERO_SOURCES[i]!;
    const input = resolveInput(name);
    if (!input) {
      console.warn(`Skip slide ${i + 1}: ${name} not found`);
      continue;
    }

    const output = path.join(OUT_DIR, `slide-${String(i + 1).padStart(2, '0')}.jpg`);
    console.log(`Slide ${i + 1} ← ${path.relative(ROOT, input)}`);
    await optimizeSlide(input, output, `Slide ${i + 1}`);
    processed += 1;
  }

  if (processed === 0) {
    throw new Error(`No hero sources found. Add JPGs to ${SRC_DIR} or ${OUT_DIR}`);
  }

  console.log(`\nDone — ${processed} slide(s) in public/images/hero/`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
