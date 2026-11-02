import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import messages from "@/messages/en.json";

/** Render with the English catalog, as the app does under `/en`. */
export function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}
