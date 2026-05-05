# 486Network image — 部署教程

> 摄影师返图选图系统，Node.js + Express + JSON 文件存储，零外部依赖。

---

## 目录

- [环境要求](#环境要求)
- [快速部署（Linux / macOS）](#快速部署linux--macos)
- [快速部署（Windows Server）](#快速部署windows-server)
- [生产环境最佳实践（PM2）](#生产环境最佳实践pm2)
- [Nginx 反向代理（推荐）](#nginx-反向代理推荐)
- [安全配置](#安全配置)
- [CDN 加速配置](#cdn-加速配置)
- [常见问题](#常见问题)

---

## 环境要求

| 项目 | 最低要求 | 推荐 |
|------|---------|------|
| Node.js | 18.x | **22.x** |
| 内存 | 256 MB | 512 MB+ |
| 磁盘 | 500 MB | 1 GB+（视照片量） |
| 操作系统 | Linux / macOS / Windows | Linux (Ubuntu 22.04+) |

---

## 快速部署（Linux / macOS）

### 1. 安装 Node.js

```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node -v   # 输出 v22.x.x
npm -v    # 输出 10.x.x
```

### 2. 上传源码

将 `486network-image/` 整个目录上传到服务器，例如：

```bash
# 本地打包
tar -czf 486network-image.tar.gz 486network-image/ --exclude=node_modules

# 上传到服务器（在本地执行）
scp 486network-image.tar.gz root@你的服务器IP:/opt/

# 服务器上解压（在服务器执行）
cd /opt
tar -xzf 486network-image.tar.gz
cd 486network-image
```

### 3. 安装依赖

```bash
cd /opt/486network-image
npm install
```

### 4. 启动服务

```bash
node server.js
```

看到以下输出即表示启动成功：

```
🚀 486Network image 启动成功
📸 管理后台: http://localhost:3000/admin.html
🖼️  客户选图: http://localhost:3000/
⚙️  端口: 3000  密码: admin123
```

### 5. 开放防火墙端口

```bash
# Ubuntu UFW
sudo ufw allow 3000/tcp
sudo ufw reload

# 云服务商安全组
# 登录云控制台 → 安全组 → 添加入站规则：TCP 3000
```

### 6. 访问

- **客户选图**: `http://你的服务器IP:3000/`
- **管理后台**: `http://你的服务器IP:3000/admin.html`
- **默认密码**: `admin123`（**务必第一时间修改！**）

---

## 快速部署（Windows Server）

### 1. 安装 Node.js

从官网下载安装包：
https://nodejs.org/en/download/

选择 **Windows 安装包 (.msi)**，版本 ≥ 18.x，一路默认安装。

验证安装（打开 PowerShell 或 CMD）：

```powershell
node -v
npm -v
```

### 2. 上传并安装

将 `486network-image` 整个文件夹放到服务器磁盘上，例如 `D:\486network-image\`。

```powershell
cd D:\486network-image
npm install
```

### 3. 启动服务

```powershell
node server.js
```

### 4. 防火墙放行

```powershell
# Windows 防火墙添加规则
New-NetFirewallRule -DisplayName "486Network image" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 5. 后台运行（Windows 服务方式）

```powershell
# 安装 pm2（见下文 PM2 章节）
npm install -g pm2
pm2 start server.js --name 486network
pm2 save
```

---

## 生产环境最佳实践（PM2）

PM2 是 Node.js 进程管理工具，支持开机自启、崩溃重启、日志管理。

### 安装 PM2

```bash
npm install -g pm2
```

### 使用 PM2 启动

```bash
cd /opt/486network-image

# 启动
pm2 start server.js --name 486network

# 保存进程列表（以便开机自启）
pm2 save

# 设置开机自启
pm2 startup
# 按提示执行输出的命令即可
```

### 常用 PM2 命令

```bash
pm2 list                  # 查看所有进程
pm2 logs 486network       # 查看实时日志
pm2 logs 486network --lines 100   # 查看最近100行日志
pm2 restart 486network    # 重启
pm2 stop 486network       # 停止
pm2 delete 486network     # 删除进程
pm2 monit                 # 监控面板
```

---

## Nginx 反向代理（推荐）

使用 Nginx 将 80/443 端口转发到 Node.js 应用，可以实现：
- 使用域名访问，无需端口号
- SSL/HTTPS 加密
- 限制上传文件大小
- 缓存静态资源

### 安装 Nginx

```bash
# Ubuntu / Debian
sudo apt install -y nginx
```

### 配置反向代理

创建 Nginx 配置文件 `/etc/nginx/sites-available/486network`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 换成你的域名

    # 客户端最大上传大小（照片可能较大）
    client_max_body_size 200M;

    # 静态资源缓存（图片）
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache static;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # API 请求转发
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 前端页面
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/486network /etc/nginx/sites-enabled/
sudo nginx -t              # 测试配置
sudo systemctl reload nginx  # 重载
```

### HTTPS 配置（使用 Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

配置完成后访问 `https://your-domain.com` 即可。

---

## 安全配置

### 1. 修改默认密码

进入管理后台 → 系统设置 → 管理员密码，立即修改默认密码 `admin123`。

### 2. 使用非 root 用户运行（Linux）

```bash
# 创建专用用户
sudo useradd -r -s /bin/false 486user
sudo chown -R 486user:486user /opt/486network-image

# 用此用户启动
sudo -u 486user pm2 start /opt/486network-image/server.js --name 486network
```

### 3. 使用环境变量修改端口

```bash
# 默认端口 3000，可通过环境变量修改
PORT=8080 node server.js
```

### 4. 上传文件限制

服务端已限制单文件最大 50MB，如需调整修改 `server.js` 中的：

```javascript
limits: { fileSize: 50 * 1024 * 1024 } // 改为你需要的大小
```

---

## CDN 加速配置

当照片量大时，建议使用 CDN 分发图片，减轻服务器带宽压力。

### 配置步骤

1. 将 `uploads/` 目录中的文件同步到你的 CDN/OSS
2. 登录 **管理后台 → 系统设置 → CDN 加速配置**
3. 填写 CDN 域名前缀，例如：`https://cdn.yourdomain.com`
4. 保存后，所有图片 URL 将自动使用 CDN 域名

### 阿里云 OSS + CDN 示例

```bash
# 安装 ossutil
# 将 uploads/ 同步到 OSS Bucket
ossutil sync /opt/486network-image/uploads/ oss://your-bucket/uploads/
```

然后在后台 CDN 配置中填写：`https://your-bucket.oss-cn-hangzhou.aliyuncs.com`

> 提示：CDN 配置是全局的，如有多个相册使用不同 CDN，可在每个相册的「相册设置」中独立配置。

---

## 常见问题

### Q: 启动报错 `port already in use`

端口被占用，修改端口或杀掉占用进程：

```bash
# 使用其他端口
PORT=8080 node server.js

# 或杀掉占用进程
lsof -i :3000
kill -9 <PID>
```

### Q: 上传照片时提示 "文件过大"

Nginx 层和 Node.js 层都有大小限制，检查两处：

1. Nginx 配置中 `client_max_body_size` 是否足够大
2. `server.js` 中 `limits: { fileSize }` 的值

### Q: 忘记管理员密码

直接修改 `data/database.json` 文件：

```json
{
  "config": {
    "admin_password": "新密码"
  }
}
```

修改后重启服务即可。

### Q: 照片上传后显示 404

检查 `uploads/` 目录权限：

```bash
chmod -R 755 /opt/486network-image/uploads
chown -R 486user:486user /opt/486network-image/uploads
```

### Q: 如何备份数据

只需要备份两个目录/文件：

```bash
# 数据库（包含相册信息、选图记录、配置）
cp /opt/486network-image/data/database.json /backup/

# 照片文件
cp -r /opt/486network-image/uploads /backup/
```

恢复时放回对应位置即可。

### Q: 如何更新版本

```bash
# 1. 备份数据
cp data/database.json data/database.json.bak

# 2. 拉取新版本（替换 server.js、public/ 目录等）
# 注意保留 data/ 和 uploads/ 目录

# 3. 重启
pm2 restart 486network
```

---

> **提示**：首次部署后，请先进入管理后台修改默认密码，并建议配置 Nginx 反向代理 + HTTPS 以保证数据传输安全。

_⚠这篇DEPLOY.MD由OpenClaw+ Deepseek V4生成，这么耗时耗力的任务绝对不能由本PO完成（_
_顺带一提，部分代码优化也由AI进行_
