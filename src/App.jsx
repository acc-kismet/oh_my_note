import { useCallback, useMemo, useState } from "react";
import { useCreateBlockNote, createReactBlockSpec, SuggestionMenuController } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

const ExcalidrawBlock = createReactBlockSpec(
  { type: "excalidraw", propSchema: { data: { default: "" } }, content: "none" },
)(
  {
    render: ({ block, editor }) => {
      return (
        <div contentEditable={false} className="board-block">
          <div className="board-block__header">
            <div>
              <span className="board-block__eyebrow">Excalidraw</span>
              <strong>内嵌画板</strong>
            </div>
          </div>
          <div className="board-block__canvas" id={`excalidraw-${block.id}`}>
            <ExcalidrawWrapper block={block} editor={editor} />
          </div>
        </div>
      );
    },
  },
);

function ExcalidrawWrapper({ block, editor }) {
  const [Excalidraw, setExcalidraw] = useState(null);
  const [loading, setLoading] = useState(true);

  useCallback(() => {
    import("@excalidraw/excalidraw").then((mod) => {
      setExcalidraw(() => mod.Excalidraw);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8a7966" }}>
        正在加载画板...
      </div>
    );
  }

  if (!Excalidraw) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8a7966" }}>
        画板加载失败
      </div>
    );
  }

  return <Excalidraw />;
}

const schema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, excalidraw: ExcalidrawBlock },
});

const initialContent = [
  {
    type: "heading",
    props: { level: 1 },
    content: "轻文档画板",
  },
  {
    type: "paragraph",
    content: "输入 / 打开中文快捷菜单。试试 /一级标题、/二级标题、/待办、/画板",
  },
  {
    type: "checkListItem",
    content: "把文档和白板放在同一个工作流里",
  },
];

function makeSlashItems(editor) {
  const insert = (block) => {
    const current = editor.getTextCursorPosition().block;
    editor.insertBlocks([block], current, "after");
  };

  return [
    {
      title: "一级标题",
      subtext: "大标题",
      icon: "H1",
      key: "heading",
      onItemClick: () => insert({ type: "heading", props: { level: 1 }, content: "" }),
    },
    {
      title: "二级标题",
      subtext: "中标题",
      icon: "H2",
      key: "heading_2",
      onItemClick: () => insert({ type: "heading", props: { level: 2 }, content: "" }),
    },
    {
      title: "三级标题",
      subtext: "小标题",
      icon: "H3",
      key: "heading_3",
      onItemClick: () => insert({ type: "heading", props: { level: 3 }, content: "" }),
    },
    {
      title: "正文",
      subtext: "普通段落",
      icon: "P",
      key: "paragraph",
      onItemClick: () => insert({ type: "paragraph", content: "" }),
    },
    {
      title: "待办列表",
      subtext: "可勾选任务",
      icon: "☑",
      key: "checkListItem",
      onItemClick: () => insert({ type: "checkListItem", content: "" }),
    },
    {
      title: "无序列表",
      subtext: "项目符号列表",
      icon: "•",
      key: "bulletListItem",
      onItemClick: () => insert({ type: "bulletListItem", content: "" }),
    },
    {
      title: "有序列表",
      subtext: "编号列表",
      icon: "1.",
      key: "numberedListItem",
      onItemClick: () => insert({ type: "numberedListItem", content: "" }),
    },
    {
      title: "画板",
      subtext: "Excalidraw 画布",
      icon: "🎨",
      key: "excalidraw",
      onItemClick: () => insert({ type: "excalidraw", props: { data: "" } }),
    },
  ];
}

function filterSlashItems(items, query) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const text = [item.title, item.subtext, item.key].join(" ").toLowerCase();
    return text.includes(q);
  });
}

function App() {
  const editor = useCreateBlockNote({ schema, initialContent });

  const getSlashItems = useCallback(
    async (query) => filterSlashItems(makeSlashItems(editor), query),
    [editor],
  );

  const today = useMemo(
    () => new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date()),
    [],
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="workspace-mark">LN</div>
        <div>
          <p className="sidebar-kicker">Workspace</p>
          <h1>轻文档</h1>
        </div>
        <nav className="doc-list">
          <button className="doc-list__item doc-list__item--active">画板文档</button>
          <button className="doc-list__item">产品想法</button>
          <button className="doc-list__item">会议记录</button>
        </nav>
        <div className="sidebar-card">
          <span>快捷命令</span>
          <strong>/画板</strong>
          <p>输入 / 后选择一级标题、二级标题、待办或画板。</p>
        </div>
      </aside>

      <section className="document-stage">
        <header className="topbar">
          <div>
            <span>{today}</span>
            <strong>本地优先的块级编辑器</strong>
          </div>
        </header>
        <article className="paper">
          <div className="paper-meta">
            <span>NOTE + BOARD</span>
            <span>BlockNote / Excalidraw</span>
          </div>
          <BlockNoteView editor={editor} slashMenu={false} theme="light">
            <SuggestionMenuController triggerCharacter="/" getItems={getSlashItems} />
          </BlockNoteView>
        </article>
      </section>
    </main>
  );
}

export default App;
