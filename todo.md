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

## 测试
- [x] analyzeStyle 单元测试（含 fallback 测试）
- [x] generateMaterials 单元测试（含数量验证）
- [x] uploadImage 单元测试
- [x] getGeneration 单元测试
- [x] auth.logout 测试（模板自带）
