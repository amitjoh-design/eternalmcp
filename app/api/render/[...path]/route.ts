// Proxy route — serves Supabase-stored HTML dashboards with correct Content-Type
// GET /api/render/dashboards/{user_id}/{filename}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const storagePath = path.join('/')

  // Only allow dashboards/ paths
  if (!storagePath.startsWith('dashboards/')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const db = getServiceClient()

  // Check expiry in storage_files
  const { data: fileRecord } = await db
    .from('storage_files')
    .select('expires_at')
    .eq('storage_path', storagePath)
    .single()

  if (fileRecord?.expires_at && new Date(fileRecord.expires_at) < new Date()) {
    return new NextResponse('Dashboard link expired. Generate a new one.', {
      status: 410,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const { data, error } = await db.storage
    .from('research-pdfs')
    .download(storagePath)

  if (error || !data) {
    return new NextResponse('Dashboard not found', { status: 404 })
  }

  const html = await data.text()

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, max-age=86400',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
