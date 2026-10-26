import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Só vale no `next dev`: libera o JS e o HMR quando a página é aberta por um túnel do ngrok.
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.app"],
  async headers() {
    // O link de senha nova traz o token na URL: nada da página o repassa a terceiros (REQ-PWD-013).
    return [
      { source: "/fonts/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] },
      { source: "/reset-password", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/owner/bookings/:bookingId/payment", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

export default nextConfig;
