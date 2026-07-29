"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useHabits, useUpdateHabit, useDeleteHabit, useStreaks } from "@/lib/queries/goals";
import { Button } from "@/components/ui/button";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { NewHabitForm } from "@/components/goals/NewHabitForm";
import { ArrowLeft, Trash2, Edit3, Flame, Award } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function HabitDetailPage({
  params,
}: {
  params: Promise<{ habitId: string }>;
}) {
  const { habitId } = use(params);
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: habits = [] } = useHabits();
  const { data: streaks = {} } = useStreaks();

  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();

  const habit = habits.find((h) => h.id === habitId);
  const streak = streaks[habitId];

  if (!habit) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-navy-600 font-bold">Habit not found</p>
          <Link href="/goals">
            <Button className="rounded-full bg-navy-900 text-white">Back to Goals</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdateHabit = async (data: any) => {
    try {
      await updateHabitMutation.mutateAsync({
        ...data,
        id: habitId,
      });
      toast.success("Habit updated! ✨");
      setIsEditOpen(false);
    } catch {
      toast.error("Failed to update habit");
    }
  };

  const handleDeleteHabit = async () => {
    try {
      await deleteHabitMutation.mutateAsync(habitId);
      toast.success("Habit deleted");
      router.push("/goals");
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/goals" className="text-navy-600 hover:text-navy-900 flex items-center gap-1.5 text-sm font-bold">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-full border-input text-navy-900 bg-white cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
             <Button
              onClick={() => setIsDeleteOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-full border-danger/30 text-danger bg-white hover:bg-danger/5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-6">
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-navy-900" style={{ fontFamily: "var(--font-heading)" }}>
              {habit.title}
            </h1>
            <p className="text-xs text-navy-600 font-semibold uppercase tracking-wider">
              Frequency: {habit.frequency.type}
            </p>
          </div>

          <hr className="border-border" />

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cream-bg/20 rounded-[var(--radius-md)] p-4 flex flex-col items-center justify-center text-center">
              <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
              <span className="text-[10px] font-bold text-navy-600 uppercase tracking-wider mt-1">Current Streak</span>
              <span className="text-2xl font-extrabold text-navy-900 mt-0.5">{streak?.currentStreak || 0} days</span>
            </div>

            <div className="bg-cream-bg/20 rounded-[var(--radius-md)] p-4 flex flex-col items-center justify-center text-center">
              <Award className="h-6 w-6 text-amber-500" />
              <span className="text-[10px] font-bold text-navy-600 uppercase tracking-wider mt-1">Longest Streak</span>
              <span className="text-2xl font-extrabold text-navy-900 mt-0.5">{streak?.longestStreak || 0} days</span>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveFormContainer
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Habit"
        description="Update your settings or tracking options"
      >
        <NewHabitForm
          initialValues={habit}
          onSubmit={handleUpdateHabit}
          loading={updateHabitMutation.isPending}
        />
      </ResponsiveFormContainer>

      <DeleteConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteHabit}
        title="Delete Habit"
        description="Are you sure you want to delete this habit? This cannot be undone."
      />
    </div>
  );
}
