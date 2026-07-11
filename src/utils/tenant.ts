export function detectTenantFromHost(hostname = window.location.hostname) {
  const host = hostname.toLowerCase();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.")
  ) {
    return localStorage.getItem("tenant") || "tokoa";
  }

  const parts = host.split(".");
  const subdomain = parts[0];

  if (!subdomain || subdomain === "www" || subdomain === "api") {
    return localStorage.getItem("tenant") || "tokoa";
  }

  return subdomain;
}

export function syncTenantFromHost() {
  const tenant = detectTenantFromHost();

  if (tenant) {
    localStorage.setItem("tenant", tenant);
  }

  return tenant;
}