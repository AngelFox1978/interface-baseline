import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["fr", "en"] as const;
export const defaultLocale = "fr";

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("locale")?.value;
  const locale = cookieLocale === "en" ? "en" : "fr";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
