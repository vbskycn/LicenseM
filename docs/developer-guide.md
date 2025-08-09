---
layout: default
title: 开发者指南
description: 完整的技术架构、API接口、集成指南，适合开发者进行客户端集成
---

# 密钥管理系统 - 开发者指南

> 完整的技术架构、API接口、集成指南，适合开发者进行客户端集成

## 🏗️ 技术架构

### 技术栈
- **后端**: Node.js + Express + SQLite
- **前端**: HTML5 + CSS3 + JavaScript + Bootstrap 5
- **认证**: JWT + bcrypt
- **安全**: Helmet + CORS + Rate Limiting
- **工具**: Moment.js (时间处理) + Crypto (密钥签名)

### 目录结构
```
License/
├── config/                 # 配置文件
│   ├── database.js        # 数据库配置
│   ├── rateLimit.js       # 速率限制配置
│   └── licenseTypes.js    # 密钥类型配置
├── data/                  # 数据目录
│   ├── license.db        # SQLite数据库
│   └── backups/          # 备份文件目录
├── public/                # 前端文件
│   ├── index.html        # 主页面
│   ├── app.js           # 前端逻辑
│   └── styles.css       # 样式文件
├── routes/               # 路由文件
│   ├── admin.js         # 管理接口
│   ├── auth.js          # 认证接口
│   ├── license.js       # 验证接口
│   └── backup.js        # 备份接口
├── utils/                # 工具函数
│   ├── licenseGenerator.js # 密钥生成器
│   ├── backupManager.js   # 备份管理器
│   ├── logger.js         # 日志工具
│   └── timeUtils.js      # 时间工具
├── server.js            # 服务器入口
└── package.json         # 项目配置
```

### 数据库设计

#### 核心表结构

**applications (应用表)**
```sql
CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  version TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**license_types (密钥类型表)**
```sql
CREATE TABLE license_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  type_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  description TEXT,
  default_max_uses INTEGER DEFAULT 1,
  default_max_devices INTEGER DEFAULT 1,
  default_validity_days INTEGER,
  default_custom_field_1 TEXT,
  default_custom_field_2 TEXT,
  default_custom_field_3 TEXT,
  features TEXT,
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications (id),
  UNIQUE(application_id, type_id)
);
```

**licenses (密钥表)**
```sql
CREATE TABLE licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT UNIQUE NOT NULL,
  application_id INTEGER NOT NULL,
  license_type_id INTEGER NOT NULL,
  user_id INTEGER,
  status TEXT DEFAULT 'inactive',
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  max_devices INTEGER DEFAULT 1,
  current_devices INTEGER DEFAULT 0,
  custom_field_1 TEXT,
  custom_field_2 TEXT,
  custom_field_3 TEXT,
  activated_at DATETIME,
  expires_at DATETIME,
  paused_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications (id),
  FOREIGN KEY (license_type_id) REFERENCES license_types (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

**device_bindings (设备绑定表)**
```sql
CREATE TABLE device_bindings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_info TEXT,
  is_active BOOLEAN DEFAULT 0,
  first_verified_at DATETIME,
  last_verified_at DATETIME,
  last_verified_date DATE,
  last_verified_ip TEXT,
  last_online DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (license_id) REFERENCES licenses (id)
);
```

**license_usage (使用记录表)**
```sql
CREATE TABLE license_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_id INTEGER NOT NULL,
  machine_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (license_id) REFERENCES licenses (id)
);
```

## 🔐 密钥验证逻辑

### 1. 数据库结构设计

#### licenses表 - 密钥主表
```sql
CREATE TABLE licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT UNIQUE NOT NULL,        -- 密钥字符串
  application_id INTEGER NOT NULL,         -- 关联的应用ID
  license_type_id INTEGER NOT NULL,        -- 密钥类型ID
  user_id INTEGER,                         -- 用户ID
  status TEXT DEFAULT 'inactive',          -- 状态：inactive/active/suspended
  max_uses INTEGER DEFAULT 1,              -- 最大使用次数
  current_uses INTEGER DEFAULT 0,          -- 当前使用次数
  max_devices INTEGER DEFAULT 1,           -- 最大设备数
  current_devices INTEGER DEFAULT 0,       -- 当前设备数
  custom_field_1 TEXT,                     -- 自定义字段1
  custom_field_2 TEXT,                     -- 自定义字段2
  custom_field_3 TEXT,                     -- 自定义字段3
  activated_at DATETIME,                   -- 激活时间
  expires_at DATETIME,                     -- 过期时间
  paused_at DATETIME,                      -- 暂停时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### device_bindings表 - 设备绑定管理
```sql
CREATE TABLE device_bindings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_id INTEGER NOT NULL,             -- 关联的密钥ID
  device_id TEXT NOT NULL,                 -- 设备唯一标识
  device_name TEXT,                        -- 设备名称
  device_info TEXT,                        -- 设备信息
  is_active BOOLEAN DEFAULT 0,             -- 是否激活
  first_verified_at DATETIME,              -- 首次验证时间
  last_verified_at DATETIME,               -- 最后验证时间
  last_verified_date DATE,                 -- 最后验证日期（用于周期管理）
  last_verified_ip TEXT,                   -- 最后验证IP
  last_online DATETIME,                    -- 最后在线时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### license_usage表 - 使用记录
```sql
CREATE TABLE license_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_id INTEGER NOT NULL,             -- 关联的密钥ID
  machine_id TEXT,                         -- 设备ID
  ip_address TEXT,                         -- IP地址
  user_agent TEXT,                         -- 用户代理
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 密钥生成和签名机制

#### 密钥格式
```
{前缀}-{16位随机字符串}
```
- **前缀**: 从`license_types`表获取，如"LIC"、"PRO"等
- **随机部分**: 使用crypto.randomBytes生成16位十六进制字符串

#### 签名验证
```javascript
// 使用HMAC-SHA256生成签名
const signature = crypto.createHmac('sha256', secretKey)
  .update(`${licenseKey}-${applicationId}-${licenseTypeId}`)
  .digest('hex');

// 验证签名
const expectedSignature = generateSignature(licenseKey, applicationId, licenseTypeId);
const isValid = signature === expectedSignature;
```

### 3. 核心验证流程

#### 验证入口
```
POST /api/license/verify
```

#### 验证步骤

**步骤1: 基础验证**
```javascript
// 1. 检查密钥是否存在
const license = await db.get('SELECT * FROM licenses WHERE license_key = ?', [licenseKey]);

// 2. 检查密钥是否被暂停
if (license.paused_at) {
  return { success: false, message: '密钥已被暂停' };
}

// 3. 检查密钥状态
if (license.status === 'inactive') {
  // 首次验证时激活密钥
  await activateLicense(license);
}
```

**步骤2: 首次激活**
```javascript
// 计算过期时间（基于密钥类型的有效期天数）
const expiresAt = calculateExpiryTime(licenseType.default_validity_days);

// 激活密钥
await db.run(`
  UPDATE licenses 
  SET status = 'active', activated_at = ?, expires_at = ? 
  WHERE id = ?
`, [currentTime, expiresAt, license.id]);
```

**步骤3: 状态检查**
```javascript
// 检查是否过期（使用UTC时间）
if (license.expires_at && moment.utc().isAfter(license.expires_at)) {
  return { success: false, message: '密钥已过期' };
}

// 检查使用次数限制
if (license.max_uses > 0 && license.current_uses >= license.max_uses) {
  return { success: false, message: '密钥使用次数已达上限' };
}

// 检查设备数量限制
if (license.max_devices > 0) {
  validateDeviceAccess(license, machineId, deviceInfo, clientIP);
}
```

### 4. 设备管理策略

#### 周期化设备管理

**宽松期（激活当天）**
- 所有设备都可以通过验证
- 不占用设备数量限制
- 提高用户体验，允许设备切换

**严格期（激活后）**
- 按**每日周期**管理设备
- 每个设备在当天首次验证时占用一个设备名额
- 同一设备在同一天内重复验证不占用额外名额

#### 设备优先级逻辑
```javascript
// 检查设备是否在当前周期内从未验证过
const isNewInCurrentPeriod = !existingDevice.last_verified_date || 
                            existingDevice.last_verified_date !== currentUtcDate;

if (isNewInCurrentPeriod) {
  // 检查当前周期内已验证的设备数量
  const currentPeriodDevices = await getCurrentPeriodDeviceCount(license.id, currentUtcDate);
  
  if (currentPeriodDevices < license.max_devices) {
    // 通过验证
    return recordUsageAndRespond(license, machineId, deviceInfo, clientIP);
  } else {
    // 拒绝：设备数量已达上限
    return { 
      success: false, 
      message: '设备数量已达上限',
      error: 'MAX_DEVICES_REACHED'
    };
  }
} else {
  // 同一天内已验证过，直接通过
  return recordUsageAndRespond(license, machineId, deviceInfo, clientIP);
}
```

### 5. 安全机制

#### IP地址获取
```javascript
// 支持多种代理头
const clientIP = req.headers['x-forwarded-for'] || 
                 req.headers['x-real-ip'] || 
                 req.headers['x-client-ip'] || 
                 req.headers['cf-connecting-ip'] || 
                 req.connection.remoteAddress;

// 自动识别本地地址和私有IP范围
const isLocalAddress = (ip) => {
  const localAddresses = ['127.0.0.1', '::1', 'localhost'];
  const privateRanges = [/^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./];
  
  return localAddresses.includes(ip) || privateRanges.some(range => range.test(ip));
};
```

#### 使用记录
```javascript
// 每次验证都记录详细信息
await db.run(`
  INSERT INTO license_usage (license_id, machine_id, ip_address, user_agent) 
  VALUES (?, ?, ?, ?)
`, [license.id, machineId, clientIP, deviceInfo]);

// 更新当前使用次数
await db.run(`
  UPDATE licenses 
  SET current_uses = current_uses + 1 
  WHERE id = ?
`, [license.id]);
```

#### 时间管理
```javascript
// 使用UTC时间确保跨时区一致性
const currentUtcTime = moment.utc().format('YYYY-MM-DD HH:mm:ss');
const currentUtcDate = moment.utc().format('YYYY-MM-DD');

// 支持密钥暂停功能
if (license.paused_at) {
  return { success: false, message: '密钥已被暂停' };
}

// 自动过期检查
if (license.expires_at && moment.utc().isAfter(license.expires_at)) {
  return { success: false, message: '密钥已过期' };
}
```

### 6. 验证响应

#### 成功响应
```json
{
  "success": true,
  "data": {
    "licenseKey": "LIC-XXXXXXXX",
    "status": "active",
    "maxUses": 100,
    "currentUses": 5,
    "maxDevices": 3,
    "currentDevices": 2,
    "expiresAt": "2024-12-31T23:59:59Z",
    "applicationName": "MyApp",
    "licenseTypeName": "专业版"
  }
}
```

#### 失败响应
```json
{
  "success": false,
  "message": "设备数量已达上限",
  "error": "MAX_DEVICES_REACHED",
  "maxDevices": 3,
  "currentDevices": 3
}
```

### 7. 系统特点

#### 智能设备管理
- **按日周期管理**: 避免设备频繁切换
- **宽松期机制**: 激活当天允许所有设备
- **优先级策略**: 按首次验证时间确定设备优先级

#### 精确时间控制
- **UTC时间**: 使用UTC时间，支持跨时区部署
- **自动激活**: 首次验证时自动激活密钥
- **过期管理**: 自动过期检查和暂停功能

#### 完整审计日志
- **详细记录**: 记录所有验证活动
- **IP追踪**: 记录客户端IP地址
- **设备信息**: 记录设备详细信息

#### 灵活配置
- **多种密钥类型**: 支持不同的密钥类型和限制策略
- **自定义字段**: 支持自定义字段扩展
- **动态配置**: 支持运行时配置调整

## 📡 API接口

### 认证接口

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com"
}
```

### 管理接口

#### 应用管理

**获取应用列表**
```http
GET /api/admin/applications
Authorization: Bearer <token>
```

**创建应用**
```http
POST /api/admin/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "MyApp",
  "description": "我的应用",
  "version": "1.0.0"
}
```

**更新应用**
```http
PUT /api/admin/applications/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "MyApp Updated",
  "description": "更新后的应用描述"
}
```

**删除应用**
```http
DELETE /api/admin/applications/:id
Authorization: Bearer <token>
```

#### 密钥类型管理

**获取密钥类型列表**
```http
GET /api/admin/license-types?application_id=1
Authorization: Bearer <token>
```

**创建密钥类型**
```http
POST /api/admin/license-types
Authorization: Bearer <token>
Content-Type: application/json

{
  "application_id": 1,
  "type_id": "pro",
  "name": "专业版",
  "display_name": "专业版",
  "prefix": "PRO",
  "description": "专业版密钥类型",
  "default_max_uses": 5,
  "default_max_devices": 3,
  "default_validity_days": 365
}
```

#### 密钥管理

**获取密钥列表**
```http
GET /api/admin/licenses?page=1&limit=20&status=active
Authorization: Bearer <token>
```

**生成单个密钥**
```http
POST /api/admin/generate-license
Authorization: Bearer <token>
Content-Type: application/json

{
  "application_id": 1,
  "license_type_id": 1,
  "max_uses": 10,
  "max_devices": 5,
  "validity_days": 365
}
```

**批量生成密钥**
```http
POST /api/admin/generate-licenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "application_id": 1,
  "license_type_id": 1,
  "count": 100,
  "max_uses": 10,
  "max_devices": 5,
  "validity_days": 365
}
```

**暂停/恢复密钥**
```http
PUT /api/admin/licenses/:id/pause
Authorization: Bearer <token>
Content-Type: application/json

{
  "paused": true
}
```

**删除密钥**
```http
DELETE /api/admin/licenses/:id
Authorization: Bearer <token>
```

#### 批量操作

**批量导出**
```http
POST /api/admin/licenses/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "license_ids": [1, 2, 3, 4, 5],
  "format": "csv"
}
```

**批量删除**
```http
DELETE /api/admin/licenses/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "license_ids": [1, 2, 3, 4, 5]
}
```

#### 用户管理

**获取用户列表**
```http
GET /api/admin/users
Authorization: Bearer <token>
```

**创建用户**
```http
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "role": "user"
}
```

**修改用户角色**
```http
PUT /api/admin/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

### 验证接口

#### 密钥验证
```http
POST /api/license/verify
Content-Type: application/json

{
  "licenseKey": "PRO-5F587EBFE85D59419FFB40CB82CFA3FB",
  "machineId": "machine_123456",
  "deviceInfo": "{\"userAgent\":\"Mozilla/5.0...\",\"platform\":\"Win32\"}"
}
```

**成功响应**
```json
{
  "success": true,
  "data": {
    "licenseKey": "PRO-5F587EBFE85D59419FFB40CB82CFA3FB",
    "status": "active",
    "maxUses": 5,
    "currentUses": 1,
    "maxDevices": 3,
    "currentDevices": 1,
    "expiresAt": "2024-12-31T23:59:59Z",
    "applicationName": "MyApp",
    "licenseTypeName": "专业版"
  }
}
```

**失败响应**
```json
{
  "success": false,
  "message": "密钥已过期",
  "error": "EXPIRED_LICENSE"
}
```

### 统计接口

**获取统计信息**
```http
GET /api/admin/statistics
Authorization: Bearer <token>
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "totalLicenses": 1000,
    "activeLicenses": 850,
    "expiredLicenses": 150,
    "todayUsage": 25,
    "totalApplications": 5,
    "totalUsers": 10
  }
}
```

### 备份接口

**获取备份列表**
```http
GET /api/backup/list
Authorization: Bearer <token>
```

**创建备份**
```http
POST /api/backup/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "full",
  "description": "手动备份"
}
```

**下载备份**
```http
GET /api/backup/download/:filename
Authorization: Bearer <token>
```

**还原备份**
```http
POST /api/backup/restore/:filename
Authorization: Bearer <token>
```





## [💻 Demo在线演示](https://license-demo.zhoujie8.cn/)  

- **账号**：`admin`  
- **密码**：`admin123`  
- 演示站点api接口速度有限制，报错请求数过多，可以自己部署测试。
- 演示站点里面的所有数据每6小时自动清除一次。

#### 接口使用示例

linux-ssh

```bash
# 登录
curl -X POST https://license-demo.zhoujie8.cn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 可先查看可用的密钥类型，获取 licenseTypeId
curl -X GET https://license-demo.zhoujie8.cn/api/admin/license-types \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQ2MjkxMDIsImV4cCI6MTc1NDYzNjMwMn0.mRLX4DqwYWPkwQRAdc8n8nwNHWe6_cDrF6vKBp4lJsc"

# 生成密钥（字段为驼峰，ID为整数）
curl -X POST https://license-demo.zhoujie8.cn/api/admin/generate-license \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQ2MjkxMDIsImV4cCI6MTc1NDYzNjMwMn0.mRLX4DqwYWPkwQRAdc8n8nwNHWe6_cDrF6vKBp4lJsc" \
  -d '{"applicationId":1,"licenseTypeId":3,"maxUses":10,"maxDevices":10,"validityDays":365}'

# 批量生成密钥（字段为驼峰，ID为整数）
curl -X POST https://license-demo.zhoujie8.cn/api/admin/generate-licenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQ2MjkxMDIsImV4cCI6MTc1NDYzNjMwMn0.mRLX4DqwYWPkwQRAdc8n8nwNHWe6_cDrF6vKBp4lJsc" \
  -d '{"applicationId":1,"licenseTypeId":3,"count":5,"maxUses":10,"maxDevices":10,"validityDays":365}'

# 验证密钥
curl -X POST https://license-demo.zhoujie8.cn/api/license/verify \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"TRIAL-26C4CA7481C2E9245D4CDFAB7F08454F","machineId":"machine_1213"}'
```

windows-cmd

```bash
# 验证密钥

curl -X POST https://license-demo.zhoujie8.cn/api/license/verify -H "Content-Type: application/json" -d "{\"licenseKey\":\"TRIAL-26C4CA7481C2E9245D4CDFAB7F08454F\",\"machineId\":\"test-device-091\"}"
```





## 🔗 客户端集成

### JavaScript集成示例

#### 基础验证函数
```javascript
// 验证密钥
async function verifyLicense(licenseKey, machineId) {
    try {
        const response = await fetch('/api/license/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                licenseKey: licenseKey,
                machineId: machineId,
                deviceInfo: JSON.stringify({
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    timestamp: new Date().toISOString()
                })
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('License验证成功');
            return result.data;
        } else {
            console.log('License验证失败:', result.message);
            return null;
        }
    } catch (error) {
        console.error('验证请求失败:', error);
        return null;
    }
}
```

#### 机器ID生成
```javascript
// 生成机器ID
function generateMachineId() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Machine ID', 2, 2);
    
    const fingerprint = canvas.toDataURL();
    const userAgent = navigator.userAgent;
    const screenRes = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    let hash = 0;
    const str = fingerprint + userAgent + screenRes + timezone;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return `machine_${Math.abs(hash)}`;
}
```



```javascript
class ServerMachineId {
  // 生成服务器机器码
  generateMachineId() {
    // 收集最稳定的硬件特征
    const hardwareFeatures = {
      platform: os.platform(),           // 操作系统平台
      hardwareConcurrency: os.cpus().length, // CPU核心数
      deviceMemory: os.totalmem(),       // 系统内存大小
      cpuModel: this.getCPUModel(),      // CPU型号信息
      cpuId: this.getCPUId(),            // CPU序列号或ID
      motherboardInfo: this.getMotherboardInfo(), // 主板信息
      osInfo: this.getOSInfo(),          // 操作系统信息
      arch: os.arch(),                   // CPU架构
      hostId: this.getHostId()           // 宿主机标识
    };

    // 生成哈希
    const str = JSON.stringify(sortedFeatures, sortedKeys);
    const hash = crypto.createHash('sha256').update(str, 'utf8').digest('hex');
    const machineId = `server_${hash.substring(0, 16)}`;

    return machineId;
  }
}
```



#### 使用示例

```javascript
// 使用示例
async function checkLicense() {
    const licenseKey = 'PRO-5F587EBFE85D59419FFB40CB82CFA3FB';
    const machineId = generateMachineId();
    
    const license = await verifyLicense(licenseKey, machineId);
    if (license) {
        console.log('License类型:', license.licenseTypeName);
        console.log('剩余使用次数:', license.maxUses - license.currentUses);
        console.log('设备数量:', license.currentDevices + '/' + license.maxDevices);
        console.log('过期时间:', license.expiresAt);
        
        // 根据License信息启用功能
        enableFeatures(license);
    } else {
        // License验证失败，显示错误信息
        showLicenseError();
    }
}

// 启用功能
function enableFeatures(license) {
    if (license.licenseTypeName === '专业版') {
        enableProFeatures();
    } else if (license.licenseTypeName === '企业版') {
        enableEnterpriseFeatures();
    }
}
```

### React集成示例

#### License验证Hook
```javascript
import { useState, useEffect } from 'react';

export function useLicense(licenseKey) {
    const [license, setLicense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function verifyLicense() {
            try {
                const machineId = generateMachineId();
                const result = await fetch('/api/license/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        licenseKey,
                        machineId,
                        deviceInfo: JSON.stringify({
                            userAgent: navigator.userAgent,
                            platform: navigator.platform
                        })
                    })
                });

                const data = await result.json();
                
                if (data.success) {
                    setLicense(data.data);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError('网络错误');
            } finally {
                setLoading(false);
            }
        }

        if (licenseKey) {
            verifyLicense();
        }
    }, [licenseKey]);

    return { license, loading, error };
}
```

#### 使用组件
```javascript
import React from 'react';
import { useLicense } from './useLicense';

function App() {
    const { license, loading, error } = useLicense('PRO-5F587EBFE85D59419FFB40CB82CFA3FB');

    if (loading) {
        return <div>验证License中...</div>;
    }

    if (error) {
        return <div>License验证失败: {error}</div>;
    }

    if (!license) {
        return <div>无效的License</div>;
    }

    return (
        <div>
            <h1>欢迎使用 {license.applicationName}</h1>
            <p>License类型: {license.licenseTypeName}</p>
            <p>剩余使用次数: {license.maxUses - license.currentUses}</p>
            <p>设备数量: {license.currentDevices}/{license.maxDevices}</p>
            <p>过期时间: {new Date(license.expiresAt).toLocaleDateString()}</p>
        </div>
    );
}
```

### Vue.js集成示例

#### License验证Composable
```javascript
import { ref, onMounted } from 'vue';

export function useLicense(licenseKey) {
    const license = ref(null);
    const loading = ref(true);
    const error = ref(null);

    const verifyLicense = async () => {
        try {
            const machineId = generateMachineId();
            const response = await fetch('/api/license/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    licenseKey,
                    machineId,
                    deviceInfo: JSON.stringify({
                        userAgent: navigator.userAgent,
                        platform: navigator.platform
                    })
                })
            });

            const data = await response.json();
            
            if (data.success) {
                license.value = data.data;
            } else {
                error.value = data.message;
            }
        } catch (err) {
            error.value = '网络错误';
        } finally {
            loading.value = false;
        }
    };

    onMounted(() => {
        if (licenseKey) {
            verifyLicense();
        }
    });

    return {
        license,
        loading,
        error,
        verifyLicense
    };
}
```

#### 使用组件
```vue
<template>
    <div>
        <div v-if="loading">验证License中...</div>
        <div v-else-if="error">License验证失败: {{ error }}</div>
        <div v-else-if="license">
            <h1>欢迎使用 {{ license.applicationName }}</h1>
            <p>License类型: {{ license.licenseTypeName }}</p>
            <p>剩余使用次数: {{ license.maxUses - license.currentUses }}</p>
            <p>设备数量: {{ license.currentDevices }}/{{ license.maxDevices }}</p>
            <p>过期时间: {{ formatDate(license.expiresAt) }}</p>
        </div>
        <div v-else>无效的License</div>
    </div>
</template>

<script>
import { useLicense } from './useLicense';

export default {
    setup() {
        const { license, loading, error } = useLicense('PRO-5F587EBFE85D59419FFB40CB82CFA3FB');

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString();
        };

        return {
            license,
            loading,
            error,
            formatDate
        };
    }
};
</script>
```

### Node.js集成示例

#### 客户端SDK
```javascript
const axios = require('axios');
const crypto = require('crypto');

class LicenseClient {
    constructor(baseURL, licenseKey) {
        this.baseURL = baseURL;
        this.licenseKey = licenseKey;
        this.machineId = this.generateMachineId();
    }

    generateMachineId() {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        const macAddress = Object.values(networkInterfaces)
            .flat()
            .find(interface => !interface.internal)?.mac;
        
        const hostname = os.hostname();
        const platform = os.platform();
        
        const data = `${macAddress}-${hostname}-${platform}`;
        const hash = crypto.createHash('md5').update(data).digest('hex');
        
        return `machine_${hash}`;
    }

    async verify() {
        try {
            const response = await axios.post(`${this.baseURL}/api/license/verify`, {
                licenseKey: this.licenseKey,
                machineId: this.machineId,
                deviceInfo: JSON.stringify({
                    platform: process.platform,
                    arch: process.arch,
                    version: process.version,
                    hostname: require('os').hostname()
                })
            });

            return response.data;
        } catch (error) {
            if (error.response) {
                return error.response.data;
            }
            throw error;
        }
    }

    async checkFeature(featureName) {
        const result = await this.verify();
        
        if (!result.success) {
            return false;
        }

        const license = result.data;
        
        // 检查License是否有效
        if (license.status !== 'active') {
            return false;
        }

        // 检查是否过期
        if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
            return false;
        }

        // 根据License类型检查功能
        switch (license.licenseTypeName) {
            case '专业版':
                return ['feature1', 'feature2', 'feature3'].includes(featureName);
            case '企业版':
                return ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'].includes(featureName);
            default:
                return false;
        }
    }
}

module.exports = LicenseClient;
```

#### 使用示例
```javascript
const LicenseClient = require('./license-client');

async function main() {
    const client = new LicenseClient(
        'http://localhost:3005',
        'PRO-5F587EBFE85D59419FFB40CB82CFA3FB'
    );

    // 验证License
    const result = await client.verify();
    if (result.success) {
        console.log('License验证成功:', result.data);
        
        // 检查功能
        const hasFeature1 = await client.checkFeature('feature1');
        console.log('功能1可用:', hasFeature1);
        
        const hasFeature4 = await client.checkFeature('feature4');
        console.log('功能4可用:', hasFeature4);
    } else {
        console.log('License验证失败:', result.message);
    }
}

main().catch(console.error);
```

## 🛡️ 安全机制

### 1. 认证安全
- **JWT令牌**: 使用JWT进行用户认证
- **密码加密**: 使用bcrypt加密存储密码
- **令牌过期**: JWT令牌设置合理的过期时间

### 2. 接口安全
- **速率限制**: 防止API滥用和暴力攻击
- **CORS配置**: 控制跨域请求
- **Helmet**: 设置安全HTTP头

### 3. 数据安全
- **密钥签名**: 防篡改的密钥验证
- **设备绑定**: 防止密钥滥用
- **IP记录**: 记录客户端IP地址

### 4. 备份安全
- **文件验证**: 备份文件完整性验证
- **权限控制**: 备份操作权限控制
- **自动清理**: 定期清理旧备份文件

### 安全最佳实践

#### 1. 生产环境配置
```bash
# 修改默认密钥
JWT_SECRET=your-production-jwt-secret
LICENSE_SECRET_KEY=your-production-license-secret

# 启用安全模式
NODE_ENV=production
DEBUG_MODE=false
LOG_LEVEL=warn

# 配置速率限制
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=3
```

#### 2. 客户端安全
```javascript
// 使用HTTPS
const API_BASE_URL = 'https://your-domain.com';

// 实现重试机制
async function verifyLicenseWithRetry(licenseKey, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await verifyLicense(licenseKey);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// 本地缓存License信息
function cacheLicense(license) {
    localStorage.setItem('license', JSON.stringify({
        ...license,
        cachedAt: new Date().toISOString()
    }));
}

function getCachedLicense() {
    const cached = localStorage.getItem('license');
    if (!cached) return null;
    
    const license = JSON.parse(cached);
    const cachedAt = new Date(license.cachedAt);
    const now = new Date();
    
    // 缓存1小时
    if (now - cachedAt > 60 * 60 * 1000) {
        localStorage.removeItem('license');
        return null;
    }
    
    return license;
}
```

#### 3. 错误处理
```javascript
// 统一错误处理
function handleLicenseError(error) {
    switch (error.error) {
        case 'EXPIRED_LICENSE':
            showMessage('License已过期，请续费');
            break;
        case 'MAX_DEVICES_REACHED':
            showMessage(`设备数量已达上限，最多支持${error.maxDevices}台设备`);
            break;
        case 'MAX_USES_REACHED':
            showMessage('License使用次数已达上限');
            break;
        case 'LICENSE_PAUSED':
            showMessage('License已被暂停');
            break;
        default:
            showMessage('License验证失败，请检查网络连接');
    }
}
```

## 🧪 测试指南

### 单元测试

#### 密钥验证测试
```javascript
const { verifyLicense } = require('../utils/licenseGenerator');

describe('License验证测试', () => {
    test('有效License应该通过验证', () => {
        const license = {
            licenseKey: 'PRO-5F587EBFE85D59419FFB40CB82CFA3FB',
            status: 'active',
            maxUses: 5,
            currentUses: 1,
            maxDevices: 3,
            currentDevices: 1,
            expiresAt: '2024-12-31T23:59:59Z'
        };
        
        const result = verifyLicense(license, 'machine_123');
        expect(result.success).toBe(true);
    });

    test('过期License应该被拒绝', () => {
        const license = {
            licenseKey: 'PRO-5F587EBFE85D59419FFB40CB82CFA3FB',
            status: 'active',
            maxUses: 5,
            currentUses: 1,
            maxDevices: 3,
            currentDevices: 1,
            expiresAt: '2020-12-31T23:59:59Z'
        };
        
        const result = verifyLicense(license, 'machine_123');
        expect(result.success).toBe(false);
        expect(result.error).toBe('EXPIRED_LICENSE');
    });
});
```

#### API接口测试
```javascript
const request = require('supertest');
const app = require('../server');

describe('API接口测试', () => {
    test('POST /api/license/verify 应该验证License', async () => {
        const response = await request(app)
            .post('/api/license/verify')
            .send({
                licenseKey: 'PRO-5F587EBFE85D59419FFB40CB82CFA3FB',
                machineId: 'machine_123'
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success');
    });

    test('POST /api/auth/login 应该验证用户登录', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin',
                password: 'admin123'
            });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
    });
});
```

### 集成测试

#### 完整流程测试
```javascript
describe('完整License流程测试', () => {
    let token;
    let licenseKey;

    beforeAll(async () => {
        // 登录获取token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin',
                password: 'admin123'
            });
        
        token = loginResponse.body.data.token;
    });

    test('应该能够生成并验证License', async () => {
        // 1. 生成License
        const generateResponse = await request(app)
            .post('/api/admin/generate-license')
            .set('Authorization', `Bearer ${token}`)
            .send({
                application_id: 1,
                license_type_id: 1,
                max_uses: 5,
                max_devices: 3,
                validity_days: 365
            });
        
        expect(generateResponse.status).toBe(200);
        licenseKey = generateResponse.body.data.licenseKey;

        // 2. 验证License
        const verifyResponse = await request(app)
            .post('/api/license/verify')
            .send({
                licenseKey: licenseKey,
                machineId: 'machine_123'
            });
        
        expect(verifyResponse.status).toBe(200);
        expect(verifyResponse.body.success).toBe(true);
    });
});
```

### 性能测试

#### 负载测试
```javascript
const autocannon = require('autocannon');

async function runLoadTest() {
    const result = await autocannon({
        url: 'http://localhost:3005/api/license/verify',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            licenseKey: 'PRO-5F587EBFE85D59419FFB40CB82CFA3FB',
            machineId: 'machine_123'
        }),
        connections: 10,
        duration: 10
    });

    console.log('性能测试结果:', result);
}

runLoadTest();
```

### 测试脚本

#### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --grep "License验证"

# 运行覆盖率测试
npm run test:coverage

# 运行性能测试
npm run test:performance
```

#### 测试配置
```javascript
// jest.config.js
module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'routes/**/*.js',
        'utils/**/*.js',
        'config/**/*.js'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};
```

## 📞 技术支持

如有技术问题，请：
1. 查看本文档的相关章节
2. 检查API接口规范
3. 提交Issue描述问题
4. 联系技术支持

### 相关链接
- 🌐 [项目主页](https://github.com/vbskycn/License)
- 📚 [在线文档](https://license.zhoujie8.cn/)
- 🐛 [问题反馈](https://github.com/vbskycn/License/issues)
- 🐳 [Docker镜像](https://hub.docker.com/r/zhoujie218/license-management-system)

---

**密钥管理系统开发者指南** - 让集成更简单、更安全！ 