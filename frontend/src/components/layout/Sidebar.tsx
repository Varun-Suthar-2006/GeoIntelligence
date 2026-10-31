import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  SplitSquareVertical,
  Activity,
  MapPin,
  Cpu,
  Database,
  History,
  FileText,
  Settings as SettingsIcon,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/explorer', label: 'Satellite Explorer', icon: Compass },
  { path: '/comparison', label: 'Image Comparison', icon: SplitSquareVertical },
  { path: '/detection', label: 'Change Detection', icon: Activity },
  { path: '/geospatial', label: 'Geospatial Intelligence', icon: MapPin },
  { path: '/models', label: 'AI Model Centre', icon: Cpu },
  { path: '/datasets', label: 'Dataset Manager', icon: Database },
  { path: '/history', label: 'Analysis History', icon: History },
  { path: '/reports', label: 'Research Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-surface border-r border-surface-border flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0">
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono tracking-wider text-text-muted uppercase">
          Intelligence Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/15 text-primary-light border-l-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* System Footer info */}
      <div className="p-4 border-t border-surface-border bg-surface-light/40">
        <div className="text-[11px] font-mono text-text-muted">
          <div>GeoIntelligence AI v1.0.0</div>
          <div className="text-[10px] text-text-secondary mt-0.5">Scientific Multi-Temporal System</div>
        </div>
      </div>
    </aside>
  );
};
