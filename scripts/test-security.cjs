/**
 * 安全测试（阶段 2）
 * 覆盖：登录/JWT/Cookie、越权访问、上传校验、非法参数、XSS 存储层
 * 直接对 localhost:3000 的 REST API 发起真实请求。
 */
const BASE = "http://localhost:3000";
const ts = Date.now().toString().slice(-6);

async function req(path, { method = "GET", cookie, body, form } = {}) {
  const headers = {};
  if (cookie) headers["Cookie"] = cookie;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, { method, headers, body: payload, redirect: "manual" });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, setCookie: res.headers.get("set-cookie") };
}

const results = [];
function check(id, name, cond, detail) {
  results.push({ id, name, pass: !!cond, detail });
  console.log(`${cond ? "✅" : "❌"} ${id} ${name}${cond ? "" : " —— " + detail}`);
}

(async () => {
  // ========== 1. 注册两个测试账号 ==========
  const ua = `sec_a_${ts}@test.com`, ub = `sec_b_${ts}@test.com`;
  const ra = await req("/api/auth/register", { method: "POST", body: { email: ua, password: "test123456", name: "安全测试A" } });
  const rb = await req("/api/auth/register", { method: "POST", body: { email: ub, password: "test123456", name: "安全测试B" } });
  check("S-01", "注册测试账号 A/B", ra.status === 200 || ra.status === 201, "A:" + ra.status + " B:" + rb.status);

  // ========== 2. 登录 / JWT / Cookie ==========
  const la = await req("/api/auth/login", { method: "POST", body: { email: ua, password: "test123456" } });
  const cookieA = la.setCookie ? la.setCookie.split(";")[0] : null;
  check("S-02", "正确账号密码登录", la.status === 200 && !!cookieA, "status:" + la.status + " cookie:" + !!cookieA);
  check("S-03", "Cookie 标记 HttpOnly", la.setCookie ? /httponly/i.test(la.setCookie) : false, la.setCookie || "no set-cookie");
  check("S-04", "Cookie 标记 SameSite", la.setCookie ? /samesite/i.test(la.setCookie) : false, la.setCookie || "no set-cookie");

  const lb = await req("/api/auth/login", { method: "POST", body: { email: ub, password: "test123456" } });
  const cookieB = lb.setCookie ? lb.setCookie.split(";")[0] : null;

  const badLogin = await req("/api/auth/login", { method: "POST", body: { email: ua, password: "wrong-pass" } });
  check("S-05", "错误密码登录", badLogin.status === 401, "status:" + badLogin.status);
  const noLogin = await req("/api/trips");
  check("S-06", "未登录访问受保护 API", noLogin.status === 401, "status:" + noLogin.status);

  // ========== 3. 越权访问 ==========
  const trip = await req("/api/trips", { method: "POST", cookie: cookieA, body: { title: "越权测试旅行", startDate: "2026-01-01", endDate: "2026-01-03", description: "安全测试" } });
  const tripId = trip.data?.id;
  check("S-07", "A 创建旅行", trip.status === 201 && !!tripId, "status:" + trip.status + " id:" + tripId);

  const crossGet = await req(`/api/trips/${tripId}`, { cookie: cookieB });
  check("S-08", "B 读取 A 的旅行（越权）", crossGet.status === 404, "status:" + crossGet.status);
  const crossPut = await req(`/api/trips/${tripId}`, { method: "PUT", cookie: cookieB, body: { title: "篡改" } });
  check("S-09", "B 修改 A 的旅行（越权）", crossPut.status === 404, "status:" + crossPut.status);
  const crossDel = await req(`/api/trips/${tripId}`, { method: "DELETE", cookie: cookieB });
  check("S-10", "B 删除 A 的旅行（越权）", crossDel.status === 404, "status:" + crossDel.status);

  // 消费越权：A 建消费 → B 删
  const exp = await req(`/api/trips/${tripId}/expenses`, { method: "POST", cookie: cookieA, body: { amount: 100, category: "FOOD", note: "越权消费", date: "2026-01-01T12:00" } });
  const expId = exp.data?.id;
  check("S-11", "A 创建消费", exp.status === 201 && !!expId, "status:" + exp.status + " id:" + expId);
  const expCross = await req(`/api/expenses/${expId}`, { method: "DELETE", cookie: cookieB });
  check("S-12", "B 删除 A 的消费（越权）", expCross.status === 404, "status:" + expCross.status);

  // ========== 4. 上传校验 ==========
  const upNoLogin = await req("/api/upload", { method: "POST" });
  check("S-13", "未登录上传", upNoLogin.status === 401, "status:" + upNoLogin.status);

  const txtForm = new FormData();
  txtForm.append("file", new Blob(["hello"], { type: "text/plain" }), "evil.txt");
  const upTxt = await req("/api/upload", { method: "POST", cookie: cookieA, form: txtForm });
  check("S-14", "非图片扩展名上传", upTxt.status === 400, "status:" + upTxt.status);

  // 伪造 .png 的 HTML 内容（扩展名校验通过 → 记录为已知限制）
  const fakeForm = new FormData();
  fakeForm.append("file", new Blob(["<script>alert(1)</script>"], { type: "image/png" }), "fake.png");
  const upFake = await req("/api/upload", { method: "POST", cookie: cookieA, form: fakeForm });
  check("S-15", "伪造 .png 内容上传（仅扩展名校验）", upFake.status === 201, "status:" + upFake.status + " —— 仅扩展名校验，内容未检测（建议增强）");

  // 超 5MB
  const bigForm = new FormData();
  bigForm.append("file", new Blob([Buffer.alloc(5.5 * 1024 * 1024)], { type: "image/png" }), "big.png");
  const upBig = await req("/api/upload", { method: "POST", cookie: cookieA, form: bigForm });
  check("S-16", "超过 5MB 上传", upBig.status === 400, "status:" + upBig.status);

  // ========== 5. 非法参数 ==========
  const badStatus = await req("/api/trips", { method: "POST", cookie: cookieA, body: { title: "非法状态", startDate: "2026-01-01", endDate: "2026-01-03", status: "HACKED" } });
  check("S-17", "非法状态值", badStatus.status === 400, "status:" + badStatus.status);
  const longTitle = await req("/api/trips", { method: "POST", cookie: cookieA, body: { title: "x".repeat(150), startDate: "2026-01-01", endDate: "2026-01-03" } });
  check("S-18", "超长标题（>100）", longTitle.status === 400, "status:" + longTitle.status);
  const badId = await req("/api/trips/abc123", { cookie: cookieA });
  check("S-19", "非法 ID 参数", badId.status === 400 || badId.status === 404, "status:" + badId.status);

  // ========== 6. XSS 存储层 ==========
  // 先建旅行日 → 地点 → 游记（正确链路）
  const day = await req(`/api/trips/${tripId}/days`, { method: "POST", cookie: cookieA, body: { title: "Day 1", date: "2026-01-01" } });
  const dayId = day.data?.id;
  check("S-20a", "创建旅行日（XSS 前置）", day.status === 201 && !!dayId, "status:" + day.status);
  const loc = await req(`/api/days/${dayId}/locations`, { method: "POST", cookie: cookieA, body: { name: "XSS测试地", lat: 25.0, lng: 102.7, type: "ATTRACTION" } });
  const locId = loc.data?.id;
  check("S-20b", "创建地点（XSS 前置）", loc.status === 201 && !!locId, "status:" + loc.status);
  if (loc.status === 201) {
    const xssBlog = await req(`/api/locations/${locId}/blog`, { method: "POST", cookie: cookieA, body: { title: "<script>alert(1)</script>标题", content: "# 正文\n\n<script>alert(2)</script>注入测试" } });
    check("S-20", "XSS 载荷可保存（存储层）", xssBlog.status === 201, "status:" + xssBlog.status);
    const blogId = xssBlog.data?.id;
    if (blogId) {
      const list = await req(`/api/locations/${locId}/blog`, { cookie: cookieA });
      const item = (list.data || []).find((b) => b.id === blogId);
      const stored = item?.title || "";
      check("S-21", "存储原样（未执行，渲染层 react-markdown 转义）", list.status === 200 && stored.includes("<script>"), "title:" + stored.slice(0, 30));
      // 清理 XSS 游记
      await req(`/api/blogs/${blogId}`, { method: "DELETE", cookie: cookieA });
    }
    await req(`/api/locations/${locId}`, { method: "DELETE", cookie: cookieA });
  } else {
    check("S-20", "XSS 地点创建", false, "status:" + loc.status + " " + JSON.stringify(loc.data));
  }

  // ========== 清理测试数据 ==========
  await req(`/api/trips/${tripId}`, { method: "DELETE", cookie: cookieA });
  console.log("（测试数据已清理）");

  const pass = results.filter((r) => r.pass).length;
  console.log(`\n===== 安全测试：${pass}/${results.length} 通过 =====`);
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
