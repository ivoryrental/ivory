import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.AUTH_SECRET;

if (!secretKey || secretKey.length < 32) {
    throw new Error("AUTH_SECRET must be set and be at least 32 characters long.");
}
const key = new TextEncoder().encode(secretKey);

interface SessionPayload extends JWTPayload {
    userId?: string;
    username?: string;
    role?: string;
    [key: string]: unknown;
}

export async function encrypt(payload: SessionPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });
        return payload as SessionPayload;
    } catch {
        return null;
    }
}

export async function verifySession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    return await decrypt(session);
}
