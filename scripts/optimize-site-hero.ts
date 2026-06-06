/**
 * Build responsive hero slides (WebP + JPEG at multiple widths).
 *
 * Sources (in order of preference):
 *   1. public/images/src/hero/_DSC*.jpg — full camera exports
 *   2. public/images/hero/slide-NN-2560.jpg — existing masters
 *
 *   npm run hero:optimize
 */
import { existsSync } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const OUT_DIR = path.join(IMAGES_DIR, 'hero');
const SRC_DIR = path.join(IMAGES_DIR, 'src', 'hero');

const WIDTHS = [640, 1280, 1920, 2560] as const;
const JPEG_QUALITY = 93;
const WEBP_QUALITY = 90;

const HERO_SOURCE_NAMES = [
  '_DSC8841.jpg',
  '_DSC8291.jpg',
  '_DSC9040.jpg',
  '_DSC9016.jpg',
  '_DSC9266.jpg',
] as const;

const SLIDE_COUNT = HERO_SOURCE_NAMES.length;

function slideId(n: number): string {
  return String(n).padStart(2, '0');
}

function resolveInput(index: number): string | null {
  const fromSrc = path.join(SRC_DIR, HERO_SOURCE_NAMES[index]!);
  if (existsSync(fromSrc)) return fromSrc;

  const legacy = path.join(OUT_DIR, `slide-${slideId(index + 1)}-2560.jpg`);
  if (existsSync(legacy)) return legacy;

  const oldLegacy = path.join(OUT_DIR, `slide-${slideId(index + 1)}.jpg`);
  if (existsSync(oldLegacy)) return oldLegacy;

  return null;
}

async function writeViaTemp(
  write: (dest: string) => Promise<unknown>,
  dest: string,
): Promise<void> {
  const temp = `${dest}.tmp`;
  await write(temp);
  if (existsSync(dest)) await unlink(dest);
  await rename(temp, dest);
}

async function writeVariant(
  input: string,
  id: string,
  width: number,
): Promise<{ jpegKb: number; webpKb: number }> {
  const meta = await sharp(input).metadata();
  const targetWidth = meta.width && meta.width < width ? meta.width : width;

  const pipeline = sharp(input)
    .rotate()
    .resize(targetWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 0.5, m1: 0.5, m2: 0.35 });

  const jpegOut = path.join(OUT_DIR, `slide-${id}-${width}.jpg`);
  const webpOut = path.join(OUT_DIR, `slide-${id}-${width}.webp`);
  const inputResolved = path.resolve(input);

  const writeJpeg = (dest: string) =>
    pipeline
      .clone()
      .jpeg({
        quality: JPEG_QUALITY,
        progressive: true,
        mozjpeg: true,
        chromaSubsampling: '4:4:4',
      })
      .toFile(dest);

  const writeWebp = (dest: string) =>
    pipeline
      .clone()
      .webp({ quality: WEBP_QUALITY, effort: 6, smartSubsample: false })
      .toFile(dest);

  if (inputResolved === path.resolve(jpegOut)) {
    await writeViaTemp((d) => writeJpeg(d), jpegOut);
  } else {
    await writeJpeg(jpegOut);
  }

  if (inputResolved === path.resolve(webpOut)) {
    await writeViaTemp((d) => writeWebp(d), webpOut);
  } else {
    await writeWebp(webpOut);
  }

  const fs = await import('node:fs/promises');
  const [jpeg, webp] = await Promise.all([fs.stat(jpegOut), fs.stat(webpOut)]);
  return { jpegKb: jpeg.size / 1024, webpKb: webp.size / 1024 };
}

async function main(): Promise<void> {
  await mkdir(SRC_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  let processed = 0;

  for (let i = 0; i < SLIDE_COUNT; i++) {
    const input = resolveInput(i);
    if (!input) {
      console.warn(`Skip slide ${i + 1}: no source`);
      continue;
    }

    const id = slideId(i + 1);
    console.log(`Slide ${id} ← ${path.relative(ROOT, input)}`);

    for (const width of WIDTHS) {
      const { jpegKb, webpKb } = await writeVariant(input, id, width);
      console.log(`  ${width}px — jpeg ${jpegKb.toFixed(0)} KB, webp ${webpKb.toFixed(0)} KB`);
    }

    processed += 1;
  }

  if (processed === 0) {
    throw new Error(`No hero sources found. Add JPGs to ${SRC_DIR} or keep slide-NN-2560.jpg in ${OUT_DIR}`);
  }

  console.log(`\nDone — ${processed} slide(s), ${WIDTHS.length} widths × 2 formats in public/images/hero/`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
