export type TimeBudgetUnit = "hours" | "days";

export type PlanRequest = {
  places: import("./place").Place[];
  timeBudget: { unit: TimeBudgetUnit; value: number };
  start?: string; // ISO
  preferences?: string[];
};

export type ItineraryItem = {
  start: string; // ISO
  end: string; // ISO
  placeId?: string;
  title: string;
  details?: string;
};

export type PlanResponse = {
  summary: string;
  items: ItineraryItem[];
};


