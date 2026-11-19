import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const KEY = "speakup:profile:v1";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Local profile — Speak Sprout" }] }),
  component: LocalProfile,
});

function LocalProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) ?? "null") as {
        name?: string;
        email?: string;
      } | null;
      if (typeof stored?.name === "string") setName(stored.name);
      if (typeof stored?.email === "string") setEmail(stored.email);
    } catch {
      // An unavailable or unreadable profile can be replaced by saving the form.
    }
  }, []);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ name: cleanName, email: email.trim() }));
      setStatus("saved");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <MobileShell>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Local profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your profile and practice history stay in this browser.
      </p>
      <form
        onSubmit={save}
        className="mt-6 max-w-lg space-y-4 rounded-[1.5rem] border border-border bg-card p-5 sm:p-6"
      >
        <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
          <UserRound aria-hidden="true" className="size-6" />
        </span>
        <div>
          <label htmlFor="profile-name" className="text-sm font-bold">
            Name
          </label>
          <Input
            id="profile-name"
            className="mt-1"
            autoComplete="name"
            maxLength={80}
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setStatus("idle");
            }}
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="text-sm font-bold">
            Email <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="profile-email"
            className="mt-1"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setStatus("idle");
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="hero" size="pill" disabled={!name.trim()}>
            Save profile
          </Button>
          <p role="status" className="text-sm text-muted-foreground">
            {status === "saved" && "Profile saved."}
            {status === "failed" && "Couldn’t save the profile in this browser."}
          </p>
        </div>
      </form>
    </MobileShell>
  );
}
