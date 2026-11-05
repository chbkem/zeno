import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/zeno/AppShell";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [{ title: "Stats — Zeno" }],
  }),
  component: () => <AppShell page="stats" />,
});
