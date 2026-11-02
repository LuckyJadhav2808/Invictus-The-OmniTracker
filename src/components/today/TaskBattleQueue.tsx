'use client';

import React from 'react';
import Link from 'next/link';
import { Kanban, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { type TaskItem } from '@/types';
import { cn } from '@/lib/utils';

interface TaskBattleQueueProps {
  tasks: TaskItem[];
  onCompleteTask: (taskId: string, title: string) => void;
  selectedDate: string;
  className?: string;
}

export function TaskBattleQueue({
  tasks,
  onCompleteTask,
  selectedDate,
  className,
}: TaskBattleQueueProps) {
  // Filter for pending high-priority or due-today tasks
  const priorityTasks = tasks
    .filter((t) => {
      if (t.status === 'completed') return false;
      if (t.dueDate === selectedDate) return true;
      if (t.priority === 'p1' || t.priority === 'p2') return true;
      return false;
    })
    .slice(0, 5);

  return (
    <div
      id="tasks-section"
      className={cn(
        "bg-white border border-[#E8E5DF] p-5 rounded-xl flex flex-col justify-between space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-[#F1EFEA] flex items-center justify-center text-[#161514]">
            <Kanban className="size-3.5 stroke-[1.5]" />
          </div>
          <h2 className="font-sans font-semibold text-[15px] text-[#161514] tracking-tight">
            Priority Tasks
          </h2>
        </div>

        <Link
          href="/tasks"
          className="text-xs font-medium text-[#6B6B6B] hover:text-[#161514] flex items-center gap-1 transition-colors"
        >
          <span>All Tasks</span>
          <ArrowRight className="size-3 stroke-[1.5]" />
        </Link>
      </div>

      {/* Task Items */}
      {priorityTasks.length === 0 ? (
        <div className="flex-1 p-6 text-center space-y-2 bg-[#FBF9F5] border border-dashed border-[#E8E5DF] rounded-xl flex flex-col items-center justify-center">
          <div className="size-8 rounded-full bg-[#DCFAE5] flex items-center justify-center mx-auto text-[#047857]">
            <ShieldCheck className="size-4 stroke-[1.5]" />
          </div>
          <p className="font-medium text-sm text-[#161514]">
            All priority tasks cleared
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-[220px] sm:max-h-[260px] space-y-1.5 pr-1 scrollbar-thin">
          {priorityTasks.map((task) => {
            const completedSubtasksCount = task.subtasks?.filter((s) => s.completed).length || 0;
            const totalSubtasksCount = task.subtasks?.length || 0;

            return (
              <div
                key={task.id}
                className="p-3 bg-white border border-[#E8E5DF] rounded-lg flex items-center justify-between gap-3 hover:bg-[#FBF9F5] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Completion Checkbox */}
                  <button
                    onClick={() => onCompleteTask(task.id, task.title)}
                    className="size-7 rounded-md border border-[#D1D5DB] bg-white hover:bg-[#DCFAE5] hover:border-[#03D26F] flex items-center justify-center shrink-0 cursor-pointer active:translate-y-px transition-colors group"
                    aria-label={`Complete task: ${task.title}`}
                  >
                    <Check className="size-3.5 stroke-[2] opacity-0 group-hover:opacity-100 text-[#047857] transition-opacity" />
                  </button>

                  <div className="min-w-0">
                    <p className="font-medium text-xs text-[#161514] truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          'text-xs font-mono font-medium px-1.5 py-0.2 rounded',
                          task.priority === 'p1'
                            ? 'bg-[#FFEDEA] text-[#831C1E]'
                            : 'bg-[#FFFBEB] text-[#92400E]'
                        )}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                      {task.projectTag && (
                        <span className="text-xs font-mono text-[#6B6B6B]">
                          #{task.projectTag}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {totalSubtasksCount > 0 && (
                  <span className="text-xs font-mono text-[#6B6B6B] bg-[#F1EFEA] px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                    {completedSubtasksCount}/{totalSubtasksCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Navigation Link */}
      <div className="pt-2 border-t border-[#E8E5DF] flex items-center justify-between text-xs">
        <span className="text-[#6B6B6B]">Upcoming tasks & milestones</span>
        <Link
          href="/tasks"
          className="font-medium text-[#161514] hover:underline flex items-center gap-1"
        >
          <span>Tasks Hub</span>
          <ArrowRight className="size-3.5 stroke-[1.5]" />
        </Link>
      </div>
    </div>
  );
}
