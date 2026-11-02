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

    // Prevent directory traversal
    const safeRel = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.resolve(process.cwd(), '../data/synthetic', safeRel);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return NextResponse.json({ error: `File not found: ${safeRel}` }, { status: 404 });
    }

    const buffer = fs.readFileSync(fullPath);
    let contentType = 'application/octet-stream';
    if (safeRel.endsWith('.json')) contentType = 'application/json';
    else if (safeRel.endsWith('.csv')) contentType = 'text/csv';
    else if (safeRel.endsWith('.md')) contentType = 'text/markdown';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${path.basename(safeRel)}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
