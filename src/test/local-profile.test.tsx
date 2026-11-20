import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route as HomeRoute } from "@/routes/index";
import { Route as ProfileRoute } from "@/routes/login";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useLocation: () => "/",
  Link: ({
    to,
    search,
    children,
    "aria-label": label,
  }: { to: string; search?: Record<string, string> } & ComponentProps<"a">) => (
    <a href={search ? `${to}?${new URLSearchParams(search)}` : to} aria-label={label}>
      {children}
    </a>
  ),
}));

const profileKey = "speakup:profile:v1";
const progressKey = "speakup:progress:v1";

beforeEach(() => localStorage.clear());

describe("local profile", () => {
  it("personalizes Home and the profile button and clears only the profile", () => {
    const Home = HomeRoute.options.component!;
    const Profile = ProfileRoute.options.component!;
    const progress = JSON.stringify({ xp: 42 });
    localStorage.setItem(progressKey, progress);

    const view = render(<Home />);
    expect(screen.getByRole("heading", { name: "Daily speaking practice" })).toBeInTheDocument();

    view.rerender(<Profile />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: " Sanskar " } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "learner@example.com" } });
    fireEvent.change(screen.getByLabelText(/First language/), { target: { value: "Spanish" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByRole("status")).toHaveTextContent("Profile saved.");
    expect(screen.getAllByRole("link", { name: "Local profile for Sanskar" })).toHaveLength(1);

    view.rerender(<Home />);
    expect(screen.getByRole("heading", { name: "Welcome back, Sanskar!" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Your accent focus/ })).toHaveTextContent("/s/");
    const avatarLinks = screen.getAllByRole("link", { name: "Local profile for Sanskar" });
    expect(screen.getByRole("link", { name: "Progress: 0-day streak, 42 XP" })).toBeVisible();
    expect(avatarLinks.some((link) => link.textContent === "S")).toBe(true);

    view.rerender(<Profile />);
    expect(screen.getByLabelText("Name")).toHaveValue("Sanskar");
    fireEvent.click(screen.getByRole("button", { name: "Clear local profile" }));
    expect(screen.getByRole("status")).toHaveTextContent("Local profile cleared.");
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText(/Email/)).toHaveValue("");
    expect(localStorage.getItem(profileKey)).toBeNull();
    expect(localStorage.getItem(progressKey)).toBe(progress);

    view.rerender(<Home />);
    expect(screen.getByRole("heading", { name: "Daily speaking practice" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Local profile" })).toHaveLength(1);
  });

  it("opens Kiki’s guide, answers a question, and closes it", () => {
    const Home = HomeRoute.options.component!;
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Ask Kiki for help" }));
    const guide = within(screen.getByRole("dialog", { name: "Kiki’s practice guide" }));
    fireEvent.click(guide.getByRole("button", { name: "What’s in my session?" }));
    expect(guide.getByText(/We’ll warm up with any due review words/)).toBeVisible();
    fireEvent.click(guide.getByRole("button", { name: "Close Kiki’s guide" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows direct topic and sound drill links in Home’s library preview", () => {
    const Home = HomeRoute.options.component!;
    render(<Home />);
    const section = within(screen.getByRole("region", { name: "Explore the library" }));
    expect(section.getByRole("link", { name: "Travel" })).toHaveAttribute(
      "href",
      "/practice?topic=travel",
    );
    expect(section.getByRole("link", { name: "TH think" })).toHaveAttribute(
      "href",
      "/practice?sound=TH",
    );
    expect(section.getByRole("link", { name: "Open Sound Lab & Library" })).toHaveAttribute(
      "href",
      "/skills",
    );
  });

  it("loads an existing profile without an email", () => {
    localStorage.setItem(profileKey, JSON.stringify({ name: "Asha" }));
    const Profile = ProfileRoute.options.component!;
    render(<Profile />);
    expect(screen.getByLabelText("Name")).toHaveValue("Asha");
    expect(screen.getByLabelText(/Email/)).toHaveValue("");
  });
});
