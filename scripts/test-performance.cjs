/**
 * 性能测试（阶段 3）：生产模式（npm run start:3001）下
 * 对首页 / 旅行详情 / 分析中心 / 旅行回顾 的加载耗时测量。
 * 数据规模：50 地点 / 100 游记 / 500 图片 / 500 消费
 */
const BASE = "http://localhost:3001";

async function login() {
  const res = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@travel.com", password: "123456" }),
  });
  const setCookie = res.headers.get("set-cookie");
  return setCookie ? setCookie.split(";")[0] : null;
}

async function measure(path, cookie, rounds = 3) {
  const times = [];
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    const res = await fetch(BASE + path, { headers: { Cookie: cookie } });
    const t1 = performance.now();
    const text = await res.text();
    times.push({ ms: t1 - t0, status: res.status, sizeKB: Math.round(text.length / 1024) });
  }
  times.sort((a, b) => a.ms - b.ms);
  return { median: times[1], best: times[0], worst: times[2] };
}

(async () => {
  const cookie = await login();
  if (!cookie) { console.error("登录失败"); process.exit(1); }
  console.log("登录成功，数据规模：50 地点 / 100 游记 / 500 图片 / 500 消费\n");
  console.log("页面\t\t中位耗时(ms)\t最快(ms)\t最慢(ms)\t状态\t大小");

  const pages = [
    ["首页 /", "/"],
    ["旅行详情 /trips/30", "/trips/30"],
    ["分析中心 /analytics", "/analytics"],
    ["旅行回顾 /trips/30/review", "/trips/30/review"],
  ];
  const all = [];
  for (const [name, path] of pages) {
    const r = await measure(path, cookie);
    console.log(`${name}\t${r.median.ms}\t\t${r.best.ms}\t\t${r.worst.ms}\t\t${r.median.status}\t${r.median.sizeKB}KB`);
    all.push({ name, ...r });
  }
  console.log("\n===== 性能测试完成 =====");
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
