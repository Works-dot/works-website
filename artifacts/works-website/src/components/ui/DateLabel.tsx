import { Calendar } from "lucide-react";
import { displayDate } from "@/lib/display-date.js";

export function DateLabel({ value, locale, className, iconClassName = "w-4 h-4" }: {
  value: string;
  locale: "hu" | "en";
  className?: string;
  iconClassName?: string;
}) {
  const date = displayDate(value, locale);
  if (!date) return null;
  return (
    <span className={className}>
      <Calendar aria-hidden="true" className={`${iconClassName} shrink-0`} />
      <time dateTime={date.dateTime} className="whitespace-nowrap">{date.text}</time>
    </span>
  );
}
