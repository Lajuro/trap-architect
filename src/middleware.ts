import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_ROUTES = ["/editor", "/settings", "/profile", "/shop", "/admin"];

function getLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length > 0 &&
    (routing.locales as readonly string[]).includes(segments[0])
  ) {
    return segments[0];
  }
  return null;
}

function getPathWithoutLocale(pathname: string): string {
  const locale = getLocaleFromPath(pathname);
  if (locale) {
    const segments = pathname.split("/").filter(Boolean);
    return "/" + segments.slice(1).join("/");
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware (locale detection, rewrites, redirects)
  const response = intlMiddleware(request);

  // 2. Refresh Supabase session on the same response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Redirect unauthenticated users away from protected routes
  const pathWithoutLocale = getPathWithoutLocale(request.nextUrl.pathname);
  const isProtected = PROTECTED_ROUTES.some(
    (route) =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(route + "/")
  );

  if (isProtected && !user) {
    const locale = getLocaleFromPath(request.nextUrl.pathname);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = locale ? `/${locale}/login` : "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
