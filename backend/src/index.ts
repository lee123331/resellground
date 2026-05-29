import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "https://resellground.pages.dev",
        "http://localhost:8787",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
      ];
      return allowed.includes(origin) ? origin : "https://resellground.pages.dev";
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (c) => {
  return c.json({ message: "ResellGround API running" });
});

app.get("/api/products", async (c) => {
  try {
    const category = c.req.query("category") || "전체";
    const page = Math.max(1, parseInt(c.req.query("page") || "1"));
    const limit = Math.min(20, Math.max(1, parseInt(c.req.query("limit") || "8")));
    const sort = c.req.query("sort") || "popular";
    const offset = (page - 1) * limit;

    const params: (string | number)[] = [];
    let whereClause = "";
    if (category !== "전체") {
      whereClause = "WHERE cat = ?";
      params.push(category);
    }

    const orderMap: Record<string, string> = {
      popular: "interest DESC, view_count DESC",
      new: "created_at DESC",
      price_asc: "price_num ASC",
      price_desc: "price_num DESC",
    };
    const orderClause = `ORDER BY ${orderMap[sort] ?? orderMap.popular}`;

    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM products ${whereClause}`
    ).bind(...params).first<{ total: number }>();
    const total = countResult?.total ?? 0;

    const rows = await c.env.DB.prepare(
      `SELECT * FROM products ${whereClause} ${orderClause} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();

    return c.json({ items: rows.results, total, page, limit, hasMore: offset + limit < total });
  } catch (err) {
    console.error(err);
    return c.json({ message: "서버 오류가 발생했습니다." }, 500);
  }
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
app.post("/api/posts", async (c) => {
  try {
    const body = await c.req.json();

    const id = String(body.id || `post_${Date.now()}`);
    const board = String(body.board || "RESELL TALK");
    const badge = String(body.badge || board);
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const preview = String(body.preview || content.slice(0, 90));
    const author = String(body.author || "익명");
    const authorEmail = String(body.author_email || "");
    const tags = JSON.stringify(body.tags || []);
    const likes = Number(body.likes || 0);
    const comments = Number(body.comments || 0);
    const views = Number(body.views || 0);

    if (!title || !content) {
      return c.json({ message: "제목과 내용을 입력해주세요." }, 400);
    }

    await c.env.DB.prepare(`
      INSERT INTO posts (
        id, board, badge, title, content, preview,
        author, author_email, tags, likes, comments, views
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, board, badge, title, content, preview,
      author, authorEmail, tags, likes, comments, views
    ).run();

    return c.json({
      ok: true,
      message: "게시글이 등록되었습니다.",
      post: body
    }, 201);
  } catch (err) {
    console.error(err);
    return c.json({ message: "게시글 등록 중 서버 오류가 발생했습니다." }, 500);
  }
});

app.get("/api/posts", async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT *
      FROM posts
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    const posts = (result.results || []).map((row: any) => ({
      id: row.id,
      av: "av-a",
      em: "📝",
      author: row.author || row.nickname || "익명",
      authorTier: "",
      time: row.created_at || "방금 전",
      badge: row.badge || row.board || "RESELL TALK",
      tags: row.tags ? JSON.parse(row.tags) : [],
      title: row.title,
      content: row.content,
      preview: row.preview || String(row.content || "").slice(0, 90),
      likes: row.likes || 0,
      comments: row.comments || 0,
      views: row.views || 0
    }));

    return c.json(posts);
  } catch (err) {
    console.error(err);
    return c.json({ message: "게시글 목록을 불러오지 못했습니다." }, 500);
  }
});

app.post("/api/comments", async (c) => {
  try {
    const body = await c.req.json();

    const id = String(body.id || `comment_${Date.now()}`);
    const postId = String(body.post_id || body.postId || "").trim();
    const author = String(body.author || "익명");
    const authorEmail = String(body.author_email || "");
    const content = String(body.content || "").trim();

    if (!postId || !content) {
      return c.json({ message: "댓글 정보가 부족합니다." }, 400);
    }

    await c.env.DB.prepare(`
      INSERT INTO comments (
        id, post_id, author, author_email, content
      )
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, postId, author, authorEmail, content).run();

    return c.json({
      ok: true,
      message: "댓글이 등록되었습니다."
    }, 201);
  } catch (err) {
    console.error(err);
    return c.json({ message: "댓글 등록 중 오류가 발생했습니다." }, 500);
  }
});

app.get("/api/comments/:postId", async (c) => {
  try {
    const postId = c.req.param("postId");

    const result = await c.env.DB.prepare(`
      SELECT *
      FROM comments
      WHERE post_id = ?
      ORDER BY created_at DESC
    `).bind(postId).all();

    return c.json(result.results || []);
  } catch (err) {
    console.error(err);
    return c.json({ message: "댓글을 불러오지 못했습니다." }, 500);
  }
});

app.post("/api/products", async (c) => {
  try {
    const body = await c.req.json();

    const id = String(body.id || `product_${Date.now()}`);
    const sellerEmail = String(body.seller_email || "");
    const sellerName = String(body.seller_name || "익명");
    const name = String(body.name || "").trim();
    const brand = String(body.brand || "").trim();
    const category = String(body.category || "").trim();

    const priceRaw = String(body.price || "").replace(/[^\d]/g, "");
    const price = priceRaw ? Number(priceRaw) : 0;

    const condition = String(body.condition || "");
    const tradeMethod = String(body.trade_method || "");
    const description = String(body.description || "");
    const images = JSON.stringify(Array.isArray(body.images) ? body.images : []);
    const status = String(body.status || "판매중");

    if (!name || !category || !Number.isFinite(price) || price <= 0) {
      return c.json({
        ok: false,
        message: "상품명, 카테고리, 가격은 필수입니다."
      }, 400);
    }

    await c.env.DB.prepare(`
      INSERT INTO products (
        id, seller_email, seller_name, name, brand, category, price,
        condition, trade_method, description, images, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      sellerEmail,
      sellerName,
      name,
      brand,
      category,
      price,
      condition,
      tradeMethod,
      description,
      images,
      status
    ).run();

    return c.json({
      ok: true,
      message: "상품이 등록되었습니다.",
      product: {
        id,
        seller_email: sellerEmail,
        seller_name: sellerName,
        name,
        brand,
        category,
        price,
        condition,
        trade_method: tradeMethod,
        description,
        images: Array.isArray(body.images) ? body.images : [],
        status
      }
    }, 201);
  } catch (err) {
    console.error(err);

    return c.json({
      ok: false,
      message: "상품 등록 중 오류가 발생했습니다."
    }, 500);
  }
});

app.get("/api/products", async (c) => {
  try {
    const pageRaw = Number(c.req.query("page") || 1);
    const limitRaw = Number(c.req.query("limit") || 12);
    const category = String(c.req.query("category") || "").trim();
    const status = String(c.req.query("status") || "").trim();

    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), 50)
      : 12;

    const offset = (page - 1) * limit;

    const where: string[] = [];
    const binds: unknown[] = [];

    if (category && category !== "전체") {
      where.push("category = ?");
      binds.push(category);
    }

    if (status && status !== "전체") {
      where.push("status = ?");
      binds.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM products
      ${whereSql}
    `).bind(...binds).first();

    const total = Number(countResult?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const result = await c.env.DB.prepare(`
      SELECT *
      FROM products
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ?
      OFFSET ?
    `).bind(...binds, limit, offset).all();

    const rows = result.results || [];

    const products = rows.map(row => {
      let images = [];

      try {
        images = row.images ? JSON.parse(String(row.images)) : [];
      } catch (e) {
        images = [];
      }

      return {
        id: row.id,
        seller_email: row.seller_email,
        seller_name: row.seller_name,
        name: row.name,
        brand: row.brand,
        category: row.category,
        price: row.price,
        condition: row.condition,
        trade_method: row.trade_method,
        description: row.description,
        images,
        status: row.status,
        created_at: row.created_at
      };
    });

    return c.json({
      ok: true,
      page,
      limit,
      total,
      totalPages,
      products
    });
  } catch (err) {
    console.error(err);

    return c.json({
      ok: false,
      message: "상품 목록을 불러오지 못했습니다.",
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1,
      products: []
    }, 500);
  }
});
/* ── 내 상품 목록: email 기준 ── */
app.get("/api/user/products", async (c) => {
  try {
    const email = String(c.req.query("email") || "").trim().toLowerCase();
    if (!email) return c.json({ ok: false, message: "email 파라미터가 필요합니다." }, 400);

    const result = await c.env.DB.prepare(`
      SELECT * FROM products
      WHERE seller_email = ?
      ORDER BY created_at DESC
    `).bind(email).all();

    const products = (result.results || []).map((row: any) => {
      let images: string[] = [];
      try { images = row.images ? JSON.parse(String(row.images)) : []; } catch { images = []; }
      return {
        id: row.id,
        seller_email: row.seller_email,
        seller_name: row.seller_name,
        name: row.name,
        brand: row.brand,
        category: row.category,
        price: row.price,
        condition: row.condition,
        trade_method: row.trade_method,
        description: row.description,
        images,
        status: row.status,
        created_at: row.created_at,
      };
    });

    return c.json({ ok: true, products });
  } catch (err) {
    console.error(err);
    return c.json({ ok: false, message: "내 상품 목록을 불러오지 못했습니다." }, 500);
  }
});

/* ── 상품 상태 변경 ── */
app.patch("/api/products/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const status = String(body.status || "").trim();

    const allowed = ["판매중", "판매완료", "예약중"];
    if (!allowed.includes(status)) {
      return c.json({ ok: false, message: "유효하지 않은 상태입니다." }, 400);
    }

    const result = await c.env.DB.prepare(`
      UPDATE products SET status = ? WHERE id = ?
    `).bind(status, id).run();

    if (result.meta?.changes === 0) {
      return c.json({ ok: false, message: "상품을 찾을 수 없습니다." }, 404);
    }

    return c.json({ ok: true, message: `상태가 "${status}"로 변경되었습니다.` });
  } catch (err) {
    console.error(err);
    return c.json({ ok: false, message: "상태 변경 중 오류가 발생했습니다." }, 500);
  }
});

/* ── 상품 삭제 ── */
app.delete("/api/products/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(`
      DELETE FROM products WHERE id = ?
    `).bind(id).run();

    if (result.meta?.changes === 0) {
      return c.json({ ok: false, message: "상품을 찾을 수 없습니다." }, 404);
    }

    return c.json({ ok: true, message: "상품이 삭제되었습니다." });
  } catch (err) {
    console.error(err);
    return c.json({ ok: false, message: "삭제 중 오류가 발생했습니다." }, 500);
  }
});

/* ─────────────────────────────────────────────── */

app.get("/api/bookmarks/:email", async (c) => {
  try {
    const email = c.req.param("email");

    const result = await c.env.DB.prepare(`
      SELECT bookmarks.post_id, posts.*
      FROM bookmarks
      LEFT JOIN posts ON bookmarks.post_id = posts.id
      WHERE bookmarks.user_email = ?
      ORDER BY bookmarks.created_at DESC
    `).bind(email).all();

    return c.json(result.results || []);
  } catch (err) {
    console.error(err);
    return c.json({ message: "북마크를 불러오지 못했습니다." }, 500);
  }
});

app.post("/api/bookmarks", async (c) => {
  try {
    const body = await c.req.json();

    const id = String(body.id || `bookmark_${Date.now()}`);
    const userEmail = String(body.user_email || "").trim();
    const postId = String(body.post_id || "").trim();

    if (!userEmail || !postId) {
      return c.json({ message: "북마크 정보가 부족합니다." }, 400);
    }

    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO bookmarks (
        id, user_email, post_id
      )
      VALUES (?, ?, ?)
    `).bind(id, userEmail, postId).run();

    return c.json({
      ok: true,
      message: "북마크에 저장되었습니다."
    });
  } catch (err) {
    console.error(err);
    return c.json({ message: "북마크 저장 중 오류가 발생했습니다." }, 500);
  }
});

app.delete("/api/bookmarks", async (c) => {
  try {
    const body = await c.req.json();

    const userEmail = String(body.user_email || "").trim();
    const postId = String(body.post_id || "").trim();

    if (!userEmail || !postId) {
      return c.json({ message: "북마크 정보가 부족합니다." }, 400);
    }

    await c.env.DB.prepare(`
      DELETE FROM bookmarks
      WHERE user_email = ? AND post_id = ?
    `).bind(userEmail, postId).run();

    return c.json({
      ok: true,
      message: "북마크를 해제했습니다."
    });
  } catch (err) {
    console.error(err);
    return c.json({ message: "북마크 삭제 중 오류가 발생했습니다." }, 500);
  }
});



export default app;