"""
Jira Dashboard – CustomTkinter desktop GUI.
Reads static issue data on startup; pass --email / --token CLI flags for live refresh.
"""

from __future__ import annotations

import argparse
import threading
import webbrowser
from collections import Counter

import customtkinter as ctk

from jira_data import JiraIssue, browse_url, get_issues

# ── Theme ────────────────────────────────────────────────────────────────────
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

COLORS = {
    "To Do": "#3B82F6",
    "In Progress": "#F59E0B",
    "Done": "#22C55E",
    "High": "#EF4444",
    "Medium": "#F59E0B",
    "Low": "#22C55E",
    "Epic": "#A855F7",
    "Story": "#3B82F6",
    "Bug": "#EF4444",
    "Task": "#06B6D4",
    "card_bg": "#1E293B",
    "header_bg": "#0F172A",
    "row_alt": "#1E293B",
    "link": "#60A5FA",
}


# ── Helpers ──────────────────────────────────────────────────────────────────
def _count_by(issues: list[JiraIssue], attr: str) -> Counter:
    return Counter(getattr(i, attr) for i in issues)


class StatCard(ctk.CTkFrame):
    """Big-number card for a single metric."""

    def __init__(self, master, title: str, value: int, accent: str, subtitle: str = "", **kw):
        super().__init__(master, corner_radius=12, fg_color=COLORS["card_bg"], **kw)
        self.grid_columnconfigure(0, weight=1)

        lbl_title = ctk.CTkLabel(self, text=title, font=("", 13), text_color="#94A3B8")
        lbl_title.grid(row=0, column=0, padx=16, pady=(14, 0), sticky="w")

        lbl_value = ctk.CTkLabel(self, text=str(value), font=("", 36, "bold"), text_color=accent)
        lbl_value.grid(row=1, column=0, padx=16, pady=(2, 0), sticky="w")

        if subtitle:
            lbl_sub = ctk.CTkLabel(self, text=subtitle, font=("", 11), text_color="#64748B")
            lbl_sub.grid(row=2, column=0, padx=16, pady=(0, 14), sticky="w")

    def update_value(self, value: int):
        for child in self.winfo_children():
            if isinstance(child, ctk.CTkLabel) and child.cget("font") == ("", 36, "bold"):
                child.configure(text=str(value))
                break


class BreakdownCard(ctk.CTkFrame):
    """Card listing category → count rows."""

    def __init__(self, master, title: str, data: dict[str, int], color_map: dict[str, str], **kw):
        super().__init__(master, corner_radius=12, fg_color=COLORS["card_bg"], **kw)
        self.grid_columnconfigure(0, weight=1)

        lbl = ctk.CTkLabel(self, text=title, font=("", 14, "bold"), text_color="#E2E8F0")
        lbl.grid(row=0, column=0, columnspan=2, padx=16, pady=(14, 8), sticky="w")

        for idx, (cat, count) in enumerate(data.items(), start=1):
            color = color_map.get(cat, "#94A3B8")
            dot = ctk.CTkLabel(self, text="●", font=("", 14), text_color=color, width=20)
            dot.grid(row=idx, column=0, padx=(16, 0), pady=2, sticky="w")

            row_frame = ctk.CTkFrame(self, fg_color="transparent")
            row_frame.grid(row=idx, column=0, columnspan=2, padx=(36, 16), pady=2, sticky="ew")
            row_frame.grid_columnconfigure(0, weight=1)

            ctk.CTkLabel(row_frame, text=cat, font=("", 13), text_color="#CBD5E1").grid(
                row=0, column=0, sticky="w"
            )
            ctk.CTkLabel(row_frame, text=str(count), font=("", 13, "bold"), text_color="#F1F5F9").grid(
                row=0, column=1, sticky="e"
            )

        # bottom padding
        spacer = ctk.CTkLabel(self, text="", height=8)
        spacer.grid(row=len(data) + 1, column=0)


class IssueTable(ctk.CTkScrollableFrame):
    """Scrollable table of Jira issues."""

    COLUMNS = ("Key", "Summary", "Type", "Status", "Priority", "Updated")
    COL_WIDTHS = (100, 420, 70, 100, 80, 90)

    def __init__(self, master, issues: list[JiraIssue], **kw):
        super().__init__(master, corner_radius=12, fg_color=COLORS["card_bg"], **kw)
        self.grid_columnconfigure(1, weight=1)
        self._build_header()
        self._issues = issues
        self._build_rows(issues)

    def _build_header(self):
        hdr = ctk.CTkFrame(self, fg_color=COLORS["header_bg"], corner_radius=0, height=34)
        hdr.grid(row=0, column=0, columnspan=len(self.COLUMNS), sticky="ew", padx=0, pady=(0, 4))
        for col_idx, (name, w) in enumerate(zip(self.COLUMNS, self.COL_WIDTHS)):
            lbl = ctk.CTkLabel(hdr, text=name, font=("", 12, "bold"), text_color="#94A3B8", width=w, anchor="w")
            lbl.grid(row=0, column=col_idx, padx=(12 if col_idx == 0 else 4, 4), pady=6)
        hdr.grid_columnconfigure(1, weight=1)

    def _build_rows(self, issues: list[JiraIssue]):
        for row_idx, issue in enumerate(issues, start=1):
            bg = COLORS["row_alt"] if row_idx % 2 == 0 else "transparent"
            row_frame = ctk.CTkFrame(self, fg_color=bg, corner_radius=0, height=32)
            row_frame.grid(row=row_idx, column=0, columnspan=len(self.COLUMNS), sticky="ew", padx=0, pady=0)
            row_frame.grid_columnconfigure(1, weight=1)

            # Key (clickable link)
            key_lbl = ctk.CTkLabel(
                row_frame, text=issue.key, font=("", 12, "bold"),
                text_color=COLORS["link"], width=self.COL_WIDTHS[0], anchor="w", cursor="hand2",
            )
            key_lbl.grid(row=0, column=0, padx=(12, 4), pady=4)
            key_lbl.bind("<Button-1>", lambda e, k=issue.key: webbrowser.open(browse_url(k)))

            # Summary
            ctk.CTkLabel(
                row_frame, text=issue.summary, font=("", 12),
                text_color="#E2E8F0", width=self.COL_WIDTHS[1], anchor="w", wraplength=400,
            ).grid(row=0, column=1, padx=4, pady=4, sticky="w")

            # Type
            ctk.CTkLabel(
                row_frame, text=issue.issue_type, font=("", 11),
                text_color=COLORS.get(issue.issue_type, "#94A3B8"), width=self.COL_WIDTHS[2], anchor="w",
            ).grid(row=0, column=2, padx=4, pady=4)

            # Status
            ctk.CTkLabel(
                row_frame, text=issue.status, font=("", 11),
                text_color=COLORS.get(issue.status_category, "#94A3B8"), width=self.COL_WIDTHS[3], anchor="w",
            ).grid(row=0, column=3, padx=4, pady=4)

            # Priority
            ctk.CTkLabel(
                row_frame, text=issue.priority, font=("", 11),
                text_color=COLORS.get(issue.priority, "#94A3B8"), width=self.COL_WIDTHS[4], anchor="w",
            ).grid(row=0, column=4, padx=4, pady=4)

            # Updated
            ctk.CTkLabel(
                row_frame, text=issue.updated, font=("", 11),
                text_color="#94A3B8", width=self.COL_WIDTHS[5], anchor="w",
            ).grid(row=0, column=5, padx=4, pady=4)

    def refresh(self, issues: list[JiraIssue]):
        for child in self.winfo_children():
            child.destroy()
        self._build_header()
        self._build_rows(issues)


# ── Main App ─────────────────────────────────────────────────────────────────
class JiraDashboard(ctk.CTk):
    def __init__(self, email: str | None = None, token: str | None = None):
        super().__init__()
        self.title("Jira Dashboard — Core Platforms UX")
        self.geometry("1100x780")
        self.minsize(900, 600)
        self._email = email
        self._token = token

        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(3, weight=1)

        self._issues: list[JiraIssue] = get_issues(token, email)
        self._build_ui()

    # ── layout ───────────────────────────────────────────────────────────
    def _build_ui(self):
        self._build_title_bar()
        self._build_stat_cards()
        self._build_breakdown_row()
        self._build_table()

    def _build_title_bar(self):
        bar = ctk.CTkFrame(self, fg_color="transparent")
        bar.grid(row=0, column=0, sticky="ew", padx=24, pady=(20, 4))
        bar.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            bar, text="Jira Dashboard", font=("", 24, "bold"), text_color="#F1F5F9",
        ).grid(row=0, column=0, sticky="w")

        ctk.CTkLabel(
            bar, text="CPUX · Kendra Marchant", font=("", 13), text_color="#64748B",
        ).grid(row=1, column=0, sticky="w", pady=(0, 2))

        mode = "Live" if self._token else "Static"
        mode_color = "#22C55E" if self._token else "#94A3B8"

        right = ctk.CTkFrame(bar, fg_color="transparent")
        right.grid(row=0, column=1, rowspan=2, sticky="e")

        ctk.CTkLabel(right, text=f"● {mode} data", font=("", 11), text_color=mode_color).grid(
            row=0, column=0, padx=(0, 12)
        )

        self._refresh_btn = ctk.CTkButton(
            right, text="↻  Refresh", width=100, height=32,
            font=("", 13), command=self._on_refresh,
        )
        self._refresh_btn.grid(row=0, column=1)

    def _build_stat_cards(self):
        counts = _count_by(self._issues, "status_category")
        frame = ctk.CTkFrame(self, fg_color="transparent")
        frame.grid(row=1, column=0, sticky="ew", padx=24, pady=(12, 0))
        frame.grid_columnconfigure((0, 1, 2), weight=1)

        self._card_todo = StatCard(frame, "To Do", counts.get("To Do", 0), COLORS["To Do"], "issues awaiting work")
        self._card_todo.grid(row=0, column=0, padx=(0, 8), sticky="ew")

        self._card_wip = StatCard(frame, "In Progress", counts.get("In Progress", 0), COLORS["In Progress"], "issues being worked on")
        self._card_wip.grid(row=0, column=1, padx=8, sticky="ew")

        self._card_done = StatCard(frame, "Done", counts.get("Done", 0), COLORS["Done"], "issues completed")
        self._card_done.grid(row=0, column=2, padx=(8, 0), sticky="ew")

    def _build_breakdown_row(self):
        frame = ctk.CTkFrame(self, fg_color="transparent")
        frame.grid(row=2, column=0, sticky="ew", padx=24, pady=(12, 0))
        frame.grid_columnconfigure((0, 1), weight=1)

        type_counts = _count_by(self._issues, "issue_type")
        ordered_types = {t: type_counts.get(t, 0) for t in ("Epic", "Story", "Bug", "Task") if type_counts.get(t, 0)}
        self._type_card = BreakdownCard(frame, "Issue Types", ordered_types, COLORS)
        self._type_card.grid(row=0, column=0, padx=(0, 8), sticky="nsew")

        pri_counts = _count_by(self._issues, "priority")
        ordered_pri = {p: pri_counts.get(p, 0) for p in ("High", "Medium", "Low") if pri_counts.get(p, 0)}
        self._pri_card = BreakdownCard(frame, "Priority", ordered_pri, COLORS)
        self._pri_card.grid(row=0, column=1, padx=(8, 0), sticky="nsew")

    def _build_table(self):
        lbl_frame = ctk.CTkFrame(self, fg_color="transparent")
        lbl_frame.grid(row=3, column=0, sticky="nsew", padx=24, pady=(12, 20))
        lbl_frame.grid_columnconfigure(0, weight=1)
        lbl_frame.grid_rowconfigure(1, weight=1)

        header = ctk.CTkFrame(lbl_frame, fg_color="transparent")
        header.grid(row=0, column=0, sticky="ew")
        header.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(header, text="All Issues", font=("", 16, "bold"), text_color="#E2E8F0").grid(
            row=0, column=0, sticky="w"
        )
        ctk.CTkLabel(header, text=f"{len(self._issues)} total", font=("", 12), text_color="#64748B").grid(
            row=0, column=1, sticky="e"
        )

        self._table = IssueTable(lbl_frame, self._issues)
        self._table.grid(row=1, column=0, sticky="nsew", pady=(8, 0))

    # ── actions ──────────────────────────────────────────────────────────
    def _on_refresh(self):
        self._refresh_btn.configure(text="Refreshing…", state="disabled")

        def _do():
            issues = get_issues(self._token, self._email)
            self.after(0, lambda: self._apply_refresh(issues))

        threading.Thread(target=_do, daemon=True).start()

    def _apply_refresh(self, issues: list[JiraIssue]):
        self._issues = issues

        counts = _count_by(issues, "status_category")
        self._card_todo.update_value(counts.get("To Do", 0))
        self._card_wip.update_value(counts.get("In Progress", 0))
        self._card_done.update_value(counts.get("Done", 0))

        self._table.refresh(issues)
        self._refresh_btn.configure(text="↻  Refresh", state="normal")


# ── Entry point ──────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Jira Dashboard")
    parser.add_argument("--email", help="Atlassian account email for live data")
    parser.add_argument("--token", help="Atlassian API token for live data")
    args = parser.parse_args()

    app = JiraDashboard(email=args.email, token=args.token)
    app.mainloop()


if __name__ == "__main__":
    main()
