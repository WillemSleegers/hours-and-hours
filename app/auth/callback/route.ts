import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin, search } = new URL(request.url)

  // Redirect to home, keeping the query string (e.g. a PKCE `?code=`) so the
  // client-side supabase can pick it up and handle the session
  return NextResponse.redirect(new URL(`/${search}`, origin))
}
