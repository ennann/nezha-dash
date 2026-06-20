import { NezhaAPISafe } from "@/app/types/nezha-api";
import {
  billingBarClass,
  getBillingInfo,
  getPlanTags,
  tagClassName,
} from "@/lib/server-display";
import { cn } from "@/lib/utils";

type BillingSummaryProps = {
  serverInfo: NezhaAPISafe;
  compact?: boolean;
  showTags?: boolean;
  showMeter?: boolean;
  meterLayout?: "stacked" | "inline";
  label?: string;
  showInlineLabels?: boolean;
  className?: string;
  tagsClassName?: string;
  meterClassName?: string;
};

export default function BillingSummary({
  serverInfo,
  compact = false,
  showTags = true,
  showMeter = true,
  meterLayout = "stacked",
  label,
  showInlineLabels,
  className,
  tagsClassName,
  meterClassName,
}: BillingSummaryProps) {
  const tags = getPlanTags(serverInfo);

  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5", className)}>
      {showTags && <BillingTags tags={tags} className={tagsClassName} />}
      {showMeter && (
        <BillingMeter
          serverInfo={serverInfo}
          layout={meterLayout}
          label={label}
          showInlineLabels={showInlineLabels}
          className={meterClassName}
        />
      )}
    </div>
  );
}

export function BillingTags({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className={cn(
            "w-fit shrink-0 rounded-[5px] border px-[4px] py-[1.5px] text-[9px] leading-none",
            tagClassName(index),
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function BillingMeter({
  serverInfo,
  layout = "stacked",
  label,
  showInlineLabels = false,
  className,
}: {
  serverInfo: NezhaAPISafe;
  layout?: "stacked" | "inline";
  label?: string;
  showInlineLabels?: boolean;
  className?: string;
}) {
  const billing = getBillingInfo(serverInfo);

  if (layout === "inline") {
    return (
      <div
        className={cn(
          "flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-muted-foreground",
          className,
        )}
      >
        {label ? <span className="shrink-0">{label}</span> : null}
        <span className="shrink-0">
          {showInlineLabels ? "价格: " : ""}
          {billing.price}
        </span>
        <span className="shrink-0">
          {showInlineLabels ? "剩余天数: " : ""}
          {billing.remaining}
        </span>
        <BillingBar progress={billing.progress} className="w-[70px] shrink-0" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label ? (
        <p className="text-xs text-muted-foreground">{label}</p>
      ) : null}
      <p className="truncate text-xs text-muted-foreground">{billing.price}</p>
      <div className="flex items-center truncate text-xs font-semibold">
        {billing.remaining}
      </div>
      <BillingBar progress={billing.progress} className="w-full" />
    </div>
  );
}

function BillingBar({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-[3px] w-[70px] overflow-hidden rounded-sm bg-secondary",
        className,
      )}
    >
      <div
        className={cn("h-full transition-all", billingBarClass(progress))}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
