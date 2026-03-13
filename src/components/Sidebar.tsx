import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Settings,
  Home,
  Bell,
  Users,
  X,
} from 'lucide-react';
import TeamPanel from './TeamPanel';
import type { Project } from '../types';
import type { Employee } from '../lib/employees';

interface Props {
  projects: Project[];
  currentProjectId?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
  unreadCount?: number;
  employees?: Employee[];
  currentUserName?: string;
  currentUserEmail?: string;
  onShowNotifications?: () => void;
  onShowSettings?: () => void;
}

export default function Sidebar({
  projects, currentProjectId, isAdmin, onLogout,
  unreadCount = 0, employees = [], currentUserName, currentUserEmail,
  onShowNotifications, onShowSettings,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTeam, setShowTeam] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const basePath = isAdmin ? '/admin/project' : '/view';
  const homePath = isAdmin ? '/admin' : '/dashboard';

  return (
    <aside
      className={`sidebar-transition flex flex-col bg-dark-surface border-r border-dark-border h-screen sticky top-0 z-30 ${
        collapsed ? 'w-[52px]' : 'w-[260px]'
      }`}
    >
      {/* Logo area */}
      <div className="flex items-center justify-between px-3 h-[52px] border-b border-dark-border shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">IO</span>
            </div>
            <span className="text-text-bright font-bold text-sm truncate">INTEROHRIGIN</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xs">IO</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-dark-card text-text-dim hover:text-text-bright transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick nav */}
      <div className="px-2 py-2 space-y-0.5 border-b border-dark-border">
        <button
          onClick={() => navigate(homePath)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
            location.pathname === '/admin' || location.pathname === '/dashboard'
              ? 'bg-primary/15 text-primary'
              : 'text-text-mid hover:bg-dark-card hover:text-text-bright'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          {!collapsed && <span>홈</span>}
        </button>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
              location.pathname === '/admin'
                ? 'bg-primary/15 text-primary'
                : 'text-text-mid hover:bg-dark-card hover:text-text-bright'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left">대시보드</span>
            )}
          </button>
        )}
        <button
          onClick={() => {
            if (onShowNotifications) {
              onShowNotifications();
            } else {
              setShowNotifPanel(!showNotifPanel);
            }
          }}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors relative ${
            showNotifPanel
              ? 'bg-primary/15 text-primary'
              : 'text-text-mid hover:bg-dark-card hover:text-text-bright'
          }`}
        >
          <Bell className="w-4 h-4 shrink-0" />
          {!collapsed && <span>알림</span>}
          {unreadCount > 0 && (
            <span className="absolute top-1 left-5 w-4 h-4 bg-status-blocked text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {employees.length > 0 && (
          <button
            onClick={() => setShowTeam(!showTeam)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
              showTeam
                ? 'bg-primary/15 text-primary'
                : 'text-text-mid hover:bg-dark-card hover:text-text-bright'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">팀 멤버</span>
                <span className="text-[10px] text-text-dim">{employees.length}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Notification panel */}
      {showNotifPanel && !collapsed && (
        <div className="border-b border-dark-border px-3 py-3 max-h-[200px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">알림</span>
            <button onClick={() => setShowNotifPanel(false)} className="p-0.5 text-text-dim hover:text-text-bright">
              <X className="w-3 h-3" />
            </button>
          </div>
          {unreadCount > 0 ? (
            <p className="text-xs text-text-mid">읽지 않은 의견 {unreadCount}개</p>
          ) : (
            <p className="text-xs text-text-dim text-center py-2">새로운 알림이 없습니다</p>
          )}
        </div>
      )}

      {/* Team panel (toggled) */}
      {showTeam && employees.length > 0 && (
        <div className="border-b border-dark-border overflow-y-auto max-h-[240px]">
          <TeamPanel employees={employees} collapsed={collapsed} />
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 bg-dark-card rounded-lg px-2.5 py-1.5 border border-dark-border">
            <Search className="w-3.5 h-3.5 text-text-dim shrink-0" />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-text-bright placeholder-text-dim outline-none"
            />
          </div>
        </div>
      )}

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {!collapsed && (
          <div className="flex items-center justify-between px-2.5 mb-1">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">워크스페이스</span>
            <button
              onClick={() => navigate(homePath)}
              className="p-0.5 rounded hover:bg-dark-card text-text-dim hover:text-primary transition-colors"
              title="새 프로젝트"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {filteredProjects.map((project) => {
            const isActive = currentProjectId === project.id;
            return (
              <button
                key={project.id}
                onClick={() => navigate(`${basePath}/${project.id}`)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-primary/15 text-primary border-l-2 border-primary'
                    : 'text-text-mid hover:bg-dark-card hover:text-text-bright'
                }`}
                title={collapsed ? project.title : undefined}
              >
                <FolderKanban className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{project.title}</span>
                    <span className="text-[10px] font-mono text-text-dim">{project.overallProgress}%</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {filteredProjects.length === 0 && !collapsed && (
          <p className="text-xs text-text-dim text-center py-4">프로젝트 없음</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-dark-border space-y-0.5">
        {/* Current user info */}
        {currentUserName && !collapsed && (
          <div className="px-2.5 py-2 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-bold">{currentUserName.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-bright truncate">{currentUserName}</p>
                {currentUserEmail && (
                  <p className="text-[10px] text-text-dim truncate">{currentUserEmail}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {isAdmin && (
          <button
            onClick={onShowSettings}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text-mid hover:bg-dark-card hover:text-text-bright transition-colors"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>설정</span>}
          </button>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text-mid hover:bg-dark-card hover:text-status-blocked transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>로그아웃</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
