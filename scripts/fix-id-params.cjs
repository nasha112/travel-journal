/**
 * 批量修复：所有 [id] API 路由增加正整数 ID 校验（非法 ID → 400 而非 500）
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "app", "api");
const files = [
  "blogs/[id]/route.ts",
  "days/[id]/route.ts",
  "days/[id]/locations/route.ts",
  "locations/[id]/route.ts",
  "locations/[id]/blog/route.ts",
  "expenses/[id]/route.ts",
  "trips/[id]/route.ts",
  "trips/[id]/days/route.ts",
  "trips/[id]/expenses/route.ts",
];

let changed = 0;
for (const rel of files) {
  const p = path.join(root, rel);
  let c = fs.readFileSync(p, "utf8");
  const before = c;

  // 1) 每个 handler 的路径参数解析后插入校验
  c = c.replace(
    /const \{ id \} = await params;/g,
    'const { id } = await params;\n  const parsedId = parseIdParam(id);\n  if (!parsedId) return NextResponse.json({ error: "参数错误" }, { status: 400 });'
  );
  // 2) 路径 id 的 Number(id) 统一替换为已校验的 parsedId
  c = c.replace(/Number\(id\)/g, "parsedId");
  // 3) 引入 helper
  if (!c.includes('parse-id')) {
    c = c.replace(
      'import { requireUserId } from "@/lib/auth";',
      'import { requireUserId } from "@/lib/auth";\nimport { parseIdParam } from "@/lib/parse-id";'
    );
  }

  if (c !== before) {
    fs.writeFileSync(p, c, "utf8");
    changed++;
    console.log("OK", rel);
  } else {
    console.log("SKIP(no change)", rel);
  }
}
console.log("changed files:", changed);
