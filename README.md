# QuanWenG 个人博客

一个使用 React、TypeScript、Vite 和 Three.js 构建的静态个人博客。站点包含双屏首页、技术星图、Markdown 笔记、静态批注、项目瀑布流、全局音乐盒以及中英文/深浅色切换。

## 本地开发

```bash
npm ci
npm run dev
```

质量检查：

```bash
npm run lint
npm run test
npm run build
npm run preview
```

## 内容配置

- `src/data/site.json`：站点标题、首页终端和作者信息。
- `src/data/ui.json`：固定 UI 的中英文文案。
- `src/data/navigation.json`：顶部导航与首页锚点。
- `src/data/tech-stack.json`：技术星图节点。
- `src/data/projects.json`：项目卡片；按 `featured`、`weight` 和配置顺序展示，生产环境隐藏 `draft`。
- `src/data/music.json`：歌单；`src` 使用相对 `BASE_URL` 的媒体路径。
- `src/data/annotations.json`：只读批注，使用 `mdPath + blockId` 定位。

Markdown 放入 `src/assets/markdown/<分类>/<文章>.md`。构建时会自动生成目录、文章路由和全文搜索索引，无需手工注册。文章地址为 `/blog/<分类>/<文章>`。

音乐媒体放入 `public/media/music`。播放器不会自动播放，只有用户主动操作后才会启用 Web Audio 律动和 Media Session。

## 批注格式

```json
{
  "src/assets/markdown/java/java基础.md": {
    "b-listItem-0-2": [
      { "id": "note-001", "content": "批注内容" }
    ]
  }
}
```

`blockId` 由 Markdown AST 的节点类型和结构路径生成。修改文字不会改变 ID，插入或移动结构块可能需要同步批注。

## 数据服务与后端

默认通过本地 JSON/Markdown 读取内容。设置 `VITE_API_BASE_URL` 后会请求公开接口，并在失败时回退本地数据：

- `/site`、`/ui`、`/navigation`、`/tech-stack`
- `/projects`、`/music`、`/annotations`
- `/blog`、`/blog/{id}`

前端不保存密钥、管理令牌或写入权限。

## 部署

推送到 `main` 后，GitHub Actions 会依次执行 `npm ci`、lint、test、build，并部署 `dist` 到 GitHub Pages。`public/404.html` 会把深层路由转回 SPA，因此 `/blog/*` 可直接刷新。