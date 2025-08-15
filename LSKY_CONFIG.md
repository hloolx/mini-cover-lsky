# 兰空图床配置指南

本项目已支持兰空图床（Lsky Pro）作为图片外链存储服务。

## 配置步骤

### 1. 获取兰空图床 API Token

1. 登录你的兰空图床后台
2. 进入「个人设置」→「API设置」或「接口」
3. 点击「生成Token」或查看已有Token
4. 复制 Token 备用（注意保密）

### 2. 修改 .env 配置文件

```env
# 设置图床类型为 lsky
VITE_APP_UPLOAD_API_TYPE = lsky

# 设置你的兰空图床API地址
# 格式：https://你的域名/api/v2/upload （注意使用v2版本）
VITE_APP_UPLOAD_API_URL = https://your-domain.com/api/v2/upload

# 设置API Token（只需要token值，不需要Bearer前缀）
# 正确格式示例：
VITE_APP_UPLOAD_API_TOKEN = 1|abcdefghijklmnopqrstuvwxyz1234567890
# 或者带Bearer前缀：
VITE_APP_UPLOAD_API_TOKEN = Bearer 1|abcdefghijklmnopqrstuvwxyz1234567890

# 存储策略ID（可选）
# 留空：首次上传时显示策略选择界面
# 指定ID：跳过选择，直接使用指定策略
VITE_APP_LSKY_STORAGE_ID = 
```

### 3. 重启项目

```bash
# 重新启动开发服务器
npm run dev
```

## 功能说明

- **自动识别图床类型**：根据 `VITE_APP_UPLOAD_API_TYPE` 自动选择上传方式
- **支持两种Token格式**：Bearer Token 和普通 Token
- **智能存储策略选择**：
  - 首次使用时自动获取可用策略列表
  - 用户可视化选择存储策略
  - 选择后自动保存到浏览器本地
  - 支持随时刷新重新选择（点击🔄按钮）
- **上传状态管理**：显示上传进度，防止重复点击
- **自动复制链接**：上传成功后自动复制图片链接到剪贴板

## 兼容性

- 支持 Lsky Pro V2 版本
- 同时保留对 PixPro 图床的支持（将 `VITE_APP_UPLOAD_API_TYPE` 设置为 `pixpro` 即可）

## 故障排除

### 1. 检查浏览器控制台

按 F12 打开浏览器开发者工具，切换到 Console 标签，点击"获取外链"后查看输出信息：

- `上传到兰空图床:` - 显示实际请求的URL
- `使用认证头:` - 显示是否配置了Token
- `响应状态:` - HTTP状态码（200表示成功）
- `兰空图床响应:` - 完整的响应数据

### 2. 常见错误及解决方案

#### 错误：CORS（跨域问题）
**症状**：控制台显示 "Failed to fetch" 或 CORS 相关错误

**解决方案**：
1. 在兰空图床后台设置中启用跨域访问
2. 或者将前端部署到同域名下
3. 或者配置反向代理

#### 错误：401 Unauthorized（未授权）
**症状**：响应状态码为 401

**解决方案**：
1. 检查Token是否正确
2. Token格式通常是：`1|xxxxxxxxxxxxx`
3. 在.env中直接填写token值即可，系统会自动添加Bearer前缀

#### 错误：404 Not Found
**症状**：响应状态码为 404

**解决方案**：
1. 检查API地址是否正确
2. 确认格式为：`https://你的域名/api/v2/upload`
3. 注意是 `/api/v2/upload` （v2版本）

#### 错误：不存在的储存驱动
**症状**：返回"不存在的储存驱动"错误

**解决方案**：
1. 首次上传时会自动显示可用的存储策略供选择
2. 如果看不到策略选择界面，检查Token是否正确
3. 可以在.env中手动指定存储策略ID（VITE_APP_LSKY_STORAGE_ID）
4. 使用curl命令查看可用的存储策略ID

#### 错误：413 Payload Too Large
**症状**：文件太大

**解决方案**：
1. 检查兰空图床的上传大小限制
2. 在图床后台调整上传限制

### 3. 测试配置

可以使用curl命令测试API是否正常：

```bash
# 获取可用的存储策略
curl -X GET \
  -H "Authorization: Bearer 你的token" \
  -H "Accept: application/json" \
  https://你的域名/api/v1/strategies

# 上传图片（需要指定storage_id）
curl -X POST \
  -H "Authorization: Bearer 你的token" \
  -H "Accept: application/json" \
  -F "file=@test.jpg" \
  -F "storage_id=2" \
  https://你的域名/api/v2/upload
```

## 常见问题

### Q: Token在哪里获取？
A: 登录兰空图床后台 → 个人中心 → 接口 → 生成Token

### Q: 如何查看可用的存储策略？
A: 有以下几种方式：
1. 首次上传时会自动显示策略列表供选择
2. 点击"🔄"按钮清除已保存的策略，下次上传时重新选择
3. 使用curl命令查看：
```bash
curl -X GET \
  -H "Authorization: Bearer 你的token" \
  -H "Accept: application/json" \
  https://你的域名/api/v1/strategies
```

### Q: 如何更改已选择的存储策略？
A: 点击"获取外链"按钮旁边的"🔄"按钮，清除保存的策略，下次上传时会重新显示选择界面

### Q: 存储策略选择保存在哪里？
A: 保存在浏览器的localStorage中，每个域名独立保存，清除浏览器缓存会丢失

### Q: 上传时一直显示"上传中..."？
A: 可能是以下原因：
1. 网络连接问题
2. 图床服务器响应慢
3. 文件过大
打开浏览器控制台查看具体错误信息

### Q: 如何切换回 PixPro 图床？
A: 将 `VITE_APP_UPLOAD_API_TYPE` 改为 `pixpro`，并设置对应的 API 地址即可

### Q: 上传成功但无法获取链接？
A: 打开浏览器控制台查看响应数据格式，可能需要调整代码中的响应解析逻辑