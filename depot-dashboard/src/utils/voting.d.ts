export const normalizeVotingDurationDays: (value: number | string) => number;
export const calculateVotingEndDate: (
  startedAt: string,
  votingDurationDays: number | string,
) => string;
