import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdmin = pathname.startsWith("/admin");
  const isClient = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  const isProtected = isAdmin || isClient;

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "client";

    // Redirect away from login
    if (pathname === "/login") {
      const dest = role === "client" ? "/dashboard" : "/admin";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // Client users must not access admin — redirect to their dashboard
    if (isAdmin && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Admin users who somehow land on client routes go to admin
    if (isClient && role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/onboarding/:path*", "/login"],
};
