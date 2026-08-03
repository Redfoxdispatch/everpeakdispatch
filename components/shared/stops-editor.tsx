"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type StopDraft = {
  stopType: "pickup" | "delivery";
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  appointmentEarliest: string;
  appointmentLatest: string;
};

const EMPTY_STOP: StopDraft = {
  stopType: "pickup",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  appointmentEarliest: "",
  appointmentLatest: "",
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "text-xs font-medium text-muted-foreground";

export function useStopsDraft() {
  const [stops, setStops] = useState<StopDraft[]>([
    { ...EMPTY_STOP, stopType: "pickup" },
    { ...EMPTY_STOP, stopType: "delivery" },
  ]);

  function updateStop(index: number, patch: Partial<StopDraft>) {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addStop() {
    // Insert a new intermediate stop just before the final (delivery) stop.
    setStops((prev) => [...prev.slice(0, -1), { ...EMPTY_STOP, stopType: "delivery" }, prev[prev.length - 1]]);
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  return { stops, updateStop, addStop, removeStop };
}

function StopCard({
  stop,
  index,
  isFirst,
  isLast,
  onChange,
  onRemove,
}: {
  stop: StopDraft;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<StopDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-heading text-xs text-muted-foreground">Stop {index + 1}</span>
          {isFirst || isLast ? (
            <span className="text-xs font-medium capitalize">{stop.stopType}</span>
          ) : (
            <select
              value={stop.stopType}
              onChange={(e) => onChange({ stopType: e.target.value as StopDraft["stopType"] })}
              className="rounded-md border border-input bg-background px-2 py-0.5 text-xs"
            >
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
          )}
        </div>
        {!isFirst && !isLast ? (
          <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Address line 1</label>
          <input
            value={stop.line1}
            onChange={(e) => onChange({ line1: e.target.value })}
            className={`mt-1 ${inputClass}`}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Address line 2 (optional)</label>
          <input
            value={stop.line2}
            onChange={(e) => onChange({ line2: e.target.value })}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input
            value={stop.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className={`mt-1 ${inputClass}`}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>State</label>
            <input
              value={stop.state}
              onChange={(e) => onChange({ state: e.target.value })}
              className={`mt-1 ${inputClass}`}
              required
            />
          </div>
          <div>
            <label className={labelClass}>ZIP</label>
            <input
              value={stop.zip}
              onChange={(e) => onChange({ zip: e.target.value })}
              className={`mt-1 ${inputClass}`}
              required
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Earliest appointment</label>
          <input
            type="datetime-local"
            value={stop.appointmentEarliest}
            onChange={(e) => onChange({ appointmentEarliest: e.target.value })}
            className={`mt-1 ${inputClass}`}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Latest appointment</label>
          <input
            type="datetime-local"
            value={stop.appointmentLatest}
            onChange={(e) => onChange({ appointmentLatest: e.target.value })}
            className={`mt-1 ${inputClass}`}
            required
          />
        </div>
      </div>
    </div>
  );
}

export function StopsEditor({
  stops,
  onUpdate,
  onAdd,
  onRemove,
}: {
  stops: StopDraft[];
  onUpdate: (index: number, patch: Partial<StopDraft>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Stops</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-3.5" strokeWidth={1.75} />
          Add stop
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {stops.map((stop, i) => (
          <StopCard
            key={i}
            stop={stop}
            index={i}
            isFirst={i === 0}
            isLast={i === stops.length - 1}
            onChange={(patch) => onUpdate(i, patch)}
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>
    </div>
  );
}
