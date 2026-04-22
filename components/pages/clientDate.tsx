"use client";
import dayjs, { WIB_TZ } from "@/lib/dayjs";

export function ClientDate({ date }: { date: string | Date }) {
  const t = typeof date === "string"
    ? dayjs.utc(date).tz(WIB_TZ)
    : dayjs(date).tz(WIB_TZ);
  //return <time dateTime={t.toISOString()}>{t.format("DD MMM YYYY HH:mm:ss [WIB]")}</time>;
  return <time dateTime={t.toISOString()}>{t.format("HH:mm:ss [WIB]")}</time>;
}