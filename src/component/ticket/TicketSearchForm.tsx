"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FieldError from "@/component/ui/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type TicketSearchValues,
  ticketSearchSchema,
} from "@/lib/schemas";
import useFilterStore from "@/store/useFilterStore";

export default function TicketSearchForm() {
  const t = useTranslations("home");
  const search = useFilterStore((s) => s.search);
  const setSearch = useFilterStore((s) => s.setSearch);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<TicketSearchValues>({
    resolver: zodResolver(ticketSearchSchema),
    defaultValues: { query: "" },
    mode: "onChange",
  });

  // The filter sidebar's reset clears the store; mirror that into the input.
  useEffect(() => {
    if (search === "" && getValues("query") !== "") reset();
  }, [search, getValues, reset]);

  return (
    <form
      onSubmit={handleSubmit((v) => setSearch(v.query))}
      className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top))] z-30 border-b bg-background px-4 py-3"
      role="search"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            {...register("query", {
              // Filter live as the user types; the schema only gates the error.
              onChange: (e) => setSearch(e.target.value),
            })}
            inputMode="numeric"
            maxLength={12}
            aria-label={t("searchLabel")}
            aria-invalid={!!errors.query}
            aria-describedby={errors.query ? "search-error" : undefined}
            placeholder={t("searchPlaceholder")}
            className="h-10 rounded-full bg-card pl-9"
          />
        </div>
        <Button type="submit" className="h-10 rounded-full px-4">
          {t("searchButton")}
        </Button>
      </div>
      <FieldError id="search-error" message={errors.query?.message} />
    </form>
  );
}
