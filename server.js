// ============================================================
// 486Network image - 摄影师返图选图系统
// 后端服务 (Node.js + Express + JSON 文件存储)
// ============================================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// ============================================================
// JSON 文件数据库
// ============================================================
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

// 默认数据
const defaultData = {
  config: {
    admin_password: 'admin123',
    site_name: '486Network image',
    entry_subtitle: '摄影师专属返图选图平台',
    entry_subtitle_mode: 'custom',  // 'custom' | 'hitokoto'
    entry_bg: '',
    entry_bg_mode: '',  // '' | 'upload' | 'url'
    cdn_prefix: '',
    max_upload_size: 50, // 单位 MB，默认 50MB
    footer_content: '<a href="https://486network.com" target="_blank" style="color:rgba(255,255,255,0.6);text-decoration:none;">© 2025 486Network image</a> — Powered by 486Network',
    success_message: '您已成功选择了 <strong style="color:var(--accent)">{count}</strong> 张照片。<br>摄影师收到后会尽快处理，请耐心等待。'
  },
  albums: {}  // key: albumId, value: { id, name, password, cdn_prefix, cover, status, created_at, photos: {}, selections: {} }
};

let db = loadDB();

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // 确保有 config 和 albums
      if (!data.config) data.config = { ...defaultData.config };
      if (!data.albums) data.albums = {};
      return data;
    }
  } catch(e) { console.error('DB load error:', e.message); }
  return JSON.parse(JSON.stringify(defaultData));
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// ============================================================
// Multer 配置（硬性安全上限 500MB，实际限制由配置文件动态控制）
// ============================================================
function getUploadLimit() {
  return (db.config.max_upload_size || 50) * 1024 * 1024;
}

function getUploadLimitMB() {
  return db.config.max_upload_size || 50;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const albumId = req.params.albumId || 'temp';
    const dir = path.join(__dirname, 'uploads', albumId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 硬性上限 500MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|heic|avif)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，请上传图片文件'));
    }
  }
});

const app = express();

// ============================================================
// JSON / 静态文件服务
// ============================================================
app.use(express.json());

// 禁用 CSS/JS/HTML 的浏览器缓存（避免之前错误 Content-Type 的遗留影响）
app.use((req, res, next) => {
  if (/\.(css|js|html?)$/i.test(req.path)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// API - 配置
// ============================================================

app.get('/api/config/cdn', (req, res) => {
  res.json({ prefix: db.config.cdn_prefix || '' });
});

app.post('/api/config/cdn', (req, res) => {
  db.config.cdn_prefix = req.body.prefix || '';
  saveDB();
  res.json({ success: true });
});

app.get('/api/config/password', (req, res) => {
  res.json({ password: db.config.admin_password });
});

app.post('/api/config/password', (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 4) return res.status(400).json({ error: '密码至少4位' });
  db.config.admin_password = password;
  saveDB();
  res.json({ success: true });
});

app.get('/api/config/footer', (req, res) => {
  res.json({ content: db.config.footer_content || '' });
});

app.post('/api/config/footer', (req, res) => {
  db.config.footer_content = req.body.content || '';
  saveDB();
  res.json({ success: true });
});

app.get('/api/config/success-message', (req, res) => {
  res.json({ message: db.config.success_message || '' });
});

app.post('/api/config/success-message', (req, res) => {
  const { message } = req.body;
  if (message !== undefined && message.length > 500) return res.status(400).json({ error: '提示语不能超过 500 个字符' });
  db.config.success_message = message || '';
  saveDB();
  res.json({ success: true });
});

app.get('/api/config/upload-size', (req, res) => {
  res.json({ maxSizeMB: getUploadLimitMB() });
});

app.post('/api/config/upload-size', (req, res) => {
  const { maxSizeMB } = req.body;
  const size = parseInt(maxSizeMB);
  if (isNaN(size) || size < 1) return res.status(400).json({ error: '大小至少为 1MB' });
  if (size > 500) return res.status(400).json({ error: '最大不能超过 500MB' });
  db.config.max_upload_size = size;
  saveDB();
  res.json({ success: true, maxSizeMB: size });
});

app.get('/api/config/site-name', (req, res) => {
  res.json({ name: db.config.site_name || '486Network image' });
});

app.post('/api/config/site-name', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: '网站名称不能为空' });
  if (name.length > 50) return res.status(400).json({ error: '名称不能超过 50 个字符' });
  db.config.site_name = name.trim();
  saveDB();
  res.json({ success: true, name: db.config.site_name });
});

app.get('/api/config/entry-subtitle', (req, res) => {
  res.json({
    subtitle: db.config.entry_subtitle || '摄影师专属返图选图平台',
    mode: db.config.entry_subtitle_mode || 'custom'
  });
});

app.post('/api/config/entry-subtitle', (req, res) => {
  const { subtitle, mode } = req.body;
  if (subtitle !== undefined && subtitle.length > 100) return res.status(400).json({ error: '副标题不能超过 100 个字符' });
  if (mode && !['custom', 'hitokoto'].includes(mode)) return res.status(400).json({ error: '无效的副标题模式' });
  db.config.entry_subtitle = subtitle !== undefined ? (subtitle || '') : db.config.entry_subtitle;
  if (mode) db.config.entry_subtitle_mode = mode;
  saveDB();
  res.json({ success: true, subtitle: db.config.entry_subtitle, mode: db.config.entry_subtitle_mode });
});

app.get('/api/config/entry-bg', (req, res) => {
  res.json({
    bg: db.config.entry_bg || '',
    mode: db.config.entry_bg_mode || ''
  });
});

app.post('/api/config/entry-bg', (req, res) => {
  const { bg, mode } = req.body;
  if (mode && !['upload', 'url', ''].includes(mode)) return res.status(400).json({ error: '无效的背景模式' });
  db.config.entry_bg = bg || '';
  db.config.entry_bg_mode = mode || '';
  saveDB();
  res.json({ success: true, bg: db.config.entry_bg, mode: db.config.entry_bg_mode });
});

// 上传入口背景图
app.post('/api/config/entry-bg/upload', upload.single('bg_image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择图片' });
  const ext = path.extname(req.file.originalname);
  const bgFilename = 'entry_bg' + ext;
  const oldPath = req.file.path;
  const newPath = path.join(__dirname, 'uploads', 'bg', bgFilename);
  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  // 删除旧背景图
  try {
    const files = fs.readdirSync(path.dirname(newPath));
    files.forEach(f => { if (f.startsWith('entry_bg')) fs.unlinkSync(path.join(path.dirname(newPath), f)); });
  } catch(e) {}
  fs.renameSync(oldPath, newPath);
  db.config.entry_bg = '/uploads/bg/' + bgFilename;
  db.config.entry_bg_mode = 'upload';
  saveDB();
  res.json({ success: true, bg: db.config.entry_bg, mode: 'upload' });
});

app.post('/api/admin/login', (req, res) => {
  if (req.body.password === db.config.admin_password) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

// ============================================================
// API - 相册
// ============================================================

app.get('/api/albums', (req, res) => {
  const list = Object.values(db.albums).map(a => ({
    ...a,
    photo_count: Object.keys(a.photos || {}).length,
    client_count: Object.keys(a.selections || {}).length,
    photos: undefined,
    selections: undefined
  }));
  list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  res.json(list);
});

app.post('/api/albums', (req, res) => {
  const { name, password } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: '相册名称不能为空' });

  const id = uuidv4().slice(0, 8);
  db.albums[id] = {
    id,
    name: name.trim(),
    password: password || '',
    cdn_prefix: '',
    cover: '',
    status: 'active',
    created_at: new Date().toLocaleString('zh-CN', { hour12: false }),
    photos: {},
    selections: {}
  };
  saveDB();
  res.json({ success: true, id });
});

app.put('/api/albums/:id', (req, res) => {
  const album = db.albums[req.params.id];
  if (!album) return res.status(404).json({ error: '相册不存在' });

  if (req.body.name !== undefined) album.name = req.body.name;
  if (req.body.password !== undefined) album.password = req.body.password;
  if (req.body.cdn_prefix !== undefined) album.cdn_prefix = req.body.cdn_prefix;
  if (req.body.status !== undefined) album.status = req.body.status;
  saveDB();
  res.json({ success: true });
});

app.delete('/api/albums/:id', (req, res) => {
  const album = db.albums[req.params.id];
  if (!album) return res.status(404).json({ error: '相册不存在' });

  // 删除上传文件
  const dir = path.join(__dirname, 'uploads', req.params.id);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

  delete db.albums[req.params.id];
  saveDB();
  res.json({ success: true });
});

// ============================================================
// API - 照片
// ============================================================

app.get('/api/albums/:id/photos', (req, res) => {
  const album = db.albums[req.params.id];
  if (!album) return res.status(404).json({ error: '相册不存在' });

  const cdnPrefix = album.cdn_prefix || '';
  const baseUrl = cdnPrefix ? cdnPrefix.replace(/\/$/, '') + '/uploads/' + req.params.id + '/' : '/uploads/' + req.params.id + '/';

  const photos = Object.values(album.photos).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const result = photos.map(p => ({
    ...p,
    url: baseUrl + p.filename,
    thumb_url: baseUrl + p.filename,
    using_cdn: !!cdnPrefix
  }));

  res.json({
    album: { id: album.id, name: album.name, cdn_prefix: album.cdn_prefix, password: album.password, status: album.status },
    photos: result,
    cdn_prefix: cdnPrefix
  });
});

// 批量上传（动态大小校验）
app.post('/api/albums/:albumId/upload', upload.array('photos', 100), (req, res) => {
  const album = db.albums[req.params.albumId];
  if (!album) return res.status(404).json({ error: '相册不存在' });

  const files = req.files;
  if (!files || files.length === 0) return res.status(400).json({ error: '请选择图片' });

  const maxBytes = getUploadLimit();
  const limitMB = getUploadLimitMB();

  // 逐文件检查大小，超出则删除并报错
  for (const file of files) {
    if (file.size > maxBytes) {
      // 清理已上传的文件
      files.forEach(f => { try { fs.unlinkSync(f.path); } catch(e) {} });
      return res.status(400).json({
        error: `文件「${file.originalname}」大小为 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过限制 ${limitMB}MB`
      });
    }
  }

  const inserted = [];
  for (const file of files) {
    const id = uuidv4().slice(0, 8);
    album.photos[id] = {
      id,
      album_id: req.params.albumId,
      filename: file.filename,
      original_name: file.originalname,
      file_size: file.size,
      width: 0,
      height: 0,
      sort_order: Object.keys(album.photos).length,
      created_at: new Date().toLocaleString('zh-CN', { hour12: false })
    };
    inserted.push({ id, filename: file.filename, original_name: file.originalname });
  }

  // 首张作为封面
  if (inserted.length > 0 && !album.cover) {
    album.cover = inserted[0].filename;
  }

  saveDB();
  res.json({ success: true, count: inserted.length, photos: inserted });
});

// 删除照片
app.delete('/api/photos/:id', (req, res) => {
  let found = null;
  for (const albumId of Object.keys(db.albums)) {
    if (db.albums[albumId].photos[req.params.id]) {
      found = { albumId, photo: db.albums[albumId].photos[req.params.id] };
      break;
    }
  }
  if (!found) return res.status(404).json({ error: '照片不存在' });

  const filePath = path.join(__dirname, 'uploads', found.albumId, found.photo.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  delete db.albums[found.albumId].photos[req.params.id];
  saveDB();
  res.json({ success: true });
});

// ============================================================
// 下载图片（保留原始文件名，UTF-8 编码防乱码）
// ============================================================
app.get('/api/albums/:albumId/photos/:photoId/download', (req, res) => {
  const album = db.albums[req.params.albumId];
  if (!album) return res.status(404).json({ error: '相册不存在' });

  const photo = album.photos[req.params.photoId];
  if (!photo) return res.status(404).json({ error: '照片不存在' });

  const filePath = path.join(__dirname, 'uploads', req.params.albumId, photo.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });

  // 原始文件名（可能含中文）
  const originalName = photo.original_name;
  const ext = path.extname(originalName) || path.extname(photo.filename) || '.jpg';
  const nameBody = path.basename(originalName, ext);
  // fallback: 只保留 ASCII 可见字符，其余用 _ 替换，完全避免乱码
  const asciiFallback = nameBody.replace(/[^\x20-\x7E]/g, '_').replace(/\s+/g, '_') || 'image';
  // RFC 5987 filename* 用标准的 encodeURIComponent（自动 UTF-8 百分号编码）
  const encodedName = encodeURIComponent(originalName);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition',
    `attachment; filename="${asciiFallback}${ext}"; filename*=UTF-8''${encodedName}`);
  res.sendFile(filePath);
});

// ============================================================
// API - 客户选图
// ============================================================

// 获取相册公开信息
app.get('/api/client/album/:id', (req, res) => {
  const album = db.albums[req.params.id];
  if (!album) return res.status(404).json({ error: '相册不存在' });
  if (album.status !== 'active') return res.status(403).json({ error: '相册已关闭' });
  res.json({ id: album.id, name: album.name, status: album.status, created_at: album.created_at });
});

// 客户获取照片
app.get('/api/client/album/:id/photos', (req, res) => {
  const album = db.albums[req.params.id];
  if (!album) return res.status(404).json({ error: '相册不存在' });
  if (album.status !== 'active') return res.status(403).json({ error: '相册已关闭' });

  const cid = req.query.client_id || '';
  const cdnPrefix = album.cdn_prefix || '';
  const baseUrl = cdnPrefix ? cdnPrefix.replace(/\/$/, '') + '/uploads/' + req.params.id + '/' : '/uploads/' + req.params.id + '/';

  const clientSelections = album.selections[cid];
  const selectedIds = clientSelections ? new Set(clientSelections.photo_ids || []) : new Set();

  const photos = Object.values(album.photos).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const result = photos.map(p => ({
    id: p.id,
    filename: p.filename,
    original_name: p.original_name,
    url: baseUrl + p.filename,
    thumb_url: baseUrl + p.filename,
    width: p.width,
    height: p.height,
    selected: selectedIds.has(p.id)
  }));

  res.json({ album: { id: album.id, name: album.name }, photos: result, cdn_prefix: cdnPrefix });
});

// 提交选图
app.post('/api/client/album/:id/select', (req, res) => {
  const album = db.albums[req.params.id];
  if (!album) return res.status(404).json({ error: '相册不存在' });

  const { photo_ids, client_id, notes } = req.body;
  if (!photo_ids || !Array.isArray(photo_ids)) return res.status(400).json({ error: '请选择照片' });

  const cid = client_id || uuidv4().slice(0, 12);

  album.selections[cid] = {
    client_id: cid,
    notes: notes || '',
    photo_ids: [...new Set(photo_ids)],
    created_at: new Date().toLocaleString('zh-CN', { hour12: false })
  };

  saveDB();
  res.json({ success: true, client_id: cid, count: photo_ids.length });
});

// 管理员查看选图结果
app.get('/api/albums/:id/selections', (req, res) => {
  const album = db.albums[req.params.id];
  if (!album) return res.status(404).json({ error: '相册不存在' });

  const result = Object.values(album.selections).map(s => ({
    client_id: s.client_id,
    notes: s.notes,
    selected_at: s.created_at,
    count: (s.photo_ids || []).length,
    photos: (s.photo_ids || []).map(pid => {
      const p = album.photos[pid];
      return p ? { id: p.id, filename: p.filename, original_name: p.original_name } : null;
    }).filter(Boolean)
  }));

  result.sort((a, b) => (b.selected_at || '').localeCompare(a.selected_at || ''));
  res.json({ album: { id: album.id, name: album.name }, selections: result });
});

// ============================================================
// 错误处理
// ============================================================
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: `文件过大，硬性上限 500MB（当前配置：${getUploadLimitMB()}MB）` });
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

// ============================================================
// 启动
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ${db.config.site_name || '486Network image'} 启动成功`);
  console.log(`📸 管理后台: http://localhost:${PORT}/admin.html`);
  console.log(`🖼️  客户选图: http://localhost:${PORT}/`);
  console.log(`⚙️  端口: ${PORT}  密码: ${db.config.admin_password}`);
});
