import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  // Just redirect to home - the client-side supabase will handle the session
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
