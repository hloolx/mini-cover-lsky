# 兰空图床（LskyPro）配置指南

Mini-Cover-Lsky 专门集成了兰空图床（Lsky Pro）作为图片存储服务，提供稳定的图片外链功能。

## 🚀 快速配置

### 1. 获取兰空图床 API Token

1. 登录你的兰空图床后台
2. 进入「个人设置」→「API设置」或「接口」
3. 点击「生成Token」或查看已有Token
4. 复制 Token 备用（注意保密）

### 2. 在应用内配置

1. 打开 Mini-Cover-Lsky 应用
2. 点击右上角「设置」按钮
3. 在「兰空图床配置」部分填入：
   - **API 地址**: `https://你的域名/api/v2/upload`
   - **API Token**: 粘贴刚才复制的Token
4. 系统会自动保存配置

### 3. 选择存储策略

- 首次上传时会自动显示可用的存储策略列表
- 选择合适的存储策略（如：本地、阿里云OSS等）
- 选择后会自动保存，下次使用时无需重新选择

## ✨ 核心功能

### 图片上传
- 📸 支持拖拽上传
- 📋 支持粘贴上传
- 🎨 支持多种图片格式（JPG、PNG、GIF、WebP等）
- 📊 实时显示上传进度

### 智能管理
- 💾 自动保存配置到浏览器
- 🔄 支持刷新重选存储策略
- 📎 上传成功自动复制链接
- 🔒 Token安全显示（可切换显示/隐藏）

## 🔧 高级配置

### 环境变量配置（可选）

如果需要预设配置，可以创建 `.env` 文件：

```env
# 兰空图床API地址
VITE_APP_UPLOAD_API_URL = https://your-domain.com/api/v2/upload

# API Token（可选，建议在应用内设置）
VITE_APP_UPLOAD_API_TOKEN = 1|xxxxxxxxxxxxxxxxxxxxx

# 存储策略ID（可选）
VITE_APP_LSKY_STORAGE_ID = 
```

## 🚨 故障排除

### 常见问题

#### 1. CORS跨域错误
**症状**: 控制台显示 "Failed to fetch" 或 CORS 错误

**解决方案**:
- 在兰空图床后台启用跨域访问
- 或将应用部署到同域名下
- 或配置反向代理

#### 2. 401未授权错误
**症状**: 上传失败，提示未授权

**解决方案**:
- 检查Token是否正确
- Token格式：`1|xxxxxxxxxxxxx`
- 确认Token未过期

#### 3. 存储策略错误
**症状**: 提示"不存在的储存驱动"

**解决方案**:
- 点击设置中的刷新按钮重新选择策略
- 确认图床后台已配置存储驱动

### 测试工具

使用curl命令测试API连接：

```bash
# 测试获取存储策略
curl -X GET \
  -H "Authorization: Bearer 你的token" \
  -H "Accept: application/json" \
  https://你的域名/api/v1/strategies

# 测试上传图片
curl -X POST \
  -H "Authorization: Bearer 你的token" \
  -F "file=@test.jpg" \
  -F "storage_id=2" \
  https://你的域名/api/v2/upload
```

## 📚 相关资源

- [LskyPro官方文档](https://docs.lsky.pro)
- [Mini-Cover-Lsky项目](https://github.com/hloolx/mini-cover-lsky)
- [问题反馈](https://github.com/hloolx/mini-cover-lsky/issues)

## 👨‍💻 作者

- **阿懒同学** - [个人博客](https://www.alantx.cn)

---

💡 **提示**: 遇到问题请先查看浏览器控制台（F12）的错误信息，大部分问题都可以通过错误提示找到解决方案。