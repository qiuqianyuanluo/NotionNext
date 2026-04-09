# Twikoo 表单与通知配置

这个项目已经增加了一个 Twikoo 配置脚本，可以直接把常用表单设置写入 Twikoo 后端。

## 目标配置

- 只显示 `昵称` 和 `邮箱`
- `昵称` 必填，`邮箱` 选填
- 留言框提示文案：
  - `邮箱用于接收回复的邮件提醒XD，邮箱地址不公开`

## 使用方法

```bash
cd /Users/tiger/Downloads/NotionNext
npm run config:twikoo -- \
  --url https://your-twikoo-url.vercel.app \
  --password '你的管理员密码' \
  --set DISPLAYED_FIELDS=nick,mail \
  --set REQUIRED_FIELDS=nick \
  --set COMMENT_PLACEHOLDER='邮箱用于接收回复的邮件提醒XD，邮箱地址不公开'
```

### 说明

- `--url`：Twikoo 后端 URL
- `--password`：Twikoo 管理员密码
- 如果该 Twikoo 后端还没有初始化管理员密码，脚本会先自动初始化
- 如果已经有管理员密码，脚本会直接登录并保存配置

## 额外建议

如果后面要启用邮件通知，建议再到 Twikoo 管理端补全这些配置：

- `BLOGGER_EMAIL`
- `SENDER_EMAIL`
- `SMTP_SERVICE`
- `SMTP_USER`
- `SMTP_PASS`

当前博客前端也支持通过环境变量覆盖留言框提示文案：

```text
NEXT_PUBLIC_COMMENT_TWIKOO_PLACEHOLDER=邮箱用于接收回复的邮件提醒XD，邮箱地址不公开
```

这个前端占位文案会优先于后端 `COMMENT_PLACEHOLDER`。
