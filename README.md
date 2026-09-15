# 🧭 个人旅行足迹与游记管理系统

基于 **Next.js + TypeScript + Prisma + MySQL** 的个人旅行记录 Web 应用。

将旅行中的**地图空间、时间行程、游记图文、消费账单**四个维度整合管理，支持地图足迹可视化、行程时间轴、Markdown 游记、消费分类统计。

## ✨ 功能特性

| 模块 | 功能 |
| ---- | ---- |
| 用户账号 | 注册 / 登录 / 退出，JWT 会话，httpOnly Cookie（生产环境 Secure），页面级登录保护 |
| 旅行管理 | 创建 / 编辑 / 删除旅行，封面、简介、起止日期（结束不得早于开始），**生命周期状态机：计划中 / 进行中 / 已完成（按起止日期自动推断，可手动修改）** |
| 行程时间轴 | 按旅行日组织行程，Day 1 / Day 2 ... 时间轴展示，旅行日可编辑 / 删除 |
| 地点与地图 | 打卡地点 + 经纬度，地图选点录入，Leaflet/OpenStreetMap 渲染，行程路线连线 + 方向箭头，点位按游玩顺序编号，有游记 / 无游记点位区分，地点类型使用数据库枚举（9 类） |
| 搜索筛选 | 首页地图按年份 / 地点类型筛选（URL 驱动，点位与统计联动）；旅行列表关键词搜索（标题 / 描述 / 目的地）+ 年份筛选 |
| 游记图文 | 地点 ↔ 游记一对多，**分屏 Markdown 编辑器（顶部格式工具栏 H1/H2/H3/加粗/斜体/引用/列表/链接/分割线/代码块，左侧源码右侧实时预览，对新手友好）**，多图上传（本地存储），图片可一键插入正文光标处实现图文混排（已嵌入图片自动从顶部图集隐藏，避免重复），列表 / 阅读 / 编辑三模式 |
| 消费统计 | 分类记账（枚举：交通 / 住宿 / 餐饮 / 门票 / 购物 / 其他），可关联旅行日与具体打卡地点，日期时间精确到时分（24 小时制），Recharts 饼图占比，消费明细（支持逐条编辑 / 删除） |
| 数据分析中心 | 汇总统计（旅行 / 天数 / 地点 / 游记 / 消费），年度统计柱状图，消费分类饼图，国家 / 城市分布，月度消费趋势，平均每天 / 单次旅行消费 |
| 单次旅行分析 | 旅行详情页内嵌分析：天数 / 地点 / 游记 / 总消费 / 日均 / 单次均消 6 指标 + 消费分类饼图 + 每日消费柱状图 + 地点类型柱状图 + 每日游记分布 + 消费最高日 / 消费最高地点（基于现有表聚合，不新增表） |
| 旅行回顾页 | `/trips/:id/review`：英雄区汇总 + 按天连线足迹地图（顺序编号 + 方向箭头）+ 每日回顾时间轴（照片 / 游记 / 消费）+ 消费分类占比条 + 照片墙 |
| 输入校验与安全 | 后端统一校验（lib/validate）：必填、长度、经纬度范围、金额正数、枚举合法性；**跨层级关联一致性校验（消费的旅行日/地点必须属于同一旅行且相互匹配，地点自动继承所属旅行日）**；JWT 生产环境强制配置 AUTH_SECRET；数据归属逐级校验（用户只能操作自己的数据） |

## 📸 运行截图

| | |
| ---- | ---- |
| **登录页** | **首页 · 足迹地图总览** |
| ![登录页](screenshots/00-login.png) | ![首页](screenshots/01-home.png) |
| **旅行列表** | **旅行详情 · 行程时间轴** |
| ![旅行列表](screenshots/02-trips.png) | ![旅行详情](screenshots/03-trip-detail.png) |
| **足迹地图 · 顺序编号 + 方向箭头** | **游记 · 一地多篇** |
| ![足迹地图](screenshots/04-trip-map.png) | ![游记](screenshots/05-blog.png) |
| **游记阅读 · Markdown 渲染** | **消费统计 · 分类占比 + 明细编辑** |
| ![游记阅读](screenshots/06-blog-read.png) | ![消费统计](screenshots/07-expenses.png) |
| **数据分析中心 · 汇总统计与图表** | |
| ![数据分析中心](screenshots/08-analytics.png) | |

## 🛠 技术栈

- **前端框架**：Next.js (App Router) + TypeScript + Tailwind CSS
- **ORM**：Prisma 6
- **数据库**：MySQL 5.7+
- **地图**：react-leaflet + OpenStreetMap（免费，无需 API Key）
- **认证**：jose (JWT) + bcryptjs（httpOnly Cookie）
- **图表**：recharts
- **富文本**：react-markdown

## 🚀 快速启动

### 1. 环境要求
- Node.js 18+（开发环境 v22）
- MySQL 5.7+（本地 3306 端口）

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

编辑 `.env`：

```env
DATABASE_URL="mysql://root:你的密码@localhost:3306/travel_journal"
AUTH_SECRET="任意随机字符串，用于 JWT 签名"
```

> 首次使用请先创建数据库：`CREATE DATABASE travel_journal DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

### 4. 同步数据表并生成客户端

```bash
npx prisma migrate dev   # 应用已有迁移（7 张表，5 个迁移）
npx prisma generate      # 生成 Prisma Client
```

> 迁移记录：初始化建表 → 消费关联地点 → 游记一地多篇 → 地点类型枚举 → 查询索引。

### 5. 生成演示数据（可选）

```bash
node prisma/seed.mjs
```

会为 `demo@travel.com` 生成 4 趟旅行（云南·已完成 / 北京·已完成 / 成都·进行中 / 西安·计划中）、16 个打卡地点、7 篇游记（滇池地点含 2 篇演示多游记）、44 笔消费。

### 6. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000 ，注册账号即可开始使用。

### 生产构建

```bash
npm run build
npm run start
```

## 🗄 数据库设计（7 张表）

```
users ──< trips ──< trip_days ──< locations ──< blogs ──< blog_images
              │         │             │
              └──< expenses <─────────┘
```

| 表 | 说明 |
| ---- | ---- |
| `users` | 用户账号 |
| `trips` | 旅行（归属用户） |
| `trip_days` | 旅行日（归属旅行） |
| `locations` | 打卡地点（归属旅行日，含经纬度、类型枚举） |
| `blogs` | 游记（与地点一对多） |
| `blog_images` | 游记图片 |
| `expenses` | 消费记录（归属旅行，可选归属旅行日与地点） |

**设计要点**：三级级联删除（用户→旅行→行程→地点→游记/图片）；消费在上级删除时 SET NULL 保留明细；地点类型用数据库枚举杜绝脏数据；一个地点可拥有多篇游记。

📄 完整设计见 [`docs/database-design.md`](docs/database-design.md)（ER 图 / 字段 / 索引 / 级联策略）。
🧪 系统测试清单见 [`docs/test-plan.md`](docs/test-plan.md)（功能 / 接口 / 异常 / 权限 / 兼容性）。

## 📁 目录结构

```
app/
├── (auth)/            # 登录 / 注册页
├── (main)/            # 主界面（导航栏布局）
│   ├── page.tsx       # 首页：足迹地图总览 + 统计 + 筛选（查询已拆分优化）
│   ├── analytics/     # 数据分析中心
│   ├── trips/         # 旅行列表 / 新建 / 详情 / 编辑
│   │   └── [id]/      # 详情（含单次旅行分析）、旅行日、地图、消费统计、回顾页 review/
│   └── locations/[id]/blog   # 地点游记
├── api/               # REST API（Route Handlers）
│   ├── auth/          # 注册 / 登录 / 退出 / 当前用户
│   ├── trips/         # 旅行 CRUD、旅行日、消费
│   ├── days/          # 旅行日、地点
│   ├── locations/     # 地点、游记
│   ├── expenses/      # 消费记录
│   └── upload/        # 图片上传
components/            # TripMap / AnalyticsCharts / HomeFilter / ExpensePage 等
lib/                   # prisma 单例、auth、validate（输入校验）、工具函数
prisma/                # schema + 迁移文件 + seed 脚本
docs/                  # 数据库设计文档 + 系统测试清单
```

## 🧪 演示数据

- 账号：`demo@travel.com` / 密码：`123456`
- 内容：云南七日游（已完成）、北京文化三日游（已完成）、成都吃货之旅（进行中）、西安古城之旅（计划中）（16 个打卡地点、7 篇游记、44 笔消费）
- 重新生成：`node prisma/seed.mjs`

## 📄 许可

毕业设计项目，仅用于学习交流。
