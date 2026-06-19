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
};

export default function BillingSummary({
  serverInfo,
  compact = false,
}: BillingSummaryProps) {
  const tags = getPlanTags(serverInfo);
  const billing = getBillingInfo(serverInfo);

  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5")}>
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className={cn(
                "w-fit rounded-[5px] border px-[4px] py-[1.5px] text-[9px] leading-none",
                tagClassName(index),
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
          <span>{billing.price}</span>
          <span>{billing.remaining}</span>
        </div>
        <div className="h-[3px] w-[70px] overflow-hidden rounded-sm bg-secondary">
          <div
            className={cn(
              "h-full transition-all",
              billingBarClass(billing.progress),
            )}
            style={{ width: `${billing.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

