import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const relPath = searchParams.get('path');
    if (!relPath) {
      return NextResponse.json({ error: 'path query parameter is required' }, { status: 400 });
    }

    // 1. Resolve canonical base directory (support Vercel public/synthetic first, then ../data/synthetic)
    const publicSynthetic = path.resolve(process.cwd(), 'public/synthetic');
    const externalSynthetic = path.resolve(process.cwd(), '../data/synthetic');
    const baseDir = fs.existsSync(publicSynthetic) ? publicSynthetic : externalSynthetic;

    // 2. Resolve requested path against the base directory
    const fullPath = path.resolve(baseDir, relPath);

    // 3. Strict confinement check: ensure target stays inside data/synthetic
    const relative = path.relative(baseDir, fullPath);
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      !fullPath.startsWith(baseDir + path.sep)
    ) {
      return NextResponse.json(
        { error: 'Access denied: Requested path is outside the synthetic data directory' },
        { status: 403 }
      );
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return NextResponse.json({ error: `File not found: ${relPath}` }, { status: 404 });
    }

    const buffer = fs.readFileSync(fullPath);
    let contentType = 'application/octet-stream';
    if (fullPath.endsWith('.json')) contentType = 'application/json';
    else if (fullPath.endsWith('.csv')) contentType = 'text/csv';
    else if (fullPath.endsWith('.md')) contentType = 'text/markdown';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${path.basename(fullPath)}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
