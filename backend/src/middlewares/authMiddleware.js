import { verifySessionToken } from "../services/tokenService.js";

export function createAuthMiddleware(jwtSecret) {
    return (req, res, next) => {
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

        if (!token) {
            return res.status(401).json({ error: "Missing bearer token" });
        }

        try {
            const decoded = verifySessionToken(token, jwtSecret);
            req.user = decoded;
            return next();
        } catch {
            return res.status(401).json({ error: "Invalid token" });
        }
    };
}
