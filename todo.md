# 素材鹅 TODO

## 视觉系统
- [x] 全局配色：米白底 + 深墨绿主色 + 暖沙色点缀
- [x] 字体：Playfair Display + Noto Serif SC
- [x] 鹅脚形状自定义光标（SVG cursor）
- [x] 全局 CSS 变量与 Tailwind 主题

## 首页
- [x] Hero 区：产品名、价值主张文案、上传按钮、查看示例按钮
- [x] 简笔画小鹅随机游走动画（canvas 动画）
- [x] 使用流程区：3 步说明
- [x] 示例展示区：参考图示意 + 风格分析卡片示意 + 素材包示意
- [x] 页脚

## 核心工作区
- [x] 图片上传组件（拖拽 + 点击，PNG/JPG）
- [x] 上传至 S3，返回 URL
- [x] 上传后预览参考图
- [x] AI 风格分析（LLM 调用，结构化 JSON 输出）
- [x] 风格分析结果卡片（主色调、风格标签、视觉元素、推荐方向）
- [x] 生成按钮
- [x] AI 素材生成（图像生成 API，11 个素材）
  - [x] 主标题框 ×2
  - [x] 小标题框 ×2
  - [x] 提示框 ×2
  - [x] 分割线 ×2
  - [x] 装饰元素 ×3
- [x] 素材预览网格

## 下载功能
- [x] 单个素材下载（PNG/JPG）
- [x] 批量打包下载（ZIP）

## 数据库 & API
- [x] generations 表（存储生成记录）
- [x] materials 表（存储素材记录）
- [x] tRPC: uploadImage 过程（上传图片到 S3）
- [x] tRPC: analyzeStyle 过程（LLM 风格分析）
- [x] tRPC: generateMaterials 过程（图像生成）
- [x] tRPC: getGeneration 过程（查询生成记录）

## 视觉重构（v2）
- [x] 白底大胆排版风格（参考图二）
- [x] 手绘鹅 AI 生成并 CDN 托管
- [x] 可拖动物理粘性素材卡片（framer-motion drag + spring）
- [x] WorkArea 视觉与新风格统一
- [x] shimmer 骨架屏动画

## 测试
- [x] analyzeStyle 单元测试（含 fallback 测试）
- [x] generateMaterials 单元测试（含数量验证）
- [x] uploadImage 单元测试
- [x] getGeneration 单元测试
- [x] auth.logout 测试（模板自带）
- [x] 16/16 测试全部通过

## GitHub
- [x] 推送代码至 Ritadu128/SucaiGoose

## 性能修复 v1
- [x] 服务端：并发分批生成素材（每批 3 个），减少总等待时间
- [x] 前端：实时进度条显示已生成素材数量
- [x] 前端：素材卡片逐条出现（不等全部完成再显示）
- [x] 修复 Home.tsx em dash 语法错误

## Bug 修复 + 页面重组 v4
- [x] 修复素材卡片图片不显示的 bug（WorkArea.tsx MaterialCard 添加 imgError state + onError 处理 + 空 URL guard）
- [x] 首页精简为纯 Hero（只保留大标题 + 漂浮图 + 两个按钮）
- [x] 新建 /generate 生成页（上传 + 分析 + 素材网格）
- [x] 新建 /examples 示例展示页
- [x] 更新 App.tsx 路由
- [x] 推送代码至 GitHub Ritadu128/SucaiGoose

## Hero 重构 v3
- [x] 重新生成手绘鹅（米白身体/橙红嘴脚/深灰柔和线条/稚拙蒱笔感）
- [x] 上传5张素材示例图至 CDN（漫画格/鹅拼贴/电视眼/胶片纸/蓝色星星）
- [x] Hero 文案改为：「把喜欢的风格变成你的素材」
- [x] 剪掉所有解释型文案，大量留白
- [x] 小鹅全屏游走动效（idle: 轻微晁头慢慢移动）
- [x] 小鹅 click 逃跑动效（快速移出屏幕，几秒后从别处回来）
- [x] 漂浮素材图区域（全郥真实 CDN 图片，自然角度遗挡层次，轻微漂浮视差）

## 鹅动效 v5
- [x] 首页鹅替换为极简线条风格（圆头+弯颈+渿圆身体+两条腿），颜色：深灰线条+橙红脚/嘴
- [x] 实现走路动效：左右腿交替前后摆动（CSS keyframes），逃跑时动效加快

## 素材生成逻辑优化 v6
- [x] 前端"提示框"改名为"文字框"（服务端 MATERIAL_PLAN label 已更新，前端动态读取自动生效）
- [x] 重写 server/routers.ts 中各类素材的生成 prompt，严格遵守留白规则
- [x] 主标题框：拼贴感/色块感/纸片感留白背景，不放字
- [x] 小标题框：同风格但更窄更短更低调，中间留白
- [x] 文字框：简单干净，纯色/半透明/浅色底，轻微纹理，不影响阅读
- [x] 分割线：横向细长线条，一条长简单线 + 一条短带小装饰线
- [x] 装饰元素：爱心/星星/圆点/小花/箭头等，风格统一

## 素材生成规则修正 v7
- [x] 文字框：改为横向长方形（4:3 / 3:2 / 16:10），宽度明显大于高度，不接近正方形
- [x] 装饰元素：完整主体贴纸，不留中间空白，不做成框，直接是爱心/星星/花/小动物/箭头等

## 素材生成规则修正 v8
- [x] 大标题框：收小为紧凑拼贴标题条，略大于小标题框，不是大横幅
- [x] 文字框：改为竖版长方形，高度明显大于宽度，比例接近 9:16
- [x] 装饰元素：完整物件贴纸风格（图钉/扣子/布贴/蝴蝶结/胶带/小花/牛仔爱心等），绝对不留白，不做框

## 素材生成重试逻辑
- [x] generateMaterials 批量生成中，单张失败时自动重试最多 2 次，避免因偶发 500 错误导致素材数量不足

## Bug 修复：generations INSERT 失败
- [x] 修复 insert into generations 失败：改用 mysql2 createPool 连接池（enableKeepAlive + connectionLimit:5），解决长时间空闲后连接断开导致 INSERT 超时失败的问题
