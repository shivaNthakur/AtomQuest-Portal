"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { UOM_LABELS } from "@/lib/utils";

const goalSchema = z.object({
  thrustAreaId: z.string().min(1, "Select a thrust area"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  uomType: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO_BASED"]),
  target: z.coerce.number().min(0),
  targetDate: z.string().optional(),
  weightage: z.coerce.number().min(10).max(100),
});

export type GoalFormData = z.infer<typeof goalSchema>;

type Props = {
  thrustAreas: { id: string; name: string }[];
  totalUsed: number;
  existingCount: number;
  onSubmit: (data: GoalFormData) => Promise<void>;
  initialData?: Partial<GoalFormData> & { weightage?: number };
};

export function GoalForm({
  thrustAreas,
  totalUsed,
  existingCount,
  onSubmit,
  initialData,
}: Props) {
  const MAX_GOALS = 8;
  const TOTAL_CAP = 100;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      thrustAreaId: initialData?.thrustAreaId || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      uomType: initialData?.uomType || "NUMERIC_MIN",
      target: initialData?.target ?? 0,
      targetDate: initialData?.targetDate || "",
      weightage: initialData?.weightage ?? 10,
    },
  });

  const weightage = parseFloat(String(watch("weightage"))) || 0;
  const uomType = watch("uomType");
  const currentUsed = initialData
    ? totalUsed - (initialData.weightage || 0) + weightage
    : totalUsed + weightage;
  const remaining = TOTAL_CAP - currentUsed;
  const isOver = currentUsed > TOTAL_CAP;
  const atMax = !initialData && existingCount >= MAX_GOALS;

  if (atMax) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        Maximum {MAX_GOALS} goals reached for this cycle.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await onSubmit(data);
        if (!initialData) reset();
      })}
      className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
    >
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Total weightage</span>
          <span className={isOver ? "text-red-600 font-semibold" : "text-slate-900"}>
            {currentUsed.toFixed(0)}% / 100%
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(currentUsed, 100)}%`,
              background: isOver ? "#ef4444" : currentUsed >= 90 ? "#f59e0b" : "#22c55e",
            }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {isOver
            ? `Over by ${(currentUsed - TOTAL_CAP).toFixed(0)}%`
            : `${remaining.toFixed(0)}% remaining · ${existingCount}/${MAX_GOALS} goals`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Thrust area *</label>
          <select
            {...register("thrustAreaId")}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {thrustAreas.map((ta) => (
              <option key={ta.id} value={ta.id}>
                {ta.name}
              </option>
            ))}
          </select>
          {errors.thrustAreaId && (
            <p className="text-xs text-red-600 mt-1">{errors.thrustAreaId.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">Goal title *</label>
          <input
            {...register("title")}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.title && (
            <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">UoM *</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {Object.entries(UOM_LABELS).map(([key, meta]) => (
              <label
                key={key}
                className={`cursor-pointer rounded-lg border p-3 text-sm ${
                  uomType === key
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  value={key}
                  {...register("uomType")}
                  className="sr-only"
                />
                <div className="font-medium">{meta.label}</div>
                <div className="text-xs text-slate-500">{meta.formula}</div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">
            {uomType === "TIMELINE" ? "Target date *" : "Target value *"}
          </label>
          {uomType === "TIMELINE" ? (
            <input
              type="date"
              {...register("targetDate")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          ) : uomType === "ZERO_BASED" ? (
            <input
              type="number"
              value={0}
              disabled
              className="mt-1 w-full rounded-lg border bg-slate-100 px-3 py-2 text-sm"
            />
          ) : (
            <input
              type="number"
              step="0.01"
              {...register("target")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Weightage (%) *</label>
          <input
            type="number"
            min={10}
            max={100}
            {...register("weightage")}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.weightage && (
            <p className="text-xs text-red-600 mt-1">{errors.weightage.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting || isOver || weightage < 10}>
        {isSubmitting ? "Saving…" : initialData ? "Update goal" : "Add goal"}
      </Button>
    </form>
  );
}
