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
          label: "中文教程",
          items: [{ autogenerate: { directory: "tutorial/zh-CN" } }],
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
