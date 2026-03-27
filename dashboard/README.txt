Consolepuffs Jira Board — Changelog
====================================

React + Vite + PatternFly 6 dashboard for managing HCC sprint stories via the Jira REST API.

Last updated: March 27, 2026

────────────────────────────────────────

NEW FUNCTIONALITY & IMPROVEMENTS

Sprint & Board Management
- Sprint-based table view with collapsible sections for active, future, and backlog sprints
- Drag-and-drop stories between sprints and backlog, with sprint tabs as drop zones — includes visual drop-zone indicator (dashed border + glow) on hover
- Drag-and-drop now calls the Jira API to actually move stories (previously only updated the UI)
- Exclude Epics from sprint and backlog tables — only stories appear; epics show in the Active Epics card
- Create story buttons on each sprint tab and the backlog, pre-filling reporter and component
- Default description template on new and cloned stories with formatted "What" and "Definition of Done" sections (headings + bullet list), sent to Jira as proper ADF

Issue Detail Panel
- Editable Jira detail panel opens on click — fields include Summary (editable title), Description, Status, Assignee, Reporter, Activity Type, Story Points, Due Date, Epic, and Sprint
- Save button validation — disabled until all required fields are filled and a change has been made; tooltip explains what's missing
- Due Date marked as optional with "(Optional)" label
- Click outside the panel to close it
- Sticky Save/Cancel footer that never scrolls off
- Panel resets state properly when switching between issues (key prop added)
- Description preserves Jira formatting — headings, bold, italic, bullet/numbered lists, links, code blocks, tables, and more rendered via ADF-to-HTML conversion inside PatternFly's Content component
- Click-to-edit description — toggles between rich HTML view and plain text editor
- Description is only sent to Jira when actually edited — prevents accidental corruption of formatted descriptions
- Prepend [Activity Type] to new issue titles — e.g., selecting "Explore" and typing "Do stuff" creates "[Explore] Do stuff"
- Sprint dropdown in the panel to assign issues to available sprints or backlog (hidden when creating from backlog)
- Epic dropdown patches both epicName and epicKey so the parent field is correctly updated in Jira's unified parent model

Comments
- Scrollable comments section with input field for new comments
- Bullet list support in comments — toolbar button inserts "- " markers, Enter auto-continues bullets, and bullets are sent to Jira as proper ADF bulletList nodes
- Comments render rich formatting (headings, bold, links, lists, etc.)
- "Latest Comment" column on every story row showing the date and first 112 characters of the newest comment

Kebab Menu & Clone
- Kebab menu on each story row with "Modify" and "Clone" options
- Clone opens panel as "New story in this sprint" with all original properties pre-filled in red, editable fields, and a toast on creation

UI & Layout
- Board-wide search — instant client-side search across all sprints, backlog, and active epics by key, summary, assignee, reporter, status, epic, activity type, or sprint name; auto-expands collapsed sections when results are found
- Consolepuffs Jira Board masthead with logo image and user email displayed below the title
- "View board in JIRA" link in the dashboard header
- Client-side filtering and sorting on Owner, Status, and Epic columns with filter/sort icons
- Active Epics card (collapsible) listing non-closed epics with owner and size in table format
- Due date urgency icons — red exclamation for overdue, yellow warning for within 2 days
- Assignee avatar photos on each story row
- Sprint dates shown under each tab title
- Toast notifications for success/failure of API operations, auto-dismiss after 5 seconds
- Column titles never truncated — explicit min-widths and nowrap on headers
- Increased spacing between sprint tabs

Infrastructure
- Custom Node.js HTTPS proxy in vite.config.ts to bypass CORS/XSRF issues with the Jira API during development
- Configurable proxy URL via VITE_PROXY_URL environment variable
- GitHub Actions workflow for GitHub Pages deployment
- Vercel serverless proxy option for production API access

────────────────────────────────────────

BUG FIXES

- Fixed description corruption on save — the app was stripping HTML tags from the ADF-converted description, concatenating all block elements into a single paragraph. Now tracks whether the user actually edited the description and only sends it if modified.
- Fixed activity type prefix corrupting descriptions — handleSave was prepending [Activity Type] to the HTML description on every save, triggering destructive HTML-to-plaintext conversion. Reverted to only prepend on new issue titles.
- Fixed comments displaying raw HTML tags — comments were going through adfToHtml but rendered as plain text. Switched to dangerouslySetInnerHTML inside PatternFly Content component.
- Fixed PatternFly CSS stripping description formatting — headings rendered as plain bold text, lists lost bullets. Added CSS overrides for heading sizes, list styles, bold, italic, code, links, and margin removal.
- Fixed epic not updating in Jira — the panel's epic dropdown only patched epicName but not epicKey, so updateIssue never detected a change. Now patches both fields and uses the unified parent field.
- Fixed drag-and-drop not persisting to Jira — handleDragEnd only updated local React state. Now calls moveToSprint API on every drop, with toast confirmation and error handling with data reload.
- Fixed XSRF 403 errors — replaced Vite's built-in proxy with a custom Node.js https middleware that explicitly constructs server-side requests with only necessary headers.
- Fixed 400 error on issue creation (invalid priority) — stopped sending the priority field during creation; Jira assigns its project default.
- Fixed new stories appearing in backlog instead of sprint — rewrote moveToSprint to update customfield_10020 (Sprint field) via PUT instead of the Agile API endpoint.
- Fixed assignee list including members outside the team — hardcoded the HCC team member list.
- Fixed Save button tooltip not appearing on disabled button — wrapped the disabled button in a span to capture hover events.
- Fixed column title truncation — removed tableLayout fixed, added whiteSpace nowrap and explicit minWidth values to narrow columns.
- Fixed missing padding between column headers — added CSS override for PatternFly's padding-inline-start/padding-inline-end on th and td elements.
- Fixed Due Date column never expanding — set width 8% on Story Points and Due Date headers for proportional scaling.
- Fixed panel state not resetting between issues — added key prop to IssueDetailPanel so React remounts with fresh state.
- Fixed toast notifications requiring manual dismissal — reduced auto-dismiss from 15s to 5s.
