# Webpack 构建优化（笔记总结）

## 1. 为什么要优化

- 开发环境依赖打包结果才能在浏览器看到效果，**构建越慢，反馈越慢**。
- 大型项目中，**Babel / 各类 Loader** 往往占构建耗时大头，需要**先度量再优化**。

---

## 2. 先定位：耗时在哪里

| 工具 | 作用 |
| --- | --- |
| **speed-measure-webpack-plugin** | 输出构建耗时报告：总时间、各阶段、**各插件 / 各 Loader** 耗时 |
| **webpack-bundle-analyzer** | 分析打包产物体积与模块构成，生成**可交互**的可视化图表，辅助做**分包与依赖治理** |

结论：从报告里找 Top 耗时项（常见：Babel、`babel-loader`、`css-loader` 等），再对症下药。

---

## 3. 常见优化手段

### 3.1 用 SWC 替代 Babel（编译加速）

- **SWC**（Speedy Web Compiler）：Rust 实现的 JS/TS 编译器。
- **特点**：编译速度快；生态上可对接大量 Babel 能力（是否 1:1 兼容取决于项目插件与语法特性，迁移时要**对照验证**）。
- **适用**：以「转译耗时」为主瓶颈时，优先考虑。

### 3.2 thread-loader（Loader 并行）

- **是什么**：Webpack Loader，把**后面的**一批 Loader 放到**子线程**执行，减轻主线程压力。
- **痛点**：默认 Webpack 多在主线程串行处理，大项目下 Loader 链路易成瓶颈。
- **注意**：线程有启动与通信成本，**只适合耗时 Loader**；通常放在**昂贵 loader 链最前面**，且 `workers` 数量需权衡。

### 3.3 Webpack 5 持久化缓存

- **作用**：把构建中间结果缓存起来，**二次构建**显著变快。
- **常见类型**：
  - **memory**：内存缓存，适合**开发**（快，但进程结束即失效）。
  - **filesystem**：落盘缓存，适合**生产/长时间保留**（Webpack 5 推荐 `type: 'filesystem'`）。

示例（注意字段名与逗号；`type` 取值以官方文档为准，一般为 `filesystem`）：

```js
cache: {
  type: 'filesystem',
  buildDependencies: {
    config: [__filename], // 配置文件变更时失效重建
  },
  name: 'my-cache',
  version: '1.0',
  // cacheDirectory 可选，自定义缓存目录
  // cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
}
```

### 3.4 开发与生产：文件名是否带 hash

- **开发**：通常**不需要**长期缓存文件名，**不加 contenthash** 可减少不必要构建开销（按团队规范来）。
- **生产**：一般用 **`[contenthash]`** 等，配合 CDN/浏览器缓存做**长缓存**，提升加载性能。

```js
output: {
  filename: isProd ? 'bundle.[contenthash].js' : 'bundle.js',
}
```

### 3.5 升级构建链依赖

- 例如 **terser-webpack-plugin**、各类 Loader/Plugin 升级到**与 Webpack 5 匹配**的版本，修复性能问题与兼容性。

---

## 4. Webpack 打包流程（简版）

1. **初始化**：读取配置 + CLI 参数，合并为最终配置（入口、输出、resolve、module、plugins 等）。
2. **编译**：从入口递归解析依赖；模块经 **Loader** 转成可打包的 JS 模块。
3. **模块图**：建立模块对象与依赖关系（Module Graph）。
4. **生成 Chunk**：按入口、动态 import、SplitChunks 等策略分组为 chunk。
5. **输出**：生成文件到 `output.path`。
6. **插件**：在生命周期钩子上介入（优化、压缩、注入资源等）。

### 生命周期钩子（混个眼熟）

| 阶段 | 示例钩子 |
| --- | --- |
| 启动 | `beforeRun`、`run` |
| 编译 | `compile`、`make`、`buildModule`、`seal` |
| 资源 | `processAssets`、`emit`、`afterEmit` |
| 结束 | `done` |
| 监听 | `watchRun`、`invalid` |

---

## 5. 浏览器缓存（与「生产 hash」常一起考）

- **强缓存**：在有效期内**可能不发请求**直接用本地缓存。常见响应头：`Cache-Control`（优先）、`Expires`（旧）。
- **协商缓存**：会**发请求**问服务器资源是否变化；未变则 **304**。常见响应头：`ETag`（优先）、`Last-Modified`。
- **ETag 补充**：值为服务端生成的**实体标记**；强校验多为 `"..."`，弱校验为 `W/"..."`，用于 `If-None-Match` 条件请求。

---

## 6. 面试怎么讲（建议结构）

1. **背景**：项目规模、构建耗时痛点（最好有前后对比口径：全量/增量、机器环境）。
2. **定位**：SMP / Analyzer 看到的主要耗时项。
3. **方案**：SWC / thread-loader / filesystem cache / hash 策略 / 依赖升级，各自解决什么问题。
4. **结果**：构建时间、产物体积、二次编译体验；线上配合缓存策略的收益（若有）。
5. **权衡**：SWC 兼容性验证成本、thread-loader 适用边界、缓存失效策略等。
