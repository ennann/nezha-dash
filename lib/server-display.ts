import { NezhaAPISafe } from "@/app/types/nezha-api";

type PublicNote = {
  billingDataMod?: {
    startDate?: string;
    endDate?: string;
    cycle?: string;
    amount?: string;
  };
  planDataMod?: {
    bandwidth?: string;
    trafficVol?: string;
    IPv4?: string;
    IPv6?: string;
    networkRoute?: string;
  };
};

export type BillingInfo = {
  price: string;
  remaining: string;
  progress: number;
  free: boolean;
};

const dayMs = 24 * 60 * 60 * 1000;

export function parsePublicNote(publicNote?: string): PublicNote {
  if (!publicNote) return {};

  try {
    return JSON.parse(publicNote) as PublicNote;
  } catch {
    return {};
  }
}

function trimAmount(value: string) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return value.trim();
  return parsed.toFixed(2).replace(/\.?0+$/, "");
}

function formatAmount(raw?: string) {
  const amount = (raw || "").trim();
  if (!amount || amount === "0" || amount === "0.00") return "免费";

  if (/usd$/i.test(amount)) {
    return `$${trimAmount(amount.replace(/usd$/i, ""))}`;
  }

  if (/cny$/i.test(amount)) {
    return `¥${trimAmount(amount.replace(/cny$/i, ""))}`;
  }

  if (amount.startsWith("$")) return `$${trimAmount(amount.slice(1))}`;
  if (amount.startsWith("¥")) return `¥${trimAmount(amount.slice(1))}`;
  return amount;
}

function formatCycle(cycle?: string) {
  switch ((cycle || "").toLowerCase()) {
    case "year":
      return "年";
    case "month":
      return "月";
    default:
      return "";
  }
}

export function getBillingInfo(serverInfo: NezhaAPISafe): BillingInfo {
  const note = parsePublicNote(serverInfo.public_note);
  const billing = note.billingDataMod || {};
  const amount = formatAmount(billing.amount);
  const free = amount === "免费";
  const cycle = formatCycle(billing.cycle);

  if (free && !billing.endDate) {
    return {
      price: "免费",
      remaining: "+∞",
      progress: 100,
      free: true,
    };
  }

  const price = cycle ? `${amount}/${cycle}` : amount || "--";
  const start = billing.startDate ? new Date(billing.startDate).getTime() : NaN;
  const end = billing.endDate ? new Date(billing.endDate).getTime() : NaN;

  if (!Number.isFinite(end)) {
    return {
      price,
      remaining: free ? "+∞" : "--",
      progress: free ? 100 : 0,
      free,
    };
  }

  const now = Date.now();
  const remainingDays = Math.max(0, Math.ceil((end - now) / dayMs));
  const total = Number.isFinite(start) ? Math.max(dayMs, end - start) : dayMs;
  const progress = Math.max(0, Math.min(100, ((end - now) / total) * 100));

  return {
    price,
    remaining: `${remainingDays} 天`,
    progress,
    free,
  };
}

export function getPlanTags(serverInfo: NezhaAPISafe) {
  const plan = parsePublicNote(serverInfo.public_note).planDataMod || {};
  const tags = [
    plan.bandwidth,
    plan.trafficVol,
    plan.IPv4 === "1" ? "IPv4" : undefined,
    plan.IPv6 === "1" ? "IPv6" : undefined,
    plan.networkRoute,
  ];

  return tags.filter((tag): tag is string => Boolean(tag && tag.trim()));
}

export function billingBarClass(value: number) {
  if (value > 70) return "bg-green-500";
  if (value > 30) return "bg-orange-400";
  return "bg-red-500";
}

export function tagClassName(index: number) {
  const classes = [
    "border-sky-200/70 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
    "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    "border-violet-200/70 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
    "border-rose-200/70 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
    "border-slate-200/70 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
  ];

  return classes[index % classes.length];
}

export function formatSpeedCompact(bytesPerSecond: number) {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "0K/s";
  if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(2)}K/s`;
  }
  if (bytesPerSecond < 1024 * 1024 * 1024) {
    return `${(bytesPerSecond / 1024 / 1024).toFixed(2)}M/s`;
  }
  return `${(bytesPerSecond / 1024 / 1024 / 1024).toFixed(2)}G/s`;
}
