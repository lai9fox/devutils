# DevUtils

DevUtils 是一个面向开发者的在线工具站，聚焦本地处理、即开即用和高频小工具场景。项目基于 Nuxt 4 构建，覆盖编码转换、文本处理、时间处理、颜色转换、安全辅助等常见开发需求。

在线地址：<https://devutils.fox9.dev>

## ✨ 特性

- 本地处理优先：输入内容默认在浏览器本地完成计算，不依赖后端服务。
- 开发者高频工具集合：围绕日常开发中的格式化、转换、校验、生成、解析等场景设计。
- 快速检索与直达：首页搜索、分类和命令面板都由统一工具注册表驱动。
- 响应式界面：桌面端和移动端都可直接使用。
- 易于扩展：新增工具只需添加工具组件，并在集中注册表与组件映射中声明。

## 🧰 当前工具

目前已包含以下工具：

### 编码与格式化

- YAML 格式化：YAML 格式化、压缩、校验，以及 YAML 与 JSON 双向转换。
- JSON 格式化：JSON 格式化、压缩、校验与美化。
- XML 格式化：XML 格式化、压缩、校验，以及 XML 转 JSON。
- JSON Schema 校验：使用 JSON Schema 校验 JSON 数据，支持 format、本地 $ref、$defs 与 definitions。
- CSV / TSV 转换：解析 CSV、TSV、分号或竖线分隔文本，并转换为 JSON、Markdown、CSV、TSV。
- Base64 编解码：文本 Base64 编码与解码。
- URL 编解码：支持 encodeURI 和 encodeURIComponent 两种模式。
- HTML 实体编解码：特殊字符与 HTML 实体互转。
- Data URI 编解码：文本或文件与 Data URI 互转，支持 MIME、Base64、图片和文本预览。
- URL / Query 解析：解析完整 URL、相对 URL 或 query string，保留重复参数并输出 JSON。

### 文本与内容处理

- 文本对比：支持逐字、逐词、逐行对比并高亮差异。
- 文本统计：统计字符数、单词数、行数、段落数和阅读时间。
- 正则测试器：实时测试正则表达式并展示匹配结果与捕获组。
- Lorem 生成器：按段落、句子、单词生成占位文本。
- Unicode 查询：查看字符码点、UTF-8、UTF-16 等编码信息。
- 大小写转换：在 camelCase、PascalCase、snake_case、kebab-case 等命名风格间转换。
- JSON 路径提取：用轻量路径表达式从 JSON 中提取字段或数组元素。

### 时间与调度

- 时间戳转换：Unix 时间戳与日期时间互转，支持秒和毫秒。
- Cron 解析器：将 Cron 表达式解析为自然语言并计算后续执行时间。

### 数值与样式

- 进制转换：二进制、八进制、十进制、十六进制互转。
- CSS 单位转换：px、rem、em、pt、vw、vh 等单位换算。
- 颜色转换：HEX、HEX8、RGB、HSL、HSV、CMYK、OKLCH 互转并实时预览。

### 安全与标识

- Hash 摘要：计算文本或文件的 MD5、SHA-1、SHA-256、SHA-384、SHA-512 摘要。
- JWT 解码器：解析 JWT Header 和 Payload，检查过期时间。
- 密码生成器：生成可配置长度和字符集的随机密码。
- UUID 生成器：支持 v1、v3、v4、v5、v6、v7 多版本 UUID 批量生成。

## 🛠️ 技术栈

- Nuxt 4
- Vue 3
- Nuxt UI
- TailwindCSS v4
- TypeScript
- pnpm
- dayjs
- diff
- colord
- uuid
- yaml
- ajv
- fast-xml-parser
- papaparse

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

默认访问地址：<http://localhost:3000>

### 构建生产版本

```bash
pnpm build
```

### 本地预览生产构建

```bash
pnpm preview
```

### 代码检查

```bash
pnpm lint
pnpm typecheck
```

## 📁 项目结构

```text
app/
	components/          通用 UI 组件
	components/tools/    各个工具实现组件
	composables/         工具检索与状态管理
	data/                工具注册表与组件映射
	layouts/             页面布局
	pages/
		index.vue          首页：搜索、分类、工具列表
		[toolid].vue       工具详情页：根级动态路由
	types/               类型定义
public/                静态资源
```

## ➕ 如何新增工具

新增工具时，遵循当前项目约定：

1. 在 `app/components/tools` 下新增一个 kebab-case 命名的工具组件，文件名与工具 id 保持一致。
2. 在 `app/data/tools.ts` 中新增工具元数据，包括 `id`、`path`、`category`、`icon`、`name`、`description`、`keywords`、`seoTitle`、`seoDescription`、`order` 等字段。
3. 在 `app/data/tool-components.ts` 中把工具 id 映射到新增组件。
4. 工具正式访问路径为根级 slug，例如 `/json-formatter`、`/base64-codec`。
5. 尽量保持本地处理，不引入后端依赖；复用现有组件和交互模式，例如复制、清空、交换、错误提示等。

## 📄 License

[MIT](./LICENSE)
