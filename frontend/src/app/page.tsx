'use client';

import { useDashboard } from '@/hooks/useDashboard';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';

const DependencyGraph = dynamic(
  () => import('@/components/DependencyGraph/DependencyGraph'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>Loading Service Topology...</span>
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
    systemStatus,
    isBackendConnected,
    injectFault,
    resetServices,
    selectService,
  } = useDashboard();

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navigation & Status */}
      <Header
        systemStatus={systemStatus}
        incidentCount={rootCauseResult ? 1 : 0}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Container */}
      <main className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
        {/* Top Grid: Service Topology (2/3) + RCA & Diagnostics (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Live Dependency Graph */}
          <section className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[580px] lg:min-h-[640px]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${systemStatus === 'healthy' ? 'bg-emerald-400 opacity-75' : 'bg-red-400 opacity-75'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${systemStatus === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                <h2 className="text-sm font-semibold tracking-wide text-slate-200">
                  Live Service Dependency Topology
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                <span>{services.length} Nodes</span>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-400">Interactive DAG Flow</span>
              </div>
            </div>

            <div className="flex-1 relative w-full h-[540px] lg:h-[600px]">
              <DependencyGraph
                services={services}
                rootCauseServiceId={rootCauseResult?.rootCause.serviceId}
                affectedServiceIds={rootCauseResult?.affectedServices}
              />
            </div>
          </section>

          {/* Right: Root Cause Analysis, Propagation & Blast Radius */}
          <section className="lg:col-span-4 flex flex-col gap-5">
            {/* RCA Primary Diagnostic Card */}
            <RootCausePanel result={rootCauseResult} />

            {/* Failure Propagation Pathway */}
            {rootCauseResult && (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-red-400 text-lg">⚡</span>
                  <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                    Failure Propagation Cascade
                  </h3>
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

        {/* AI Diagnostic Explanation Section */}
        {rootCauseResult && (
          <section className="rounded-2xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/20 via-slate-900/60 to-purple-950/20 backdrop-blur-xl p-5 shadow-2xl">
            <AIExplanation
              explanation={rootCauseResult.aiExplanation || rootCauseResult.explanation}
              suggestedFix={rootCauseResult.suggestedFix}
            />
          </section>
        )}

        {/* Lower Grid: Service Metrics + Chronological Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Service Telemetry & Sparklines */}
          <section className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h2 className="text-sm font-semibold text-slate-200">
                  Telemetry & Performance Metrics
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium">Service:</label>
                <select
                  aria-label="Filter Telemetry Service"
                  className="text-xs bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  value={selectedService?.id || ''}
                  onChange={(e) => selectService(e.target.value || null)}
                >
                  <option value="">Select Service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5">
              <MetricsGrid service={selectedService} />
            </div>
          </section>

          {/* Incident Timeline */}
          <section className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <h2 className="text-sm font-semibold text-slate-200">
                  Chronological Incident Timeline
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {timelineEvents.length} Events
              </span>
            </div>
            <div className="p-4 flex-1">
              <IncidentTimeline events={timelineEvents} />
            </div>
          </section>
        </div>

        {/* Chaos Engineering & Fault Injection Control Room */}
        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-5 shadow-2xl">
          <ControlPanel
            onInjectFault={injectFault}
            onReset={resetServices}
            isActive={activeScenario !== null}
            activeScenario={activeScenario}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500">
        TraceX • Intelligent Distributed System Root Cause Analyzer • Hackathon Edition
      </footer>
    </div>
  );
}
