import React, { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { tenantApi } from "@/services/api";

type TenantBranding = {
  tenant: string;
  appName: string;
  sidebarTitle: string;
  sidebarSubtitle: string;
  logoUrl: string | null;
  primaryColor: string;
};

const AuthLayout: React.FC = () => {
  const [branding, setBranding] = useState<TenantBranding>({
  tenant: localStorage.getItem("tenant") || "tokoa",
  appName: "Marketplace Integration",
  sidebarTitle: "Marketplace",
  sidebarSubtitle: "Integration",
  logoUrl: null,
  primaryColor: "#2563eb",
});

const brandStyle = useMemo(
  () =>
    ({
      "--tenant-primary": branding.primaryColor || "#2563eb",
    }) as React.CSSProperties,
  [branding.primaryColor]
);

useEffect(() => {
  let mounted = true;

  tenantApi
    .getBranding()
    .then((res) => {
      if (!mounted) return;

      const payload = res.data?.branding;
      const tenant = res.data?.tenant;

      if (payload) {
        setBranding({
          tenant: tenant || localStorage.getItem("tenant") || "tokoa",
          appName: payload.appName || "Marketplace Integration",
          sidebarTitle: payload.sidebarTitle || "Marketplace",
          sidebarSubtitle: payload.sidebarSubtitle || "Integration",
          logoUrl: payload.logoUrl || null,
          primaryColor: payload.primaryColor || "#2563eb",
        });

        document.title = payload.appName || "Marketplace Integration";
      }
    })
    .catch(() => {
      // fallback branding tetap dipakai
    });

  return () => {
    mounted = false;
  };
}, []);
  return (
    <div
  className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200"
  style={brandStyle}
>
      <div className="flex min-h-screen">
        {/* LEFT SIDE */}
        <div className="relative hidden overflow-hidden bg-[color:var(--tenant-primary)]lg:flex lg:w-1/2">
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--tenant-primary)] to-slate-900" />

          <div className="relative z-10 flex flex-col justify-center px-14 text-white">
            <div className="mb-10">
              <h1 className="mb-5 text-5xl font-bold leading-tight">
                {branding.appName}
              </h1>

              <p className="max-w-xl text-xl leading-relaxed text-blue-100">
                 Kelola operasional {branding.sidebarTitle} dalam satu dashboard yang powerful.
                 Sinkronisasi produk, pesanan, dan inventori secara otomatis.
              </p>
            </div>

            <div className="space-y-8">
              {/* FEATURE 1 */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/40 backdrop-blur">
                  <svg
                    className="h-7 w-7"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Multi Marketplace
                  </h3>

                  <p className="mt-1 text-blue-100">
                    Shopee, Tokopedia, Lazada, dan marketplace lainnya.
                  </p>
                </div>
              </div>

              {/* FEATURE 2 */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/40 backdrop-blur">
                  <svg
                    className="h-7 w-7"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Sinkronisasi Otomatis
                  </h3>

                  <p className="mt-1 text-blue-100">
                    Real-time sync produk, stok, dan pesanan.
                  </p>
                </div>
              </div>

              {/* FEATURE 3 */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/40 backdrop-blur">
                  <svg
                    className="h-7 w-7"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Analytics & Reporting
                  </h3>

                  <p className="mt-1 text-blue-100">
                    Pantau performa toko dan penjualan secara realtime.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DECORATIONS */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-blue-300/20" />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-8">
          <div className="w-full max-w-md">
            {/* MOBILE HEADER */}
            <div className="mb-8 text-center lg:hidden">
              <h1 className="mb-2 text-3xl font-bold text-slate-900">
                {branding.appName}
              </h1>

              <p className="text-slate-600">
                Kelola operasional {branding.sidebarTitle} dalam satu dashboard.
              </p>
            </div>

            {/* FORM CARD */}
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              <Outlet />
            </div>

            {/* FOOTER */}
            <div className="mt-8 text-center text-sm text-slate-500">
              © 2026 {branding.appName}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;