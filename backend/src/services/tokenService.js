import jwt from "jsonwebtoken";

export function createSessionToken(payload, jwtSecret) {
    return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

export function verifySessionToken(token, jwtSecret) {
    return jwt.verify(token, jwtSecret);
}
