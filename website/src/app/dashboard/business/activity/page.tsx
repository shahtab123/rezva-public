"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrackGate, useTrackAccess } from "@/components/dashboard/TrackGate";
import { dashboardFetch } from "@/lib/dashboard/fetch-with-auth";
import { useRegistryIdentifiers } from "@/lib/dashboard/registry-hooks";

type RegistryEvent = {
  event_type: string;
  timestamp: string;
  authorization_reference?: string | null;
};

export default function BusinessActivityPage() {
  return (
    <TrackGate
      track="business"
      title="Activity is locked"
      description="History unlocks after business approval."
    >
      <ActivityContent />
    </TrackGate>
  );
}

function ActivityContent() {
  const { controllerWallet } = useTrackAccess("business");
  const { identifiers, loading } = useRegistryIdentifiers(controllerWallet);
  const [events, setEvents] = useState<
    Array<{ identifierId: string; label: string; events: RegistryEvent[] }>
  >([]);

  useEffect(() => {
    if (!controllerWallet || identifiers.length === 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const batches = await Promise.all(
        identifiers.slice(0, 10).map(async (identifier) => {
          const response = await dashboardFetch(
            `/api/dashboard/registry/identifiers/${identifier.id}/history`,
            { controllerWallet },
          );
          if (!response.ok) return null;
          const data = (await response.json()) as { events?: RegistryEvent[] };
          return {
            identifierId: identifier.id,
            label: `${identifier.type}:${identifier.value}`,
            events: data.events ?? [],
          };
        }),
      );
      if (!cancelled) {
        setEvents(batches.filter(Boolean) as typeof events);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [controllerWallet, identifiers]);

  const flat = (!controllerWallet || identifiers.length === 0 ? [] : events)
    .flatMap((batch) =>
      batch.events.map((event) => ({
        ...event,
        label: batch.label,
      })),
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Activity"
        description="Protocol events for your identifiers - registration, updates, suspensions, and complaints."
      />
      {loading ? (
        <p className="dash-meta">Loading identifiers…</p>
      ) : flat.length === 0 ? (
        <p className="dash-meta">No registry events yet - register an identifier to see history.</p>
      ) : (
        <div className="dash-table-wrap" style={{ marginTop: 16 }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Identifier</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {flat.map((event, index) => (
                <tr key={`${event.timestamp}-${index}`}>
                  <td>{new Date(event.timestamp).toLocaleString()}</td>
                  <td>{event.label}</td>
                  <td>{event.event_type.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
