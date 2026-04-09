# Twikoo 测试与 Cusdis 迁移计划

这份说明只服务于当前博客：

- 现网评论系统：Cusdis Cloud
- 测试目标：先在 Preview 环境单独验证 Twikoo
- 迁移目标：尽量迁移旧评论，再切主站

## 一、先做 Twikoo 测试

### 1. 准备一套独立的 Twikoo 后端

建议：

- Twikoo 后端：Vercel
- 数据库：MongoDB Atlas Free
- 自定义域名：`comments.kylinbag.top` 或 `twikoo.kylinbag.top`

### 2. 在博客 Preview 环境里添加变量

保留现有的 Cusdis 配置不动，只给 Preview 新增：

```bash
NEXT_PUBLIC_COMMENT_ACTIVE_SERVICE=twikoo
NEXT_PUBLIC_COMMENT_ENV_ID=https://comments.kylinbag.top
```

如果测试阶段先不绑自定义域名，也可以先填：

```bash
NEXT_PUBLIC_COMMENT_ENV_ID=https://你的-twikoo-vercel-项目.vercel.app
```

注意：

- `NEXT_PUBLIC_COMMENT_ACTIVE_SERVICE=twikoo` 会强制当前环境只显示 Twikoo
- 这样 Preview 可以看 Twikoo，Production 仍然保留 Cusdis

## 二、迁移旧评论的思路

迁移不走数据库硬写，而是：

1. 从 Cusdis 后台 API 导出评论
2. 转成 Twikoo 备份 JSON
3. 导入 Twikoo

## 三、本地导出与转换脚本

脚本位置：

```bash
node scripts/cusdis-to-twikoo.js --help
```

### 1. 直接从 Cusdis 后台 API 拉取并转换

```bash
CUSDIS_COOKIE='你的完整 Cookie header' \
node scripts/cusdis-to-twikoo.js \
  --project-id 你的_cusdis_project_id \
  --raw-out ./tmp/cusdis-raw.json \
  --out ./tmp/twikoo-comments.json
```

### 2. 如果已经手动导出过 Cusdis JSON

```bash
node scripts/cusdis-to-twikoo.js \
  --input ./tmp/cusdis-raw.json \
  --out ./tmp/twikoo-comments.json
```

## 四、迁移前要确认的点

1. 文章路径是否稳定

- Twikoo 依赖页面路径区分文章
- Cusdis 导出的 `page.url` 必须能映射到博客当前文章 URL

2. 回复层级是否正确

- 脚本会把 `parentId` 转成 `pid`
- 会额外补出根评论 `rid`

3. 邮件通知订阅状态不要强依赖可迁

- 评论正文、昵称、时间、楼层基本可迁
- 旧的回复订阅关系不保证能完整保留

## 五、切换顺序建议

1. Twikoo Preview 跑通
2. 测试新评论
3. 导入旧评论
4. 抽样检查几篇有回复的文章
5. Production 切到 Twikoo
6. 保留 Cusdis 一段时间再决定是否停用
