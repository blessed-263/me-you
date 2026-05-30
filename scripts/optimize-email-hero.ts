/**
 * Optimize guest email hero images for fast inbox loading.
 * Usage:
 *   npm run email:optimize-hero              → both heroes (if sources exist)
 *   npm run email:optimize-hero -- harvest   → harvest only
 *   npm run email:optimize-hero -- after     → after-party only
 *   npx tsx scripts/optimize-email-hero.ts path/to/custom.jpg after
 */
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images');
const MAX_WIDTH = 1200;

const DEFAULT_HARVEST_SRC =
  'C:\\Users\\bless\\.cursor\\projects\\c-Users-bless-OneDrive-Desktop-me-you\\assets\\c__Users_bless_AppData_Roaming_Cursor_User_workspaceStorage_c8280145c88cf027f28084747d5d91d7_images__DSC6456-fb325fb0-6fae-415b-bd70-2e0651d52273.png';

const HERO_JOBS = {
  harvest: {
    label: 'Harvest Table hero',
    output: 'email-hero-harvest.jpg',
    defaultSrc: DEFAULT_HARVEST_SRC,
    fallbacks: ['public/images/email-hero-harvest.jpg'],
  },
  after: {
    label: 'After Lunch Party hero',
    output: 'email-hero-after-party.jpg',
    defaultSrc: path.join(ROOT, 'public/images/src/event-dj.png'),
    fallbacks: [
      path.join(ROOT, 'public/images/src/event-dj.png'),
      path.join(ROOT, 'public/images/src/after-party.png'),
    ],
  },
} as const;

type HeroKey = keyof typeof HERO_JOBS;

async function optimizeHero(
  input: string,
  output: string,
  label: string,
): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  await sharp(input)
    .rotate()
    .resize(MAX_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(output);

  const meta = await sharp(output).metadata();
  const { size } = await import('node:fs/promises').then((fs) => fs.stat(output));

  console.log(
    `${label}: ${meta.width}×${meta.height}px, ${(size / 1024).toFixed(1)} KB → ${path.relative(ROOT, output)}`,
  );
}

function resolveSource(job: (typeof HERO_JOBS)[HeroKey], customSrc?: string): string {
  if (customSrc && existsSync(customSrc)) {
    return customSrc;
  }
  if (existsSync(job.defaultSrc)) {
    return job.defaultSrc;
  }
  for (const candidate of job.fallbacks) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`No source image found for ${job.label}`);
}

const mode = (process.argv[2]?.trim().toLowerCase() || 'all') as
  | HeroKey
  | 'all'
  | 'harvest'
  | 'after-party'
  | 'after';
const customPath = process.argv[3]?.trim();

const runHarvest = mode === 'all' || mode === 'harvest';
const runAfter =
  mode === 'all' || mode === 'after' || mode === 'after-party';

try {
  if (runHarvest) {
    const job = HERO_JOBS.harvest;
    const src = resolveSource(job, mode === 'harvest' ? customPath : undefined);
    await optimizeHero(src, path.join(OUT_DIR, job.output), job.label);
  }

  if (runAfter) {
    const job = HERO_JOBS.after;
    const src = resolveSource(
      job,
      mode === 'after' || mode === 'after-party' ? customPath : undefined,
    );
    await optimizeHero(src, path.join(OUT_DIR, job.output), job.label);
  }
} catch (err) {
  console.error('Optimization failed:', err);
  process.exit(1);
}
