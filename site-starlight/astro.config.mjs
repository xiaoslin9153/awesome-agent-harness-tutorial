import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const siteUrl = process.env.SITE_BASE_URL || "/awesome-agent-harness-tutorial/";

export default defineConfig({
  site: "https://xiaoslin9153.github.io",
  base: "/awesome-agent-harness-tutorial",
  integrations: [
    starlight({
      title: "Agent Harness 学习指南",
      description:
        "用工程视角理解 Agent Harness 的核心机制、主流实现和设计取舍。",
      defaultLocale: "root",
      locales: {
        root: {
          label: "简体中文",
          lang: "zh-CN",
        },
      },
      social: [
        {
          label: "GitHub",
          icon: "github",
          href: "https://github.com/xiaoslin9153/awesome-agent-harness-tutorial",
        },
      ],
      sidebar: [
        {
          label: "概览",
          items: [{ autogenerate: { directory: "00-overview" } }],
        },
        {
          label: "核心概念",
          collapsed: true,
          items: [{ autogenerate: { directory: "01-core-concepts" } }],
        },
        {
          label: "Harness 机制",
          collapsed: true,
          items: [{ autogenerate: { directory: "02-harness-mechanics" } }],
        },
        {
          label: "框架拆解",
          collapsed: true,
          items: [
            { autogenerate: { directory: "03-frameworks" } },
          ],
        },
        {
          label: "实验",
          collapsed: true,
          items: [{ autogenerate: { directory: "05-labs" } }],
        },
        {
          label: "对比",
          collapsed: true,
          items: [{ autogenerate: { directory: "04-comparisons" } }],
        },
        {
          label: "案例分析",
          collapsed: true,
          items: [{ autogenerate: { directory: "06-case-studies" } }],
        },
        {
          label: "面试准备",
          collapsed: true,
          items: [{ autogenerate: { directory: "07-interview" } }],
        },
        {
          label: "评估",
          collapsed: true,
          items: [{ autogenerate: { directory: "08-evaluation" } }],
        },
        {
          label: "术语表",
          collapsed: true,
          items: [{ autogenerate: { directory: "09-glossary" } }],
        },
        {
          label: "延伸阅读",
          collapsed: true,
          items: [{ autogenerate: { directory: "10-extended" } }],
        },
      ],
      customCss: ["./src/styles/custom.css"],
      expressiveCode: false,
      components: {
        MarkdownContent: "./src/components/CustomMarkdownContent.astro",
      },
    }),
  ],
});
