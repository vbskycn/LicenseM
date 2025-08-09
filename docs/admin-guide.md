---
layout: default
title: 管理员指南
description: 完整的系统配置、备份恢复、故障排除指南，适合系统管理员
---

# 密钥管理系统 - 管理员指南

> 完整的系统配置、备份恢复、故障排除指南，适合系统管理员

## ⚙️ 系统配置

### 环境变量配置

#### 基础配置

```bash
# 服务器配置
PORT=3005
NODE_ENV=production

# JWT配置（生产环境必须修改）
JWT_SECRET=your-production-jwt-secret-key-change-this

# License配置（生产环境必须修改）
LICENSE_SECRET_KEY=your-production-license-secret-key-change-this

# 数据库配置
DB_PATH=./data/license.db
```

#### 安全配置

```bash
# 速率限制配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=3

# 域名和CDN配置
ALLOWED_DOMAINS=https://yourdomain.com,https://www.yourdomain.com
ALLOWED_CDNS=https://cdn.bootcdn.net,https://cdn.jsdelivr.net,https://*.cloudflare.com

# 调试配置
DEBUG_MODE=false
LOG_LEVEL=warn
```

#### 高级配置

```bash
# 备份配置
BACKUP_RETENTION_DAYS=30
BACKUP_MAX_SIZE_MB=100

# 性能配置
MAX_CONNECTIONS=100
REQUEST_TIMEOUT=30000

# 日志配置
LOG_FILE=./logs/server.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
```

### 生产环境配置

#### Docker环境配置

```bash
# 创建.env文件
cat > .env << EOF
# 服务器配置
PORT=3005
NODE_ENV=production

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
LICENSE_SECRET_KEY=your-super-secret-license-key-change-this-in-production

# 速率限制
RATE_LIMIT_MAX_REQUESTS=2000
API_RATE_LIMIT_MAX_REQUESTS=5000
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=20

# 域名配置
ALLOWED_DOMAINS=https://yourdomain.com,https://www.yourdomain.com
ALLOWED_CDNS=https://cdn.bootcdn.net,https://static.cloudflareinsights.com,https://*.cloudflare.com

# 调试配置
DEBUG_MODE=false
LOG_LEVEL=warn
EOF
```

#### 系统服务配置

**systemd服务文件**
```ini
# /etc/systemd/system/license-manager.service
[Unit]
Description=License Management System
After=network.target

[Service]
Type=simple
User=license
WorkingDirectory=/opt/license-manager
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3005

[Install]
WantedBy=multi-user.target
```

**启动服务**
```bash
# 启用服务
sudo systemctl enable license-manager

# 启动服务
sudo systemctl start license-manager

# 查看状态
sudo systemctl status license-manager

# 查看日志
sudo journalctl -u license-manager -f
```

### 性能优化配置

#### 数据库优化

```javascript
// config/database.js
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接错误:', err.message);
    } else {
        console.log('数据库连接成功');
        
        // 启用WAL模式提高性能
        db.run('PRAGMA journal_mode = WAL');
        
        // 设置缓存大小
        db.run('PRAGMA cache_size = 10000');
        
        // 启用外键约束
        db.run('PRAGMA foreign_keys = ON');
        
        // 设置同步模式
        db.run('PRAGMA synchronous = NORMAL');
        
        initDatabase();
    }
});
```

#### 内存优化

```bash
# Node.js内存配置
export NODE_OPTIONS="--max-old-space-size=512"

# 系统内存配置
# 在/etc/sysctl.conf中添加
vm.swappiness=10
vm.dirty_ratio=15
vm.dirty_background_ratio=5
```

#### 网络优化

```javascript
// server.js
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');

const app = express();

// 启用Gzip压缩
app.use(compression());

// 设置安全头
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.bootcdn.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.bootcdn.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// 设置缓存头
app.use((req, res, next) => {
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    next();
});
```

### 安全配置

#### 防火墙配置

```bash
# UFW防火墙配置
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3005/tcp
sudo ufw enable

# iptables配置
sudo iptables -A INPUT -p tcp --dport 3005 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -P INPUT DROP
```

#### SSL/TLS配置

```javascript
// 使用HTTPS
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('/path/to/private.key'),
    cert: fs.readFileSync('/path/to/certificate.crt')
};

https.createServer(options, app).listen(443, () => {
    console.log('HTTPS服务器运行在端口 443');
});
```

#### 访问控制

```javascript
// 限制IP访问
const allowedIPs = ['192.168.1.0/24', '10.0.0.0/8'];

app.use((req, res, next) => {
    const clientIP = req.ip;
    const isAllowed = allowedIPs.some(range => {
        return ipRangeCheck(clientIP, range);
    });
    
    if (!isAllowed) {
        return res.status(403).json({
            success: false,
            message: '访问被拒绝'
        });
    }
    
    next();
});
```

## 💾 备份恢复

### 自动备份配置

#### 备份脚本

```bash
#!/bin/bash
# /opt/license-manager/backup.sh

BACKUP_DIR="/opt/license-manager/backups"
DB_FILE="/opt/license-manager/data/license.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
sqlite3 $DB_FILE ".backup '$BACKUP_FILE'"

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_FILE.gz"
```

#### 定时备份

```bash
# 编辑crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /opt/license-manager/backup.sh

# 每周日凌晨3点完整备份
0 3 * * 0 /opt/license-manager/backup.sh --full
```

### 手动备份

#### 数据库备份

```bash
# SQL备份
sqlite3 data/license.db ".backup backup_$(date +%Y%m%d_%H%M%S).sql"

# 完整备份
cp data/license.db backup_$(date +%Y%m%d_%H%M%S).db

# 压缩备份
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz data/
```

#### 配置文件备份

```bash
# 备份配置文件
cp .env backup_env_$(date +%Y%m%d_%H%M%S)
cp config/* backup_config_$(date +%Y%m%d_%H%M%S)/
```

### 数据恢复

#### 从备份恢复

```bash
# 停止服务
sudo systemctl stop license-manager

# 恢复数据库
sqlite3 data/license.db ".restore backup_20241219_143000.sql"

# 恢复配置文件
cp backup_env_20241219_143000 .env

# 启动服务
sudo systemctl start license-manager
```

#### 验证恢复

```bash
# 检查数据库完整性
sqlite3 data/license.db "PRAGMA integrity_check;"

# 检查表结构
sqlite3 data/license.db ".schema"

# 检查数据
sqlite3 data/license.db "SELECT COUNT(*) FROM licenses;"
sqlite3 data/license.db "SELECT COUNT(*) FROM applications;"
```

### 备份管理

#### 备份文件管理

```bash
# 查看备份文件
ls -la backups/

# 检查备份文件大小
du -sh backups/*

# 验证备份文件完整性
for file in backups/*.sql.gz; do
    echo "检查 $file"
    gunzip -t "$file" && echo "✓ 完整" || echo "✗ 损坏"
done
```

#### 备份策略

```bash
# 备份策略脚本
#!/bin/bash

BACKUP_DIR="/opt/license-manager/backups"
RETENTION_DAYS=30
MAX_SIZE_MB=1000

# 清理过期备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# 检查备份大小
TOTAL_SIZE=$(du -sm $BACKUP_DIR | cut -f1)
if [ $TOTAL_SIZE -gt $MAX_SIZE_MB ]; then
    echo "备份大小超过限制，删除最旧的备份"
    ls -t $BACKUP_DIR/*.sql.gz | tail -n 5 | xargs rm -f
fi
```

## 🔧 故障排除

### 常见问题诊断

#### 1. 服务无法启动

**检查步骤：**
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3005

# 检查进程
ps aux | grep node

# 检查日志
tail -f logs/server.log

# 检查权限
ls -la data/
ls -la logs/
```

**解决方案：**
```bash
# 杀死占用端口的进程
sudo kill -9 $(lsof -t -i:3005)

# 修复权限
sudo chown -R license:license /opt/license-manager
sudo chmod -R 755 /opt/license-manager

# 重新启动服务
sudo systemctl restart license-manager
```

#### 2. 数据库连接错误

**检查步骤：**
```bash
# 检查数据库文件
ls -la data/license.db

# 检查数据库完整性
sqlite3 data/license.db "PRAGMA integrity_check;"

# 检查磁盘空间
df -h

# 检查文件权限
ls -la data/
```

**解决方案：**
```bash
# 修复数据库
sqlite3 data/license.db "VACUUM;"
sqlite3 data/license.db "REINDEX;"

# 从备份恢复
cp backup_20241219_143000.db data/license.db

# 重新初始化数据库
rm data/license.db
npm start
```

#### 3. 内存不足

**检查步骤：**
```bash
# 检查内存使用
free -h

# 检查Node.js内存
ps aux | grep node

# 检查系统负载
top
```

**解决方案：**
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=1024"

# 优化数据库
sqlite3 data/license.db "PRAGMA cache_size = 5000;"
sqlite3 data/license.db "VACUUM;"

# 重启服务
sudo systemctl restart license-manager
```

#### 4. 网络连接问题

**检查步骤：**
```bash
# 检查网络连接
ping google.com

# 检查防火墙
sudo ufw status

# 检查端口监听
netstat -tlnp | grep :3005

# 检查DNS
nslookup yourdomain.com
```

**解决方案：**
```bash
# 配置防火墙
sudo ufw allow 3005/tcp

# 检查服务状态
sudo systemctl status license-manager

# 重启网络服务
sudo systemctl restart networking
```

### 日志分析

#### 日志文件位置

```bash
# 应用日志
tail -f logs/server.log

# 系统日志
sudo journalctl -u license-manager -f

# 错误日志
grep "ERROR" logs/server.log

# 访问日志
grep "POST /api/license/verify" logs/server.log
```

#### 日志分析脚本

```bash
#!/bin/bash
# log_analyzer.sh

LOG_FILE="logs/server.log"

echo "=== License验证统计 ==="
grep "License验证" $LOG_FILE | wc -l

echo "=== 错误统计 ==="
grep "ERROR" $LOG_FILE | wc -l

echo "=== 最近错误 ==="
grep "ERROR" $LOG_FILE | tail -10

echo "=== 访问IP统计 ==="
grep "POST /api/license/verify" $LOG_FILE | awk '{print $1}' | sort | uniq -c | sort -nr

echo "=== 响应时间统计 ==="
grep "响应时间" $LOG_FILE | awk '{print $NF}' | sort -n | tail -5
```

### 性能监控

#### 系统监控

```bash
#!/bin/bash
# monitor.sh

echo "=== 系统资源使用 ==="
echo "CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "内存使用: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "磁盘使用: $(df / | tail -1 | awk '{print $5}')"

echo "=== 应用状态 ==="
if pgrep -f "node server.js" > /dev/null; then
    echo "应用运行中"
    echo "进程ID: $(pgrep -f 'node server.js')"
    echo "内存使用: $(ps aux | grep 'node server.js' | grep -v grep | awk '{print $6/1024 " MB"}')"
else
    echo "应用未运行"
fi

echo "=== 数据库状态 ==="
DB_SIZE=$(du -h data/license.db | cut -f1)
echo "数据库大小: $DB_SIZE"
echo "表数量: $(sqlite3 data/license.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")"
```

#### 性能优化

```bash
# 数据库优化
sqlite3 data/license.db << EOF
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
VACUUM;
ANALYZE;
EOF

# 清理日志
find logs/ -name "*.log" -mtime +7 -delete

# 清理临时文件
find /tmp -name "license-*" -mtime +1 -delete
```

## 📊 监控维护

### 系统监控

#### 监控脚本

```bash
#!/bin/bash
# health_check.sh

# 检查服务状态
if ! systemctl is-active --quiet license-manager; then
    echo "服务未运行，尝试重启"
    systemctl restart license-manager
    sleep 5
    
    if ! systemctl is-active --quiet license-manager; then
        echo "服务重启失败，发送告警"
        # 发送告警邮件或通知
    fi
fi

# 检查数据库连接
if ! sqlite3 data/license.db "SELECT 1;" > /dev/null 2>&1; then
    echo "数据库连接失败"
    # 发送告警
fi

# 检查磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "磁盘空间不足: ${DISK_USAGE}%"
    # 发送告警
fi

# 检查内存使用
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "内存使用过高: ${MEM_USAGE}%"
    # 发送告警
fi
```

#### 定时监控

```bash
# 添加到crontab
*/5 * * * * /opt/license-manager/health_check.sh
0 * * * * /opt/license-manager/performance_check.sh
0 2 * * * /opt/license-manager/cleanup.sh
```

### 数据维护

#### 数据清理

```sql
-- 清理过期的使用记录
DELETE FROM license_usage 
WHERE used_at < datetime('now', '-90 days');

-- 清理过期的设备绑定
DELETE FROM device_bindings 
WHERE last_verified_at < datetime('now', '-180 days');

-- 清理暂停的密钥（超过1年）
DELETE FROM licenses 
WHERE status = 'suspended' 
AND paused_at < datetime('now', '-365 days');
```

#### 数据统计

```sql
-- 密钥使用统计
SELECT 
    l.license_key,
    l.status,
    l.max_uses,
    l.current_uses,
    l.max_devices,
    l.current_devices,
    COUNT(lu.id) as usage_count,
    MAX(lu.used_at) as last_used
FROM licenses l
LEFT JOIN license_usage lu ON l.id = lu.license_id
GROUP BY l.id
ORDER BY usage_count DESC;

-- 设备绑定统计
SELECT 
    l.license_key,
    COUNT(db.id) as device_count,
    MAX(db.last_verified_at) as last_device_activity
FROM licenses l
LEFT JOIN device_bindings db ON l.id = db.license_id
GROUP BY l.id
HAVING device_count > 0
ORDER BY device_count DESC;
```

### 性能调优

#### 数据库索引

```sql
-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_usage_license ON license_usage(license_id);
CREATE INDEX IF NOT EXISTS idx_usage_used_at ON license_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_device_license ON device_bindings(license_id);
CREATE INDEX IF NOT EXISTS idx_device_id ON device_bindings(device_id);
```

#### 查询优化

```javascript
// 优化查询性能
const optimizedQuery = `
    SELECT l.*, a.name as application_name, lt.name as license_type_name
    FROM licenses l
    JOIN applications a ON l.application_id = a.id
    JOIN license_types lt ON l.license_type_id = lt.id
    WHERE l.license_key = ?
    LIMIT 1
`;

// 使用预编译语句
const stmt = db.prepare(optimizedQuery);
const license = stmt.get(licenseKey);
stmt.finalize();
```

## 🛡️ 安全加固

### 安全配置

#### 环境变量安全

```bash
# 生成强密钥
openssl rand -hex 32
openssl rand -base64 32

# 设置环境变量
export JWT_SECRET=$(openssl rand -hex 32)
export LICENSE_SECRET_KEY=$(openssl rand -hex 32)

# 保存到.env文件
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "LICENSE_SECRET_KEY=$LICENSE_SECRET_KEY" >> .env
```

#### 访问控制

```javascript
// IP白名单
const allowedIPs = [
    '192.168.1.0/24',
    '10.0.0.0/8',
    '172.16.0.0/12'
];

app.use((req, res, next) => {
    const clientIP = req.ip;
    const isAllowed = allowedIPs.some(range => {
        return ipRangeCheck(clientIP, range);
    });
    
    if (!isAllowed) {
        return res.status(403).json({
            success: false,
            message: '访问被拒绝'
        });
    }
    
    next();
});
```

#### 速率限制

```javascript
// 严格的速率限制
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最多5次请求
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// 应用到敏感接口
app.use('/api/auth/login', strictLimiter);
app.use('/api/admin', strictLimiter);
```

### 安全审计

#### 访问日志

```javascript
// 记录所有访问
app.use((req, res, next) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
    };
    
    console.log(JSON.stringify(logEntry));
    next();
});
```

#### 安全扫描

```bash
# 使用nmap扫描端口
nmap -sS -p- your-server-ip

# 检查SSL证书
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# 检查HTTP安全头
curl -I https://your-domain.com
```

### 应急响应

#### 安全事件处理

```bash
#!/bin/bash
# security_incident.sh

echo "=== 安全事件响应 ==="

# 1. 停止服务
systemctl stop license-manager

# 2. 备份当前状态
cp data/license.db backup_incident_$(date +%Y%m%d_%H%M%S).db

# 3. 检查日志
grep -i "error\|fail\|denied" logs/server.log | tail -50

# 4. 检查异常访问
grep "POST /api/license/verify" logs/server.log | awk '{print $1}' | sort | uniq -c | sort -nr

# 5. 检查系统进程
ps aux | grep node

# 6. 检查网络连接
netstat -tlnp | grep :3005

echo "=== 响应完成 ==="
```

#### 数据恢复

```bash
#!/bin/bash
# data_recovery.sh

echo "=== 数据恢复流程 ==="

# 1. 停止服务
systemctl stop license-manager

# 2. 备份当前数据
cp -r data/ data_backup_$(date +%Y%m%d_%H%M%S)/

# 3. 从最新备份恢复
LATEST_BACKUP=$(ls -t backups/*.sql.gz | head -1)
gunzip -c $LATEST_BACKUP | sqlite3 data/license.db

# 4. 验证数据完整性
sqlite3 data/license.db "PRAGMA integrity_check;"

# 5. 启动服务
systemctl start license-manager

echo "=== 恢复完成 ==="
```

## 📞 技术支持

### 联系信息

如有问题，请：
1. 查看本文档的相关章节
2. 检查系统日志
3. 提交Issue或联系技术支持

### 相关链接
- 🌐 [项目主页](https://github.com/vbskycn/LicenseM)
- 📚 [在线文档](https://license.zhoujie8.cn/)
- 🐛 [问题反馈](https://github.com/vbskycn/LicenseM/issues)
- 🐳 [Docker镜像](https://hub.docker.com/r/zhoujie218/license-management-system)

---

**密钥管理系统管理员指南** - 让运维更简单、更安全！ 