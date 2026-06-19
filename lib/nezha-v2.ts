import { NezhaAPI, ServerApi } from "@/app/types/nezha-api";

type NezhaV2Host = {
  platform?: string;
  cpu?: string[];
  mem_total?: number;
  disk_total?: number;
  arch?: string;
  boot_time?: number;
};

type NezhaV2State = {
  cpu?: number;
  mem_used?: number;
  disk_used?: number;
  net_in_transfer?: number;
  net_out_transfer?: number;
  net_in_speed?: number;
  net_out_speed?: number;
  uptime?: number;
  load_1?: number;
  load_5?: number;
  load_15?: number;
  tcp_conn_count?: number;
  udp_conn_count?: number;
  process_count?: number;
};

type NezhaV2Server = {
  id: number;
  name: string;
  public_note?: string;
  display_index?: number;
  country_code?: string;
  last_active?: string;
  host?: NezhaV2Host;
  state?: NezhaV2State;
};

type NezhaV2Snapshot = {
  now?: number;
  servers?: NezhaV2Server[];
};

type NezhaV2GroupResponse = {
  success?: boolean;
  data?: Array<{
    group?: {
      name?: string;
    };
    servers?: number[];
  }>;
};

type CloudflareWebSocket = WebSocket & {
  accept: () => void;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function sameOriginFor(baseUrl: string) {
  const url = new URL(baseUrl);
  return `${url.protocol}//${url.host}`;
}

async function readTextFrame(socket: CloudflareWebSocket): Promise<string> {
  socket.accept();

  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out waiting for Nezha websocket snapshot"));
    }, 10000);

    socket.addEventListener("message", (event) => {
      clearTimeout(timeout);
      const data = event.data;
      socket.close();
      if (typeof data === "string") {
        resolve(data);
      } else {
        resolve(new TextDecoder().decode(data as ArrayBuffer));
      }
    });

    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("Nezha websocket snapshot failed"));
    });
  });
}

async function readTextFrameFromClient(socket: WebSocket): Promise<string> {
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out waiting for Nezha websocket snapshot"));
    }, 10000);

    socket.addEventListener("message", (event) => {
      clearTimeout(timeout);
      socket.close();
      if (typeof event.data === "string") {
        resolve(event.data);
      } else {
        resolve(new TextDecoder().decode(event.data as ArrayBuffer));
      }
    });

    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("Nezha websocket snapshot failed"));
    });
  });
}

async function fetchV2SnapshotWithClient(
  baseUrl: string,
): Promise<NezhaV2Snapshot> {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}/api/v1/ws/server`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(url.toString());
  return JSON.parse(await readTextFrameFromClient(socket)) as NezhaV2Snapshot;
}

async function fetchV2Snapshot(baseUrl: string): Promise<NezhaV2Snapshot> {
  const normalized = normalizeBaseUrl(baseUrl);
  let response: Response & { webSocket?: WebSocket };

  try {
    response = (await fetch(`${normalized}/api/v1/ws/server`, {
      headers: {
        Upgrade: "websocket",
        Origin: sameOriginFor(normalized),
      },
      cache: "no-store",
    } as RequestInit)) as Response & { webSocket?: WebSocket };
  } catch {
    return fetchV2SnapshotWithClient(normalized);
  }
  const socket = response.webSocket as CloudflareWebSocket | undefined;

  if (!response.ok || !socket) {
    return fetchV2SnapshotWithClient(normalized);
  }

  return JSON.parse(await readTextFrame(socket)) as NezhaV2Snapshot;
}

async function fetchV2Groups(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  const response = await fetch(`${normalized}/api/v1/server-group`, {
    cache: "no-store",
  });

  if (!response.ok) return new Map<number, string>();

  const data = (await response.json()) as NezhaV2GroupResponse;
  const groupMap = new Map<number, string>();

  for (const item of data.data || []) {
    const groupName = item.group?.name;
    if (!groupName) continue;
    for (const serverId of item.servers || []) {
      if (!groupMap.has(serverId)) groupMap.set(serverId, groupName);
    }
  }

  return groupMap;
}

function toNumber(value?: number) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function isOnline(lastActive?: string) {
  if (!lastActive) return false;
  const timestamp = new Date(lastActive).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp <= 300000;
}

function mapV2Server(server: NezhaV2Server, tag: string): NezhaAPI {
  const host = server.host || {};
  const state = server.state || {};

  return {
    id: server.id,
    name: server.name,
    tag,
    public_note: server.public_note,
    last_active: Math.floor(new Date(server.last_active || 0).getTime() / 1000),
    online_status: isOnline(server.last_active),
    ipv4: "",
    ipv6: "",
    valid_ip: "",
    display_index: server.display_index || 0,
    hide_for_guest: false,
    host: {
      Platform: host.platform || "linux",
      PlatformVersion: "",
      CPU: host.cpu || [],
      MemTotal: toNumber(host.mem_total),
      DiskTotal: toNumber(host.disk_total),
      SwapTotal: 0,
      Arch: host.arch || "",
      Virtualization: "",
      BootTime: toNumber(host.boot_time),
      CountryCode: (server.country_code || "").toUpperCase(),
      Version: "",
      GPU: [],
    },
    status: {
      CPU: toNumber(state.cpu),
      MemUsed: toNumber(state.mem_used),
      SwapUsed: 0,
      DiskUsed: toNumber(state.disk_used),
      NetInTransfer: toNumber(state.net_in_transfer),
      NetOutTransfer: toNumber(state.net_out_transfer),
      NetInSpeed: toNumber(state.net_in_speed),
      NetOutSpeed: toNumber(state.net_out_speed),
      Uptime: toNumber(state.uptime),
      Load1: toNumber(state.load_1),
      Load5: toNumber(state.load_5),
      Load15: toNumber(state.load_15),
      TcpConnCount: toNumber(state.tcp_conn_count),
      UdpConnCount: toNumber(state.udp_conn_count),
      ProcessCount: toNumber(state.process_count),
      Temperatures: 0,
      GPU: 0,
    },
  };
}

export async function GetNezhaV2Data(baseUrl: string): Promise<ServerApi> {
  const [snapshot, groups] = await Promise.all([
    fetchV2Snapshot(baseUrl),
    fetchV2Groups(baseUrl),
  ]);
  const data: ServerApi = {
    live_servers: 0,
    offline_servers: 0,
    total_out_bandwidth: 0,
    total_in_bandwidth: 0,
    total_in_speed: 0,
    total_out_speed: 0,
    result: [],
  };

  data.result = (snapshot.servers || []).map((server) => {
    const mapped = mapV2Server(server, groups.get(server.id) || "");

    if (mapped.online_status) {
      data.live_servers += 1;
    } else {
      data.offline_servers += 1;
    }

    data.total_out_bandwidth += mapped.status.NetOutTransfer;
    data.total_in_bandwidth += mapped.status.NetInTransfer;
    data.total_in_speed += mapped.status.NetInSpeed;
    data.total_out_speed += mapped.status.NetOutSpeed;

    return mapped;
  });

  return data;
}
