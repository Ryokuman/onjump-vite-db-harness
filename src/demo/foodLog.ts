export type FoodLogInput = {
  name: unknown;
  calories: unknown;
  mealType: unknown;
  mealTime: unknown;
};

export type NormalizedFoodLogInput = {
  name: string;
  calories: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  mealTime: string;
};

export function normalizeFoodLogInput(input: FoodLogInput): NormalizedFoodLogInput {
  const name = String(input.name ?? "").trim();
  const calories = Number(input.calories);
  const mealType = String(input.mealType ?? "");
  const mealTime = String(input.mealTime ?? "");

  if (!name) {
    throw new Error("name is required");
  }
  if (!Number.isInteger(calories) || calories <= 0) {
    throw new Error("calories must be a positive integer");
  }
  if (!["breakfast", "lunch", "dinner", "snack"].includes(mealType)) {
    throw new Error("mealType is invalid");
  }
  if (!/^\d{2}:\d{2}$/.test(mealTime)) {
    throw new Error("mealTime must be HH:mm");
  }

  return {
    name,
    calories,
    mealType: mealType as NormalizedFoodLogInput["mealType"],
    mealTime
  };
}
