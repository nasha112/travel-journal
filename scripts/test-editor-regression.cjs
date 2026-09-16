/**
 * 编辑器回归测试（Editor-02/03/04/05/06/07/13）
 * 使用与项目一致的扩展配置（StarterKit + Markdown + Image + Link + Placeholder）
 * jsdom 环境执行，验证编辑器命令、Markdown 序列化与旧 Markdown 兼容。
 */
const { JSDOM } = require("jsdom");
const dom = new JSDOM('<div id="app"></div>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.getSelection = dom.window.getSelection;
global.Element = dom.window.Element;

const { Editor } = require("@tiptap/core");
const sk = require("@tiptap/starter-kit");
const StarterKit = sk.default || sk;
const { Markdown } = require("@tiptap/markdown");
const Image = require("@tiptap/extension-image").default;
const Link = require("@tiptap/extension-link").default;
const Placeholder = require("@tiptap/extension-placeholder").default;

const extensions = [
  StarterKit.configure({ link: false, heading: { levels: [1, 2, 3] } }),
  Markdown,
  Image,
  Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
  Placeholder.configure({ placeholder: "test" }),
];

const el = dom.window.document.createElement("div");
const ed = new Editor({ element: el, extensions });

const results = [];
function check(id, name, cond, detail) {
  results.push({ id, name, pass: !!cond, detail });
  console.log(`${cond ? "✅" : "❌"} ${id} ${name}${cond ? "" : " —— " + detail}`);
}

// Editor-03: H1/H2/H3
ed.commands.clearContent();
ed.chain().setContent("<h1>一级标题</h1><h2>二级标题</h2><h3>三级标题</h3>").run();
let md = ed.getMarkdown();
check("E-03", "H1/H2/H3 序列化", md.includes("# 一级标题") && md.includes("## 二级标题") && md.includes("### 三级标题"), md.split("\n")[0]);

// Editor-04: 粗体/斜体/删除线
ed.commands.clearContent();
ed.chain().setContent("<p><strong>粗体</strong> <em>斜体</em> <s>删除线</s></p>").run();
md = ed.getMarkdown();
check("E-04", "粗体/斜体/删除线", md.includes("**粗体**") && md.includes("*斜体*") && md.includes("~~删除线~~"), md.trim());

// Editor-05: 无序/有序列表
ed.commands.clearContent();
ed.chain().setContent("<ul><li><p>项目一</p></li><li><p>项目二</p></li></ul><ol><li><p>编号一</p></li></ol>").run();
md = ed.getMarkdown();
check("E-05", "无序/有序列表", md.includes("- 项目一") && md.includes("- 项目二") && md.includes("1. 编号一"), md.replace(/\n/g, " | "));

// Editor-06: 引用
ed.commands.clearContent();
ed.chain().setContent("<blockquote><p>引用内容</p></blockquote>").run();
md = ed.getMarkdown();
check("E-06", "引用", md.includes("> 引用内容"), md.trim());

// Editor-07: 链接
ed.commands.clearContent();
ed.chain().setContent('<p><a href="https://example.com">示例链接</a></p>').run();
md = ed.getMarkdown();
check("E-07", "链接", md.includes("[示例链接](https://example.com)"), md.trim());

// Editor-08/09: 图片（NodeView 预览在浏览器层验证；此处验证 Markdown 序列化）
ed.commands.clearContent();
ed.chain().setContent('<p><img src="/uploads/test.png" alt="测试图片"></p>').run();
md = ed.getMarkdown();
check("E-08", "图片序列化", md.includes("![测试图片](/uploads/test.png)"), md.trim());

// Editor-13: Markdown round-trip（构造 → Markdown → 重新加载 → 再序列化一致）
const sample = `# 京都之旅

**粗体**与*斜体*和~~删除线~~。

## 清水寺

- 湖边散步
- 看红嘴鸥

1. 第一站
2. 第二站

> 建议清晨来一次。

[链接文字](https://example.com)

![图片说明](/uploads/test.png)

---

\`\`\`js
const a = 1;
\`\`\`
`;
ed.commands.setContent(sample, { contentType: "markdown" });
const md2 = ed.getMarkdown();
// 逐段验证关键语法
const roundtrip =
  md2.includes("# 京都之旅") &&
  md2.includes("**粗体**") &&
  md2.includes("*斜体*") &&
  md2.includes("~~删除线~~") &&
  md2.includes("- 湖边散步") &&
  md2.includes("1. 第一站") &&
  md2.includes("> 建议清晨来一次") &&
  md2.includes("[链接文字](https://example.com)") &&
  md2.includes("![图片说明](/uploads/test.png)") &&
  md2.includes("```js");
check("E-13", "Markdown round-trip（旧文章 10 类语法无丢失）", roundtrip, md2.length + " chars");

// Editor-02: 旧 Markdown 加载为 WYSIWYG（HTML 结构）
ed.commands.setContent("# 清晨的滇池\n\n- 湖边散步\n\n> 引用", { contentType: "markdown" });
const html = ed.getHTML();
check("E-02", "旧 Markdown → 编辑器结构正确", html.includes("<h1>") && html.includes("<ul>") && html.includes("<blockquote>"), html.slice(0, 120));

// 总结
const passCount = results.filter((r) => r.pass).length;
console.log(`\n===== 结果：${passCount}/${results.length} 通过 =====`);
ed.destroy();
process.exit(passCount === results.length ? 0 : 1);
