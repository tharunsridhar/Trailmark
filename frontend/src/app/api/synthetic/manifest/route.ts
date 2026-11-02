import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'public/synthetic/manifest.json'),
      path.resolve(process.cwd(), '../data/synthetic/manifest.json'),
    ];
    const manifestPath = candidates.find((p) => fs.existsSync(p));
    if (!manifestPath) {
      return NextResponse.json({ error: 'Manifest not found' }, { status: 404 });
    }
    const content = fs.readFileSync(manifestPath, 'utf8');
    return NextResponse.json(JSON.parse(content));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
