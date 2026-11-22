(() => {
    const hostname = window.location?.hostname || "";
    const protocol = window.location?.protocol || "";
    const isLocalDevelopment = protocol === "file:"
        || hostname === "localhost"
        || hostname === "127.0.0.1";

    window.IWAR_API_BASE_URL = isLocalDevelopment
        ? "http://localhost:4000"
        : "https://infinit-war-api.onrender.com";
    // Backward compatibility for older scripts.
    window.GDE_API_BASE_URL = window.IWAR_API_BASE_URL;
})();
