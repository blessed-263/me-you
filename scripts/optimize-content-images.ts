/**
 * Build responsive WebP + JPEG variants for homepage content PNGs.
 *
 *   npm run content:optimize
 */
import { existsSync } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');

const WIDTHS = [640, 960, 1280, 2048] as const;
const JPEG_QUALITY = 92;
const WEBP_QUALITY = 90;

const CONTENT_IMAGES = [
  'harvest-table',
  'event-dj',
  'event-cake',
  'event-martell-bar',
  'after-party',
  'event-guests-couch',
  'event-guests-duo',
  'martell-bottles',
] as const;

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
  baseName: string,
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

  const jpegOut = path.join(IMAGES_DIR, `${baseName}-${width}.jpg`);
  const webpOut = path.join(IMAGES_DIR, `${baseName}-${width}.webp`);
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
  let processed = 0;

  for (const name of CONTENT_IMAGES) {
    const input = path.join(IMAGES_DIR, `${name}.png`);
    if (!existsSync(input)) {
      console.warn(`Skip ${name}: ${input} not found`);
      continue;
    }

    console.log(`${name} ← ${path.relative(ROOT, input)}`);
    for (const width of WIDTHS) {
      const { jpegKb, webpKb } = await writeVariant(input, name, width);
      console.log(`  ${width}px — jpeg ${jpegKb.toFixed(0)} KB, webp ${webpKb.toFixed(0)} KB`);
    }
    processed += 1;
  }

  if (processed === 0) {
    throw new Error('No content PNG sources found in public/images/');
  }

  console.log(`\nDone — ${processed} image(s), ${WIDTHS.length} widths × 2 formats`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
