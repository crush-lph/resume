# AI 前端面试知识

## SSE vs WebSocket

正确主线：

- SSE 是基于 HTTP 的服务端到客户端单向事件流。
- WebSocket 是客户端和服务端之间的全双工通信。
- AI 聊天场景通常是服务端持续输出文本，SSE 往往更简单、更适合。
- 如果需要双向实时协作、游戏、多人状态同步，WebSocket 更合适。

容易说错：

- 不要说 SSE 是二进制协议。
- 不要把 SSE 的优势说成所有场景都比 WebSocket 好。

## Token 与上下文窗口

正确主线：

- Token 是模型处理文本的基本计量单位。
- API 计费、上下文窗口、响应时延都和 Token 数量有关。
- 输入和输出都会占用 Token。
- 上下文超过模型限制时，需要截断、摘要、分页、检索增强或拒绝请求。

容易说错：

- 不要简单把字符长度等同于 Token 数量。
- 不要说超过长度后“模型失忆”，更准确是旧内容被截断或请求失败。

## 流式文本渲染优化

正确主线：

- 不要每来一个 token 就 `setState`。
- 可以按时间片、按帧或按固定字符数批量更新。
- 只更新最后一个消息气泡，避免整个列表反复 diff。
- 历史消息长时使用虚拟列表。
- Markdown、代码高亮、自动滚动要节流或分阶段处理。

项目表达：

- “我们将服务端返回的 token 先放入缓冲区，再通过 `requestAnimationFrame` 或定时批处理刷新 UI，避免高频 setState 导致主线程压力过大。”

## Prompt 管理

正确主线：

- Prompt 应模板化，而不是硬编码长字符串。
- 支持变量占位符，如 `{{input}}`、`{{context}}`。
- 区分 System、User、Assistant 等角色。
- 支持版本管理、预览、回滚和调试。

安全边界：

- 前端可以做可视化配置和调试体验。
- 关键安全校验、敏感信息注入和权限控制应在后端完成。

## RAG 前端展示

正确主线：

- RAG 前端不只是展示答案，还要展示来源、引用、检索状态和反馈入口。
- 引用编号要和正文稳定对应。
- 来源可以通过侧边栏、Tooltip 或抽屉展示原文片段。
- 要处理引用为空、引用失效、重复引用、长文档性能问题。

## Web Worker

正确主线：

- Web Worker 适合把耗时计算从主线程移走。
- 可用于文本清洗、分词、Token 估算、简单向量计算、流数据解析。
- Worker 不能直接操作 DOM。
- 大对象传输要注意序列化成本，可考虑 `Transferable` 或 `SharedArrayBuffer`。

## Markdown、公式和代码高亮

正确主线：

- Markdown 可用 `markdown-it`、`micromark`、unified/remark/rehype 体系。
- 公式可用 `KaTeX` 或 `MathJax`。
- 代码高亮可用 Prism、lowlight、Shiki 等。
- 模型输出必须考虑 XSS，不能直接信任 HTML。

容易说错：

- 不要只说“用了 Markdown 库”，还要说明安全清洗和性能策略。

