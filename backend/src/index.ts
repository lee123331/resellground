import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: "https://resellground.pages.dev",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (c) => {
  return c.json({
    message: "ResellGround API running",
  });
});

app.post("/api/auth/signup", async (c) => {
  try {
    const body = await c.req.json();

    const nickname = String(body.nickname || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const phone = body.phone ? String(body.phone).trim() : null;

    if (!nickname || !email || !password) {
      return c.json({ message: "필수 정보를 입력해주세요." }, 400);
    }

    if (password.length < 8) {
      return c.json({ message: "비밀번호는 8자 이상이어야 합니다." }, 400);
    }

    const exists = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (exists) {
      return c.json({ message: "이미 가입된 이메일입니다." }, 409);
    }

    const passwordHash = await hashPassword(password);

    await c.env.DB.prepare(
      `INSERT INTO users (nickname, email, password_hash, phone)
       VALUES (?, ?, ?, ?)`
    )
      .bind(nickname, email, passwordHash, phone)
      .run();

    return c.json(
      {
        message: "회원가입이 완료되었습니다.",
      },
      201
    );
  } catch (err) {
    console.error(err);
    return c.json({ message: "서버 오류가 발생했습니다." }, 500);
  }
});

app.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return c.json({ message: "이메일과 비밀번호를 입력해주세요." }, 400);
    }

 const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?")
  .bind(email)
  .first();

if (!user) {
  return c.json(
    { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
    401
  );
}

const savedHash = String(user.password_hash || "");

    if (!user) {
      return c.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        401
      );
    }

const isValid = await verifyPassword(password, savedHash);

    if (!isValid) {
      return c.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        401
      );
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      sellerGrade: user.seller_grade,
    });

    return c.json({
      message: "로그인 성공",
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
        sellerGrade: user.seller_grade,
      },
    });
  } catch (err) {
    console.error(err);
    return c.json({ message: "서버 오류가 발생했습니다." }, 500);
  }
});

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const salt = crypto.randomUUID();
  const data = encoder.encode(`${salt}:${password}`);

  const digest = await crypto.subtle.digest("SHA-256", data);
  const hash = bufferToHex(digest);

  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, savedHash: string) {
  const [salt, originalHash] = savedHash.split(":");

  if (!salt || !originalHash) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);

  const digest = await crypto.subtle.digest("SHA-256", data);
  const hash = bufferToHex(digest);

  return hash === originalHash;
}

function bufferToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function createToken(payload: Record<string, unknown>) {
  const tokenPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };

  const json = JSON.stringify(tokenPayload);
  const bytes = new TextEncoder().encode(json);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}
export default app;