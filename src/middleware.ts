import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from './app/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  try {
    // Create a Supabase client configured to use cookies
    const { supabase, response } = await createClient(request);
    
    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    await supabase.auth.getUser();
    
    return response;
  } catch (e) {
    // If there's an error, return the original request
    console.error('Middleware error:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 