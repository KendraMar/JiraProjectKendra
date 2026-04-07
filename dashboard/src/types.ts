export interface JiraComment {
  author: string;
  authorAvatar: string;
  body: string;
  /** Display date in the issue panel */
  created: string;
  /** ISO 8601 from Jira when available (sprint highlight date filtering) */
  createdIso?: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
  issueType: string;
  status: string;
  statusCategory: string;
  priority: string;
  activityType: string;
  epicName: string;
  epicKey: string;
  storyPoints: number | null;
  sprintName: string;
  sprintState: "active" | "future" | "closed" | "";
  sprintStartDate: string;
  sprintEndDate: string;
  allSprints?: { name: string; state: string; startDate: string; endDate: string }[];
  assigneeName: string;
  assigneeAvatar: string;
  reporterName: string;
  description: string;
  dueDate: string;
  comments: JiraComment[];
}

export interface JiraEpic {
  key: string;
  summary: string;
  status: string;
}

export interface SprintGroup {
  name: string;
  state: "active" | "future" | "closed" | "backlog";
  startDate?: string;
  endDate?: string;
  issues: JiraIssue[];
}
