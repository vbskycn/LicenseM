---
layout: default
title: 用户指南
description: 完整的安装、部署、使用指南，适合普通用户和管理员
---

# 密钥管理系统 - 用户指南

> 完整的安装、部署、使用指南，适合普通用户和管理员

## 🚀 快速开始

### 环境要求
- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **内存**: 最少 512MB，推荐 1GB 或更多
- **磁盘空间**: 最少 100MB 可用空间

### 快速安装

```bash
# 1. 克隆项目
git clone https://github.com/vbskycn/License.git
cd License

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp env.example .env

# 4. 启动服务
npm start
```

### 访问系统
打开浏览器访问：`http://localhost:3005`

### 默认账户
- **用户名**: admin
- **密码**: admin123

## 📦 安装指南

### 1. 获取源代码

```bash
# 方法1：克隆Git仓库
git clone https://github.com/vbskycn/License.git
cd License

# 方法2：下载ZIP文件
# 从GitHub下载ZIP文件并解压
```

### 2. 安装依赖

```bash
# 安装项目依赖
npm install

# 验证安装
npm list --depth=0
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑配置文件
# Windows: notepad .env
# Linux/macOS: nano .env
```

### 4. 基础配置

编辑 `.env` 文件，设置基本配置：

```bash
# 服务器配置
PORT=3005
NODE_ENV=development

# JWT配置（生产环境必须修改）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# License配置（生产环境必须修改）
LICENSE_SECRET_KEY=your-super-secret-license-key-change-this-in-production

# 速率限制配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
```

### 5. 初始化数据库

```bash
# 启动系统（会自动创建数据库）
npm start

# 或者使用开发模式
npm run dev
```

### 6. 验证安装

```bash
# 检查服务是否启动
curl http://localhost:3005/api/test

# 或者打开浏览器访问
```

## 🐳 Docker部署

### 方式一：Docker Hub镜像（推荐）

#### 最新版本部署

```bash
# 创建数据目录（持久化）
mkdir -p ${PWD}/license-data

# 设置目录权限（Linux/macOS）
sudo chown -R 1000:1000 ${PWD}/license-data
sudo chmod -R 755 ${PWD}/license-data

# 停止并删除旧容器
docker stop license-management-system
docker rm license-management-system

# 启动容器
docker run -d \
  --name license-management-system \
  --restart unless-stopped \
  -p 3005:3005 \
  -v ${PWD}/license-data:/app/data \
  -e JWT_SECRET="your-super-secret-jwt-key-change-this-in-production" \
  -e LICENSE_SECRET_KEY="your-super-secret-license-key-change-this-in-production" \
  -e PORT="3005" \
  -e NODE_ENV="production" \
  -e DEBUG_MODE="false" \
  -e LOG_LEVEL="warn" \
  zhoujie218/license-management-system:latest
```

#### 可选环境变量

```bash
# 全局请求速率限制：每分钟最多允许 2000 个请求
-e RATE_LIMIT_MAX_REQUESTS="2000" \

# API 接口的请求限制：每分钟最多允许 5000 个 API 请求
-e API_RATE_LIMIT_MAX_REQUESTS="5000" \

# 登录尝试限制：最多允许 20 次失败的登录尝试
-e LOGIN_RATE_LIMIT_MAX_ATTEMPTS="20" \

# 允许的访问来源域名（多个使用英文逗号分隔，无空格）
-e ALLOWED_DOMAINS="https://yourdomain.com,https://www.yourdomain.com" \

# 允许加载的 CDN 链接（多个使用英文逗号分隔）
-e ALLOWED_CDNS="https://cdn.bootcdn.net,https://static.cloudflareinsights.com,https://*.cloudflare.com" \
```

#### 验证部署

```bash
# 检查容器状态
docker ps

# 查看容器日志
docker logs license-management-system

# 测试API接口
curl http://localhost:3005/api/health

# 访问管理界面
# 打开浏览器访问: http://localhost:3005
# 默认账号: admin 密码: admin123
```

### 方式二：Docker Compose

#### 创建docker-compose.yml

```yaml
version: '3.8'

services:
  license-manager:
    image: zhoujie218/license-management-system:latest
    container_name: license-management-system
    restart: unless-stopped
    ports:
      - "3005:3005"
    volumes:
      - ./license-data:/app/data
    environment:
      - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
      - LICENSE_SECRET_KEY=your-super-secret-license-key-change-this-in-production
      - PORT=3005
      - NODE_ENV=production
      - DEBUG_MODE=false
      - LOG_LEVEL=warn
      - RATE_LIMIT_MAX_REQUESTS=2000
      - API_RATE_LIMIT_MAX_REQUESTS=5000
      - LOGIN_RATE_LIMIT_MAX_ATTEMPTS=20
      - ALLOWED_DOMAINS=https://yourdomain.com,https://www.yourdomain.com
      - ALLOWED_CDNS=https://cdn.bootcdn.net,https://static.cloudflareinsights.com,https://*.cloudflare.com
```

#### 启动服务

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式三：源码构建

```bash
# 克隆源码
git clone https://github.com/vbskycn/License.git
cd License

# 构建镜像
docker build -t license-management-system .

# 运行容器
docker run -d \
  --name license-management-system \
  --restart unless-stopped \
  -p 3005:3005 \
  -v ${PWD}/data:/app/data \
  license-management-system
```

## 📖 使用指南

### 系统架构

系统采用**应用-密钥类型**的架构设计：

```
应用 (applications)
├── 密钥类型 (license_types) - 属于应用
└── 密钥 (licenses) - 基于应用和密钥类型生成
```

### 默认配置

系统启动时自动创建：
- **默认应用**：我的Web应用
- **默认密钥类型**：
  - 试用版 (TRIAL-) - 30天，1次使用，1台设备
  - 标准版 (STD-) - 365天，1次使用，1台设备
  - 专业版 (PRO-) - 365天，5次使用，3台设备
  - 企业版 (ENT-) - 365天，100次使用，10台设备
  - 终身版 (LIFE-) - 36500天，无限使用，无限设备

### 功能模块

#### 1. 仪表板
- 总密钥数统计
- 活跃密钥数统计
- 过期密钥数统计
- 今日使用数统计
- 应用统计图表

#### 2. 应用管理
- 创建新应用
- 编辑应用信息
- 删除应用
- 查看应用列表

#### 3. 密钥类型管理
- 创建新密钥类型
- 编辑密钥类型配置
- 删除密钥类型
- 查看密钥类型列表

#### 4. 密钥管理
- 生成单个密钥
- 批量生成密钥
- 查看密钥列表
- 编辑密钥状态
- 删除密钥
- 密钥详情查看
- 批量导出
- 批量删除
- 批量复制

#### 5. 用户管理
- 创建用户
- 删除用户
- 修改用户角色
- 修改管理员密码

#### 6. 备份管理
- 创建完整备份
- 创建SQL备份
- 上传备份文件
- 下载备份文件
- 还原数据库
- 备份文件管理

### 核心特性

#### 密钥激活逻辑
- **生成时状态**: 密钥生成后为"未激活"状态
- **首次验证激活**: 客户端首次验证密钥时自动激活
- **有效期计算**: 激活时才开始计算有效期，而非生成时
- **灵活配置**: 可以设置有效期天数，0表示永不过期

#### 设备管理策略
- **宽松期**: 激活当天（0-24小时），所有设备都可以通过
- **严格期**: 每天一个周期，新设备优先，按首次验证时间排序
- **设备限制**: 每个周期内最多允许N个设备（N = 密钥类型的最大设备数）

#### 批量管理功能
- **批量选择**: 支持全选和单个选择
- **批量导出**: CSV格式导出，支持中文
- **批量删除**: 事务安全，自动清理关联数据
- **批量复制**: 复制密钥到剪贴板

#### 搜索和过滤
- **实时搜索**: 支持密钥关键词搜索
- **状态过滤**: 按密钥状态过滤
- **应用过滤**: 按应用过滤密钥
- **防抖处理**: 避免频繁API调用

## ⚙️ 配置说明

### 环境变量配置

#### 基础配置

```bash
# 服务器配置
PORT=3005
NODE_ENV=production

# JWT配置
JWT_SECRET=your-production-jwt-secret

# License配置
LICENSE_SECRET_KEY=your-production-license-secret
```

#### 安全配置

```bash
# 速率限制配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=3

# 域名配置
ALLOWED_DOMAINS=https://yourdomain.com
ALLOWED_CDNS=https://cdn.bootcdn.net,https://cdn.jsdelivr.net
```

#### 调试配置

```bash
# 调试模式
DEBUG_MODE=false
LOG_LEVEL=warn

# IP地址测试配置（开发环境）
TEST_EXTERNAL_IP=203.0.113.1
```

### 生产环境配置

```bash
NODE_ENV=production
PORT=3005
JWT_SECRET=your-production-jwt-secret
LICENSE_SECRET_KEY=your-production-license-secret
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=3
DEBUG_MODE=false
LOG_LEVEL=warn
```

## 🔧 故障排除

### 常见问题

#### 1. License无法激活
- 检查License状态是否为inactive
- 确认应用名称是否匹配
- 验证License密钥格式

#### 2. 设备数量限制
- 检查max_devices字段设置
- 确认设备绑定情况
- 查看设备管理策略

#### 3. API请求被限制
- 检查速率限制配置
- 等待限制时间窗口结束
- 调整环境变量配置

#### 4. 数据库连接错误
- 检查data目录权限
- 确认磁盘空间充足
- 验证数据库文件完整性

#### 5. Docker容器启动失败
- 检查端口是否被占用
- 确认环境变量配置正确
- 查看容器日志排查问题

### 日志调试

```bash
# 查看激活日志
grep "激活License" logs/server.log

# 查看验证日志  
grep "License验证" logs/server.log

# 查看错误日志
grep "ERROR" logs/server.log

# Docker容器日志
docker logs license-management-system
```

### 性能优化

#### 1. 数据库优化
- 定期清理过期数据
- 监控数据库文件大小
- 备份重要数据

#### 2. 内存优化
- 调整Node.js内存限制
- 监控内存使用情况
- 优化查询性能

#### 3. 网络优化
- 配置CDN加速
- 启用Gzip压缩
- 优化静态资源

### 安全建议

#### 1. 生产环境安全
- 修改默认密钥
- 使用强密码
- 配置HTTPS
- 定期备份

#### 2. 访问控制
- 限制IP访问
- 配置防火墙
- 监控异常访问
- 定期更新依赖

#### 3. 数据保护
- 加密敏感数据
- 定期备份
- 监控数据完整性
- 实施访问审计

## 📞 技术支持

如有问题，请：
1. 查看本文档的故障排除部分
2. 查看系统日志
3. 提交Issue或联系技术支持

### 相关链接
- 🌐 [项目主页](https://github.com/vbskycn/License)
- 📚 [在线文档](https://license.zhoujie8.cn/)
- 🐳 [Docker镜像](https://hub.docker.com/r/zhoujie218/license-management-system)

---

**密钥管理系统用户指南** - 让使用更简单、更高效！ 