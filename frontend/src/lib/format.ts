import type { Checkin, Pact } from "./api";

export function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    ...options,
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export function periodKey(dateValue: string, frequency: Pact["frequency"]) {
  const date = new Date(`${dateValue.slice(0, 10)}T12:00:00`);
  if (frequency === "daily") return localDate(date);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return localDate(date);
}

export function pactIsCheckedIn(pact: Pact, checkins: Checkin[]) {
  const period = periodKey(localDate(), pact.frequency);
  return checkins.some(
    (checkin) =>
      checkin.pact_id === pact.id &&
      periodKey(checkin.date, pact.frequency) === period,
  );
}
