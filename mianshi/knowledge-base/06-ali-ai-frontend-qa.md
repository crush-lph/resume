# 阿里 AI 前端面试题与参考答案

这份文档从“阿里 AI 前端研发”题单中提取问题，并整理成可直接复习的参考答案。回答不追求背诵口吻，而是强调面试时能讲清楚：核心概念、工程实践、边界和常见坑。

## 一面：技术基础

### 1. 简单介绍一下 SSE 和 WebSocket 的区别，为什么 AI 聊天场景多采用 SSE？

SSE 是基于 HTTP 的服务端到客户端单向事件流，浏览器原生提供 `EventSource` 支持，适合服务端持续推送文本片段。WebSocket 是全双工通信协议，适合客户端和服务端都需要高频实时通信的场景，比如协同编辑、IM、游戏状态同步。

AI 聊天大多数场景是用户发起请求后，服务端持续返回模型生成的 token 或文本片段，本质是“请求一次，服务端持续输出”。这种单向流用 SSE 更简单，能复用 HTTP 体系，兼容网关、鉴权、日志和监控也更自然。

面试补充：

- SSE 更适合文本流，不适合原生二进制传输。
- WebSocket 更灵活，但连接管理、心跳、重连、协议治理成本更高。
- 如果要做多人协作、实时控制、客户端频繁发事件，WebSocket 会更合适。

### 2. 在处理 AI 长文本输出时，如何实现自动滚动到底部？

核心思路是：当新内容追加且用户仍停留在底部附近时，自动滚动到底部；如果用户手动向上查看历史内容，就不要强行抢滚动。

可以用一个底部哨兵元素配合 `scrollIntoView`，或直接控制容器的 `scrollTop = scrollHeight`。更稳的做法是维护 `isAtBottom` 状态，通过滚动事件判断用户是否在底部附近。流式输出时不要每个 token 都滚动，可以用 `requestAnimationFrame` 或节流合并滚动操作。

参考实现：

```tsx
function ChatList({ messages }: { messages: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldStickRef = useRef(true);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;

    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickRef.current = distance < 80;
  }

  useEffect(() => {
    if (!shouldStickRef.current) return;

    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ block: "end" });
    });

    return () => cancelAnimationFrame(frame);
  }, [messages]);

  return (
    <div ref={containerRef} onScroll={handleScroll}>
      {messages.map((item, index) => (
        <div key={index}>{item}</div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

常见坑：

- 每来一个 token 都滚动，容易造成主线程压力。
- 用户正在看历史消息时强制滚到底部，体验很差。
- 长列表场景要结合虚拟列表，否则 DOM 数量会越来越大。

### 3. 请手写一个函数，用于取消正在进行的 Fetch 请求。

浏览器取消 `fetch` 通常使用 `AbortController`。调用 `controller.abort()` 后，请求会被中断，`fetch` 会抛出 `AbortError`。

参考实现：

```ts
function createCancelableFetch<T>(url: string, options?: RequestInit) {
  const controller = new AbortController();

  const request = fetch(url, {
    ...options,
    signal: controller.signal,
  }).then(async response => {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  });

  return {
    request,
    cancel: () => controller.abort(),
  };
}
```

React 中常见用法：

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/chat", { signal: controller.signal }).catch(error => {
    if (error.name !== "AbortError") {
      throw error;
    }
  });

  return () => controller.abort();
}, []);
```

面试补充：

- 组件卸载、切换会话、重新发送问题时都可能需要取消旧请求。
- 如果是流式响应，还要同时处理 `ReadableStream` 的 reader 取消。

### 4. 谈谈你对 TypeScript 中泛型的理解，并写一个处理 AI 接口响应的通用类型。

泛型可以把类型当作参数传入，让函数、接口、组件在保持类型安全的同时具备复用能力。它适合描述“结构相同但数据类型不同”的场景，比如接口响应、分页结果、表单字段、组件 props。

AI 接口响应可以抽象成统一结构：

```ts
type ApiSuccess<T> = {
  success: true;
  data: T;
  traceId?: string;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    retryable?: boolean;
  };
  traceId?: string;
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatCompletion = {
  conversationId: string;
  message: ChatMessage;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
};

type ChatResponse = ApiResponse<ChatCompletion>;
```

好处：

- 调用方能根据 `success` 做类型收窄。
- 业务数据 `T` 可复用在聊天、RAG、模型列表等接口。
- 错误结构统一后，前端提示、重试和日志上报更容易治理。

### 5. 如何实现一个简单的 Markdown 代码块高亮功能？

基本方案是：先用 Markdown 解析器把内容转成 HTML 或 AST，再对代码块节点调用高亮库生成带样式的 HTML。常见组合包括 `markdown-it + highlight.js`、`remark/rehype + lowlight`、`Shiki`。

示例思路：

```ts
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

const md = new MarkdownIt({
  html: false,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }

    return md.utils.escapeHtml(code);
  },
});

export function renderMarkdown(source: string) {
  return md.render(source);
}
```

工程注意点：

- 模型输出不可信，不能直接放行任意 HTML。
- 如果允许 HTML，需要配合 `DOMPurify` 做白名单清洗。
- 流式输出时不要每个字符都全量解析 Markdown，可以等代码块闭合后再高亮。
- 代码块较多时要考虑解析和高亮的性能成本。

### 6. 解释一下 JS 的事件循环机制，并说明 Promise.then 和 setTimeout 的执行顺序。

JavaScript 在浏览器中运行在事件循环模型上。同步代码先执行，执行完一个宏任务后，会清空当前产生的微任务队列，然后浏览器再根据时机进行渲染，之后进入下一个宏任务。

常见宏任务包括：

- 整体脚本执行
- `setTimeout`
- `setInterval`
- 用户事件
- 网络回调

常见微任务包括：

- `Promise.then`
- `queueMicrotask`
- `MutationObserver`

示例：

```ts
console.log("start");

setTimeout(() => {
  console.log("timeout");
});

Promise.resolve().then(() => {
  console.log("promise");
});

console.log("end");
```

输出顺序：

```txt
start
end
promise
timeout
```

原因是同步代码先执行，`Promise.then` 进入微任务队列，`setTimeout` 进入宏任务队列。当前宏任务结束后先清空微任务，所以 `promise` 先于 `timeout` 输出。

## 二面：深入原理与项目

### 1. AI 聊天界面的流式渲染在 React 中如何高效实现？

核心目标是减少不必要的 React 更新和 DOM 操作。流式接口可能以 token、字符片段或句子片段持续返回，如果每个片段都 `setState`，会导致 React 高频渲染。

推荐方案：

- 用 `ReadableStream` 或 SSE 接收增量内容。
- 将增量内容先写入缓冲区。
- 使用 `requestAnimationFrame`、定时器或固定 token 数量批量刷新 UI。
- 只更新当前正在生成的最后一条 assistant 消息。
- 长对话使用虚拟列表。
- Markdown、代码高亮、自动滚动做节流或分阶段处理。

面试表达：

```txt
我会把模型返回的 token 先放在 ref 缓冲区里，再按帧合并提交到 React state。
这样可以保留流式体验，同时避免每个 token 都触发一次组件渲染。
```

### 2. 针对长达数千条的对话记录，你会如何设计前端的性能优化方案？

长对话的主要问题是 DOM 数量、渲染频率、Markdown 解析成本、代码高亮成本和滚动定位成本。

优化方案：

- 使用虚拟列表，只渲染可视区域附近的消息。
- 消息组件拆分并配合 `React.memo` 减少重复渲染。
- 对已完成消息缓存 Markdown 渲染结果。
- 对代码高亮、公式渲染等重操作做懒处理。
- 当前流式消息单独更新，避免整个消息数组频繁重建。
- 图片、附件、引用卡片延迟加载。
- 会话历史分页加载，首屏只加载最近一段。

项目表达：

```txt
我会把历史消息和正在生成的消息拆开处理。历史消息尽量稳定，当前消息允许高频变化，再用虚拟列表控制 DOM 数量。
```

### 3. 在 Prompt Engineering 中，前端如何参与并优化 Prompt 的构建？

前端可以参与 Prompt 的可视化配置、变量注入、上下文选择和调试预览，但不应该承担最终安全边界。

可做的事情：

- 提供 Prompt 模板编辑和版本管理。
- 用变量占位符拼接用户输入、选中文本、页面上下文、知识库片段。
- 区分 `system`、`user`、`assistant`、`tool` 等消息角色。
- 在开发环境展示最终发送给模型的 Prompt。
- 做 token 估算和超长截断提示。
- 对敏感字段做展示态脱敏。

边界意识：

- 前端能提升 Prompt 配置体验。
- 关键权限、敏感信息注入、工具调用控制仍应放在后端。

### 4. 谈谈 RAG 流程中，前端可以做哪些工作？

RAG 是检索增强生成，通常由“用户问题 -> 检索知识库 -> 拼接上下文 -> 模型生成 -> 返回答案和引用”组成。前端不一定负责检索算法本身，但要负责把检索和引用过程清楚地呈现给用户。

前端工作：

- 展示检索中、生成中、引用加载中等状态。
- 展示引用来源、文档标题、片段预览和跳转。
- 处理引用编号与答案正文的对应关系。
- 提供点赞、点踩、纠错反馈，帮助评估回答质量。
- 处理引用为空、引用失效、重复引用、权限不足等异常。
- 对长文档来源做懒加载和折叠展示。

面试加分点：

- 流式输出时，引用可能晚于正文返回，需要设计稳定的引用占位和回填机制。
- RAG 答案应该让用户能追溯来源，而不是只展示一个自然语言结果。

### 5. 如何设计一个 AI Agent 的前端状态机？

AI Agent 通常不是简单的“输入 -> 输出”，而是包含规划、工具调用、观察结果、继续推理、最终回答等多个阶段。前端适合用状态机描述这些阶段，保证 UI 可预测。

常见状态：

- `idle`：等待用户输入
- `submitting`：提交用户请求
- `planning`：模型规划任务
- `tool_calling`：调用工具
- `tool_result`：工具结果返回
- `generating`：生成最终答案
- `paused`：等待用户确认
- `completed`：任务完成
- `failed`：任务失败
- `cancelled`：用户取消

状态中要保存的信息：

- 当前会话和任务 id
- 当前步骤列表
- 工具调用名称、参数和结果
- 用户确认状态
- 错误信息和可重试状态

工程建议：

- 简单场景可用 reducer 管理。
- 复杂 Agent 可以用 XState 这类状态机库。
- 工具调用必须有权限边界和用户确认机制。

### 6. 谈谈前端安全，特别是针对 AI 应用的 Prompt 注入攻击。

Prompt Injection 是指攻击者通过输入内容诱导模型忽略系统指令、泄露上下文、调用不该调用的工具或生成恶意输出。前端需要防，但不能把前端当作唯一防线。

前端能做：

- 对用户输入做风险提示和基础过滤。
- 对模型输出做 XSS 清洗，避免恶意 HTML 或脚本进入页面。
- 把用户内容、检索内容、系统内容在 UI 和协议层做清晰隔离。
- 对高风险工具调用展示确认弹窗。
- 对来源不可信内容加标记。

后端必须做：

- 限制模型可调用的工具和参数。
- 对工具调用做权限校验。
- 系统提示和密钥不下发前端。
- 对模型输出做二次校验和审计。
- 记录 trace，方便追溯安全问题。

面试表达：

```txt
前端是体验和展示层的第一道防线，真正的权限边界必须在后端。
```

### 7. Web Worker 在 AI 前端场景下有哪些应用场景？

Web Worker 适合处理耗时但不需要直接访问 DOM 的任务，避免阻塞主线程。

AI 前端场景：

- 长文本清洗、切分、分词
- token 估算
- Markdown 预处理
- 简单向量相似度计算
- 本地搜索
- 大 JSON 或流式数据解析
- 轻量模型或 Transformers.js 推理

注意点：

- Worker 不能直接操作 DOM。
- 大对象频繁 `postMessage` 会有序列化成本。
- 可以用 `Transferable` 或 `SharedArrayBuffer` 优化大数据传输。

### 8. 介绍一下 React Fiber 架构，它对提升 AI 聊天体验有什么帮助？

React Fiber 是 React 的协调架构。它把渲染工作拆成可调度的工作单元，使 React 能够中断、恢复和按优先级处理更新。它主要解决大更新阻塞主线程、交互响应差的问题。

对 AI 聊天体验的帮助：

- 流式消息持续更新时，React 可以更好地调度不同优先级的 UI 更新。
- 用户输入、点击停止生成、滚动等交互可以保持更高优先级。
- 配合 React 18 的并发能力，可以把非紧急更新放到较低优先级。

容易说错：

- Fiber 不是让所有渲染都更快，而是让渲染更可调度，提升交互响应性。
- 不要说 Fiber 把任务拆成微任务，更准确是拆成可调度的工作单元。

## 三面：架构与综合能力

### 1. 如果让你从零设计一个企业级 AI Copilot 平台，你会如何设计前端架构？

可以从应用层、状态层、协议层、渲染层、安全层、工程层来回答。

架构拆分：

- 应用层：会话、模型选择、知识库、工具调用、用户设置、权限管理。
- 状态层：管理会话列表、消息流、工具调用状态、用户偏好和错误恢复。
- 协议层：统一封装 SSE、普通 HTTP、取消请求、重试、traceId。
- 渲染层：消息组件、Markdown、代码高亮、引用卡片、工具调用结果。
- 安全层：XSS 清洗、权限控制、敏感信息脱敏、工具调用确认。
- 工程层：组件库、监控埋点、错误边界、灰度配置、自动化测试。

技术选型示例：

- React + TypeScript 构建 UI。
- Zustand 或 Redux Toolkit 管理复杂状态。
- TanStack Query 管理普通请求缓存。
- SSE 或 fetch stream 处理模型流式输出。
- 虚拟列表处理长对话。
- DOMPurify 处理不可信 HTML。

面试加分点：

- 企业级平台要特别关注权限、审计、可观测性、可扩展的模型 Provider 抽象。

### 2. 在 AI 时代，你认为前端工程师的核心竞争力发生了什么变化？

前端工程师的核心竞争力会从“会写页面”进一步转向“理解业务、设计交互、组织复杂状态、治理工程系统、和 AI 协作交付产品”。

变化点：

- 从 UI 实现者变成 AI 产品体验设计和工程落地的连接者。
- 更重视数据流、状态机、权限、安全和可观测性。
- 需要理解模型能力边界，比如 hallucination、上下文窗口、token 成本、流式输出。
- 需要会把 AI 能力封装成稳定的产品体验，而不是只调一个接口。
- 需要更强的工程判断，知道哪些交给模型，哪些必须由确定性代码完成。

面试表达：

```txt
AI 会降低部分代码编写门槛，但会提高对产品判断、系统设计和工程质量的要求。
```

### 3. 聊聊你在项目中遇到的最难的一个技术问题，你是如何定位并解决的？

这是开放题，建议按“背景、现象、定位、方案、结果、复盘”回答。

回答模板：

```txt
项目背景是 X，我负责 Y。
当时遇到的问题是 Z，表现为页面卡顿、接口异常或状态错乱。
我先通过日志、性能面板、React Profiler 或抓包定位问题。
然后对比了几种方案，最终选择 A。
上线后指标改善为 B。
如果重做一次，我会在 C 方面提前设计。
```

AI 前端可用案例方向：

- 流式输出导致高频渲染卡顿。
- 长对话记录导致 DOM 节点过多。
- Markdown 全量解析导致 CPU 占用高。
- SSE 断线重连导致消息重复。
- RAG 引用编号和正文错位。

### 4. 如何衡量一个 AI 前端产品的“好坏”？请给出几个关键指标。

可以从体验、质量、性能、可靠性、安全和业务价值六类指标回答。

关键指标：

- 首 token 时间：用户发起请求后多久看到第一个输出。
- 完整响应时间：从提问到回答完成的时间。
- 生成中断率：用户主动停止、刷新、离开的比例。
- 采纳率：用户复制、应用、插入答案的比例。
- 反馈质量：点赞、点踩、纠错、追问率。
- 引用可信度：RAG 场景下引用命中率和引用可追溯性。
- 错误率：接口失败、流中断、解析失败、渲染异常。
- 性能指标：长对话滚动 FPS、内存占用、主线程阻塞时间。
- 安全指标：XSS 拦截、越权工具调用拦截、敏感信息泄漏次数。

面试加分点：

- AI 产品不能只看模型回答质量，也要看“用户是否能信任、理解并继续操作”。

### 5. 团队协作中，如果后端接口协议频繁变动，你会如何应对？

核心是建立稳定的协作契约和前端适配层，降低协议变化对业务 UI 的冲击。

可采取的方案：

- 使用 OpenAPI、JSON Schema、Protobuf 等方式定义接口契约。
- 前后端约定版本号和兼容策略。
- 前端建立 API adapter 层，把后端响应转换成前端稳定模型。
- 对接口响应做运行时校验，比如 `zod`。
- 使用 mock 服务和契约测试提前发现不兼容变更。
- 对高风险字段做降级处理，避免整个页面崩溃。
- 在接口返回中保留 `traceId`，方便联调排查。

面试表达：

```txt
我不会让组件直接依赖后端原始字段，而是通过 adapter 转成前端自己的领域模型，这样接口字段变化时修改面更小。
```

常见坑：

- 组件里到处直接读取后端字段，导致协议一变全局连锁修改。
- 没有 mock 和契约测试，问题只能等联调或上线后暴露。
