"""
Data layer for Jira issues.
Starts with static data from a prior MCP fetch; swap in live_fetch() once
you have an API token.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import requests

JIRA_BASE_URL = "https://redhat.atlassian.net"
CLOUD_ID = "2b9e35e3-6bd3-4cec-b838-f4249ee02432"


@dataclass
class JiraIssue:
    key: str
    summary: str
    issue_type: str
    status: str
    status_category: str
    priority: str
    project: str
    created: str
    updated: str


STATIC_ISSUES: list[JiraIssue] = [
    JiraIssue("CPUX-6179", "[explore] Attempt to assemble dashboards/charts for UX interaction behavior questions",
              "Story", "New", "To Do", "Medium", "Core Platforms UX", "2026-03-17", "2026-03-18"),
    JiraIssue("CPUX-6177", "Measuring UX on HCC with Amplitude",
              "Epic", "New", "To Do", "High", "Core Platforms UX", "2026-03-17", "2026-03-18"),
    JiraIssue("CPUX-6178", "[Explore] events in amplitude: what do they measure?",
              "Story", "To Do", "To Do", "Medium", "Core Platforms UX", "2026-03-17", "2026-03-18"),
    JiraIssue("CPUX-6173", "move to correct epic: Simplify marketplace subs to HCC connection experience",
              "Story", "In Progress", "In Progress", "Medium", "Core Platforms UX", "2026-03-12", "2026-03-12"),
    JiraIssue("CPUX-6172", "move to correct epic: Custom (AI gen) dashboard widgets",
              "Story", "In Progress", "In Progress", "Medium", "Core Platforms UX", "2026-03-12", "2026-03-12"),
    JiraIssue("CPUX-6171", 'move to correct epic: AuthZ "opt in" onboarding consult',
              "Story", "In Progress", "In Progress", "Medium", "Core Platforms UX", "2026-03-12", "2026-03-12"),
    JiraIssue("CPUX-5956", "[UXD EPIC] UXD-Driven in Q1",
              "Epic", "In Progress", "In Progress", "Medium", "Core Platforms UX", "2026-01-12", "2026-03-12"),
    JiraIssue("CPUX-6140", "[UXD explore] AI team enablement -- highlights generator",
              "Story", "In Progress", "In Progress", "Medium", "Core Platforms UX", "2026-03-04", "2026-03-12"),
    JiraIssue("CPUX-5443", "[UXD EPIC] IAM org management (IAM bundle, cross-org sharing, org-wide access)",
              "Epic", "Closed", "Done", "Medium", "Core Platforms UX", "2025-01-15", "2026-03-11"),
    JiraIssue("CPUX-5896", "[UX discovery] GitHub: AI tasks for team efficiency/innovation",
              "Story", "To Do", "To Do", "Medium", "Core Platforms UX", "2025-11-24", "2026-03-10"),
    JiraIssue("CPUX-5894", "[UX exploration] Amplitude: measuring user experience",
              "Story", "In Progress", "In Progress", "Medium", "Core Platforms UX", "2025-11-21", "2026-03-10"),
]


def get_issues(api_token: Optional[str] = None, email: Optional[str] = None) -> list[JiraIssue]:
    """Return issues -- live from Jira when credentials are provided, static otherwise."""
    if api_token and email:
        return _live_fetch(api_token, email)
    return list(STATIC_ISSUES)


def _live_fetch(api_token: str, email: str) -> list[JiraIssue]:
    """Fetch current user's issues from the Jira REST API."""
    url = (
        f"https://api.atlassian.com/ex/jira/{CLOUD_ID}"
        f"/rest/api/3/search"
    )
    params = {
        "jql": "assignee = currentUser() ORDER BY updated DESC",
        "maxResults": 50,
        "fields": "summary,status,issuetype,priority,project,created,updated",
    }
    resp = requests.get(url, params=params, auth=(email, api_token), timeout=15)
    resp.raise_for_status()
    data = resp.json()

    results: list[JiraIssue] = []
    for raw in data.get("issues", []):
        f = raw["fields"]
        results.append(JiraIssue(
            key=raw["key"],
            summary=f["summary"],
            issue_type=f["issuetype"]["name"],
            status=f["status"]["name"],
            status_category=f["status"]["statusCategory"]["name"],
            priority=f["priority"]["name"],
            project=f["project"]["name"],
            created=f["created"][:10],
            updated=f["updated"][:10],
        ))
    return results


def browse_url(key: str) -> str:
    return f"{JIRA_BASE_URL}/browse/{key}"
