'use client';

import { useDashboard } from '@/hooks/useDashboard';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';

const DependencyGraph = dynamic(
  () => import('@/components/DependencyGraph/DependencyGraph'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black text-neutral-500 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-white/40 border-t-transparent animate-spin" />
          <span>Initializing Topology Graph...</span>
        </div>
      </div>
    ),
  }
);
import RootCausePanel from '@/components/RootCausePanel/RootCausePanel';
import PropagationPath from '@/components/RootCausePanel/PropagationPath';
import MetricsGrid from '@/components/MetricsDashboard/MetricsGrid';
import IncidentTimeline from '@/components/IncidentTimeline/IncidentTimeline';
import ImpactSummary from '@/components/ImpactSummary/ImpactSummary';
import AIExplanation from '@/components/AIExplanation/AIExplanation';
import ControlPanel from '@/components/ControlPanel/ControlPanel';

export default function DashboardPage() {
  const {
    services,
    rootCauseResult,
    timelineEvents,
    selectedService,
    activeScenario,
    activeScenarios,
    systemStatus,
    isBackendConnected,
    injectFault,
    resetServices,
    selectService,
  } = useDashboard();

  const isHarm = systemStatus !== 'healthy' || Boolean(rootCauseResult);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white/20 relative">
      {/* Subtle Top White Gradient Accent */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

      {/* Top Header */}
      <Header
        systemStatus={systemStatus}
        incidentCount={rootCauseResult ? 1 : 0}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Container */}
      <main className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1920px] mx-auto w-full relative z-10">
        {/* Top Grid: Service Topology (2/3) + RCA & Diagnostics (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Live Dependency Graph */}
          <section className="lg:col-span-8 flex flex-col rounded-xl border border-white/20 bg-[#16161b] shadow-xl overflow-hidden min-h-[580px] lg:min-h-[640px]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10 bg-[#1c1c23]">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  {isHarm && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isHarm ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                  />
                </span>
                <h2 className="text-sm font-mono font-bold tracking-wider uppercase text-white">
                  Live Server Dependency Topology
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                <span>{services.length} Nodes</span>
                <span className="text-neutral-700">•</span>
                <span className="text-emerald-400 font-medium">Green Dotted Telemetry Flow</span>
              </div>
            </div>

            <div className="flex-1 relative w-full h-[540px] lg:h-[600px] bg-[#101014]">
              <DependencyGraph
                services={services}
                rootCauseServiceId={rootCauseResult?.rootCause.serviceId}
                rootCauseServiceIds={rootCauseResult?.secondaryRootCauseIds || []}
                affectedServiceIds={rootCauseResult?.affectedServices}
              />
            </div>
          </section>

          {/* Right: Root Cause Analysis, Propagation & Blast Radius */}
          <section className="lg:col-span-4 flex flex-col gap-4">
            {/* RCA Primary Diagnostic Card */}
            <RootCausePanel result={rootCauseResult} />

            {/* Failure Propagation Pathway */}
            {rootCauseResult && (
              <div className="rounded-xl border border-white/20 bg-[#16161b] backdrop-blur-md p-4 shadow-md">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                  <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
                    Causal Propagation Cascade
                  </span>
                </div>
                <PropagationPath
                  steps={rootCauseResult.propagationPath}
                  rootCauseServiceId={rootCauseResult.rootCause.serviceId}
                />
              </div>
            )}

            {/* Blast Radius Impact Summary */}
            {rootCauseResult && (
              <ImpactSummary
                affectedServices={rootCauseResult.affectedServices}
                affectedUsers={rootCauseResult.affectedUsers}
                totalServices={services.length}
              />
            )}
          </section>
        </div>

        {/* Diagnostic Synthesis & Fix Section (shown when an issue exists) */}
        {rootCauseResult && (
          <section className="rounded-xl border border-white/20 bg-[#16161b] backdrop-blur-md shadow-md">
            <AIExplanation
              explanation={rootCauseResult.aiExplanation || rootCauseResult.explanation}
              suggestedFix={rootCauseResult.suggestedFix}
            />
          </section>
        )}

        {/* Lower Grid: Service Metrics + Chronological Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Service Telemetry & Sparklines */}
          <section className="lg:col-span-7 flex flex-col rounded-xl border border-white/20 bg-[#16161b] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1c1c23]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Node Telemetry & Performance
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-400 font-mono">Service:</label>
                <select
                  aria-label="Filter Telemetry Service"
                  className="text-xs bg-[#22222a] border border-white/25 rounded px-2.5 py-1 text-white focus:outline-none focus:border-white/50 transition-all font-mono cursor-pointer"
                  value={selectedService?.id || ''}
                  onChange={(e) => selectService(e.target.value || null)}
                >
                  <option value="">Select Service Node...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4">
              <MetricsGrid service={selectedService} />
            </div>
          </section>

          {/* Incident Timeline */}
          <section className="lg:col-span-5 flex flex-col rounded-xl border border-white/20 bg-[#16161b] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1c1c23]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Event Stream & Anomaly Log
                </h2>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {timelineEvents.length} Events
              </span>
            </div>
            <div className="p-4 flex-1">
              <IncidentTimeline events={timelineEvents} />
            </div>
          </section>
        </div>

        {/* Chaos Engineering & Fault Simulator */}
        <section className="rounded-xl border border-white/20 bg-[#16161b] shadow-xl">
          <ControlPanel
            onInjectFault={injectFault}
            onReset={resetServices}
            isActive={activeScenarios.length > 0}
            activeScenario={activeScenario}
            activeScenarios={activeScenarios}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 px-6 text-center text-xs text-neutral-500 font-mono select-none">
        TraceX • Distributed Topology Root Cause Analyzer • Minimalist SRE Console
      </footer>
    </div>
  );
}
