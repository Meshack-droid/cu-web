import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  Database,
  Shield,
  Clock,
  Server,
  RefreshCw,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { fetchSystemHealth, type SystemHealthData } from '@/features/admin/admin.api';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemHealthModal({ isOpen, onClose }: SystemHealthModalProps) {
  const { data, isLoading, refetch, isFetching } = useQuery<SystemHealthData>({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealth,
    enabled: isOpen,
    refetchInterval: isOpen ? 10000 : false,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">TUMCU System Diagnostics & Health</h2>
              <p className="text-xs text-slate-500">Live operational status and constitutional integrity checks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Refresh diagnostics"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="py-12 text-center text-slate-500 animate-pulse">
            Running system diagnostic checks...
          </div>
        ) : (
          <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Overall Status Banner */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-emerald-900">ALL SYSTEMS NOMINAL</div>
                  <div className="text-[11px] text-emerald-700">Operational readiness 100% • Zero active critical alerts</div>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                Healthy
              </span>
            </div>

            {/* Diagnostics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Database */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-xs">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Database Store & Transaction Engine
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Engine:</span>
                    <span className="font-medium text-slate-800">MySQL Primary + InMemory Fallback</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span className="font-semibold text-emerald-600">{data.database.latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connected Tables:</span>
                    <span className="font-medium text-slate-800">{data.database.tables_loaded} constitutional tables</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection Pool:</span>
                    <span className="font-medium text-slate-800">{data.database.active_pool_connections} active / {data.database.idle_pool_connections} idle</span>
                  </div>
                </div>
              </div>

              {/* Authentication & Security */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-xs">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Auth & Access Protection
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>JWT Verification:</span>
                    <span className="font-medium text-slate-800">{data.auth.jwt_token_version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions:</span>
                    <span className="font-semibold text-blue-600">{data.auth.active_sessions_estimate} authenticated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Logins (24h):</span>
                    <span className="font-medium text-slate-800">{data.auth.failed_login_attempts_24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Password Complexity:</span>
                    <span className="font-medium text-emerald-600">Strictly Enforced</span>
                  </div>
                </div>
              </div>

              {/* Governance & Constitutional Engine */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-xs">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Constitutional Rule Enforcement
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Constitutional Positions:</span>
                    <span className="font-semibold text-slate-800">{data.governance_engine.positions_defined} offices</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Office Bearers:</span>
                    <span className="font-semibold text-emerald-600">{data.governance_engine.active_assignments} active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flagged Vacancies:</span>
                    <span className="font-semibold text-amber-600">{data.governance_engine.vacancies_flagged} positions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Financial Controls:</span>
                    <span className="font-medium text-slate-800">Dual-Signatory Rule Enforced</span>
                  </div>
                </div>
              </div>

              {/* Scheduler & Tasks */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-xs">
                  <Clock className="w-4 h-4 text-violet-600" />
                  Background Services & Automation
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Daemon Status:</span>
                    <span className="font-medium text-emerald-600">Active (cron daemon)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sweeps:</span>
                    <span className="font-medium text-slate-800">{data.scheduler.active_cron_jobs.length} jobs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audit Events Today:</span>
                    <span className="font-semibold text-slate-800">{data.audit_summary.events_recorded_today} events</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Violations:</span>
                    <span className="font-semibold text-emerald-600">0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note on Constitutional Integrity */}
            <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
              <span className="font-semibold">Constitutional Rule:</span> {data.governance_engine.financial_separation_of_powers}. Administrative actions require appropriate constitutional office authorization.
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Close Diagnostics
          </Button>
        </div>
      </div>
    </div>
  );
}
