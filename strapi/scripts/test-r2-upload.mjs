#!/usr/bin/env node
/**
 * Test Cloudflare R2 credentials — run: npm run test:r2
 *
 * Verifies PutObject works with the same options Strapi uses (ACL disabled).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function requireEnv(name) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing ${name} in strapi/.env`);
  return value.trim();
}

const accountId = requireEnv('R2_ACCOUNT_ID');
const accessKeyId = requireEnv('R2_ACCESS_KEY_ID');
const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
const bucket = requireEnv('R2_BUCKET_NAME');
const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
const endpoint =
  process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`;

const client = new S3Client({
  endpoint,
  region: process.env.R2_REGION || 'auto',
  forcePathStyle: process.env.R2_FORCE_PATH_STYLE !== 'false',
  credentials: { accessKeyId, secretAccessKey },
});

const key = `uploads/_strapi-r2-test-${Date.now()}.txt`;
const body = Buffer.from('Elewen Strapi R2 upload test\n', 'utf8');

console.log('R2 endpoint:', endpoint);
console.log('R2 bucket:', bucket);
console.log('Test key:', key);

try {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'text/plain',
    })
  );
  console.log('PutObject: OK (no ACL header — same as Strapi R2 config)');

  if (publicUrl) {
    const url = `${publicUrl}/${key}`;
    const res = await fetch(url, { method: 'HEAD' });
    console.log('Public URL HEAD:', res.status, url);
    if (!res.ok) {
      console.warn('Upload succeeded but public URL is not reachable. Check R2 bucket public access / R2_PUBLIC_URL.');
    }
  } else {
    console.warn('R2_PUBLIC_URL not set — skipped public URL check.');
  }

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log('Cleanup: test object deleted');
  console.log('\nR2 upload configuration looks good. Restart Strapi if media upload still fails.');
} catch (error) {
  console.error('\nR2 upload test FAILED:');
  console.error(error?.name || 'Error', error?.message || error);
  if (String(error?.message || '').includes('ACL')) {
    console.error('\nHint: ensure strapi/config/plugins.js sets params.ACL = null for R2.');
  }
  process.exit(1);
}
