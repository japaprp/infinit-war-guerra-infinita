(() => {
    const hostname = window.location.hostname;
    const configuredMeta = document.querySelector('meta[name="iwar-api-base-url"]')?.content?.trim() || "";
    const isLocalDevelopment = hostname === "localhost"
        || hostname === "127.0.0.1"
        || hostname === "[::1]";

    // Hosted builds must provide the HTTPS API origin explicitly. Do not silently
    // point a remote player's browser at its own localhost.
    const requestedApiUrl = window.IWAR_API_BASE_URL
        || configuredMeta
        || (isLocalDevelopment ? "http://localhost:4000" : "");
    const candidate = String(requestedApiUrl).trim().replace(/\/$/, "");
    let normalizedApiUrl = "";

    if (candidate) {
        try {
            const parsed = new URL(candidate);
            const isLocalHttpApi = isLocalDevelopment
                && parsed.protocol === "http:"
                && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
            const isSecureApi = parsed.protocol === "https:";
            // This setting is an origin, not a URL path. Keep the CSP and CORS
            // allowlists precise and reject insecure hosted endpoints.
            if (parsed.origin === candidate && (isSecureApi || isLocalHttpApi)) {
                normalizedApiUrl = parsed.origin;
            }
        } catch {
            // Invalid URLs fail closed; the API client will report missing config.
        }
    }

    window.IWAR_API_BASE_URL = normalizedApiUrl;
    window.GDE_API_BASE_URL = normalizedApiUrl;
    window.IWAR_API_CONFIG_ERROR = candidate && !normalizedApiUrl
        ? "Backend API URL must be an exact HTTPS origin (HTTP is allowed only for local development)."
        : "";
})();
