import { useCallback, useMemo } from "react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import {
  SuggestionMenuController,
  createReactBlockSpec,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "@excalidraw/excalidraw/index.css";

const initialContent = [
  {
    type: "heading",
    props: { level: 1 },
    content: "轻文档画板",
  },
  {
    type: "paragraph",
    content: "输入 / 打开中文快捷菜单。试试 /一级标题、/二级标题、/待办、/画板。",
  },
  {
    type: "checkListItem",
    content: "把文档和白板放在同一个工作流里",
  },
];

function safeParseExcalidrawData(data) {
  if (!data) {
    return { elements: [], appState: {} };
  }

  try {
    const parsed = JSON.parse(data);
    return {
      elements: Array.isArray(parsed.elements) ? parsed.elements : [],
      appState: parsed.appState && typeof parsed.appState === "object" ? parsed.appState : {},
    };
  } catch {
    return { elements: [], appState: {} };
  }
}

const ExcalidrawBlock = createReactBlockSpec(
  {
    type: "excalidraw",
    propSchema: {
      data: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const initialData = safeParseExcalidrawData(block.props.data);

      return (
        <section className="board-block">
          <div className="board-block__header" contentEditable={false}>
            <div>
              <span className="board-block__eyebrow">Excalidraw</span>
              <strong>内嵌画板</strong>
            </div>
            <span className="board-block__hint">自动保存到当前文档块</span>
          </div>
          <div className="board-block__canvas" contentEditable={false}>
            <Excalidraw
              initialData={initialData}
              onChange={(elements, appState) => {
                const data = JSON.stringify({
                  elements,
                  appState: {
                    viewBackgroundColor: appState.viewBackgroundColor,
                    currentItemStrokeColor: appState.currentItemStrokeColor,
                    currentItemBackgroundColor: appState.currentItemBackgroundColor,
                    currentItemFillStyle: appState.currentItemFillStyle,
                    currentItemStrokeWidth: appState.currentItemStrokeWidth,
                    currentItemRoughness: appState.currentItemRoughness,
                    currentItemOpacity: appState.currentItemOpacity,
                  },
                });

                if (data !== block.props.data) {
                  editor.updateBlock(block, {
                    props: { data },
                  });
                }
              }}
            />
          </div>
        </section>
      );
    },
  },
);

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    excalidraw: ExcalidrawBlock,
  },
});

function insertBlock(editor, block) {
  const currentBlock = editor.getTextCursorPosition().block;
  editor.insertBlocks([block], currentBlock, "after");
  editor.removeBlocks([currentBlock]);
}

function makeSlashItems(editor) {
  return [
    {
      title: "一级标题",
      subtext: "大标题 / H1",
      aliases: ["h1", "标题1", "一级", "biaoti1"],
      group: "基础块",
      icon: <span className="slash-icon">H1</span>,
      onItemClick: () => insertBlock(editor, { type: "heading", props: { level: 1 }, content: "" }),
    },
    {
      title: "二级标题",
      subtext: "章节标题 / H2",
      aliases: ["h2", "标题2", "二级", "biaoti2"],
      group: "基础块",
      icon: <span className="slash-icon">H2</span>,
      onItemClick: () => insertBlock(editor, { type: "heading", props: { level: 2 }, content: "" }),
    },
    {
      title: "三级标题",
      subtext: "小节标题 / H3",
      aliases: ["h3", "标题3", "三级", "biaoti3"],
      group: "基础块",
      icon: <span className="slash-icon">H3</span>,
      onItemClick: () => insertBlock(editor, { type: "heading", props: { level: 3 }, content: "" }),
    },
    {
      title: "正文",
      subtext: "普通文本段落",
      aliases: ["p", "paragraph", "wenzi", "duanluo"],
      group: "基础块",
      icon: <span className="slash-icon">文</span>,
      onItemClick: () => insertBlock(editor, { type: "paragraph", content: "" }),
    },
    {
      title: "待办",
      subtext: "可勾选任务项",
      aliases: ["todo", "task", "check", "daiban"],
      group: "列表",
      icon: <span className="slash-icon">☑</span>,
      onItemClick: () => insertBlock(editor, { type: "checkListItem", content: "" }),
    },
    {
      title: "项目符号列表",
      subtext: "无序列表",
      aliases: ["bullet", "list", "liebiao"],
      group: "列表",
      icon: <span className="slash-icon">•</span>,
      onItemClick: () => insertBlock(editor, { type: "bulletListItem", content: "" }),
    },
    {
      title: "编号列表",
      subtext: "有序列表",
      aliases: ["number", "ordered", "bianhao"],
      group: "列表",
      icon: <span className="slash-icon">1.</span>,
      onItemClick: () => insertBlock(editor, { type: "numberedListItem", content: "" }),
    },
    {
      title: "代码块",
      subtext: "粘贴或编写代码",
      aliases: ["code", "daima"],
      group: "高级块",
      icon: <span className="slash-icon">{`{}`}</span>,
      onItemClick: () => insertBlock(editor, { type: "codeBlock", content: "" }),
    },
    {
      title: "表格",
      subtext: "插入基础表格",
      aliases: ["table", "biaoge"],
      group: "高级块",
      icon: <span className="slash-icon">表</span>,
      onItemClick: () => insertBlock(editor, { type: "table" }),
    },
    {
      title: "画板",
      subtext: "插入 Excalidraw 无限画布",
      aliases: ["excalidraw", "draw", "whiteboard", "huaban", "baiban"],
      group: "高级块",
      icon: <span className="slash-icon">画</span>,
      onItemClick: () => insertBlock(editor, { type: "excalidraw", props: { data: "" } }),
    },
  ];
}

function filterSlashItems(items, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const searchable = [item.title, item.subtext, ...(item.aliases ?? [])].join(" ").toLowerCase();
    return searchable.includes(normalizedQuery);
  });
}

function App() {
  const editor = useCreateBlockNote({
    schema,
    initialContent,
  });

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
        <nav className="doc-list" aria-label="文档列表">
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
          <button className="sync-button">自动保存待接入</button>
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
