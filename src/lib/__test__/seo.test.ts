import { buildMetadata, localizedUrl, SITE_URL } from "@/lib/seo";

describe("buildMetadata", () => {
  const meta = buildMetadata({
    locale: "my",
    path: "/results",
    title: "Title",
    description: "Desc",
  });

  it("sets canonical and hreflang alternates for every locale", () => {
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/my/results`);
    expect(meta.alternates?.languages).toEqual({
      en: `${SITE_URL}/en/results`,
      my: `${SITE_URL}/my/results`,
    });
  });

  it("fills Open Graph and Twitter", () => {
    expect(meta.openGraph).toMatchObject({ title: "Title", locale: "my_MM", url: `${SITE_URL}/my/results` });
    expect(meta.twitter).toMatchObject({ title: "Title", description: "Desc" });
  });

  it("is indexable by default and noindex on request", () => {
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(buildMetadata({ locale: "en", title: "t", description: "d", noindex: true }).robots).toEqual({ index: false, follow: false });
  });

  it("builds localized URLs", () => {
    expect(localizedUrl("en")).toBe(`${SITE_URL}/en`);
  });
});
