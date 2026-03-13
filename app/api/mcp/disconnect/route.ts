// DELETE /api/mcp/disconnect — uninstall an MCP for the authenticated user
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { installed_id } = await req.json()
  if (!installed_id) return NextResponse.json({ error: 'Missing installed_id' }, { status: 400 })

  const { error } = await supabase
    .from('installed_mcps')
    .delete()
    .eq('id', installed_id)
    .eq('user_id', user.id) // ensures user can only delete their own

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
