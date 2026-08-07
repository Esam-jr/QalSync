import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const isReviewPage = request.nextUrl.pathname.startsWith("/review");
  const isProtectedApi =
    request.nextUrl.pathname.startsWith("/api/translations") ||
    request.nextUrl.pathname.startsWith("/api/projects");

  if (!isReviewPage && !isProtectedApi) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps the auth cookie alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated browser requests for /review to the root page.
  // API routes handle their own 401 responses — no redirect needed there.
  if (!user && isReviewPage) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirected", "1");
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/review/:path*", "/api/translations/:path*", "/api/projects/:path*"],
};



