export type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type GitHubActivity = {
  username: string;
  through: string;
  days: ContributionDay[];
};
