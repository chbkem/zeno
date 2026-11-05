import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/zeno/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zeno — Budgeting for Nigerian students" },
      {
        name: "description",
        content:
          "Track your allowance, expenses and budgets in Naira, with AI tips to spend smarter on campus.",
      },
      { property: "og:title", content: "Zeno — Budgeting for Nigerian students" },
      {
        property: "og:description",
        content: "Track income, expenses and monthly budgets, with Gemini-powered money tips.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AppShell page="home" />,
});
