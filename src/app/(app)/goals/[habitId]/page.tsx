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
          <Link
            href="/goals"
            className="text-[#161514] bg-[#FAF8F5] hover:bg-white flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" /> Back
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditOpen(true)}
              className="rounded-xl border-2 border-[#161514] text-[#161514] bg-[#CEF431] hover:bg-[#bce023] font-black text-xs px-3 py-1.5 shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="rounded-xl border-2 border-[#161514] text-rose-800 bg-rose-100 hover:bg-rose-200 font-black text-xs px-3 py-1.5 shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[#161514]" style={{ fontFamily: "var(--font-heading)" }}>
              {habit.title}
            </h1>
            <p className="text-xs text-[#161514]/70 font-black uppercase tracking-wider">
              Frequency: <span className="text-[#161514] bg-amber-300 px-2 py-0.5 rounded-md border border-[#161514]">{habit.frequency.type}</span>
            </p>
          </div>

          <hr className="border-2 border-[#161514]/10" />

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FAF8F5] rounded-xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
              <Flame className="h-6 w-6 text-rose-600 fill-rose-600" />
              <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider mt-1" style={{ fontFamily: "var(--font-heading)" }}>Current Streak</span>
              <span className="text-2xl font-black text-[#161514] mt-0.5" style={{ fontFamily: "var(--font-heading)" }}>{streak?.currentStreak || 0} days</span>
            </div>

            <div className="bg-[#FAF8F5] rounded-xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
              <Award className="h-6 w-6 text-amber-500" />
              <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider mt-1" style={{ fontFamily: "var(--font-heading)" }}>Longest Streak</span>
              <span className="text-2xl font-black text-[#161514] mt-0.5" style={{ fontFamily: "var(--font-heading)" }}>{streak?.longestStreak || 0} days</span>
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
