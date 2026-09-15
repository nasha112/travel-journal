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

const el = dom.window.document.createElement("div");
const ed = new Editor({ element: el, extensions: [StarterKit, Markdown] });

const irPlugins = ed.view.state.plugins.filter((p) => p.spec.isInputRules === true);
console.log("INPUT_RULES_PLUGINS:", irPlugins.length);

function typeText(editor, text) {
  const view = editor.view;
  for (const ch of text) {
    const { from, to } = view.state.selection;
    let handled = false;
    for (const p of view.state.plugins) {
      const fn = p.spec.props && p.spec.props.handleTextInput;
      if (typeof fn === "function") {
        try {
          if (fn(view, from, to, ch)) { handled = true; break; }
        } catch (e) { }
      }
    }
    if (!handled) view.dispatch(view.state.tr.insertText(ch));
  }
}

typeText(ed, "# ");
console.log("AFTER '# ':", ed.getHTML());

ed.commands.clearContent();
typeText(ed, "## ");
console.log("AFTER '## ':", ed.getHTML());

ed.commands.clearContent();
typeText(ed, "- ");
console.log("AFTER '- ':", ed.getHTML());

ed.commands.clearContent();
typeText(ed, "> ");
console.log("AFTER '> ':", ed.getHTML());

ed.commands.clearContent();
typeText(ed, "1. ");
console.log("AFTER '1. ':", ed.getHTML());

ed.destroy();
