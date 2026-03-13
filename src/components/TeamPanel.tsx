import Avatar from './Avatar';
import { getRoleLabel } from '../lib/employees';
import type { Employee } from '../lib/employees';

interface Props {
  employees: Employee[];
  collapsed?: boolean;
}

export default function TeamPanel({ employees, collapsed }: Props) {
  if (collapsed) {
    return (
      <div className="px-2 py-2 space-y-1">
        {employees.slice(0, 8).map((emp) => (
          <div key={emp.id} className="flex justify-center">
            <Avatar employee={emp} size="sm" />
          </div>
        ))}
        {employees.length > 8 && (
          <div className="flex justify-center">
            <span className="text-[9px] text-text-dim">+{employees.length - 8}</span>
          </div>
        )}
      </div>
    );
  }

  // Group by department
  const byDept = employees.reduce<Record<string, Employee[]>>((acc, e) => {
    const dept = e.department_name ?? '미배정';
    (acc[dept] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="px-2 py-1">
      <div className="px-2.5 mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">팀 멤버</span>
        <span className="text-[10px] text-text-dim">{employees.length}명</span>
      </div>

      <div className="space-y-2">
        {Object.entries(byDept).map(([dept, emps]) => (
          <div key={dept}>
            <div className="px-2.5 py-0.5">
              <span className="text-[9px] text-text-dim font-semibold">{dept}</span>
            </div>
            {emps.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-dark-card transition-colors cursor-default"
              >
                <Avatar employee={emp} size="sm" showTooltip={false} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-mid truncate">{emp.name}</div>
                </div>
                <span className="text-[9px] text-text-dim">{getRoleLabel(emp.role)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
