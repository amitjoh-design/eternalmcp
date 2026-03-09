import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert user profile
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          null,
        avatar_url:
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture ||
          null,
        github_username: data.user.user_metadata?.user_name || null,
        role: 'user',
      }, { onConflict: 'id', ignoreDuplicates: false })
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
