# DevUtils · 现代开发者实用工具箱

DevUtils 是一个面向现代开发者的高效在线工具箱，基于 **Astro 5 + Vue 3 孤岛 + Tailwind CSS v4 + CodeMirror 6** 构建，兼顾极致的首屏性能与专业的代码编辑交互。所有运算均在浏览器本地完成，零数据上报，安全隐私。

在线地址：<https://devutils.fox9.dev>

---

## ✨ 核心特性

- **100% 浏览器本地运算**：所有解析、修复、Diff 对比、代码生成均在客户端完成，零数据上报，保障开发隐私与安全。
- **专精深度交互**：告别浅尝辄止，提供格式化智能修复、语义 Diff、Schema 校验与推导、JSONPath 提取、多语言类型生成、多格式互转与转义。
- **现代化 UI & 自由工作台**：
  - **首页**：现代极简落地页 + 核心特性介绍 + 实时搜索/分类工具网格。
  - **工具页**：**自由双栏工作台布局**（左侧常驻/折叠的工具导航列表，右侧宽敞高效的编辑工作区，支持无刷新瞬时切换）。
- **极速 SSG 静态生成**：基于 Astro 5 静态预渲染，页面毫秒级加载。
- **快捷键与全局命令面板**：支持 `⌘K` / `Ctrl+K` 全局检索、深浅色模式随心切换。

---

## 🧰 核心工具列表

| 工具 ID | 工具名称 | 核心亮点 |
| :--- | :--- | :--- |
| `json-formatter` | **JSON Formatter** | 格式化 / 美化 / 压缩 JSON：2/4/Tab 缩进美化、单行压缩、未加引号 key 自动修复、移除尾随逗号、文档度量统计。 |
| `json-validator` | **JSON Validator** | 检查 JSON 是否合法并定位错误：严格 RFC 8259 语法校验、精确行号与列号定位、代码上下文视差指示指针、中文排错建议与一键修复。 |
| `json-viewer` | **JSON Viewer** | 阅读、折叠、搜索大型 JSON：交互式树形视图、多层级折叠展开控制、全文搜索高亮与命中导航、节点 JSONPath 提取与双栏模式。 |
| `json-path` | **JSON Path** | 查询 / 提取 JSON 数据：交互式测试 JSONPath 提取表达式（通配符、过滤器、切片与多层级遍历），内置常用语法速查。 |
| `json-converter` | **JSON Converter** | JSON ↔ YAML / XML / CSV 等：无缝双向互转，保持结构完整并提供格式化输出。 |
| `json-to-types` | **JSON to Type** | JSON → TypeScript / Java / Go 类型：根据 JSON 自动推断生成 TypeScript、Java (POJO/Record/Lombok)、Go Struct 等类型定义。 |

---

## 🛠️ 技术栈

- **驱动框架**：Astro 5 (SSG 静态生成)
- **组件系统**：Vue 3 (`@astrojs/vue`)
- **编辑器**：CodeMirror 6 (`@codemirror/view`, `@codemirror/state`, `@codemirror/lang-json` 等)
- **样式体系**：Tailwind CSS v4 (`@tailwindcss/vite`) + 现代设计变量
- **图标系统**：Lucide (`@lucide/vue`)
- **核心算法**：`ajv`, `ajv-formats`, `jsonpath-plus`, `yaml`, `fast-xml-parser`, `papaparse`, `diff`
- **包管理器**：pnpm 10

---

## 🚀 本地开发

### 环境要求

- Node.js 20 或更高版本
- pnpm 10 或更高版本

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
pnpm dev
```

默认访问地址：<http://localhost:4321>

### 构建生产版本

```bash
pnpm build
```

### 本地预览生产构建

```bash
pnpm preview
```

### 类型检查

```bash
pnpm check
```

---

## 📁 目录结构

```text
src/
  components/
    common/         全局通用组件（Header, CommandPalette, Footer）
    editor/         基于 CodeMirror 6 的专业代码编辑器组件
    home/           首页组件（Hero 落地页, ToolGrid 工具网格）
    tools/          6 大核心 JSON 工具实现组件
    workspace/      自由布局工作台容器（左侧工具导航 + 右侧工作区）
  data/             JSON 工具元数据与分类注册表
  layouts/          基础页面 HTML 骨架（BaseLayout.astro）
  pages/
    index.astro     首页（落地页 + 工具网格）
    [toolId].astro  动态工具页（挂载自由工作台）
    404.astro       404 容错页
  styles/           Tailwind v4 与深浅色全局样式（global.css）
  types/            TypeScript 类型定义
  utils/            JSON 智能修复、Diff、类型生成、Schema 推导算法
public/             静态资源（favicon.svg, robots.txt）
astro.config.mjs    Astro 配置文件
```

---

## 📄 License

[MIT](./LICENSE)
