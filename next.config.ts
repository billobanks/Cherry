import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The app was reorganized so the main authenticated experience lives
      // under /app/*, settings under /settings/*, and admin tooling under
      // /admin/*. These keep old bookmarks/links working.
      { source: "/dashboard", destination: "/app/today", permanent: true },
      { source: "/calendar", destination: "/app/calendar", permanent: true },
      { source: "/checkin", destination: "/app/check-in", permanent: true },
      { source: "/insights", destination: "/app/insights", permanent: true },
      { source: "/insights/today", destination: "/app/insights", permanent: true },
      { source: "/patterns", destination: "/app/patterns", permanent: true },
      { source: "/nutrition", destination: "/app/nutrition", permanent: true },
      { source: "/movement", destination: "/app/movement", permanent: true },
      { source: "/assistant", destination: "/app/assistant", permanent: true },
      { source: "/pregnancy", destination: "/app/pregnancy", permanent: true },
      { source: "/pregnancy/:path*", destination: "/app/pregnancy/:path*", permanent: true },
      { source: "/billing", destination: "/settings/subscription", permanent: true },
      { source: "/privacy", destination: "/settings/data", permanent: true },
      { source: "/admin/pregnancy-content", destination: "/admin/content", permanent: true },
      { source: "/admin/safety-rules", destination: "/admin/safety-content", permanent: true },
    ];
  },
};

export default nextConfig;
