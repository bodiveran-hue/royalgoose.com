import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored?: string) {
  if (!stored) return false;
  if (!stored.startsWith("scrypt$")) return stored === password;
  const [, salt, hash] = stored.split("$");
  return crypto.scryptSync(password, salt, 32).toString("hex") === hash;
}

export type TokenPayload = { sub: string; role: string; clubId: string | null; exp: number };

export function signToken(payload: Omit<TokenPayload, "exp">, days = 7) {
  const body: TokenPayload = { ...payload, exp: Date.now() + days * 86400000 };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as TokenPayload;
  if (payload.exp < Date.now()) return null;
  return payload;
}
