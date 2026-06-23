import * as React from "react";
import { useFetchClient, Widget } from "@strapi/strapi/admin";
import { Box, Flex, Typography, Button, Badge } from "@strapi/design-system";
import { ArrowClockwise } from "@strapi/icons";

type RebuildStatus = {
  enabled: boolean;
  pending: boolean;
  lastTrigger: {
    at: string | null;
    reason: string;
    source: "auto" | "manual" | null;
    ok: boolean | null;
    error: string;
  };
  deployment: {
    status: string;
    createdAt: string;
  } | null;
  deploymentError?: string;
};

const IN_PROGRESS = new Set([
  "QUEUED",
  "INITIALIZING",
  "BUILDING",
  "DEPLOYING",
  "WAITING",
  "NEEDS_APPROVAL",
]);
const SUCCESS = new Set(["SUCCESS"]);
const FAILED = new Set(["FAILED", "CRASHED"]);

type Tone = "in-progress" | "success" | "failed" | "neutral";

function statusTone(status?: string): Tone {
  if (!status) return "neutral";
  if (IN_PROGRESS.has(status)) return "in-progress";
  if (SUCCESS.has(status)) return "success";
  if (FAILED.has(status)) return "failed";
  return "neutral";
}

function toneLabel(tone: Tone): string {
  switch (tone) {
    case "in-progress":
      return "Frissítés folyamatban…";
    case "success":
      return "Kész — az oldal naprakész";
    case "failed":
      return "A frissítés sikertelen";
    default:
      return "Ismeretlen állapot";
  }
}

function badgeProps(tone: Tone): { backgroundColor: string; textColor: string } {
  switch (tone) {
    case "in-progress":
      return { backgroundColor: "warning100", textColor: "warning600" };
    case "success":
      return { backgroundColor: "success100", textColor: "success600" };
    case "failed":
      return { backgroundColor: "danger100", textColor: "danger600" };
    default:
      return { backgroundColor: "neutral150", textColor: "neutral600" };
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const RebuildWidget = () => {
  const { get, post } = useFetchClient();
  const [status, setStatus] = React.useState<RebuildStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [triggering, setTriggering] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const { data } = await get("/website-rebuild/status");
      setStatus(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [get]);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleRebuild = async () => {
    setTriggering(true);
    try {
      await post("/website-rebuild/trigger");
      await load();
    } catch {
      setError(true);
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return <Widget.Loading />;
  }

  if (error || !status) {
    return <Widget.Error />;
  }

  if (!status.enabled) {
    return (
      <Widget.NoData>
        Az automatikus oldalfrissítés nincs beállítva ezen a környezeten.
      </Widget.NoData>
    );
  }

  const tone: Tone = status.pending
    ? "in-progress"
    : statusTone(status.deployment?.status);
  const { backgroundColor, textColor } = badgeProps(tone);
  const label = status.pending
    ? "Frissítés ütemezve…"
    : toneLabel(tone);

  return (
    <Flex direction="column" alignItems="stretch" gap={4} height="100%">
      <Flex direction="column" alignItems="flex-start" gap={2}>
        <Badge backgroundColor={backgroundColor} textColor={textColor}>
          {label}
        </Badge>

        {status.deployment ? (
          <Typography variant="pi" textColor="neutral600">
            Utolsó build indítva: {formatDate(status.deployment.createdAt)}
          </Typography>
        ) : status.deploymentError ? (
          <Typography variant="pi" textColor="neutral600">
            A Railway állapota most nem érhető el.
          </Typography>
        ) : null}

        {status.lastTrigger.at ? (
          <Typography variant="pi" textColor="neutral600">
            Utolsó frissítés indítása innen:{" "}
            {status.lastTrigger.source === "manual" ? "kézi" : "automatikus"} —{" "}
            {formatDate(status.lastTrigger.at)}
            {status.lastTrigger.ok === false ? " (hiba)" : ""}
          </Typography>
        ) : (
          <Typography variant="pi" textColor="neutral600">
            Ebben a munkamenetben még nem indult frissítés.
          </Typography>
        )}
      </Flex>

      <Box marginTop="auto">
        <Button
          variant="secondary"
          startIcon={<ArrowClockwise />}
          onClick={handleRebuild}
          loading={triggering}
          disabled={triggering}
          fullWidth
        >
          Frissítsd most
        </Button>
      </Box>
    </Flex>
  );
};

export { RebuildWidget };
