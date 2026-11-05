import { deleteDoc, doc } from "firebase/firestore";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fb } from "@/lib/firebase";
import { formatNaira, type Transaction } from "@/lib/budget";

export function TransactionList({ uid, txs }: { uid: string; txs: Transaction[] }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <p className="mb-2 text-sm font-semibold">This month&apos;s transactions</p>
      {txs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nothing recorded for this month yet.
        </p>
      ) : (
        <ul className="divide-y">
          {txs.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  t.type === "income" ? "bg-secondary text-success" : "bg-muted text-destructive"
                }`}
              >
                {t.type === "income" ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.note || t.category}</p>
                <p className="text-xs text-muted-foreground">
                  {t.category} · {t.date}
                </p>
              </div>
              <p
                className={`text-sm font-semibold ${t.type === "income" ? "text-success" : "text-foreground"}`}
              >
                {t.type === "income" ? "+" : "−"}
                {formatNaira(t.amount)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={() =>
                  deleteDoc(doc(fb().db, "users", uid, "transactions", t.id)).catch((err) =>
                    toast.error(
                      "Couldn't delete: " + (err as Error).message.replace("Firebase: ", ""),
                    ),
                  )
                }
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
