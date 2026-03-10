"use server";

import { cookies, headers } from "next/headers";
import { encrypt, verifySession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { limitLoginRequests } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { getClientIdentity } from "@/lib/client-identity";

export async function login(formData: FormData) {
    const user = formData.get("username") as string;
    const pass = formData.get("password") as string;
    const headerList = await headers();

    if (!isSameOriginRequest(headerList)) {
        return false;
    }

    const rateLimit = await limitLoginRequests(getClientIdentity(headerList));
    if (!rateLimit.success) {
        return false;
    }

    if (!user || !pass) {
        return false;
    }

    // 1. Check DB for custom credentials
    try {
        const dbCreds = await prisma.globalSettings.findUnique({
            where: { key: "admin_credentials" }
        });

        if (dbCreds) {
            const { username, passwordHash } = JSON.parse(dbCreds.value);
            if (user === username) {
                const isValid = await bcrypt.compare(pass, passwordHash);
                if (isValid) {
                    await createSession(user);
                    return true;
                }
            }
            return false;
        }
    } catch (e) {
        console.error("DB Auth check failed", e);
    }

    // 2. Fallback to Env ONLY if strictly configured (Legacy Support - Remove in Prod if possible)
    // Disabled insecure default "admin/admin123" logic.
    const adminUser = process.env.ADMIN_USER; // Must be set explicitly
    const adminPass = process.env.ADMIN_PASSWORD;

    if (adminUser && adminPass && user === adminUser && pass === adminPass) {
        await createSession(user);
        return true;
    }

    return false;
}

async function createSession(user: string) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt({ user, expires });
    const cookieStore = await cookies();
    cookieStore.set("session", session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}

export async function updateAdminAction(formData: FormData) {
    // 1. Verify Session
    const session = await verifySession();
    if (!session) {
        return { success: false, message: "Unauthorized: Please log in." };
    }

    // 2. CSRF Protection (strict same-origin check)
    const headerList = await headers();
    if (!isSameOriginRequest(headerList)) {
        return { success: false, message: "Security Error: Invalid request origin" };
    }

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password || password.length < 6) {
        return { success: false, message: "Invalid credentials. Password must be at least 6 characters." };
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.globalSettings.upsert({
            where: { key: "admin_credentials" },
            update: { value: JSON.stringify({ username, passwordHash }) },
            create: { key: "admin_credentials", value: JSON.stringify({ username, passwordHash }) }
        });

        return { success: true, message: "Admin credentials updated successfully." };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to update credentials." };
    }
}
