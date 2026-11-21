"use client";

import { CheckSquare, RotateCcw, Trash2, CheckCircle2 } from "lucide-react";
import { SubpageLayout } from "@/components/shared/SubpageLayout";
import { NeobrutalistEmptyCard } from "@/components/shared/NeobrutalistEmptyCard";
import { useTasks, useUpdateTask, useDeleteTask } from "@/lib/queries/tasks";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { format } from "date-fns";

export default function TasksArchivePage() {
  const { data: tasks = [] } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const completedTasks = tasks
    .filter((t) => t.status === "completed")
    .sort((a, b) => new Date(b.completedAt || b.createdAt || 0).getTime() - new Date(a.completedAt || a.createdAt || 0).getTime());

  const handleRestore = (id: string) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    updateTaskMutation.mutate({
      id,
      updates: { status: "todo", completedAt: undefined },
    });
    toast.success("Task restored to active list!");
  };

  const handleDelete = (id: string) => {
    soundFX.playPop();
    deleteTaskMutation.mutate(id);
    toast.info("Task permanently removed from archive.");
  };

  return (
    <SubpageLayout
      appBarTitle="Archive"
      backHref="/tasks"
      backLabel="Tasks"
      title="Completed History & Archive"
      badge="Task Vault"
      badgeColorClass="bg-emerald-400/20 text-emerald-700 dark:text-[#03D26F] border-emerald-500/30"
      subtitle="Review finished accomplishments, restore archived tasks or purge records"
      icon={CheckSquare}
      rightAction={
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border font-mono text-xs font-bold text-foreground">
          <CheckCircle2 className="size-3.5 text-[#03D26F]" />
          <span>{completedTasks.length} DONE</span>
        </div>
      }
    >
      {/* Archive Stream */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
            Finished Accomplishments ({completedTasks.length})
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            Ordered latest first
          </span>
        </div>

        {completedTasks.length === 0 ? (
          <NeobrutalistEmptyCard
            icon={CheckSquare}
            title="Archive is empty"
            description="Completed tasks from your checklist will automatically land here."
            actionHref="/tasks"
            actionLabel="Return to Tasks"
          />
        ) : (
          <div className="divide-y divide-border">
            {completedTasks.map((t) => (
              <div
                key={t.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-xl transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-5 rounded-md bg-[#03D26F]/20 text-[#03D26F] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-foreground line-through opacity-85 truncate">
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.projectTag && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase">
                          {t.projectTag}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {t.completedAt ? format(new Date(t.completedAt), "MMM d, h:mm a") : "Completed"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestore(t.id)}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                    title="Restore to active checklist"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer transition-all"
                    title="Permanently delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SubpageLayout>
  );
}
