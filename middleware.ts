export { default } from "next-auth/middleware";

// Protect these routes - require authentication
export const config = {
    matcher: [
        "/dashboard/merchant/:path*",
        "/dashboard/admin/:path*",
    ]
};
