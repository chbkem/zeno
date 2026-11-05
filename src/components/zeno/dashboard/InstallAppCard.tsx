import { Download, Share, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa";

/**
 * Small "get the app" card for Settings. Shows the native install button where
 * the browser supports it, and share-sheet instructions on iOS Safari.
 */
export function InstallAppCard() {
  const { canInstall, installed, install } = useInstallPrompt();

  if (installed) {
    return (
      <section className="rounded-2xl border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="h-4 w-4 text-primary" />
          Zeno is installed
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;re running the app version. It opens full screen and keeps your last screen
          available when you go offline.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Download className="h-4 w-4 text-primary" />
        Install Zeno
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Add Zeno to your home screen so it opens like a normal app, without the browser bar.
      </p>
      {canInstall ? (
        <Button
          className="mt-3 w-full"
          onClick={() =>
            install().then((accepted) => {
              if (!accepted) toast("No problem — you can install any time from Settings.");
            })
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Install app
        </Button>
      ) : (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
          <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            On iPhone or iPad: tap the share button in Safari, then{" "}
            <span className="font-medium text-foreground">Add to Home Screen</span>. On Android or
            desktop Chrome, use the browser menu →{" "}
            <span className="font-medium text-foreground">Install app</span>.
          </span>
        </p>
      )}
    </section>
  );
}
