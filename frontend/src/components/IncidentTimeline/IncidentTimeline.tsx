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
      <div className="flex flex-col items-center justify-center w-full min-h-[16rem] bg-slate-800/30 rounded-xl border border-slate-800">
        <Clock className="w-8 h-8 text-slate-500 mb-2 opacity-50" />
        <p className="text-slate-500 text-sm">No events logged yet</p>
      </div>
    );
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'anomaly': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
      case 'rca': return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]';
      case 'chaos': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]';
      case 'recovery': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'info':
      default: return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
    }
  };

  const getSeverityBadgeClass = (severity?: string) => {
    const s = severity?.toUpperCase();
    if (s === 'CRITICAL') return 'bg-red-500/20 text-red-400 border border-red-500/30';
    if (s === 'HIGH') return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    if (s === 'MEDIUM') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  };

  return (
    <div
      ref={scrollRef}
      className="bg-slate-950/40 rounded-xl border border-slate-800/60 p-4 max-h-[340px] overflow-y-auto"
    >
      <div className="relative border-l border-slate-800 ml-3 space-y-5 pb-2 mt-1">
        {events.map((event, index) => {
          // Guaranteed unique composite key to prevent React duplicate key warnings
          const itemKey = `${event.id || 'evt'}-${index}-${event.timestamp || Date.now()}`;

          return (
            <div key={itemKey} className="relative pl-6">
              <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 ${getColor(event.type)}`} />
              
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400" suppressHydrationWarning>
                  {new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                {event.severity && (
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getSeverityBadgeClass(event.severity)}`}>
                    {event.severity}
                  </span>
                )}
              </div>
              
              <h4 className="text-xs font-semibold text-slate-200">{event.title}</h4>
              
              {event.description && (
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{event.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
