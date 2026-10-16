(() => {
    const hostname = window.location.hostname;
    const isLocalDevelopment = hostname === "localhost"
        || hostname === "127.0.0.1"
        || hostname === "[::1]";

    // Hosted builds must provide the HTTPS API origin explicitly. Do not silently
    // point a remote player's browser at its own localhost.
    if (!window.IWAR_API_BASE_URL) {
        window.IWAR_API_BASE_URL = isLocalDevelopment ? "http://localhost:4000" : "";
    }

    window.IWAR_API_BASE_URL = String(window.IWAR_API_BASE_URL).replace(/\/$/, "");
    // Backward compatibility for older scripts.
    window.GDE_API_BASE_URL = window.IWAR_API_BASE_URL;
})();
