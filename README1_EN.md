# Penghu Li - AI Application Frontend Engineer

::: left

icon:email [1471062948@qq.com](mailto:1471062948@qq.com)
icon:weixin | icon:phone 15833802379

:::

::: right

Male | 26 years old | 4 years of work experience

CPC Member | Handan, Hebei

:::

## Professional Summary

**AI-Driven Efficiency**: Driven the adoption of AI-assisted development workflows across the team, with hands-on experience in SDD, TDD, and other development paradigms. Proficient in Codex / Claude Code / Cursor / OpenCode and other AI tools.

**Architecture**: Capable of building complete projects from 0 to 1, covering frontend toolchain selection, engineering standards, team collaboration mechanisms, and monitoring systems to support continuous business iteration.

**Engineering Practices**: Familiar with Webpack / Vite / Rollup and other build tools, with understanding of core principles and differences between them.

**Internationalization & Commerce**: Extensive experience in overseas projects, proficient in integrating domestic and international payment channels and cross-border collaboration workflows.

**Frontend Framework**: Years of deep React practice, proficient in Next.js, familiar with framework runtime mechanisms. Capable of selecting appropriate rendering strategies (CSR/SSR/SSG/ISR) based on business needs, with extensive optimization experience accumulated in project practice.

**Coding Skills**: Solid frontend fundamentals, proficient in TypeScript. In large-scale projects, capable of leveraging TS for type constraints to improve code maintainability and reliability.

**Performance Optimization**: Skilled in using Lighthouse, PageSpeed, Performance and other tools to identify performance bottlenecks and design optimization solutions, significantly reducing FCP and LCP times to enhance user interaction experience.

**Management**: Experienced in managing a 7-person frontend team, responsible for technical standards, development processes, and task allocation to ensure on-time project delivery. Improved overall team capabilities through code reviews and knowledge sharing.

## Work Experience

### Beijing Youle Today Technology Co., Ltd. (FastMoss) / Frontend Lead / Aug 2022 - Mar 2026

- Led frontend efficiency and quality systems development, drove frontend architecture upgrades to support business growth
- Promoted the adoption of AI-assisted development workflows within the team, established AI output review and merge standards to improve iteration efficiency and delivery consistency
- Established engineering standards with ESLint / Prettier / Husky / GitFlow and Code Review mechanisms to unify code style and reduce production defect rates
- Participated in product and technology decisions, led key business solution design, and collaborated with product, operations, marketing, and other teams to drive requirement delivery
- Continuously optimized performance and interaction around core conversion funnels, improving user retention and reducing bounce rates to support product growth targets
- Built team knowledge sharing and onboarding systems, compiled 50+ technical documents, shortened new hire ramp-up time, and conducted regular tech sharing sessions to enhance overall engineering capabilities

### Convertlab / Frontend Intern / Dec 2021 - Jul 2022

- Participated in requirement reviews, closely collaborated with product / UI / backend / QA teams to ensure stable delivery and on-time launches
- Encapsulated reusable business components and custom hooks to improve code reuse rate and team development efficiency
- Diagnosed and fixed issues in third-party utility libraries to ensure system stability and smooth business operations

<br/>
<br/>

## Project Experience

### FastMoss Data Platform / Frontend Lead / Aug 2022 - Mar 2026

`Next.js` `TypeScript` `ahooks` `zustand` `next-intl` `Crowdin` `html-to-image`

#### Project Overview

FastMoss is a data analytics platform powered by big data and AI technology, providing data analysis services for TikTok practitioners. It addresses data-driven decision-making needs such as product selection, competitive research, and market insights, helping customers boost profitability, gain operational strategy references, and reduce decision-making risks.

#### Responsibilities & Achievements

- Led the architecture migration from Umi to Next.js server-side rendering, balancing page performance and SEO. Developed a progressive refactoring strategy to complete the smooth migration without pausing business iteration.
- Designed SSR/CSR unified request layer with consistent handling of cookie/header, source validation, and signature mechanisms, improving request consistency and API security.
- Through SSR, performance optimization, blog system development, dynamic metadata, content structuring, and internal link optimization, increased SEO index from 100K+ to 5M+.
- Used Lighthouse / Performance / Bundle Analyzer to identify bottlenecks and implement optimizations. FCP improved by 50% (0.8s -> 0.4s), LCP optimized from 20s to 1.5s (~90% improvement).
- Designed and implemented payment service, integrating WeChat Pay / Alipay / Stripe / PayPal / Airwallex and other channels. Abstracted channel differences using strategy pattern, with new channel integration taking ~0.5 days, supporting domestic and international business growth.
- Encapsulated cross-tab communication capability (BroadcastChannel) with compatibility fallback, distilled as a reusable utility.
- Designed and implemented a view-count-based quota permission management solution, mapping page content and interaction behaviors based on user identity, deployed and running stably across 3 core projects.
- Built localization access strategy based on middleware, unifying language, region, and device redirect chains.
- Drove cloud-based internationalization, establishing standardized multi-language collaboration workflow with next-intl + Crowdin, reducing delivery cycle from 2 days to 0.5 days.
- Integrated Clarity and performance monitoring SDK for user behavior and page performance tracking. Established exception monitoring and alerting mechanisms with Feishu alerts for rapid identification and resolution of production issues.
- Built multi-platform growth event tracking aggregation capability (Google/Facebook/Bing/TikTok/LinkedIn, etc.), unifying login, registration, payment and other event metrics to improve attribution analysis and growth experiment efficiency.
- Extended AIGC scenarios based on platform data capabilities: implemented video content insights, smart clipping, script imitation, and VOC (Voice of Customer), reducing content production and decision-making costs to support acquisition and conversion.

#### FastMoss Agent

`SSE` `Tiptap` `react-markdown` `React`

- Implemented streaming output for LLM based on SSE with react-markdown, standardizing Markdown content display and style for readability and consistency.
- Used Tiptap to customize rich text input capabilities, supporting quotes, tag insertion, list selection, etc., optimizing input experience for complex scenarios.
- Continuously optimized performance and stability for long conversation scenarios through update throttling, render optimization, retry, and reconnection and recovery mechanisms to improve availability under weak network and timeout conditions.

<br/>
<br/>

### Open Source Project Learning Assistant / Full-Stack Developer

`Agent` `Python` `LangChain` `LangGraph` `Vue` `Docker` `Harness Engineering`

Built an LLM-driven open source project learning assistant based on LangChain and LangGraph, supporting repository static analysis, conversational exploration, and streaming responses, with persistent memory and observability capabilities.

#### Responsibilities & Achievements

- Built a source code analysis Agent based on LangGraph ReAct architecture, implementing a workflow of "input Git repo -> clone & static scan -> generate structured project report -> multi-turn conversation based on project context".
- Designed a layered processing strategy for large repositories: skipping invalid directories during scanning phase, building directory trees, project architecture, entry files, and symbol indexes. The Agent calls relevant tools to supplement context as needed during operation, avoiding model context window overflow.
- Built safety harness boundaries including prompt injection detection, secure path protection, error classification, LLM fallback, tool call observability, and metrics collection to enhance Agent security and observability.
- Constructed code tools such as list_tree, read_file, search_repo, symbol_lookup, exposing capabilities like directory browsing, file reading, source code search, and dependency analysis to the Agent, improving answer verifiability and reducing hallucination risks.
- Implemented containerized deployment with Docker multi-stage builds and docker-compose, with automated delivery via GitHub Actions.

### FastMoss Mini Program / Frontend Lead / Oct 2022 - Mar 2026

`Monorepo` `Taro` `TypeScript` `zustand` `Crowdin` `lodash` `echarts`

#### Responsibilities & Achievements

- Led TypeScript type governance, reducing `any` usage to under 1%, decreasing compilation errors by 95%+, and completed refactoring of 15+ core pages.
- Drove Monorepo architecture upgrade, defined PC/mobile reuse boundaries, reduced duplicate development costs, and improved cross-platform development efficiency.
- Produced 20+ reusable components and business hooks including VirtualList/Table/Cascader, improving code reuse rate and delivery efficiency.
- Reduced bundle size by 35% and improved cold start speed by 30% through code splitting, lazy loading, and package size optimization.
- Designed and implemented core solutions for sharing/referral mechanics, payments, membership permissions, login, etc., and developed high-conversion marketing landing pages for operational needs to support business growth.
- Deeply optimized Webpack build process, reducing build time from initial 4 minutes to ~1 minute, improving development and deployment efficiency.
- Resolved mini program poor network condition optimization and forced update upon new version release issues, improving user experience.

### ClawDream / Frontend Owner / Feb 2026 - Mar 2026

`Plasmo` `Firebase` `Claude Code`

#### Project Overview

An AI-powered Chrome extension that allows users to upload avatars and generate digital human images, combining target site multimedia data with LLM capabilities to achieve "one-click try-on / style preview" functionality. Covers major e-commerce and social platforms including Instagram, Amazon, Pinterest, Etsy, and more.

#### Responsibilities & Achievements

- Deeply practiced Vibe Coding, using Claude Code + MCP + Skills to cover requirement clarification, task decomposition, code implementation, unit testing, review, and integration, improving engineering quality while maintaining iteration pace.
- Designed overall plugin architecture: based on Content Script injecting scripts into target sites for data collection, encapsulated through standardized data protocol, sent via message channel to Background script, achieving decoupling of plugin core logic and page environment.
- Implemented standard media upload pipeline (pre-validation, face detection, upload progress and cancellation), reducing invalid upload rate and failure retry costs.
- Led flow design and implementation of key modules including image/video recognition and generation, Firebase authentication login, invitation code referral mechanics, ensuring stable operation of core business flows.
- Designed dynamically activatable debug panel to reduce joint debugging costs and improve problem identification efficiency.
- Designed step-level status feedback for core task flows, combined with exception retry, failure fallback, and status write-back mechanisms to optimize user experience.
- Followed up on Chrome Store review and listing process, handled multiple rounds of review feedback, and drove plugin listing as planned.

### Oumomo AI Creative Platform / Frontend Developer / Jun 2025 - Jan 2026

`AIGC` `Next.js 15` `React 19` `TypeScript` `Tailwind` `Zustand` `ahooks` `next-intl`

#### Project Overview

A one-stop AI product-promotion video creation platform for TikTok sellers: leveraging FastMoss data to identify high-performing materials, generating UGC-style high-conversion ad videos based on "viral genes", and covering the full creation pipeline from scripts, visuals, voiceover to publishing (including one-click publishing).

#### Responsibilities & Achievements

- Responsible for frontend project setup and technology selection, completing architecture design, engineering standards, and core infrastructure development to support rapid business iteration.
- Integrated internationalization, payment, and authorized login capabilities.
- Used Motion to implement landing page animations and optimized first-screen loading experience through dynamic imports and other techniques.
- Governed complex list page state and pagination race conditions, implementing URL-Driven Filter and IntersectionObserver lifecycle management to improve data-intensive page reproducibility and loading stability.

### MossCreator Influencer Outreach Platform / Frontend Lead / Nov 2023 - Mar 2026

`Umi` `TypeScript` `Tailwind` `Ant Design 5` `echarts` `CSS Module`

#### Project Overview

MossCreator is an influencer marketing management tool for TikTok merchants, leveraging AI, RPA, and other capabilities to provide influencer matching, bulk outreach, AI content generation, asset and workflow tracking, and team management, helping merchants improve marketing efficiency and reduce operational costs.

#### Responsibilities & Achievements

- Led frontend architecture design and implementation from 0 to 1, completing technology selection, project setup, and core business module development.
- Designed and implemented key flows including login, influencer marketplace, bulk email, payments, membership permissions, team management, and overseas localization.
- Custom-developed email editor and outreach tracking flows, combined with lazy loading, CDN, and other techniques to improve editor loading performance by ~40%.
- Implemented API signing, code obfuscation, and other security strategies to protect core user and business data.
- Promoted UI and development standards, continuously conducted Code Reviews to improve page consistency and delivery quality.
- Implemented AI content streaming generation and result display based on SSE, supporting multi-timezone scheduled publishing and task management.

## Education

### Hebei Normal University of Science and Technology / Full-time Bachelor's Degree / Internet of Things Engineering / Sep 2018 - Jun 2022

### Honors & Certificates

- North China Five Provinces (Municipalities/Autonomous Regions) University Student Robot Competition, Hebei Region -- First Prize
- First and Second Prizes in University-level Intelligent System Design Competition
- 2021 "Challenge Cup" Provincial Competition, Hebei -- Third Prize
