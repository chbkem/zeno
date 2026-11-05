import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/zeno/AppShell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Zeno" }],
  }),
  component: () => <AppShell page="settings" />,
});
