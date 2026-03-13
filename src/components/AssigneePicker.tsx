import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import Avatar from './Avatar';
import { getRoleLabel } from '../lib/employees';
import type { Employee } from '../lib/employees';

interface Props {
  employees: Employee[];
  currentAssigneeId: string;
  onSelect: (employeeId: string, employeeName: string) => void;
  onClear: () => void;
}

export default function AssigneePicker({ employees, currentAssigneeId, onSelect, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const currentEmployee = employees.find(e => e.id === currentAssigneeId || e.name === currentAssigneeId);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department_name?.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by department
  const byDept = filtered.reduce<Record<string, Employee[]>>((acc, e) => {
    const dept = e.department_name ?? '미배정';
    (acc[dept] ??= []).push(e);
    return acc;
  }, {});

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        className="cursor-pointer flex items-center gap-1"
        onClick={() => setOpen(!open)}
      >
        {currentEmployee ? (
          <Avatar employee={currentEmployee} size="md" />
        ) : currentAssigneeId ? (
          <Avatar name={currentAssigneeId} size="md" />
        ) : (
          <Avatar size="md" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-9 left-1/2 -translate-x-1/2 w-64 bg-dark-card border border-dark-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-dark-border">
            <Search className="w-3.5 h-3.5 text-text-dim shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="이름 또는 부서 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-text-bright placeholder-text-dim outline-none"
            />
            {currentAssigneeId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                  setOpen(false);
                }}
                className="p-0.5 rounded hover:bg-dark-border text-text-dim hover:text-status-blocked transition-colors"
                title="담당자 해제"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Employee list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {Object.entries(byDept).map(([dept, emps]) => (
              <div key={dept}>
                <div className="px-3 py-1">
                  <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">{dept}</span>
                </div>
                {emps.map((emp) => {
                  const isSelected = emp.id === currentAssigneeId || emp.name === currentAssigneeId;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => {
                        onSelect(emp.id, emp.name);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-dark-card-hover transition-colors ${
                        isSelected ? 'bg-primary/10' : ''
                      }`}
                    >
                      <Avatar employee={emp} size="sm" showTooltip={false} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-text-bright truncate">{emp.name}</div>
                        <div className="text-[9px] text-text-dim">{getRoleLabel(emp.role)}</div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] text-primary font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-text-dim text-center py-4">검색 결과 없음</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
