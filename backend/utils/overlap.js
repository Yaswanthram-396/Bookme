import { timeToMinutes } from "./time.js";

export const timeOverlap = (firstStart, firstEnd, secondStart, secondEnd) => {
  const firstStartMinutes = timeToMinutes(firstStart);
  const firstEndMinutes = timeToMinutes(firstEnd);
  const secondStartMinutes = timeToMinutes(secondStart);
  const secondEndMinutes = timeToMinutes(secondEnd);
  return (
    firstStartMinutes < secondEndMinutes && secondStartMinutes < firstEndMinutes
  );
};
