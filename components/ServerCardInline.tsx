import { NezhaAPISafe } from "@/app/types/nezha-api";
import BillingSummary from "@/components/BillingSummary";
import ServerFlag from "@/components/ServerFlag";
import ServerUsageBar from "@/components/ServerUsageBar";
import { Card } from "@/components/ui/card";
import getEnv from "@/lib/env-entry";
import { formatSpeedCompact } from "@/lib/server-display";
import { cn, formatBytes, formatNezhaInfo } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Separator } from "./ui/separator";

export default function ServerCardInline({
  serverInfo,
}: {
  serverInfo: NezhaAPISafe;
}) {
  const t = useTranslations("ServerCard");
  const { id, name, country_code, online, cpu, mem, stg } =
    formatNezhaInfo(serverInfo);

  const showFlag = getEnv("NEXT_PUBLIC_ShowFlag") === "true";

  const saveSession = () => {
    sessionStorage.setItem("fromMainPage", "true");
  };

  return online ? (
    <Link onClick={saveSession} href={`/server/${id}`} prefetch={true}>
      <Card
        className={cn(
          "flex items-center lg:flex-row justify-start gap-3 p-3 md:px-5 cursor-pointer hover:bg-accent/50 transition-colors min-w-[940px] w-full",
        )}
      >
        <section className={cn("flex w-[200px] flex-col gap-1")}>
          <div
            className="grid items-center gap-2"
            style={{ gridTemplateColumns: "auto auto 1fr" }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 self-center"></span>
            <div
              className={cn(
                "flex items-center justify-center",
                showFlag ? "min-w-[17px]" : "min-w-0",
              )}
            >
              {showFlag ? <ServerFlag country_code={country_code} /> : null}
            </div>
            <p
              className={cn(
                "break-normal font-bold tracking-tight",
                showFlag ? "text-xs " : "text-sm",
              )}
            >
              {name}
            </p>
          </div>
          <BillingSummary
            serverInfo={serverInfo}
            compact
            showMeter={false}
            tagsClassName="flex-nowrap overflow-hidden"
          />
        </section>
        <Separator orientation="vertical" className="h-8 mx-0 ml-2" />
        <div className="flex flex-col gap-1">
          <section className={cn("grid grid-cols-9 items-center gap-3 flex-1")}>
            <div className={"flex w-14 flex-col"}>
              <BillingSummary
                serverInfo={serverInfo}
                compact
                showTags={false}
              />
            </div>
            <div className={"flex w-20 flex-col"}>
              <p className="text-xs text-muted-foreground">{t("Uptime")}</p>
              <div className="flex items-center text-xs font-semibold">
                {(serverInfo?.status.Uptime / 86400).toFixed(0)} 天
              </div>
            </div>
            <div className={"flex w-14 flex-col"}>
              <p className="text-xs text-muted-foreground">{t("CPU")}</p>
              <div className="flex items-center text-xs font-semibold">
                {cpu.toFixed(2)}%
              </div>
              <ServerUsageBar value={cpu} />
            </div>
            <div className={"flex w-14 flex-col"}>
              <p className="text-xs text-muted-foreground">{t("Mem")}</p>
              <div className="flex items-center text-xs font-semibold">
                {mem.toFixed(2)}%
              </div>
              <ServerUsageBar value={mem} />
            </div>
            <div className={"flex w-14 flex-col"}>
              <p className="text-xs text-muted-foreground">{t("STG")}</p>
              <div className="flex items-center text-xs font-semibold">
                {stg.toFixed(2)}%
              </div>
              <ServerUsageBar value={stg} />
            </div>
            <div className={"flex w-16 flex-col"}>
              <p className="text-xs text-muted-foreground">{t("Upload")}</p>
              <div className="flex items-center text-xs font-semibold">
                {formatSpeedCompact(serverInfo.status.NetOutSpeed)}
              </div>
            </div>
            <div className={"flex w-16 flex-col"}>
              <p className="text-xs text-muted-foreground">{t("Download")}</p>
              <div className="flex items-center text-xs font-semibold">
                {formatSpeedCompact(serverInfo.status.NetInSpeed)}
              </div>
            </div>
            <div className={"flex w-20 flex-col"}>
              <p className="text-xs text-muted-foreground">
                {t("TotalUpload")}
              </p>
              <div className="flex items-center text-xs font-semibold">
                {formatBytes(serverInfo.status.NetOutTransfer)}
              </div>
            </div>
            <div className={"flex w-20 flex-col"}>
              <p className="text-xs text-muted-foreground">
                {t("TotalDownload")}
              </p>
              <div className="flex items-center text-xs font-semibold">
                {formatBytes(serverInfo.status.NetInTransfer)}
              </div>
            </div>
          </section>
        </div>
      </Card>
    </Link>
  ) : (
    <Card
      className={cn(
        "flex items-center justify-start gap-3 p-3 md:px-5 min-h-[61px] min-w-[940px] flex-row",
      )}
    >
      <section className={cn("flex w-[200px] flex-col gap-1")}>
        <div
          className="grid items-center gap-2"
          style={{ gridTemplateColumns: "auto auto 1fr" }}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 self-center"></span>
          <div
            className={cn(
              "flex items-center justify-center",
              showFlag ? "min-w-[17px]" : "min-w-0",
            )}
          >
            {showFlag ? <ServerFlag country_code={country_code} /> : null}
          </div>
          <p
            className={cn(
              "break-normal font-bold tracking-tight",
              showFlag ? "text-xs" : "text-sm",
            )}
          >
            {name}
          </p>
        </div>
        <BillingSummary
          serverInfo={serverInfo}
          compact
          showMeter={false}
          tagsClassName="flex-nowrap overflow-hidden"
        />
      </section>
    </Card>
  );
}
