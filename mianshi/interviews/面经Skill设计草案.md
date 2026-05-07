# 面经产出 Skill 设计草案

目标：把当前“收集面试题 -> 沉淀面经 -> 更新索引 -> 提炼高频题”的流程，沉淀成一个可复用 Skill。

暂定 Skill 名称：`interview-notes`

## 1. Skill 触发场景

当用户输入以下类型内容时触发：

- “这是某公司一面/二面/复试的问题，帮我沉淀面经”
- “把这轮面试题整理成文档”
- “按照之前的面经格式输出”
- “补充到某公司面经”
- “把这些题提炼成高频题清单”
- “这道题补到某份面经里”

不触发场景：

- 用户只是问单个知识点，不要求记录或沉淀
- 用户只是要临时回答，不想写入文件
- 用户在做简历优化，应该走简历相关流程

## 2. 输入信息

最小输入：

- 公司名
- 轮次
- 面试题列表

可选输入：

- 面试日期
- 岗位方向
- 面试官追问点
- 用户现场回答情况
- 想强调的项目经历
- 是否需要生成高频题清单
- 是否需要更新总索引

如果缺少日期，默认使用当前日期。  
如果缺少岗位方向，默认根据题目推断，例如 `React / Next.js 前端`、`AI 前端`、`工程效率`。

## 3. 输出文件规则

默认写入：

```txt
mianshi/interviews/{公司名}{轮次}.md
```

例如：

```txt
mianshi/interviews/加和科技一面.md
mianshi/interviews/数字100复试.md
```

如果同名文件已存在：

- 用户明确说“新增几个问题”：追加到现有文件末尾。
- 用户明确说“修改某题”：定位对应题目后更新。
- 用户说“重新整理”：保留原文件结构，尽量局部重写，不清空整份文档。

总索引更新：

```txt
mianshi/README.md
```

若题目形成明显公司专项高频集合，可新增：

```txt
mianshi/{公司名}高频题清单.md
```

## 4. 单题标准结构

每道题统一使用：

```md
## N. 题目

### 关键考点

- 面试官真正想考什么。

### 短答

一句话或两句话先给结论。

### 详细分析

- 根因
- 机制
- 场景
- 取舍
- 边界

### 实操口径

- 真实项目里我会怎么做
- 可以绑定哪个项目
- 会拆哪些模块
- 会加哪些状态
- 会做哪些兜底
- 如何验证和监控

### 可背答案

> 30-60 秒可直接说出口的答案。必须尽量像真实做过，而不是纯概念解释。

### 注意点

- 容易说错的点
- 容易讲虚的点

### 可能追问

- 追问 1
- 追问 2
- 追问 3
```

## 5. 答案质量标准

必须满足：

- 不只解释概念，要说明为什么。
- 不只讲方案，要讲项目里怎么落地。
- 不只讲正常流程，要讲异常、兜底、验证。
- 不要编造不存在的指标。
- 如果指标不确定，用“可以看/可以统计/我会用”表达，不写死数字。
- 能绑定用户项目时优先绑定：
  - FastMoss：Next.js、SSR/CSR、SEO、支付、国际化、性能、监控。
  - Oumomo：AI 创作链路、长任务、上传、支付、Tailwind、从 0 到 1。
  - ClawDream：Vibe Coding、Agent、插件架构、工具调用、调试面板。

## 6. 面经生成流程

1. 解析用户输入
   - 公司名
   - 轮次
   - 题目列表
   - 是否新增/修改/重整

2. 读取现有索引
   - `mianshi/README.md`
   - 相关公司面经文件
   - 必要时读取 `面经输出模板.md`

3. 判断写入方式
   - 新公司/新轮次：创建新文件
   - 已有文件新增题：追加
   - 已有题补充：局部更新

4. 生成单题内容
   - 关键考点
   - 短答
   - 详细分析
   - 实操口径
   - 可背答案
   - 注意点
   - 可能追问

5. 更新索引
   - 在 `mianshi/README.md` 增加或更新摘要
   - 保证主题映射能找到新文档

6. 可选生成高频清单
   - 若同一公司题目超过 10 道，或用户明确要求
   - 提炼第一优先级、第二优先级、第三优先级

7. 最终汇报
   - 写了哪些文件
   - 新增了哪些题
   - 是否更新索引

## 7. 不确定点清单

### 7.1 是否每道题都强制写“实操口径”

倾向：强制写。  
原因：用户明确希望答案听起来像真实做过。

待确认：

- 对纯基础题，例如“数组有哪些方法”，是否也需要实操口径？
- 还是只对工程题、项目题、AI 题强制写？

### 7.2 面经文件是否要越来越长

当前做法：每轮面试一份完整文档。  
风险：后续某公司多轮面试可能超过几万字。

可选方案：

- 继续按公司轮次分文件。
- 对同一公司建立高频清单，正文保留详细版。
- 对特别长的公司拆成 `公司/一面.md`、`公司/二面.md` 目录结构。

### 7.3 高频清单什么时候自动生成

可选触发条件：

- 用户明确要求。
- 某公司累计超过 10 道题。
- 同类主题重复出现 3 次以上。

需要确定是否自动生成，避免文件过多。

### 7.4 是否要自动把题目同步进知识库

当前面经主要写入 `mianshi/interviews/`。  
有些题其实适合沉淀到 `knowledge-base/`。

待确认：

- 只在用户要求时同步知识库？
- 还是当某题变成通用高频题时自动同步？

### 7.5 Skill 是否应该包含代码示例

有些题需要代码，例如：

- 请求去重
- 无感刷新 token
- Zustand 简化实现
- 水印
- 点击外部关闭

待确认：

- 代码直接写在面经里？
- 还是单独放 `mianshi/code-examples/`，面经里链接过去？

### 7.6 是否需要区分“真实做过”和“可推演方案”

这是关键点。  
为了不显得编造，Skill 需要区分：

- “我在项目里做过”
- “如果让我做，我会这样落地”

待确认：

- 哪些项目能力可以默认说成做过？
- 哪些只能说成“我会这样做”？

### 7.7 Skill 安装位置

可选：

- 先作为项目内草案维护。
- 后续安装到 `$CODEX_HOME/skills/interview-notes/`，变成真正可触发 Skill。

建议：先把流程确认，再安装。

## 8. 初版 Skill 主体草案

```md
---
name: interview-notes
description: Use when the user provides interview questions or interview feedback and wants to turn them into structured Chinese interview notes, append them to the mianshi knowledge base, update the global index, or produce high-frequency question summaries. This skill emphasizes practical, project-grounded answers with key points, detailed analysis, implementation口径, memorisable answers, pitfalls, and follow-up questions.
---

# Interview Notes

When the user provides interview questions, produce or update a structured interview note under `mianshi/interviews/`.

Default workflow:

1. Parse company, round, date, role direction, and question list.
2. Read `mianshi/README.md` and existing target interview file if present.
3. Create or update `mianshi/interviews/{company}{round}.md`.
4. For each question, write:
   - 关键考点
   - 短答
   - 详细分析
   - 实操口径
   - 可背答案
   - 注意点
   - 可能追问
5. Update `mianshi/README.md` with a concise summary and routing entry.
6. If asked, create or update `{company}高频题清单.md`.

Quality rules:

- Prefer practical project-grounded answers over encyclopedia explanations.
- Use “我会先...再...最后...” to show implementation sequence.
- Mention validation, fallback, monitoring, and risk boundaries when relevant.
- Do not invent metrics. Use uncertain phrasing if the user has not provided numbers.
- Distinguish “做过” from “我会这样做” when evidence is unclear.
```

