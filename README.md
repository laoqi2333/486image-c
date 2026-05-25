# 486image-C

> 一款轻量化的摄影师返图选图筛图系统 —— 让客户在线选片，摄影师一键下载。
- ⚠本项目含有部分AI生成内容，具体声明见自述文件底部！


---

## 功能一览
### 界面一览
### 移动端
<img width="516" height="1119" alt="移动端入口页" src="https://github.com/user-attachments/assets/c7d72a31-f119-4d6a-acbf-352d19ac8b22" />
<img width="516" height="1119" alt="选图页" src="https://github.com/user-attachments/assets/ceb264a4-2e6c-4203-80d2-5747befd21fb" />

### 桌面端
<img width="2560" height="1229" alt="入口页" src="https://github.com/user-attachments/assets/09a14bf6-04ed-422d-bfa6-30c8d21e355a" />
<img width="2560" height="1229" alt="选图页" src="https://github.com/user-attachments/assets/e783033d-5405-4eaa-a645-6568bc4ce646" />
<img width="2560" height="1229" alt="选图结果后台" src="https://github.com/user-attachments/assets/a3241706-f5fc-4cc3-b6da-f480b97460d5" />



### 📸 客户选图端

| 功能 | 说明 |
|------|------|
| **相册入口** | 输入相册编号进入，支持魅惑渐变背景、自定义背景图、毛玻璃登录卡片 |
| **照片浏览** | 响应式网格布局，全设备适配，照片缩略图懒加载 |
| **选中/取消** | 单击切换选中状态，红色勾选角标一目了然 |
| **全屏预览** | 双击照片进入大图模式，支持 **缩放**（滚轮/按钮/键盘 `+` `-` `0`）、**拖拽平移**、键盘 `←` `→` 翻页 |
| **查看大图** | 卡片右下角 👁 按钮或预览工具栏，新标签页打开原图 |
| **提交选择** | 一键提交已选照片，支持底部固定提交栏 |
| **一言 API** | 入口副标题可选「一言」随机句子，每次刷新不同 |

### 🛠 摄影师管理后台

| 功能 | 说明 |
|------|------|
| **登录保护** | 密码验证，系统设置中可修改 |
| **相册管理** | 创建/删除相册，每相册独立编号链接 |
| **上传照片** | 拖拽或选择文件批量上传，单张最大可配置（1~500MB） |
| **照片管理** | 网格预览、批量选择/删除、点击缩略图预览 |
| **选图结果** | 按客户分组查看每张选中照片，显示原始文件名，支持单张下载 |
| **分享链接** | 一键复制相册链接，发给客户即可选图 |

### ⚙️ 系统设置

全部通过管理后台「系统设置」界面操作，无需改代码：

| 配置项 | 说明 |
|--------|------|
| **网站名称** | 修改后同步更新客户页和管理后台的品牌名、页面标题 |
| **入口副标题** | 自定义文字 或 一言 API 随机句子 |
| **入口背景图** | 本地上传 或 外链 URL，输入框聚焦时虚化加重 |
| **CDN 加速** | 配置 CDN 域名前缀，图片 URL 自动切换为 CDN 路径 |
| **上传大小限制** | 1~500MB 可调，修改后实时生效 |
| **页脚内容** | 支持 HTML 的自定义页脚 |
| **选图提示语** | 客户提交后显示的感谢语，支持 `{count}` 占位符 |
| **管理员密码** | 修改后台登录密码 |

### 🎨 设计亮点

- **纯 CSS 图标** — 20+ 种图标全部用 CSS 伪元素实现，零带宽开销
- **毛玻璃效果** — 登录卡片、页脚、预览工具栏使用 `backdrop-filter`
- **深色主题** — 专业摄影气质，深蓝主色调 + 珊瑚红强调色
- **全设备适配** — 360px~4K 显示器，5 个断点 + 横屏 + 安全区域
- **页脚贴底** — 所有页面 flex 布局撑满视口，页脚永远在最底
- **无数据库** — 使用 JSON 文件存储，无需安装 MySQL/PostgreSQL/MongoDB
- **无前端框架** — 原生 HTML + CSS + JavaScript，无 React/Vue/jQuery
- **无图标库** — 所有图标纯 CSS 实现，无 Font Awesome/Ionicons
- **无编译步骤** — 直接运行源码，无需 Webpack/Vite/Babel


---

## 系统环境要求

| 项目 | 最低要求 | 推荐 |
|------|---------|------|
| **Node.js** | 18.x | **22.x** |
| **内存** | 256 MB | 512 MB+ |
| **磁盘** | 500 MB | 1 GB+（视照片量） |
| **操作系统** | Linux / macOS / Windows |

### 依赖包

仅 3 个运行时依赖，均为 MIT 开源许可：

| 包名 | 用途 | 版本 |
|------|------|------|
| [Express](https://expressjs.com/) | Web 框架 | ^4.18.2 |
| [Multer](https://github.com/expressjs/multer) | 文件上传处理 | ^1.4.5-lts.1 |
| [UUID](https://github.com/uuidjs/uuid) | 唯一 ID 生成 | ^9.0.0 |


---

## 快速部署

### 1. 安装 Node.js

```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Windows / macOS
# 从 https://nodejs.org/ 下载安装包

# 验证
node -v   # v22.x.x
npm -v    # 10.x.x
```

### 2. 下载源码

```bash
git clone https://github.com/laoqi2333/486image-c
# 或直接上传 486network-image/ 目录到服务器
```

### 3. 安装依赖 & 启动

```bash
cd /Path/to/your/file
npm install
node server.js
```

看到以下输出即启动成功：

```
🚀 486Network image 启动成功
📸 管理后台: http://localhost:3000/admin.html
🖼️  客户选图: http://localhost:3000/
⚙️  端口: 3000  密码: admin123
```

### 4. 访问

| 页面 | 地址 |
|------|------|
| **客户选图** | `http://你的IP:3000/` |
| **管理后台** | `http://你的IP:3000/admin.html` |
| **默认密码** | `admin123`（**务必第一时间修改！**） |

### 5. 开放防火墙

```bash
# Ubuntu
sudo ufw allow 3000/tcp

# 云服务商 → 安全组 → 添加入站规则：TCP 3000
```

---

## 生产环境部署


- ✅ PM2 进程管理（崩溃重启、开机自启、日志）
- ✅ Nginx 反向代理 + HTTPS（Let's Encrypt）
- ✅ CDN 加速配置（阿里云 OSS 示例）
- ✅ 安全加固建议
- ✅ 数据备份与恢复

### 阿里云 OSS + CDN 示例

```bash
# 安装 ossutil
# 将 uploads/ 同步到 OSS Bucket
ossutil sync /opt/486network-image/uploads/ oss://your-bucket/uploads/
```

然后在后台 CDN 配置中填写：`https://your-bucket.oss-cn-hangzhou.aliyuncs.com`

> 提示：CDN 配置是全局的，如有多个相册使用不同 CDN，可在每个相册的「相册设置」中独立配置。

---

## 项目结构

```
486network-image/
├── server.js              # 后端服务 (入口)
├── package.json           # 项目配置
├── README.md              # 本文件
├── DEPLOY.md              # 生产部署指南
├── data/
│   └── database.json      # JSON 数据库（自动生成）
├── public/
│   ├── index.html         # 客户选图页面
│   ├── admin.html         # 管理后台
│   └── css/
│       └── main.css       # 全局样式 + 纯 CSS 图标
└── uploads/               # 上传图片（按相册分目录）
```

## 自定义接口

配置全部通过管理后台「系统设置」界面完成，后端预留了以下 CDN 及扩展接口：

| API | 说明 |
|-----|------|
| `GET/POST /api/config/cdn` | CDN 域名前缀 |
| `GET/POST /api/config/site-name` | 网站名称 |
| `GET/POST /api/config/entry-subtitle` | 入口副标题（含模式） |
| `GET/POST /api/config/entry-bg` | 入口背景图 |
| `POST /api/config/entry-bg/upload` | 上传背景图 |
| `GET/POST /api/config/footer` | 页脚内容 |
| `GET/POST /api/config/success-message` | 选图成功提示语 |
| `GET/POST /api/config/upload-size` | 上传大小限制 |
| `GET/POST /api/config/password` | 管理员密码 |
| `GET /api/albums/:id/photos/:id/download` | 下载原图（UTF-8 文件名） |

---

## 致谢

本项目的开发离不开以下优秀的开源项目：

### 运行时依赖

- **[Express](https://expressjs.com/)**（MIT）— 轻量灵活的 Node.js Web 框架，项目后端基石
- **[Multer](https://github.com/expressjs/multer)**（MIT）— 优雅的 `multipart/form-data` 文件上传中间件
- **[UUID](https://github.com/uuidjs/uuid)**（MIT）— 可靠的唯一标识符生成

### 灵感与参考

- **[一言（Hitokoto）](https://developer.hitokoto.cn/)** — 提供入口页随机句子 API，为产品增添温度
- **[Lucide](https://lucide.dev/)**（ISC）— 开源图标库的设计风格参考，虽未直接使用图标资源
- **[shadcn/ui](https://ui.shadcn.com/)**（MIT）— 卡片、输入框等组件设计美学参考
- 纯 CSS 图标设计受 [CSS ICON](https://cssicon.space/) 启发

---
## AI生成声明
- 本项目的部分内容由OpenClaw + Deepseek V4辅助编写，具体内容如下：
- 1.前后端API对接
- 2.CDN支持
- 3.一言API对接
- 4.纯CSS的按钮图标适配
- 5.本README自述文件
- 如果将本程序用作特定用途，请注意AI生成内容是否合规，并在保留作者信息的前提下自行修改

## 许可

MIT © SY Studio
