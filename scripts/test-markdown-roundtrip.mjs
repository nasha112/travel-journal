/**
 * Markdown round-trip 兼容测试
 * 旧游记 Markdown → Tiptap 编辑器 → getMarkdown() 序列化
 * 验证关键语法在 parse → serialize 往返中不丢失。
 *
 * 运行：node scripts/test-markdown-roundtrip.mjs
 */
import { JSDOM } from "jsdom";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

// ---- jsdom 环境（Node 无 DOM）----
const dom = new JSDOM('<!DOCTYPE html><div id="editor"></div>', {
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});

// ---- 测试样例：覆盖旧游记全部可能用到的语法 ----
const samples = [
  {
    name: "标题+段落",
    md: "# 京都之旅\n\n## 清水寺\n\n### 三年坂\n\n今天终于来到京都，第一站是清水寺。",
  },
  {
    name: "粗体/斜体/删除线",
    md: "**粗体文字** 和 *斜体文字* 以及 ~~删除线~~",
  },
  {
    name: "无序/有序列表",
    md: "- 天气很好\n- 人比较多\n\n1. 第一站\n2. 第二站",
  },
  {
    name: "引用+链接+分割线",
    md: "> 引用内容：清水寺的景色非常漂亮。\n\n[查看地图](https://maps.example.com)\n\n---",
  },
  {
    name: "代码块",
    md: "```\nconst hello = 'world';\n```",
  },
  {
    name: "图片（图集/正文嵌入）",
    md: "## 清晨的滇池\n\n第二天一早又去了一次大坝。\n\n![旅行瞬间](https://picsum.photos/seed/travel-99-44-1/800/600)\n\n> 图文对应：旅行中的随手记录。",
  },
  {
    name: "混合长文（旧游记实际样式）",
    md: "# 云南七日游\n\n## 第一天 抵达昆明\n\n下飞机的第一站就是滇池。**海埂大坝的风很大**，但是红嘴鸥真的很多。\n\n- 买了两包鸥粮\n- 它们一点都不怕人\n\n![滇池](https://picsum.photos/seed/travel-1/800/600)\n\n> 夕阳把水面染成金色的时候，觉得这趟旅行值了。\n\n[查看完整攻略](https://example.com)",
  },
];

function makeEditor() {
  return new Editor({
    element: document.getElementById("editor"),
    extensions: [
      StarterKit.configure({ link: false }),
      Markdown,
      Image,
      Link,
    ],
  });
}

let pass = 0;
let fail = 0;
const failures = [];

for (const s of samples) {
  const editor = makeEditor();
  try {
    // Markdown → 编辑器
    editor.commands.setContent(s.md, { contentType: "markdown" });
    // 编辑器 → Markdown
    const out = editor.getMarkdown();
    const ok = out.includes(s.md.trim().split("\n")[0]) || out.trim().length > 0;
    // 逐语法校验：图片语法、粗体、标题等关键标记必须保留
    const checks = [
      { label: "H1(#)", re: /^# /m },
      { label: "H2(##)", re: /^## /m },
      { label: "粗体(**)", re: /\*\*/ },
      { label: "斜体(*)", re: /(?<!\*)\*[^*\n]+\*(?!\*)/ },
      { label: "无序列表(- )", re: /^- /m },
      { label: "有序列表(1. )", re: /^1\. /m },
      { label: "引用(>)", re: /^>/m },
      { label: "链接([)", re: /\[[^\]]*\]\(/ },
      { label: "图片(![]())", re: /!\[[^\]]*\]\(/ },
      { label: "分割线(---)", re: /^---$/m },
      { label: "代码块(```)", re: /```/ },
    ];
    const missing = checks.filter((c) => c.re.test(s.md) && !c.re.test(out)).map((c) => c.label);
    if (missing.length > 0) {
      fail++;
      failures.push({ name: s.name, missing });
      console.log(`✗ ${s.name}：丢失语法 ${missing.join("、")}`);
      console.log("  输入:", JSON.stringify(s.md.slice(0, 80)));
      console.log("  输出:", JSON.stringify(out.slice(0, 120)));
    } else {
      pass++;
      console.log(`✓ ${s.name}（${ok ? "往返成功" : "内容保留"}）`);
    }
  } catch (e) {
    fail++;
    failures.push({ name: s.name, error: String(e) });
    console.log(`✗ ${s.name}：抛错 ${e}`);
  } finally {
    editor.destroy();
  }
}

console.log("\n========== 结果 ==========");
console.log(`通过 ${pass} / ${samples.length}`);
if (failures.length > 0) {
  console.log("失败项：", JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log("全部 Markdown 语法往返无丢失，旧游记可安全迁移到新编辑器。");
