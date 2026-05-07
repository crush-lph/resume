---
name: interview-notes
description: Use when the user provides interview questions, interview feedback, or company-round notes and wants to create or update structured Chinese interview notes in this repository. Also use when maintaining the mianshi index, extracting interview考点, updating project-level topics, or producing practical, project-grounded memorisable answers.
---

# Interview Notes

This is a project-level Skill for turning raw interview questions into reusable interview study assets. It is not tied to a specific AI tool. Follow it whenever working inside this repo on 面经, 高频题, or interview考点沉淀.

## Core Rules

1. Every question gets an `实操口径`.
   - Engineering / project / AI questions need a concrete implementation sequence.
   - Basic questions still need a usage scenario, pitfall, or debugging angle.

2. Distinguish proven experience from proposed approach.
   - Say “我做过 / 我在项目里做过” only when the repo evidence or user context supports it.
   - Otherwise say “如果让我做，我会...” or “项目里类似场景可以这样落地...”.

3. Maintain two layers:
   - Company-round interview notes under `mianshi/interviews/`.
   - Topic-level study assets under `mianshi/topics/`.

4. Every interview note must include `本轮考点`.
   - Identify topics lightly; do not over-process every question.
   - Check whether matching files already exist under `mianshi/topics/`.
   - If a topic exists, append appearance records and meaningful new follow-ups only.
   - If no topic exists, do not create one unless the user asks or the topic is clearly high-frequency.

5. Keep `mianshi/README.md` as the routing index.
   - Add new interview files.
   - Add or update topic links when topics are created.
   - Keep summaries concise and searchable.

## Default Files

- Interview notes: `mianshi/interviews/{公司名}{轮次}.md`
- Topic notes: `mianshi/topics/{topic-slug}.md`
- Global index: `mianshi/README.md`
- Existing template reference: `mianshi/interviews/面经输出模板.md`

If a target interview file exists:

- “新增几个问题” means append new numbered questions.
- “修改某题” means update only that question.
- “重新整理” means preserve useful content and rewrite locally; do not wipe the file unless explicitly asked.

## Interview Note Structure

Use this structure for a new interview note:

```md
# 公司名轮次面经

面试日期：YYYY-MM-DD
岗位方向：...
题型特点：...

## 本轮考点

- 考点 1
- 考点 2

## 总体复盘

...

## 1. 题目

### 关键考点

- ...

### 短答

...

### 详细分析

...

### 实操口径

...

### 可背答案

> ...

### 注意点

- ...

### 可能追问

- ...
```

## Topic Note Structure

Use this structure for `mianshi/topics/*.md`:

```md
# 考点名称

## 考点概览

...

## 出现记录

- 公司轮次：具体问法

## 高频问法

1. ...

## 核心答案

...

## 实操口径

...

## 易错点

- ...

## 相关面经

- [公司轮次](../interviews/公司轮次.md)
```

## Practical Answer Standard

Answers should sound like real engineering experience, not encyclopedia text.

Prefer:

- “我会先...再...最后...”
- “项目里我会拆成...”
- “这个链路我会加...兜底”
- “上线后我会看...指标”
- “这类核心链路不能只靠前端，后端需要...”

Avoid:

- Pure definitions without project use.
- Invented metrics.
- Overclaiming “做过” when evidence is unclear.
- Saying only tool names without workflow, validation, or risk control.

## Project Evidence Map

Use these as safe project anchors when relevant:

- FastMoss: Next.js, SSR/CSR request layer, SEO, dynamic metadata, performance, payment, i18n, monitoring, BroadcastChannel, permissions, tracking.
- Oumomo: AI creation workflows, long task polling, upload, payment, Tailwind, from-0-to-1 project setup.
- ClawDream: Vibe Coding, Agent workflow, Chrome extension architecture, tool calls, debug panels, AI-assisted development process.
- Mini program / Monorepo: Taro, package size, build optimization, TypeScript governance, monorepo reuse.

If a topic is outside this evidence map, use proposed wording unless the user provides evidence.

## Workflow

1. Parse input:
   - company
   - round
   - interview date
   - role direction
   - question list
   - add / update / rewrite intent

2. Read context:
   - `mianshi/README.md`
   - target interview file if it exists
   - existing `mianshi/topics/` files if present
   - `mianshi/interviews/面经输出模板.md` when structure is unclear

3. Generate or update the interview note:
   - add `本轮考点`
   - write each question with the standard structure
   - include `实操口径`
   - keep answers practical and grounded

4. Lightly update topics:
   - check whether topic files exist
   - add appearance records and new follow-ups when useful
   - create topic files only when requested or clearly high-frequency

5. Update `mianshi/README.md`.

6. Final response:
   - list created / updated files
   - summarize added questions
   - mention whether topic files were created or only detected

