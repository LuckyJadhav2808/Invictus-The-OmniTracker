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
}

export function TaskBattleQueue({
  tasks,
  onCompleteTask,
  selectedDate,
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
    <div id="tasks-section" className="bg-white border-2 border-[#161514] p-5 rounded-xl shadow-[3px_3px_0px_#161514] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#161514]/15 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-[#FFB800] border-2 border-[#161514] flex items-center justify-center text-[#161514]">
            <Kanban className="size-3.5 stroke-[2.5]" />
          </div>
          <h2 className="font-heading font-black text-base text-[#161514] tracking-tight">
            Priority Battle Queue
          </h2>
        </div>

        <Link
          href="/tasks"
          className="text-xs font-heading font-black text-[#161514] hover:underline flex items-center gap-1"
        >
          <span>All Tasks</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Task Items */}
      {priorityTasks.length === 0 ? (
        <div className="p-6 text-center space-y-2 bg-[#FBF9F5] border-2 border-dashed border-[#161514]/25 rounded-xl">
          <div className="size-9 rounded-full bg-[#03D26F]/20 border-2 border-[#161514] flex items-center justify-center mx-auto text-[#03D26F]">
            <ShieldCheck className="size-5 text-[#161514]" />
          </div>
          <p className="font-heading font-black text-sm text-[#161514]">
            Battlefield Clear!
          </p>
          <p className="text-xs text-[#161514]/65">
            No urgent or high-priority targets pending for today.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {priorityTasks.map((task) => {
            const completedSubtasksCount = task.subtasks?.filter((s) => s.completed).length || 0;
            const totalSubtasksCount = task.subtasks?.length || 0;

            return (
              <div
                key={task.id}
                className="p-3 bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_#161514] flex items-center justify-between gap-3 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Ergonomic 44px touch checkbox */}
                  <button
                    onClick={() => onCompleteTask(task.id, task.title)}
                    className="size-7 rounded-md border-2 border-[#161514] bg-white hover:bg-emerald-100 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
                    aria-label={`Complete task: ${task.title}`}
                  >
                    <Check className="size-4 stroke-[3] opacity-0 hover:opacity-100 transition-opacity" />
                  </button>

                  <div className="min-w-0">
                    <p className="font-heading font-black text-xs text-[#161514] truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          'text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded border border-[#161514]',
                          task.priority === 'p1'
                            ? 'bg-[#FF4343] text-white'
                            : 'bg-[#FFB800] text-[#161514]'
                        )}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                      {task.projectTag && (
                        <span className="text-[10px] text-[#161514]/65 font-bold">
                          #{task.projectTag}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {totalSubtasksCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-[#F1EFEA] border border-[#161514]/30 px-1.5 py-0.5 rounded shrink-0">
                    {completedSubtasksCount}/{totalSubtasksCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Navigation Link */}
      <div className="pt-2 border-t border-[#161514]/15 flex items-center justify-between text-xs">
        <span className="text-[#161514]/60 font-medium">Kanban board & milestone tracking</span>
        <Link
          href="/tasks"
          className="font-heading font-black text-[#161514] hover:underline flex items-center gap-1"
        >
          <span>Tasks Hub</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
