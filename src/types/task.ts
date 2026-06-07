/* Shared task types — digunakan di tasks/page.tsx dan TaskDetailDrawer */

export type TaskStatus   = "pending" | "in_progress" | "done" | "overdue";
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id:             number;
  title:          string;
  description:    string;
  assignee:       string;
  assigneeInitial: string;
  status:         TaskStatus;
  priority:       TaskPriority;
  deadline:       string;
  targetType:     "daily" | "weekly";
  tags:           string[];
}

/* Status display config */
export const TASK_STATUS_CONFIG: Record<TaskStatus, {
  label:    string;
  badgeCls: string;
}> = {
  pending:     { label: "Pending",     badgeCls: "badge badge-pending"  },
  in_progress: { label: "In Progress", badgeCls: "badge badge-progress" },
  done:        { label: "Selesai",     badgeCls: "badge badge-done"     },
  overdue:     { label: "Overdue",     badgeCls: "badge badge-overdue"  },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  cls:   string;
}> = {
  high:   { label: "Tinggi", cls: "bg-red-100 text-red-700"     },
  medium: { label: "Sedang", cls: "bg-amber-100 text-amber-700" },
  low:    { label: "Rendah", cls: "bg-slate-100 text-slate-600" },
};
