'use client';

import React from 'react';
import { Brain, Lightbulb, Loader2 } from 'lucide-react';

interface AIExplanationProps {
  explanation?: string;
  suggestedFix?: string;
  isLoading?: boolean;
}

const AIExplanation: React.FC<AIExplanationProps> = ({
  explanation,
  suggestedFix,
  isLoading = false,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-xl border border-slate-700 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Brain className="w-32 h-32 text-indigo-400" />
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <div className="bg-indigo-500/20 border border-indigo-500/30 rounded p-1.5 flex items-center justify-center">
          <Brain className="w-4 h-4 text-indigo-400" />
        </div>
        <h3 className="text-lg font-medium text-white">AI Analysis</h3>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-indigo-400/80 mb-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Analyzing traces and identifying root cause...</span>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700/50 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-slate-700/50 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-slate-700/50 rounded animate-pulse w-5/6"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          <div>
            <h4 className="text-sm font-medium text-indigo-300 mb-2">Explanation</h4>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              {explanation || 'No explanation available.'}
            </div>
          </div>

          {suggestedFix && (
            <div>
              <div className="flex items-center space-x-2 mb-2 text-emerald-400">
                <Lightbulb className="w-4 h-4" />
                <h4 className="text-sm font-medium">Suggested Fix</h4>
              </div>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 border-l-2 border-l-emerald-500">
                {suggestedFix}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIExplanation;
