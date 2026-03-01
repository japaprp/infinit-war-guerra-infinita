import dotenv from "dotenv";

dotenv.config();

export const env = {
    PORT: Number(process.env.PORT || 4000),
    GRPC_PORT: Number(process.env.GRPC_PORT || 50051),
    JWT_SECRET: process.env.JWT_SECRET || "unsafe_dev_secret",
    RECEIPT_SECRET: process.env.RECEIPT_SECRET || "unsafe_receipt_secret",
    DATA_DRIVER: (process.env.DATA_DRIVER || "json").toLowerCase(),
    MYSQL_HOST: process.env.MYSQL_HOST || "127.0.0.1",
    MYSQL_PORT: Number(process.env.MYSQL_PORT || 3306),
    MYSQL_DATABASE: process.env.MYSQL_DATABASE || "infinitwar",
    MYSQL_USER: process.env.MYSQL_USER || "root",
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
    REDIS_ENABLED: String(process.env.REDIS_ENABLED || "false").toLowerCase() === "true",
    REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379"
};
