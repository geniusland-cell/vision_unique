export const normalizeVotingDurationDays = (value: number | string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 3;
  }
  return Math.min(parsed, 30);
};

export const calculateVotingEndDate = (
  startedAt: string,
  votingDurationDays: number | string,
): string => {
  const start = new Date(startedAt);
  const durationDays = normalizeVotingDurationDays(votingDurationDays);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  return end.toISOString();
};
