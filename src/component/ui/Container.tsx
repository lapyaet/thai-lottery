import { cn } from "@/lib/utils";

/** Centers page content; `narrow` suits forms and reading-width pages. */
export default function Container({
  size = "wide",
  className,
  children,
}: {
  size?: "wide" | "narrow";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        size === "wide" ? "max-w-7xl" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
