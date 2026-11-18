import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { POPULAR_LANGUAGES } from "@/lib/languages";
import { cn } from "@/lib/utils";

export function LanguagePicker({
  open,
  onOpenChange,
  value,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string | null;
  onSelect: (lang: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => POPULAR_LANGUAGES.filter((l) => l.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );
  const typed = q.trim();
  const showCustom = typed.length >= 2 && !POPULAR_LANGUAGES.some((l) => l.toLowerCase() === typed.toLowerCase());

  const pick = (lang: string) => {
    onSelect(lang);
    setQ("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Your language</DialogTitle>
          <DialogDescription>Translations appear in this language. Pick one or type any language.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search or type a language…"
            className="h-11 rounded-full pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter" && typed.length >= 2) pick(filtered[0] ?? typed);
            }}
          />
        </div>
        <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto py-1">
          {showCustom && (
            <button onClick={() => pick(typed)} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Use “{typed}”
            </button>
          )}
          {filtered.map((l) => (
            <button
              key={l}
              onClick={() => pick(l)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                value === l ? "border-primary bg-primary-soft text-primary" : "border-border bg-card hover:bg-muted",
              )}
            >
              {value === l && <Check className="size-4" />}
              {l}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
