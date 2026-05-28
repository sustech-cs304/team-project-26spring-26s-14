# Project Proposal — 校园社交市场 (Campus Market)

> Team ID: 14  
> 课程: CS304 Software Engineering  
> 提交日期: 2026-05-28

---

## Part I. Preliminary Requirement Analysis

### 1. Functional Requirements

系统应提供以下 6 个核心功能模块：

**FR-01 用户认证与身份管理**  
仅允许南方科技大学校园邮箱（`@sustech.edu.cn` / `@mail.sustech.edu.cn`）注册。系统自动创建用户资料，包含昵称、学号、专业、信誉分。

**FR-02 商品发布与浏览**  
支持三种类型：出售、技能交换、失物招领。卖家可上传最多 6 张图片，选择或自定义交易地点（带地图坐标）。买家可通过关键词、类型、价格区间筛选，支持按最新/价格升序/价格降序排序。

**FR-03 校园地图可视化**  
基于腾讯地图 GL，在地图上展示所有在售商品坐标。同一地点多个商品自动聚合为数字标签，点击展开商品列表。

**FR-04 实时通讯与信誉评价**  
买家与卖家可 1 对 1 站内聊天。交易完成后，双方可互评（1-5 星）。30 天内对同一用户限评一次，且必须先有聊天记录才能评价。系统自动计算并更新信誉分。

**FR-05 愿望清单与智能匹配**  
用户可设置关注关键词、商品类型和最高预算。当新发布商品匹配条件时，系统自动推送通知到通知中心。

**FR-06 收藏与通知中心**  
用户可收藏感兴趣的商品，在"我的收藏"中统一管理。系统通知（愿望匹配、交易提醒）集中展示，支持已读标记与关联商品跳转。

### 2. Non-functional Requirements

| 类别 | 要求 |
|------|------|
| **可用性 (Usability)** | 响应式布局，适配桌面端与移动端浏览器；空状态插图化，降低用户困惑；主要操作 3 步内完成 |
| **安全性 (Security)** | 校园邮箱白名单注册；Supabase Row Level Security (RLS) 确保用户只能访问/修改自己的数据；JWT 认证；图片存储在 Public bucket 但文件名含随机哈希防遍历 |
| **性能 (Performance)** | 商品列表分页加载；聊天采用 10 秒轮询（MVP 阶段，可升级 WebSocket）；图片通过 CDN 公共 URL 访问；地图聚合减少渲染压力 |
| **可维护性 (Maintainability)** | 前端组件化（Vue 3 Composition API + `<script setup>`）；API 层与视图层分离；后端业务逻辑通过 PostgreSQL 触发器实现，减少应用层重复代码 |

### 3. Technical Requirements

- **前端框架**: Vue 3 (Composition API) + TypeScript
- **构建工具**: Vite 5
- **状态管理**: Pinia 2
- **路由**: Vue Router 4 (History Mode)
- **UI 样式**: Tailwind CSS 3
- **地图服务**: 腾讯地图 JavaScript API GL
- **后端平台**: Supabase (PostgreSQL 15 + Auth + Storage + Realtime)
- **部署平台**: Vercel (前端静态托管)
- **CI/CD**: GitHub Actions
- **版本控制**: Git (GitHub)
- **浏览器支持**: Chrome, Edge, Firefox, Safari 最新 2 个主版本

### 4. Data Requirements

系统需持久化以下 7 类数据，对应 7 张数据库表：

| 数据实体 | 主要字段 | 来源 |
|----------|----------|------|
| 用户资料 (profiles) | 昵称、学号、专业、头像 URL、信誉分 | 用户注册时自动创建 |
| 商品 (items) | 标题、描述、价格、类型、状态、地点坐标、图片 URL 数组 | 用户发布时填写 |
| 消息 (messages) | 发送者、接收者、内容、关联商品 ID、已读状态 | 用户聊天时产生 |
| 评价 (reviews) | 评价者、被评价者、商品 ID、星级(1-5)、评论 | 交易完成后用户提交 |
| 收藏 (favorites) | 用户 ID、商品 ID | 用户点击收藏按钮 |
| 愿望清单 (wishlist) | 关键词、类型、最高预算、是否激活 | 用户主动设置 |
| 通知 (notifications) | 用户 ID、标题、内容、关联商品 ID、已读状态 | 系统自动生成（愿望匹配触发器） |

---

## Part II. Task Decomposition & Planning

### User Stories

| ID | User Story | 优先级 | Sprint |
|----|-----------|--------|--------|
| US-01 | 作为学生，我希望用校园邮箱注册，以便建立可信的校园身份 | High | 1 |
| US-02 | 作为卖家，我希望发布二手商品并上传图片，以便快速出售闲置物品 | High | 1 |
| US-03 | 作为买家，我希望在地图上查看附近商品，以便选择方便的见面地点 | High | 1 |
| US-04 | 作为买家，我希望与卖家实时聊天，以便确认商品细节和交易时间 | High | 1 |
| US-05 | 作为用户，我希望对交易对方进行信誉评价，以便建立社区信任机制 | Medium | 2 |
| US-06 | 作为买家，我希望设置愿望清单自动匹配新商品，以便第一时间抢到所需物品 | Medium | 2 |
| US-07 | 作为用户，我希望收藏感兴趣的商品，以便稍后对比和联系卖家 | Medium | 2 |
| US-08 | 作为用户，我希望收到系统通知，以便及时了解愿望匹配和交易动态 | Low | 2 |

### Sprint 规划

**Sprint 1 (Week 5–9): 核心交易闭环**
- 目标：实现用户认证、商品发布/浏览、校园地图、实时聊天
- 关键任务：
  - 搭建 Vue 3 + Vite + Tailwind 项目骨架
  - 配置 Supabase 项目，创建 7 张表及 RLS 策略
  - 实现校园邮箱注册/登录（Auth + 触发器自动创建 profile）
  - 实现商品发布页（表单校验、图片上传至 Storage）
  - 实现商品列表页（类型筛选、关键词搜索、价格排序）
  - 实现商品详情页（画廊、收藏、卖家信息）
  - 集成腾讯地图 GL（坐标标记、聚合逻辑）
  - 实现聊天系统（消息表设计、会话列表、轮询未读）

**Sprint 2 (Week 14–15): 体验完善与工程化**
- 目标：信誉体系、智能功能、CI/CD、部署上线、文档完善
- 关键任务：
  - 实现信誉评分（30 天限评、先聊天后评价、触发器自动计算均分）
  - 实现收藏功能与愿望清单（关键词/类型/预算匹配）
  - 实现通知中心（愿望匹配触发器自动发通知）
  - 实现用户个人主页（在售/下架/评价标签页）
  - 商品编辑/下架/重新上架生命周期管理
  - 用户资料编辑弹窗
  - 编写 README、项目指标统计脚本
  - 搭建 GitHub Actions CI/CD 流水线
  - 部署至 Vercel + Supabase 生产环境
  - 撰写团队报告 final-report-team14.md

### GitHub Projects Board 规划

Board 列设置：
1. **Product Backlog** — 用户故事（US-01 ~ US-08）
2. **Sprint Backlog** — 当前 Sprint 分解出的具体任务（如"实现商品发布表单"）
3. **In Progress** — 正在进行中的任务
4. **Done** — 已完成并通过本地测试的任务

（详见仓库 GitHub Projects 页面，Sprint 1 与 Sprint 2 分别建 milestone）

---

## Part III. AI Usage

本团队在需求分析、文档撰写、代码生成与 CI/CD 配置中使用了 AI 辅助工具（如 ChatGPT / Kimi）。AI 主要用于：
- 加速文档模板生成（Proposal、Design Report、Team Report）
- 生成 Supabase SQL 触发器与 RLS 策略草稿
- 提供正则表达式与地图聚合算法的参考实现
- 生成项目指标统计脚本（代码行数、圈复杂度计算）

所有核心架构决策、业务逻辑设计、UI 交互流程与最终代码审查由团队成员独立完成。AI 输出均经过人工验证与修改。
