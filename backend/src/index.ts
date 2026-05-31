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

app.get("/api/brands/search", async (c) => {
  try {
    const q = String(c.req.query("q") || "").trim();

    if (!q) {
      return c.json({
        success: true,
        brands: [],
      });
    }

    const result = await c.env.DB.prepare(`
      SELECT id, name_en, name_ko
      FROM brands
      WHERE
        LOWER(name_en) LIKE LOWER(?)
        OR name_ko LIKE ?
        OR search_keywords LIKE ?
      ORDER BY name_en ASC
      LIMIT 20
    `)
      .bind(`%${q}%`, `%${q}%`, `%${q}%`)
      .all();

    return c.json({
      success: true,
      brands: result.results || [],
    });
  } catch (err) {
    console.error("Brand search error:", err);

    return c.json(
      {
        success: false,
        message: "브랜드 검색 중 오류가 발생했습니다.",
      },
      500
    );
  }
});

app.get("/api/categories", async (c) => {
  try {
    const parentId = c.req.query("parent_id");

    let result;

    if (!parentId || parentId === "null") {
      result = await c.env.DB.prepare(`
        SELECT id, name, parent_id, depth, sort_order
        FROM categories
        WHERE parent_id IS NULL
        ORDER BY sort_order ASC, id ASC
      `).all();
    } else {
      result = await c.env.DB.prepare(`
        SELECT id, name, parent_id, depth, sort_order
        FROM categories
        WHERE parent_id = ?
        ORDER BY sort_order ASC, id ASC
      `)
        .bind(Number(parentId))
        .all();
    }

    return c.json({
      success: true,
      categories: result.results || [],
    });
  } catch (err) {
    console.error("Category fetch error:", err);

    return c.json(
      {
        success: false,
        message: "카테고리 조회 중 오류가 발생했습니다.",
        error: err instanceof Error ? err.message : String(err),
      },
      500
    );
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
app.patch("/api/posts/:id/like", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "게시글 ID가 없습니다.",
        },
        400
      );
    }

    await c.env.DB.prepare(`
      UPDATE posts
      SET likes = COALESCE(likes, 0) + 1
      WHERE id = ?
    `)
      .bind(id)
      .run();

    const post = await c.env.DB.prepare(`
      SELECT id, likes
      FROM posts
      WHERE id = ?
    `)
      .bind(id)
      .first();

    return c.json({
      success: true,
      ok: true,
      message: "추천이 반영되었습니다.",
      post,
    });
  } catch (err) {
    console.error("Post like error:", err);

    return c.json(
      {
        success: false,
        ok: false,
        message: "추천 처리 중 오류가 발생했습니다.",
      },
      500
    );
  }
});
app.patch("/api/products/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const status = String(body.status || "").trim();

    const allowedStatuses = ["판매중", "판매완료", "예약중", "삭제됨"];

    if (!id) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "상품 ID가 없습니다.",
        },
        400
      );
    }

    if (!allowedStatuses.includes(status)) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "유효하지 않은 상품 상태입니다.",
        },
        400
      );
    }

    const result = await c.env.DB.prepare(`
      UPDATE products
      SET status = ?
      WHERE id = ?
    `)
      .bind(status, id)
      .run();

    const product = await c.env.DB.prepare(`
      SELECT
        id,
        seller_email,
        seller_name,
        name,
        brand,
        category,
        price,
        condition,
        trade_method,
        description,
        status,
        views,
        created_at,
        brand_id,
        category_id,
        size_region,
        size_value,
        inspection_service
      FROM products
      WHERE id = ?
    `)
      .bind(id)
      .first();

    if (!product) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "상품을 찾을 수 없습니다.",
        },
        404
      );
    }

    return c.json({
      success: true,
      ok: true,
      message: "상품 상태가 변경되었습니다.",
      product,
      result,
    });
  } catch (err) {
    console.error("Product status update error:", err);

    return c.json(
      {
        success: false,
        ok: false,
        message: "상품 상태 변경 중 오류가 발생했습니다.",
      },
      500
    );
  }
});
app.delete("/api/products/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "상품 ID가 없습니다.",
        },
        400
      );
    }

    const existing = await c.env.DB.prepare(`
      SELECT id
      FROM products
      WHERE id = ?
    `)
      .bind(id)
      .first();

    if (!existing) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "상품을 찾을 수 없습니다.",
        },
        404
      );
    }

    // 실제 삭제 대신 소프트 삭제 처리
    await c.env.DB.prepare(`
      UPDATE products
      SET status = '삭제됨'
      WHERE id = ?
    `)
      .bind(id)
      .run();

    return c.json({
      success: true,
      ok: true,
      message: "상품이 삭제되었습니다.",
      product_id: id,
    });
  } catch (err) {
    console.error("Product delete error:", err);

    return c.json(
      {
        success: false,
        ok: false,
        message: "상품 삭제 중 오류가 발생했습니다.",
      },
      500
    );
  }
});
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
app.post("/api/products/ping", async (c) => {
  return c.json({
    success: true,
    message: "products post ping ok",
  });
});
app.get("/api/user/products", async (c) => {
  try {
    const email = c.req.query("email");
    const page = Number(c.req.query("page") || 1);
    const limit = Number(c.req.query("limit") || 20);
    const offset = (page - 1) * limit;

    if (!email) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "이메일이 필요합니다.",
        },
        400
      );
    }

    const countRow = await c.env.DB.prepare(`
  SELECT COUNT(*) AS total
  FROM products
  WHERE seller_email = ?
    AND (status IS NULL OR TRIM(status) NOT IN ('삭제됨', 'deleted', 'DELETED'))
`)
  .bind(email)
  .first<{ total: number }>();

    const rows = await c.env.DB.prepare(`
      SELECT
        id,
        seller_email,
        seller_name,
        name,
        brand,
        category,
        price,
        condition,
        trade_method,
        description,
        status,
        views,
        created_at,
        brand_id,
        category_id,
        size_region,
        size_value,
        inspection_service
     FROM products
WHERE seller_email = ?
  AND (status IS NULL OR TRIM(status) NOT IN ('삭제됨', 'deleted', 'DELETED'))
ORDER BY created_at DESC
LIMIT ? OFFSET ?
    `)
      .bind(email, limit, offset)
      .all();

    const products = rows.results || [];
    const total = Number(countRow?.total || 0);

    return c.json({
      success: true,
      ok: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    console.error("User products error:", err);

    return c.json(
      {
        success: false,
        ok: false,
        message: "내 상품 목록 조회 중 오류가 발생했습니다.",
      },
      500
    );
  }
});
app.post("/api/products", async (c) => {
  try {
    const body = await c.req.json();

    const id = String(
      body.id || `product_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    );

    const sellerEmail = String(
      body.seller_email || body.sellerEmail || ""
    ).trim().toLowerCase();

    const sellerName = String(
      body.seller_name || body.sellerName || "익명"
    ).trim();

    const name = String(body.name || body.title || "").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price || 0);

    const brandId = body.brand_id ? Number(body.brand_id) : null;
    const categoryId = body.category_id ? Number(body.category_id) : null;

    const sizeRegion = body.size_region ? String(body.size_region).trim() : null;
    const sizeValue = body.size_value ? String(body.size_value).trim() : null;

    const condition = String(body.condition || "").trim();
    const tradeMethod = String(body.trade_method || body.tradeMethod || "").trim();

    const inspectionService = body.inspection_service ? 1 : 0;
    const images = Array.isArray(body.images) ? body.images : [];

    if (!sellerEmail) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "판매자 이메일이 없습니다. 다시 로그인해주세요.",
        },
        400
      );
    }

    if (!name) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "상품명을 입력해주세요.",
        },
        400
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "가격을 올바르게 입력해주세요.",
        },
        400
      );
    }

    if (!brandId) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "브랜드를 선택해주세요.",
        },
        400
      );
    }

    if (!categoryId) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "카테고리를 선택해주세요.",
        },
        400
      );
    }

    if (images.length > 10) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "사진은 최대 10장까지 등록할 수 있습니다.",
        },
        400
      );
    }

    const brand = (await c.env.DB.prepare(`
  SELECT id, name_en, name_ko
  FROM brands
  WHERE id = ?
`)
  .bind(brandId)
  .first()) as { id: number; name_en: string; name_ko: string } | null;

    if (!brand) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "존재하지 않는 브랜드입니다.",
        },
        400
      );
    }

    const category = (await c.env.DB.prepare(`
  SELECT id, name
  FROM categories
  WHERE id = ?
`)
  .bind(categoryId)
  .first()) as { id: number; name: string } | null;

    if (!category) {
      return c.json(
        {
          success: false,
          ok: false,
          message: "존재하지 않는 카테고리입니다.",
        },
        400
      );
    }

    const brandText = `${brand.name_en} (${brand.name_ko})`;
    const categoryText = category.name;

    await c.env.DB.prepare(`
      INSERT INTO products (
        id,
        seller_email,
        seller_name,
        name,
        brand,
        category,
        price,
        condition,
        trade_method,
        description,
        images,
        status,
        inspection_service,
        brand_id,
        category_id,
        size_region,
        size_value
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        id,
        sellerEmail,
        sellerName,
        name,
        brandText,
        categoryText,
        price,
        condition,
        tradeMethod,
        description,
        JSON.stringify(images),
        "판매중",
        inspectionService,
        brandId,
        categoryId,
        sizeRegion,
        sizeValue
      )
      .run();

    for (let i = 0; i < images.length; i++) {
      await c.env.DB.prepare(`
        INSERT INTO product_images (
          product_id,
          image_url,
          sort_order
        )
        VALUES (?, ?, ?)
      `)
        .bind(id, String(images[i]), i)
        .run();
    }

    return c.json(
      {
        success: true,
        ok: true,
        message: "상품이 등록되었습니다.",
        product_id: id,
        product: {
          id,
          seller_email: sellerEmail,
          seller_name: sellerName,
          name,
          brand: brandText,
          category: categoryText,
          price,
          condition,
          trade_method: tradeMethod,
          description,
          images,
          status: "판매중",
          inspection_service: inspectionService,
          brand_id: brandId,
          category_id: categoryId,
          size_region: sizeRegion,
          size_value: sizeValue,
        },
      },
      201
    );
  } catch (err) {
    console.error("Product create error:", err);

    return c.json(
      {
        success: false,
        ok: false,
        message: "상품 등록 중 오류가 발생했습니다.",
        error: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
});

app.get("/api/products", async (c) => {
  try {
    const category = c.req.query("category") || "전체";
    const status = c.req.query("status") || "전체";
    const page = Math.max(1, parseInt(c.req.query("page") || "1"));
    const limit = Math.min(20, Math.max(1, parseInt(c.req.query("limit") || "8")));
    const sort = c.req.query("sort") || "popular";
    const offset = (page - 1) * limit;

    const params: (string | number)[] = [];
    const where: string[] = [];

    // 삭제된 상품 제외
    where.push("(status IS NULL OR TRIM(status) NOT IN ('삭제됨', 'deleted', 'DELETED'))");

    // 카테고리 필터
    if (category && category !== "전체") {
      where.push("category = ?");
      params.push(category);
    }

    // 상태 필터
    if (status && status !== "전체") {
      where.push("status = ?");
      params.push(status);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const orderMap: Record<string, string> = {
      popular: "views DESC, created_at DESC",
      new: "created_at DESC",
      price_asc: "price ASC",
      price_desc: "price DESC",
    };

    const orderClause = `ORDER BY ${orderMap[sort] ?? orderMap.popular}`;

    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) AS total FROM products ${whereClause}`
    )
      .bind(...params)
      .first<{ total: number }>();

    const total = Number(countResult?.total || 0);

    const rows = await c.env.DB.prepare(`
      SELECT
        id,
        seller_email,
        seller_name,
        name,
        brand,
        category,
        price,
        condition,
        trade_method,
        description,
        status,
        views,
        created_at,
        brand_id,
        category_id,
        size_region,
        size_value,
        inspection_service
      FROM products
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `)
      .bind(...params, limit, offset)
      .all();

    return c.json({
      success: true,
      ok: true,
      products: rows.results || [],
      items: rows.results || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    });
  } catch (err) {
    console.error("Products list error:", err);

    return c.json(
      {
        success: false,
        ok: false,
        message: "상품 목록 조회 중 오류가 발생했습니다.",
      },
      500
    );
  }
});

app.get("/api/products/:id", async (c) => {
  try {
    const id = c.req.param("id");

const product = (await c.env.DB.prepare(`
  SELECT
    p.*,
    b.name_en AS brand_name_en,
    b.name_ko AS brand_name_ko,
    cat.name AS category_name
  FROM products p
  LEFT JOIN brands b ON p.brand_id = b.id
  LEFT JOIN categories cat ON p.category_id = cat.id
  WHERE p.id = ?
    AND (p.status IS NULL OR TRIM(p.status) NOT IN ('삭제됨', 'deleted', 'DELETED'))
`)
  .bind(id)
  .first()) as any;

    if (!product) {
      return c.json(
        {
          success: false,
          message: "상품을 찾을 수 없습니다.",
        },
        404
      );
    }

    const imageRows = await c.env.DB.prepare(`
      SELECT image_url
      FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC
    `)
      .bind(id)
      .all();

    let images: string[] = [];

    if (imageRows.results && imageRows.results.length > 0) {
      images = imageRows.results.map((row: any) => String(row.image_url));
    } else {
      try {
        images = product.images ? JSON.parse(String(product.images)) : [];
      } catch {
        images = [];
      }
    }
    
const categoryPath: string[] = [];

if (product.category_id) {
  let currentCategoryId: number | null = Number(product.category_id);

  while (currentCategoryId !== null) {
const row = (await c.env.DB.prepare(`
  SELECT id, name, parent_id
  FROM categories
  WHERE id = ?
`)
  .bind(currentCategoryId)
  .first()) as {
    id: number;
    name: string;
    parent_id: number | null;
  } | null;

    if (!row) {
      break;
    }

    categoryPath.unshift(String(row.name));

    currentCategoryId =
      row.parent_id === null || row.parent_id === undefined
        ? null
        : Number(row.parent_id);
  }
}
    return c.json({
      success: true,
      product: {
        id: product.id,
        seller_email: product.seller_email,
        seller_name: product.seller_name,
        name: product.name,
        description: product.description,
        price: product.price,
        condition: product.condition,
        trade_method: product.trade_method,
        status: product.status,

        brand_id: product.brand_id,
        brand: {
          id: product.brand_id,
          name_en: product.brand_name_en,
          name_ko: product.brand_name_ko,
          label: product.brand_name_en && product.brand_name_ko
            ? `${product.brand_name_en} (${product.brand_name_ko})`
            : product.brand,
        },

        category_id: product.category_id,
        category: {
  id: product.category_id,
  name: product.category_name || product.category,
  path: categoryPath,
  path_label: categoryPath.join(" > "),
},

        size_region: product.size_region,
        size_value: product.size_value,
        inspection_service: Boolean(product.inspection_service),

        images,
      },
    });
  } catch (err) {
    console.error("Product detail error:", err);

    return c.json(
      {
        success: false,
        message: "상품 상세 조회 중 오류가 발생했습니다.",
        error: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
});

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



/* ── 내 상품 목록: seller_email 기준 ── */
app.get("/api/user/products", async (c) => {
  try {
    const email = String(c.req.query("email") || "").trim().toLowerCase();
    if (!email) return c.json({ ok: false, message: "email 파라미터가 필요합니다." }, 400);

    const result = await c.env.DB.prepare(`
      SELECT * FROM products
      WHERE seller_email = ? AND (is_deleted IS NULL OR is_deleted = 0)
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

/* ── 상품 삭제 (소프트 딜리트) ── */
app.delete("/api/products/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(`
      UPDATE products SET is_deleted = 1 WHERE id = ?
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

export default app;