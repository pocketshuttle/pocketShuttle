"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./node_modules/.prisma/client");
const globalForPrisma = global;
const db = globalForPrisma.prisma || new client_1.PrismaClient();
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = db;
exports.default = db;
