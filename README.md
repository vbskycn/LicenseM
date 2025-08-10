---
layout: default
title: 快速开始
description: 简单的安装部署

---

# 密钥管理系统 - 文档中心

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-orange.svg)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vbskycn/License/blob/main/LICENSE)

## 📖 关于本系统

密钥管理系统是一个现代化的License管理解决方案，支持密钥生成、验证、设备管理等功能。本系统采用应用-密钥类型架构，提供完整的生命周期管理。

![image-20250809215751912](assets/image-20250809215751912.png)

## 📚 文档导航

本系统提供完整的技术文档，按照不同用户角色进行分类：

### 📖 用户指南

面向最终用户的使用文档：

- [用户指南](docs/user-guide.md) - 完整的安装、部署、使用指南

### 🔧 开发者指南

面向开发者的技术文档：

- [开发者指南](docs/developer-guide.md) - 技术架构、API接口、集成指南

### ⚙️ 管理员指南

面向系统管理员的运维文档：

- [管理员指南](docs/admin-guide.md) - 系统配置、备份恢复、故障排除



## [💻 Demo在线演示](https://license-demo.zhoujie8.cn/)  

- **账号**：`admin`  
- **密码**：`admin123`  
- 演示站点api接口速度有限制，报错请求数过多，可以自己部署测试。
- 演示站点里面的所有数据每6小时自动清除一次。

#### linux-ssh

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

#### windows-cmd

验证密钥

```bash
curl -X POST https://license-demo.zhoujie8.cn/api/license/verify -H "Content-Type: application/json" -d "{\"licenseKey\":\"TRIAL-26C4CA7481C2E9245D4CDFAB7F08454F\",\"machineId\":\"test-device-091\"}"
```

### 👤 我是最终用户[¶](https://license.zhoujie8.cn/#_3)

**想要安装和使用系统**

- [📖 用户指南](https://license.zhoujie8.cn/user-guide/) - 完整的安装、部署、使用指南
- [🚀 快速开始](https://license.zhoujie8.cn/user-guide/#_1) - 环境要求和基本安装
- [📦 安装指南](https://license.zhoujie8.cn/user-guide/#_6) - 详细的安装步骤
- [🐳 Docker部署](https://license.zhoujie8.cn/user-guide/#docker) - 容器化部署方案
- [📖 使用指南](https://license.zhoujie8.cn/user-guide/#_12) - 系统操作说明
- [⚙️ 配置说明](https://license.zhoujie8.cn/user-guide/#_21) - 环境变量配置
- [🔧 故障排除](https://license.zhoujie8.cn/user-guide/#_27) - 常见问题解决

### 👨‍💻 我是开发者[¶](https://license.zhoujie8.cn/#_4)

**想要集成API或了解技术细节**

- [🔧 开发者指南](https://license.zhoujie8.cn/developer-guide/) - 技术架构、API接口、集成指南
- [🏗️ 技术架构](https://license.zhoujie8.cn/developer-guide/#_1) - 系统架构设计
- [🔐 密钥验证逻辑](https://license.zhoujie8.cn/developer-guide/#_6) - 验证机制详解
- [📡 API接口](https://license.zhoujie8.cn/developer-guide/#api) - 完整的API文档
- [🔗 客户端集成](https://license.zhoujie8.cn/developer-guide/#_34) - 集成示例和SDK
- [🛡️ 安全机制](https://license.zhoujie8.cn/developer-guide/#_40) - 安全设计和防护
- [🧪 测试指南](https://license.zhoujie8.cn/developer-guide/#_42) - 测试方法和工具

### 👨‍💼 我是系统管理员[¶](https://license.zhoujie8.cn/#_5)

**想要配置和维护系统**

- [⚙️ 管理员指南](https://license.zhoujie8.cn/admin-guide/) - 系统配置、备份恢复、故障排除
- [⚙️ 系统配置](https://license.zhoujie8.cn/admin-guide/#_1) - 环境变量和高级配置
- [💾 备份恢复](https://license.zhoujie8.cn/admin-guide/#_15) - 数据备份和恢复策略
- [🔧 故障排除](https://license.zhoujie8.cn/admin-guide/#_28) - 系统问题诊断和解决
- [📊 监控维护](https://license.zhoujie8.cn/admin-guide/#_36) - 系统监控和维护
- [🛡️ 安全加固](https://license.zhoujie8.cn/admin-guide/#_46) - 安全配置和加固措施

## ⚡ 快速访问[¶](https://license.zhoujie8.cn/#_6)

**最常用的页面链接：**

- [🚀 快速开始](https://license.zhoujie8.cn/user-guide/#_1) - 5分钟快速部署
- [📡 API接口](https://license.zhoujie8.cn/developer-guide/#api) - 完整的API文档
- [⚙️ 系统配置](https://license.zhoujie8.cn/admin-guide/#_1) - 环境变量配置
- [🔐 密钥验证逻辑](https://license.zhoujie8.cn/developer-guide/#_6) - 验证机制详解
- [💾 备份恢复](https://license.zhoujie8.cn/admin-guide/#_15) - 数据备份策略
- [🔧 故障排除](https://license.zhoujie8.cn/user-guide/#_27) - 常见问题解决



## 🏗️ 技术架构

本系统采用**应用-密钥类型**架构，已废弃旧的产品-套餐模型：

- **应用 (Application)**: 每个密钥必须属于一个应用
- **密钥类型 (License Type)**: 每个应用下有多个密钥类型  
- **密钥 (License)**: 基于应用和密钥类型生成

### 核心特性

- ✅ 应用-密钥类型架构
- ✅ 设备管理策略（宽松期/严格期）
- ✅ 密钥激活逻辑（首次验证激活）
- ✅ 批量管理功能（导出、删除、复制）
- ✅ 用户管理功能
- ✅ IP地址记录
- ✅ 速率限制
- ✅ 暂停/恢复功能
- ✅ 搜索和过滤功能
- ✅ 在线备份还原功能
- ✅ 备份文件管理



## 🎯 系统特色

- ✅ **应用-密钥类型架构** - 灵活的密钥管理模型
- ✅ **设备管理策略** - 支持宽松期/严格期管理
- ✅ **密钥激活逻辑** - 首次验证自动激活
- ✅ **批量管理功能** - 导出、删除、复制等操作
- ✅ **用户管理功能** - 完整的权限控制
- ✅ **在线备份还原** - 数据安全保障
- ✅ **搜索和过滤** - 快速定位目标数据



## 🔗 相关链接

- 🌐 [项目主页](https://github.com/vbskycn/LicenseM)
- 📚 [在线文档](https://license.zhoujie8.cn/)
- 🐛 [问题反馈](https://github.com/vbskycn/LicenseM/issues)
- 🐳 [Docker镜像](https://hub.docker.com/r/zhoujie218/license-management-system)

---

**开始您的密钥管理之旅** - 选择上方对应的指南开始使用！ 