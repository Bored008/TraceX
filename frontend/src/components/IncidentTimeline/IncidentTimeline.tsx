'use client';

import React, { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { TimelineEvent } from '@/types';

interface IncidentTimelineProps {
  events: TimelineEvent[];
}

export default function IncidentTimeline({ events }: IncidentTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[12rem] bg-[#0e0e11] rounded-xl border border-dashed border-white/15 p-4">
        <Clock className="w-6 h-6 text-neutral-600 mb-2" />
        <p className="text-neutral-500 text-xs font-mono">No events logged in buffer</p>
      </div>
    );
  }

  // Green for recovery/safe events, Red for anomaly/harm/chaos events
  const getDotClass = (type: string) => {
    switch (type) {
      case 'anomaly':
      case 'rca':
      case 'chaos':
        return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'recovery':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
      default:
        return 'bg-neutral-400';
    }
  };

  const getSeverityBadgeClass = (severity?: string, type?: string) => {
    if (type === 'recovery') {
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    }
    const s = severity?.toUpperCase();
    if (s === 'CRITICAL' || s === 'HIGH') {
      return 'bg-red-500/20 text-red-400 border border-red-500/40';
    }
    return 'bg-white/[0.05] text-neutral-300 border border-white/15';
  };

  return (
    <div
      ref={scrollRef}
      className="bg-[#0e0e11] rounded-xl border border-white/10 p-3.5 max-h-[340px] overflow-y-auto font-mono"
    >
      <div className="relative border-l border-white/10 ml-2 space-y-4 pb-1 mt-1">
        {events.map((event, index) => {
          const itemKey = `${event.id || 'evt'}-${index}-${event.timestamp || Date.now()}`;
          const isHarm = event.type === 'anomaly' || event.type === 'rca' || event.type === 'chaos';

          return (
            <div key={itemKey} className="relative pl-5 text-xs">
              <div
                className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border border-black ${getDotClass(
                  event.type
                )}`}
              />

              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] text-neutral-500" suppressHydrationWarning>
                  {new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                {event.severity && (
                  <span
                    className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${getSeverityBadgeClass(
                      event.severity,
                      event.type
                    )}`}
                  >
                    {event.severity}
                  </span>
                )}
              </div>

              <h4 className={`text-xs font-semibold ${isHarm ? 'text-red-300' : 'text-white'}`}>
                {event.title}
              </h4>

              {event.description && (
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed font-sans">
                  {event.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
