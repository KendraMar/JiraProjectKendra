import type { JiraIssue, JiraEpic, JiraComment, SprintGroup } from "../types";

const CLOUD_ID = import.meta.env.VITE_JIRA_CLOUD_ID;
const PROJECT_KEY = import.meta.env.VITE_JIRA_PROJECT_KEY;
const COMPONENT = import.meta.env.VITE_JIRA_COMPONENT;
const EMAIL = import.meta.env.VITE_JIRA_EMAIL;
const API_TOKEN = import.meta.env.VITE_JIRA_API_TOKEN;
const BASE_URL = import.meta.env.VITE_JIRA_BASE_URL;
const PROXY_BASE = import.meta.env.VITE_PROXY_URL || "/jira-api";

// Jira custom field IDs for the CPUX project
const FIELD_SPRINT = "customfield_10020";
const FIELD_ACTIVITY_TYPE = "customfield_10464";
const FIELD_STORY_POINTS = "customfield_10016";

const FIELDS = [
  "summary",
  "status",
  "issuetype",
  "priority",
  "parent",
  "assignee",
  "reporter",
  "description",
  "duedate",
  "comment",
  FIELD_SPRINT,
  FIELD_ACTIVITY_TYPE,
  FIELD_STORY_POINTS,
];

// ── Static fallback data ──

const STATIC_ISSUES: JiraIssue[] = [
  { key: "CPUX-6171", summary: "move to correct epic: AuthZ \"opt in\" onboarding consult", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Consult", epicKey: "CPUX-5956", epicName: "[UXD EPIC] UXD-Driven in Q1", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "### What\n\nSupport team in understanding requirements and flows, reviewing mockups and providing feedback, creating presentations and presenting to stakeholders. \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "test", created: "Mar 20, 2026" }] },
  { key: "CPUX-6140", summary: "[UXD explore] AI team enablement -- highlights generator", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Explore", epicKey: "CPUX-5956", epicName: "[UXD EPIC] UXD-Driven in Q1", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "### What\n\nWork on creating a status/team highlights generator that connects to Jira to help automate appropriate highlights to different stakeholders.\n\n[Part of UXD awareness dashboard: see slide 6](https://docs.google.com/presentation/d/1KfQZpldK6ar29Mtdq7WD2IMLIXx0h4rnqJkWbRpdz6I/edit?usp=sharing)\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "test comment", created: "Mar 5, 2026" }, { author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "was able to connect my KendraUXDapp to Jira to retrieve/show My jiras in refinement, to do, progress. Next, I want to create a slide of highlights pointing at my jiras I've commented on in the last sprint. However, I can't get Cursor to show me the comments in the jira. I've proved I have access to the comments thru the API. Gemini thinks this has to do with how Jira is transitioning to something or other in Atlassian. I will most likely wait until Jira Cloud rolls out in a couple weeks before continuing further).", created: "Mar 5, 2026" }] },
  { key: "CPUX-5220", summary: "[UX Exploration] AuthZ onboarding -- new customer ", issueType: "Story", status: "Refinement", statusCategory: "To Do", priority: "Medium", activityType: "Explore", epicKey: "CPUX-5961", epicName: "[UXD EPIC] Q1  -- Create the AuthZ onboarding experience", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "Asumi and Kendra to work together (Asumi to drive) to evaluate the onboarding experiences we outlined in May, identify gaps and areas for improvement.\n\nFor net new customers, what documentation, gui components are in the flow for a net new customer (they started using Console dot after AuthZ came to console)? Day 0 vs. Day 1?\n\n ", dueDate: "", comments: [{ author: "Asumi Hasan", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/6369743b11c69c741844f221/d10a711c-3896-4dbd-9cc2-5c2ec4f803da/32", body: "Creating mocks based on initial exploration in this miro frame https://miro.com/app/board/uXjVLRRNQRo=/?moveToWidget=3458764604471830754&cot=14 ", created: "Apr 8, 2025" }, { author: "Asumi Hasan", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/6369743b11c69c741844f221/d10a711c-3896-4dbd-9cc2-5c2ec4f803da/32", body: "Next up in UXD AuthZ priorities. Target date and new requirements TBD.", created: "Nov 19, 2025" }] },
  { key: "CPUX-6169", summary: "Update AI-widget builder dashboard deck with research details", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Make", epicKey: "CPUX-6011", epicName: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nUpdate [AI-widget builder dashboard deck](https://docs.google.com/presentation/d/1YxPATIrf_110nOzoCDFHxTvWjt3BGKp0e1KUOqHgyPY/edit?slide=id.g3934aa74ce6_0_1438#slide=id.g3934aa74ce6_0_1438) with research and research opportunities:\n\n* Research have we dug up from the [Applied AI Notebook](https://notebooklm.google.com/notebook/a612f0a1-2e29-4718-80b8-8576ab3554da) - [relevant responses here](https://docs.google.com/document/d/1rCq3Tn7Xq8QKXBXHcFnGnYa8CM3NpnNpy-4u_sjI8AY/edit?tab=t.v43bnsu2pd8c)\n* Details about what we [still need to uncover](https://docs.google.com/document/d/1i1fC_wLFBarMwok3DMIDsKBLoWdollvO66tak9jetqs/edit?tab=t.0#heading=h.sh569ih3sbqh)\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6146", summary: "Mary's amplitude exploration", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Enable", epicKey: "CPUX-6177", epicName: "Measuring UX on HCC with Amplitude", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Kendra Marchant", description: "### What\n\nWe are currently limited with what we can do in Amplitude since new tracking events must be added by engineers during the implementation / development process. However we want to set ourselves up for success so that we can begin getting more value out of Amplitude as we move forward. \n\n**Deliverables**\n\nDocument questions about amplitude process, gather notes around requirements for what we need to be providing ENG and PM with to enable them to create tracking events for us, propose a framework for UX amplitude requests.", dueDate: "Mar 26, 2026", comments: [] },
  { key: "CPUX-6168", summary: "Iterate on how Ansible connected installer could integrate into HCC", issueType: "Story", status: "To Do", statusCategory: "To Do", priority: "Medium", activityType: "Make", epicKey: "CPUX-5867", epicName: "[UXD EPIC] Miscellaneous", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nIterate on how Ansible connected installer could integrate into HCC. \n\n* Tina's prototype (VPN required): [https://connected-installer-895768.pages.redhat.com/#/install/vm/downloaded](https://connected-installer-895768.pages.redhat.com/#/install/vm/downloaded) \n* GitLab rep for above: [https://gitlab.cee.redhat.com/tiyip/connected-installer/-/tree/gitlab-pages](https://gitlab.cee.redhat.com/tiyip/connected-installer/-/tree/gitlab-pages) \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6144", summary: "Revisit design of big 3 product widgets on homepage", issueType: "Story", status: "To Do", statusCategory: "To Do", priority: "High", activityType: "Make", epicKey: "CPUX-6011", epicName: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\n* The 'big 3' product widgets are still currently just static content - can we make more dynamic and actionable?\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6170", summary: "Create an Amplitude dashboard to track metrics of the HCC homepage", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Make", epicKey: "CPUX-6011", epicName: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nPopulate the [HCC Homepage Dashboard Amplitude dashboard](https://app.amplitude.com/analytics/redhat/dashboard/ftn3mki8?source=copy+url) with relevant metrics. \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "WIP dashboard about dashboards: https://app.amplitude.com/analytics/redhat/dashboard/ftn3mki8?source=copy+url ", created: "Mar 17, 2026" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Currently blocked due to required tracking events not existing in Amplitude yet. Meeting with PM Greg B to learn about the event request process and working on #CPUX-6146 to move this along", created: "Mar 19, 2026" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Closing this out for now since I can’t push the WIP dashboard any further until I have the tracking events I need added into Amplitude", created: "Mar 19, 2026" }] },
  { key: "CPUX-6182", summary: "Create research summary deck with UX recommendations based on workspace configuration mini study", issueType: "Story", status: "To Do", statusCategory: "To Do", priority: "Medium", activityType: "Make", epicKey: "CPUX-5987", epicName: "[UXD EPIC] Help Panel Research", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nCreate research summary deck with UX recommendations based on workspace configuration mini study. Raw notes can be found here: <custom data-type=\"smartlink\" data-id=\"id-0\">https://docs.google.com/document/d/1U414OfyQTXDoZFxV8HfvzhLPbj8LSc8R8GgZ80ACQ4U/edit?tab=t.otyya5hfpw1b</custom>  \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "Mar 19, 2026", comments: [] },
  { key: "CPUX-6098", summary: "Conduct mini research study around user workstation configurations", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Orient", epicKey: "CPUX-5987", epicName: "[UXD EPIC] Help Panel Research", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nConduct mini workshop sessions with various groups to better understand how users set up their workstations (ie. monitor setups, split screens, etc.) to build intuition around panel docking/undocking.\n\n* For internal Red Hatters, use the Miro version: [https://miro.com/app/board/uXjVG-gqLuA=/?share_link_id=84373494287](https://miro.com/app/board/uXjVG-gqLuA=/?share_link_id=84373494287)\n* For all others, use the public google doc version: [https://docs.google.com/presentation/d/1Bq2R71n-zMKIQbYdk8lIymJSfhYPN3CVxy7tbe-A5TQ/edit?slide=id.g3c918f0cff5_0_367#slide=id.g3c918f0cff5_0_367](https://docs.google.com/presentation/d/1Bq2R71n-zMKIQbYdk8lIymJSfhYPN3CVxy7tbe-A5TQ/edit?slide=id.g3c918f0cff5_0_367#slide=id.g3c918f0cff5_0_367) \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Study overview: https://docs.google.com/document/d/1U414OfyQTXDoZFxV8HfvzhLPbj8LSc8R8GgZ80ACQ4U/edit?tab=t.0 Planned testing opportunities: Boston office in-person testing on Wed. March 4Mohit Insights customer demo on Wed. March 18", created: "Mar 3, 2026" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Weekly update: conducted 4 in-person sessions – not sure if we got the right persona though, so I will lean more into the virtual study method in the upcoming weeks", created: "Mar 5, 2026" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Just conducted a virtual 1:1 session with a user: session recording + workstation drawing", created: "Mar 16, 2026" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Finished research with a total of 12 participants (4 external, 8 internal Red Hat) – notes here:   more formal analysis coming soon", created: "Mar 18, 2026" }] },
  { key: "CPUX-6177", summary: "Measuring UX on HCC with Amplitude", issueType: "Epic", status: "New", statusCategory: "To Do", priority: "High", activityType: "Explore", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "‌\n\n**What**  \nExplore how the Amplitude integration on HCC can be used to measure key user experiences across Console dot services. This epic focuses on validating which UX questions Amplitude can answer, understanding its limitations, and defining workflows for getting user interactions instrumented by development (what it takes, who does what, and how hard it is). Findings for specific features (e.g., dashboards) will live in their respective feature epics rather than here.\n\n**Problem Statement**  \nWe assume that HCC UXDs and service teams experience uncertainty and friction when trying to measure user behavior on Console dot services due to a lack of clarity on Amplitude’s capabilities, limitations, and the technical process for instrumentation. This assumption is based on the transition from Pendo to Amplitude and the need to establish new measurement standards.\n\n**Definition of Done**  \nThis Epic should be Closed once the following criteria are met:\n\n* A clear understanding of Amplitude’s capabilities and limitations for HCC is documented and shared.\n* A defined workflow for dev instrumentation (process, effort, and roles) is established and documented.\n* The current list of key UX questions for Console dot services has been evaluated against Amplitude’s feature set (what can/can’t be answered).<custom data-type=\"smartlink\" data-id=\"id-0\">https://docs.google.com/document/d/1xODG9tzOhRz7jkhhsOHGu2axmk4WceV2TLTOVBl8Qqw/edit?tab=t.0#heading=h.53o50oudwzmy</custom> \n* All child tasks or stories within this epic have been closed or transferred to a follow‑up epic.\n* If follow‑up development work is needed, a link to it has been added to this epic.\n\n", dueDate: "Jun 29, 2026", comments: [] },
  { key: "CPUX-6167", summary: "Update Cross Org sharing mocks based off of Engineer Questions", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Make", epicKey: "CPUX-5922", epicName: "[UXD EPIC] AuthZ and Subscriptions/billing accounts", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### What\n\nUpdate cross org sharing mocks to reflect questions and feedback from engineer team that has been attached.\n\nReview with UX team than share wit engineers once complete.\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "Mar 19, 2026", comments: [{ author: "SJ Cox", authorAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", body: "Designs shared wit Zein - using updated deliverable guidelines.", created: "Mar 17, 2026" }] },
  { key: "CPUX-6175", summary: "[UX Consult] Create guidelines for UXD deliverable practice to Engineer team", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Consult", epicKey: "CPUX-5956", epicName: "[UXD EPIC] UXD-Driven in Q1", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### What\n\nWe have received feedback from our engineering teams regarding the difficulty of identifying \"final\" designs. In the past, the fluid nature of Figma meant that \"work-in-progress\" and \"ready-for-dev\" designs were often indistinguishable. This led to:\n\n* Confusion over which Figma file or page to reference.\n* Engineers manually creating their own PNGs to freeze a moment in time.\n* A lack of clear annotations for edge cases and logic.\n\nThe Goal: To provide a static, versioned snapshot of our designs while maintaining a single, organized Figma source of truth.\n\n<custom data-type=\"smartlink\" data-id=\"id-0\">https://docs.google.com/document/d/1exGSf6ZKb9_dZY5G-INohCVEVoGuo3Gz7kNP8CzCcAg/edit?usp=sharing</custom>\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "Mar 12, 2026", comments: [] },
  { key: "CPUX-5922", summary: "[UXD EPIC] AuthZ and Subscriptions/billing accounts", issueType: "Epic", status: "New", statusCategory: "To Do", priority: "Medium", activityType: "UX Exploration", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Yichen Yu", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", reporterName: "Kendra Marchant", description: "### Data-Driven Problem Statement\n\nToday, customers can only sharing assets (such as RHEL systems and subscriptions) and use billing accounts within their own Red Hat organization. This limitation hinders efficient collaboration between partners and customers, creating unnecessary administrative overhead and preventing seamless resource sharing. We know that in 2023 approximately **30%** of customer service tickets across the Red Hat portfolio were about correcting access and account problems, many of which customers could solve with cross org sharing (formerly known as tenancy) .\n\n## Description\n\nThis feature will introduce the ability for an Organization to securely share workspaces (and their associated assets like hosts, clusters, etc.), and Subscription Billing Accounts with other trusted Organizations. This will allow authorized users to collaborate more effectively across orgs, granting access to necessary assets, and allow workspaces to draw down form the appropriate billing account, whether from their organization or from a trusted external organization. \n\n ", dueDate: "", comments: [] },
  { key: "CPUX-6111", summary: "Scheduler share with accelerator program", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Explore", epicKey: "CPUX-5566", epicName: "Scheduler MVP", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Yichen Yu", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", reporterName: "Yichen Yu", description: "### What\n\nShare the scheduler mocks with attendees in the accelerator program\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-5543", summary: "[UXD Epic] Virtual Assistant", issueType: "Epic", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "", assigneeAvatar: "", reporterName: "Mary Shakshober-Crossman", description: "**Problem statement:** We assume that with console hosting 50+ different services and each with their own content and processes, users have difficulties manually complete multi-step tasks. The virtual assistant introduction on HCC aims to automate some of the manual process and improve user's experience. \n\n ", dueDate: "", comments: [{ author: "Crystal Levy", authorAvatar: "https://secure.gravatar.com/avatar/3e37aa0ebf005946822827f90bd7f8c1?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCL-2.png", body: "Unable to inherit fixVersion from Epic. Please add a fixVersion", created: "May 28, 2024" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "  – curious, in the nature of good JIRA hygiene, if we should deprecate this VA epic in favor of the In-context help + AI-enabled help epic (https://redhat.atlassian.net/browse/CPUX-5544)  since the VA is now folded into the AI chameleon component?", created: "Nov 13, 2025" }, { author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: " yeah, I'm cool with that. Thanks for thinking of it.", created: "Nov 14, 2025" }, { author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "So would  :1. move her remaining stories (in progress and assigned) to https://redhat.atlassian.net/browse/CPUX-55442. Mark as closed Epic ? (I can't get the strike thru formatting to go away LOL)", created: "Nov 14, 2025" }] },
  { key: "CPUX-5925", summary: "[UX Consult] Create Jira issues of inconsistencies and bugs found within Help Panel and Chameleon", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Consult", epicKey: "CPUX-5543", epicName: "[UXD Epic] Virtual Assistant", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### What\n\nMiro board of issues or bugs, such as misalignment with PF6, designs, etc.\n\nCreate an issue for the engineering team to capture all issues found.\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "SJ Cox", authorAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", body: "Old issue", created: "Mar 17, 2026" }] },
  { key: "CPUX-6133", summary: "Updates to Amplitude communications guidance based on feedback", issueType: "Story", status: "To Do", statusCategory: "To Do", priority: "Medium", activityType: "Enable", epicKey: "CPUX-5993", epicName: "[UXD EPIC] Create Amplitude Resources for team", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### What\n\nWhen Pendo was our communications tool on HCC, we wrote this guidance for using the communication tools (when to use banners, pop ups, etc). Pendo comms guidance: [https://docs.google.com/document/d/1Ls00B5WQCMPanwd8VxccmNKb6Tgi4PL-8I-A6HCtJjs/edit?usp=sharing](https://docs.google.com/document/d/1Ls00B5WQCMPanwd8VxccmNKb6Tgi4PL-8I-A6HCtJjs/edit?usp=sharing)\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The communications guide has been reviewed and commented on by stakeholders (HCC UXD, <custom data-type=\"mention\" data-id=\"id-0\">@Natalie Wong</custom> and <custom data-type=\"mention\" data-id=\"id-1\">@Jeff Gehlbach</custom> )\n* The communications guide availability and purpose is ready to share with HCC tenant PMs and tenant UXD.\n* Templates created within Amplitude are reviewed and commented on by stakeholders (HCC UXD, <custom data-type=\"mention\" data-id=\"id-2\">@Natalie Wong</custom> and <custom data-type=\"mention\" data-id=\"id-3\">@Jeff Gehlbach</custom> )\n* Training: explore and capture in writing– what is HCC UXD's role in training tenant PMs and UXD to use the Amplitude UI to create guides? Is this easy for us to do if we make templates for users? Does Amplitude provide us with training specific to our templates (given by their consulting trainers)?\n\n", dueDate: "Mar 30, 2026", comments: [] },
  { key: "CPUX-5994", summary: "Create Amplitude in-product templates", issueType: "Story", status: "To Do", statusCategory: "To Do", priority: "Medium", activityType: "Make", epicKey: "CPUX-5993", epicName: "[UXD EPIC] Create Amplitude Resources for team", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### What\n\nWhen Pendo was our communications tool on HCC, we also created templates that our tenants could copy and use to create their own communications within their bundle/services.\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The communications guide has been reviewed and commented on by stakeholders (HCC UXD, <custom data-type=\"mention\" data-id=\"id-0\">@Natalie Wong</custom> and <custom data-type=\"mention\" data-id=\"id-1\">@Jeff Gehlbach</custom> )\n* The communications guide availability and purpose is ready to share with HCC tenant PMs and tenant UXD.\n* Templates created within Amplitude are reviewed and commented on by stakeholders (HCC UXD, <custom data-type=\"mention\" data-id=\"id-2\">@Natalie Wong</custom> and <custom data-type=\"mention\" data-id=\"id-3\">@Jeff Gehlbach</custom> )\n* Training: explore and capture in writing– what is HCC UXD's role in training tenant PMs and UXD to use the Amplitude UI to create guides? Is this easy for us to do if we make templates for users? Does Amplitude provide us with training specific to our templates (given by their consulting trainers)?\n\n", dueDate: "Mar 30, 2026", comments: [] },
  { key: "CPUX-6132", summary: "Mockup designs for undocking the help panel", issueType: "Story", status: "To Do", statusCategory: "To Do", priority: "Medium", activityType: "Explore", epicKey: "CPUX-6130", epicName: "[UX Epic] UX Updates based off of Chatbot and Help Panel research", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### What\n\nWhat would the UX look like to undock the help panel?\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6166", summary: "Automation exploration share deck", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Make", epicKey: "CPUX-6165", epicName: "Automation of cloud subscription integration ", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Yichen Yu", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", reporterName: "Yichen Yu", description: "### What\n\nMake the deck to share the ways of improvement for integration\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6095", summary: "Subscription cross-org sharing advance improvement", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Make", epicKey: "CPUX-6068", epicName: "Subscription 2026 1H vision work - stats and notification", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Yichen Yu", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", reporterName: "Yichen Yu", description: "### What \n\nWith the cross-org billing account share functionality, there will be personas who overseeing the subscription usage across multiple organization. Therefore, we need to provide additional view in the subscription usage to fulfill this ability.\n\n### Problem statement\n\nWe assume that our customers need a view to review the subscription usage across the accounts that share their subscription with them because it would help them understand the utilization and plan for the usage allocation. This assumption is based on customer case feedback from a European bank.\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Yichen Yu", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", body: "Had a brainstorm session with Greg. Please refer to this Miro for the brainstorming work: https://miro.com/app/board/uXjVGEAeGkY=/Next step is to convert them into hi-fi mocks", created: "Mar 3, 2026" }] },
  { key: "CPUX-6094", summary: "Subscription integration automation exploration", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Explore", epicKey: "CPUX-6165", epicName: "Automation of cloud subscription integration ", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Yichen Yu", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", reporterName: "Yichen Yu", description: "### What\n\nExplore the possibilities to automate the integration and leverage the existing Ai tools\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Yichen Yu", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", body: "Ideas and flows are mapping out in this Miro and experimenting in local cursor. ", created: "Mar 3, 2026" }, { author: "Yichen Yu", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", body: "Sharing deck is in progress here: https://docs.google.com/presentation/d/10-RB3ho5s-4lrGJr3VyZR_NwFxgbttrktZEN92zmWHg/edit?slide=id.g291746e71c8_0_686#slide=id.g291746e71c8_0_686 ", created: "Mar 9, 2026" }] },
  { key: "CPUX-5753", summary: "[UX Spec] Update Settings overhaul mocks to incorporate severity", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "UX Spec", epicKey: "RHCLOUD-37873", epicName: "[RFE] Add labels to Notifications events to denote Severity of event.", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nTechnically speaking, we now have the ability to provide severity options for events. For example:\n\nName of event\n\n* Severity level 1\n* Severity level 2\n* ...\n* Severity level n\n\nWe need to advise on how this should impact the Alert manager services given these flows ...\n\n1. Admin sets the default settings for the org\n2. User without alert overrider role makes changes to their preferences\n3. User with alert rover rider role makes changes to their preferences\n4. User views event log\n\nAdditionally, add ability to 'subscribe to all critical events' into new settings UI mocks without any specification by bundle or event type – just simply, 'if the fired event is critical then I get alerted'\n\n### Problem statement\n\nUsers currently either opt into all notifications for a given event regardless of its severity score. We have RFEs from users requesting this feature.\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "This won't be relevant for approximately another year – will reopen when settings UI overhaul is in implementation if needed", created: "Mar 13, 2026" }] },
  { key: "CPUX-6173", summary: "move to correct epic: Simplify marketplace subs to HCC connection experience", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Consult", epicKey: "CPUX-5956", epicName: "[UXD EPIC] UXD-Driven in Q1", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "### What\n\nSupport team in understanding requirements and flows, reviewing mockups and providing feedback, creating presentations and presenting to stakeholders. \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6172", summary: "move to correct epic: Custom (AI gen) dashboard widgets", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Consult", epicKey: "CPUX-5956", epicName: "[UXD EPIC] UXD-Driven in Q1", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "### What\n\nSupport team in understanding requirements and flows, reviewing mockups and providing feedback, creating presentations and presenting to stakeholders. \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-5956", summary: "[UXD EPIC] UXD-Driven in Q1", issueType: "Epic", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Mary Shakshober-Crossman", description: "**Problem statement**\n\nSo that console dot UXD and the UXDers for its service teams are able to complete our product stories and epics, Console dot UXD must do tasks like the following:\n\n* provide tooling for service design teams or dev teams\n* create design templates for service teams use so that our customer experience is aligned across the Console; work with console dot dev to create patternfly components or extensions.\n* create and maintain repeatable onboarding jiras for service teams UXDers and PMs.\n\nWe'll track those efforts in this epic.", dueDate: "", comments: [] },
  { key: "CPUX-6103", summary: "Goal 1D: Mock up flows for saving and re-accessing dashboards", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Make", epicKey: "CPUX-6011", epicName: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nMock up flows for saving and re-accessing dashboards. Refer to what competitors are doing with this competitive analysis: [https://miro.com/app/board/uXjVGJK5kKM=/?share_link_id=836756157164](https://miro.com/app/board/uXjVGJK5kKM=/?share_link_id=836756157164) \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Various examples of dashboard hub + saving a dashboard as your homepage ready for review here: https://www.figma.com/design/6eWIMS66Fs7ov75Xj3zFIO/Dashboard-chrome-enhancements-CY26-Q1?node-id=27-166232 ", created: "Feb 26, 2026" }] },
  { key: "CPUX-6011", summary: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", issueType: "Epic", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Explore", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\n_The HCC dashboard has never really had any big imrpovements or updates since its launch a couple years ago, leaving several bits of desired functionality still yet to be created. This also positions us poorly in comparison to our competitors dashboard experience. We will be adding the ability to create custom content widgets with AI agents as well as adding new functionality to the dashboard itself including:_\n\n1. _Enabling users to create and store multiple dashboards not just one_\n2. _Enabling users to share dashboards with other users and groups in their organization_\n3. _Enabling users to export dashboards for sharing and reporting purposes_\n\n### Problem Statement\n\n_Operations/admin users_ struggles with _finding the most important and critical information in one place_. Data from _competitive analyses_ shows _that our competitors have much more robust dashboard features with customization and visualizations controlled by the user's needs_. This impacts user _efficiency when using the Hybrid Cloud Console_.\n\n### Definition of Done\n\nThis Epic should be Closed once the following criteria are met:\n\n* The primary deliverable or artifact is attached or linked to this epic.\n* The primary deliverable of this epic has been reviewed by stakeholders.\n* All child tasks or stories within this epic have been closed or transferred to a follow-up epic. If a follow-up epic is created, a link to it has been added to this epic.\n* If follow-up development work is needed, a link to it has been added to this epic.\n* _\\[Include any other criteria that needs to be met before closing this epic\\]_\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6131", summary: "Brainstorm research ideas to understand user value of genAI widgets", issueType: "Story", status: "Review", statusCategory: "In Progress", priority: "High", activityType: "Explore", epicKey: "CPUX-6011", epicName: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nBrainstorm research ideas to understand user value of genAI widgets\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Started brainstorming ideas and building intuition here: https://docs.google.com/document/d/1i1fC_wLFBarMwok3DMIDsKBLoWdollvO66tak9jetqs/edit?usp=sharing ", created: "Mar 5, 2026" }] },
  { key: "CPUX-6101", summary: "Goal 1B: Mock up flows for duplicating existing dashboard", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Make", epicKey: "CPUX-6011", epicName: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nMock up flows for duplicating existing dashboard. Refer to what competitors are doing with this competitive analysis: [https://miro.com/app/board/uXjVGJK5kKM=/?share_link_id=836756157164](https://miro.com/app/board/uXjVGJK5kKM=/?share_link_id=836756157164) \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "V1 designs ready for review: https://www.figma.com/design/6eWIMS66Fs7ov75Xj3zFIO/Dashboard-chrome-enhancements-CY26-Q1?node-id=27-217108&t=jT1PVub7NQLoNhF0-4 ", created: "Feb 26, 2026" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Weekly update: Shared mockups with Kendra, PMs, and ENG stakeholders but need to set up a more formal review as well to phase this work appropriately given engineering priorities ", created: "Mar 5, 2026" }] },
  { key: "CPUX-6104", summary: "Goal 2: Mock up flows for sharing dashboard via URL and email with org", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Make", epicKey: "CPUX-6011", epicName: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nMock up flows for sharing dashboard via URL and email with org. Refer to what competitors are doing with this competitive analysis: [https://miro.com/app/board/uXjVGJK5kKM=/?share_link_id=836756157164](https://miro.com/app/board/uXjVGJK5kKM=/?share_link_id=836756157164) \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6100", summary: "Goal 1A: Mock up flows for creating a new dashboard from scratch", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Make", epicKey: "CPUX-6011", epicName: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "### What\n\nMock up flows for creating a new dashboard from scratch. Refer to what competitors are doing with this competitive analysis: [https://miro.com/app/board/uXjVGJK5kKM=/?share_link_id=836756157164](https://miro.com/app/board/uXjVGJK5kKM=/?share_link_id=836756157164) \n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "V1 designs ready for review: https://www.figma.com/design/6eWIMS66Fs7ov75Xj3zFIO/Dashboard-chrome-enhancements-CY26-Q1?node-id=27-215536&t=jT1PVub7NQLoNhF0-4 ", created: "Feb 26, 2026" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Weekly update: Shared mockups with Kendra, PMs, and ENG stakeholders but need to set up a more formal review as well to phase this work appropriately given engineering priorities ", created: "Mar 5, 2026" }] },
  { key: "CPUX-5867", summary: "[UXD EPIC] Miscellaneous", issueType: "Epic", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "", assigneeAvatar: "", reporterName: "Mary Shakshober-Crossman", description: "```java\nRemember to use the 'Linked issues' area to 'Relate' links to any CRC-Plan (Kat, Ryan, Jess) epics to that are related.\n```\n\n## Description\n\nWhat is this 'epic' or 'theme' all about? Provide some context as to what type of stories will live in this UXD epic. ", dueDate: "", comments: [{ author: "Crystal Levy", authorAvatar: "https://secure.gravatar.com/avatar/3e37aa0ebf005946822827f90bd7f8c1?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCL-2.png", body: "Unable to inherit fixVersion from Epic. Please add a fixVersion", created: "May 28, 2024" }] },
  { key: "CPUX-5942", summary: "Create Amplitude communications guidance", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Make", epicKey: "CPUX-5993", epicName: "[UXD EPIC] Create Amplitude Resources for team", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "Kendra Marchant", description: "### What\n\nWhen Pendo was our communications tool on HCC, we wrote this guidance for using the communication tools (when to use banners, pop ups, etc). Pendo comms guidance: [https://docs.google.com/document/d/1Ls00B5WQCMPanwd8VxccmNKb6Tgi4PL-8I-A6HCtJjs/edit?usp=sharing](https://docs.google.com/document/d/1Ls00B5WQCMPanwd8VxccmNKb6Tgi4PL-8I-A6HCtJjs/edit?usp=sharing)\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The communications guide has been reviewed and commented on by stakeholders (HCC UXD, <custom data-type=\"mention\" data-id=\"id-0\">@Natalie Wong</custom> and <custom data-type=\"mention\" data-id=\"id-1\">@Jeff Gehlbach</custom> )\n* The communications guide availability and purpose is ready to share with HCC tenant PMs and tenant UXD.\n* Templates created within Amplitude are reviewed and commented on by stakeholders (HCC UXD, <custom data-type=\"mention\" data-id=\"id-2\">@Natalie Wong</custom> and <custom data-type=\"mention\" data-id=\"id-3\">@Jeff Gehlbach</custom> )\n* Training: explore and capture in writing– what is HCC UXD's role in training tenant PMs and UXD to use the Amplitude UI to create guides? Is this easy for us to do if we make templates for users? Does Amplitude provide us with training specific to our templates (given by their consulting trainers)?\n\n", dueDate: "Jan 29, 2026", comments: [{ author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "Hey,  can you add drafts/work you've done to this Jira? And what are your next steps?", created: "Feb 2, 2026" }, { author: "SJ Cox", authorAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", body: "Here is the latest Draft of the Amplitude Communications guidance that I added onto after Ryan created the initial doc.Still need to add in all of the screenshots.Share out and get feedback from stakeholders on what is missing. Sharing with designers at HCC meeting on Thursday https://docs.google.com/document/d/1VgoPFLpDqdXfzTp4ns-i_c4T_yFyqPUR10zSkLaWt9o/edit?usp=sharing", created: "Feb 3, 2026" }] },
  { key: "CPUX-5443", summary: "[UXD EPIC] IAM org management (IAM bundle, cross-org sharing, org-wide access)", issueType: "Epic", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "UX Exploration", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "### Data-Driven Problem Statement\n\nToday, customers can only sharing assets (such as RHEL systems and subscriptions) and use billing accounts within their own Red Hat organization. This limitation hinders efficient collaboration between partners and customers, creating unnecessary administrative overhead and preventing seamless resource sharing. We know that in 2023 approximately **30%** of customer service tickets across the Red Hat portfolio were about correcting access and account problems, many of which customers could solve with cross org sharing (formerly known as tenancy) .\n\n## Description\n\nThis feature will introduce the ability for an Organization to securely share workspaces (and their associated assets like hosts, clusters, etc.), and Subscription Billing Accounts with other trusted Organizations. This will allow authorized users to collaborate more effectively across orgs, granting access to necessary assets, and allow workspaces to draw down form the appropriate billing account, whether from their organization or from a trusted external organization. \n\n ", dueDate: "", comments: [{ author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "At brainstorming on Jan 24:  Verify: this request from Ryan is about cross org sharing only? Or should we think about:What does giving a user direct access to a workspace when they are NOT a member of an org look like?What does giving a user direct access to a workspace when they ARE a member of an org look like?", created: "Jan 24, 2025" }, { author: "Katie Riker", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5bec72273620cb194a7cdffc/88c2052e-6027-491c-8600-1a5c1ecc0c52/32", body: " This is a long running Epic – Would it make sense to close this and create a new one to capture the 2026 work?", created: "Dec 1, 2025" }, { author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: " will do...", created: "Dec 5, 2025" }] },
  { key: "CPUX-6165", summary: "Automation of cloud subscription integration ", issueType: "Epic", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Explore", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Yichen Yu", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", reporterName: "Yichen Yu", description: "### What\n\nExploration of the automation of cloud subscription integration. Looking for possibilities to leverage the tools like VA, automatic script, help panel, and etc to optimize the cumbersome integration process. \n\n### Problem Statement\n\n_Cloud subscription user_ struggles with integrating their subscription successfully with Red Hat HCC. Data from subscription back-end and cost management back-end, plus the anecdote collected from RH1 shows around 28% of account mis-configuration and 80% of integration failure through cost management. This impacts our revenue collection, customer subscription usage tracking, and end-user experience.\n\n### Definition of Done\n\nThis Epic should be Closed once the following criteria are met:\n\n* The primary deliverable or artifact is attached or linked to this epic.\n* The primary deliverable of this epic has been reviewed by stakeholders.\n* All child tasks or stories within this epic have been closed or transferred to a follow-up epic. If a follow-up epic is created, a link to it has been added to this epic.\n* If follow-up development work is needed, a link to it has been added to this epic.\n* _\\[Include any other criteria that needs to be met before closing this epic\\]_\n\n", dueDate: "", comments: [] },
  { key: "CPUX-5776", summary: "Red Hat One Subscription workshop", issueType: "Epic", status: "In Progress", statusCategory: "In Progress", priority: "High", activityType: "", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Yichen Yu", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", reporterName: "Yichen Yu", description: "### What\n\nThis epic will include the preparation process for Red Hat one subscription workshop\n\n### Problem Statement\n\nRed Hat customer experience frictions when it comes to purchase and renewal their subscription through both traditional and cloud venues due to the unclarity and lack of guidance in the process. Data from customer engagements with PMs, requests we got from previous subscription user research, and support tickets from account team shows that difficulties in the current subscription experience need to be solved. This will impact customer's willingness to do transaction with Red Hat and their tendency to keep renewing with us. \\_\\_ \n\n### Definition of Done\n\nThis Epic should be Closed once the following criteria are met:\n\n* The primary deliverable or artifact is attached or linked to this epic.\n* The primary deliverable of this epic has been reviewed by stakeholders.\n* All child tasks or stories within this epic have been closed or transferred to a follow-up epic. If a follow-up epic is created, a link to it has been added to this epic.\n* If follow-up development work is needed, a link to it has been added to this epic.\n\n", dueDate: "Feb 26, 2026", comments: [] },
  { key: "CPUX-5217", summary: "[UX Consult] Create session expiration experience", issueType: "Story", status: "Backlog", statusCategory: "To Do", priority: "Medium", activityType: "UX Consult", epicKey: "CPUX-6012", epicName: "[UXD Epic] A catch-all epic for miscellaneous chroming UX work (navigation, masthead, etc.) ", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Mary Shakshober-Crossman", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", reporterName: "Mary Shakshober-Crossman", description: "Let's have a session: [https://redhat.atlassian.net/browse/RHCLOUD-37897](https://redhat.atlassian.net/browse/RHCLOUD-37897)\n\nWe need to create some UX to notify users that:\n\n* Their session will soon expire and they reauth\n* Their session has already expired and they have to reauth\n\nChat with <custom data-type=\"mention\" data-id=\"id-0\">@Martin Marosi</custom> more about this if you need more direction, but basically we just want to provide our ENG team with guidance on how we should surface the bullets above.", dueDate: "", comments: [{ author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: " Hi, checking in on the status of this one.", created: "Apr 8, 2025" }, { author: "Asumi Hasan", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/6369743b11c69c741844f221/d10a711c-3896-4dbd-9cc2-5c2ec4f803da/32", body: "Not yet started, will carry over (low priority)", created: "Apr 8, 2025" }, { author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "Hi, in the spirit of cleaning up our backlogs, wanted to talk about this one.", created: "Nov 10, 2025" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "  – all of us UXDers have been tasked with cleaning up our JIRAs and I was wondering if this is still something we need UX support on? I can definitely take it up in December or early Q1 if we do", created: "Nov 13, 2025" }, { author: "Martin Marosi", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/712020:3d025258-47ab-4cf7-8907-c220a7d66731/24ce165d-85c6-4138-bd33-8f06eae8d15e/32", body: "I'd like to have this feature in the UI. I think it is annoying for users if they get logged off and they don't know why.", created: "Nov 14, 2025" }, { author: "Jeff Gehlbach", authorAvatar: "https://secure.gravatar.com/avatar/3f1c5779bc0e48adefd03963a6920c47?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FJG-6.png", body: "I'm with , mystery sign-outs don't inspire confidence. Let's keep this one, please!", created: "Nov 14, 2025" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "After finding this old documentation around session timeouts on PF3, the PF team has created a ticket to provide new and up to date guidance around session timeouts – https://github.com/patternfly/patternfly-org/issues/4898 I vote that we hold off coming up with designs for this until they have official guidance to give us.  , what do you think?", created: "Dec 18, 2025" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Update here for  and  ! PatternFly has created guidance for a a session expiration modal  The PR for the documentation has been approved and is just pending release to the main PF site, but the review link can be viewed here: https://pf-org--pr-4928-site.surge.sh/components/modal/design-guidelines/#session-expiration-modals ", created: "Mar 6, 2026" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: "Let me know if you need me or one of my fellow UXers to more granularly make mocks for how we (HCC) should use this guidance, or if you're okay to just take it and run from here!", created: "Mar 6, 2026" }, { author: "Martin Marosi", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/712020:3d025258-47ab-4cf7-8907-c220a7d66731/24ce165d-85c6-4138-bd33-8f06eae8d15e/32", body: "Hi . Looking at the example, but extending the session is not possible. The only way to \"extend\" a session is to log out and in. Which may result in loss of current progress. This is how the auth works, and I don't think we can change it. We need more of an informative message.", created: "Mar 9, 2026" }, { author: "Mary Shakshober-Crossman", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5b0ea3e8e249415c02f67c16/dc484417-bdd9-4415-b61d-3bb1d0191d87/32", body: " ahhh I see. so in our case we could still have some sort of a countdown, but then the only action could be \"Re-authenticate\", which would force a logout and then user would log back in?", created: "Mar 9, 2026" }, { author: "Jeff Gehlbach", authorAvatar: "https://secure.gravatar.com/avatar/3f1c5779bc0e48adefd03963a6920c47?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FJG-6.png", body: "Spitballing:If we get advance notice of impending session expiration and can show the modal in time for the user to see the countdown, dismiss the modal, and then (in the time left) interact with the UI in a way that updates the user's session (thus keeping it valid), then maybe that approximates \"extending\" the session. I'm not sure where the line is for interactions that would update the session, though.", created: "Mar 10, 2026" }] },
  { key: "CPUX-5896", summary: "[UX discovery] GitHub: AI tasks for team efficiency/innovation", issueType: "Story", status: "To Do", statusCategory: "To Do", priority: "Medium", activityType: "Enable", epicKey: "CPUX-5956", epicName: "[UXD EPIC] UXD-Driven in Q1", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "### What\n\nGitHub – gaining competence, making our work available:\n\n* how do we make our prototypes available? [https://docs.google.com/document/d/1nUY6HjPZ9vLj3Kr4C-FAa-NXgsoHBJOsfE4Wa4KUYl0/edit?usp=sharing;](https://docs.google.com/document/d/1nUY6HjPZ9vLj3Kr4C-FAa-NXgsoHBJOsfE4Wa4KUYl0/edit?usp=sharing)\n* openshift primer: [https://docs.google.com/document/d/1wribNGl0nJb4ECP987HCDFtitwz5CgD7vru1i5_LMuA/edit?tab=t.0#heading=h.tequ35qx3kkk](https://docs.google.com/document/d/1wribNGl0nJb4ECP987HCDFtitwz5CgD7vru1i5_LMuA/edit?tab=t.0#heading=h.tequ35qx3kkk)\n* [https://docs.google.com/document/d/1nUY6HjPZ9vLj3Kr4C-FAa-NXgsoHBJOsfE4Wa4KUYl0/edit?usp=sharing](https://docs.google.com/document/d/1nUY6HjPZ9vLj3Kr4C-FAa-NXgsoHBJOsfE4Wa4KUYl0/edit?usp=sharing)\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-5894", summary: "[UX exploration] Amplitude: measuring user experience ", issueType: "Story", status: "To Do", statusCategory: "To Do", priority: "Medium", activityType: "Explore", epicKey: "CPUX-5993", epicName: "[UXD EPIC] Create Amplitude Resources for team", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "### What\n\nPrepare for the January adoption of Amplitude on HCC.\n\n* Do initial self-learning by reading docs such as the following:  \n  [https://docs.google.com/document/d/13gln98WyuApFYhnsRV9rrmzPT3M6NlPkWpD3ksG9kY8/edit?usp=sharing](https://docs.google.com/document/d/13gln98WyuApFYhnsRV9rrmzPT3M6NlPkWpD3ksG9kY8/edit?usp=sharing)\n* amplitude training videos relevant to HCC (find these – Ryan Abbott's)\n* Identify initial questions+ that we UX designers want to try and answer with Amplitude data.  (capture in documentation) \n* How has MTV addressed this? [https://docs.google.com/document/d/1vKwPRob5VlfSdjA4Z-uPMIV6i-WNuT6omIMGCQ4Gy9o/edit?usp=sharing](https://docs.google.com/document/d/1vKwPRob5VlfSdjA4Z-uPMIV6i-WNuT6omIMGCQ4Gy9o/edit?usp=sharing)\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n\n", dueDate: "", comments: [{ author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "– document capturing initial questions that we UX designers want to try and answer with Amplitude data: https://docs.google.com/presentation/d/1KeWNSEVC-lckczKiZxxhH77Mqpf6bCvfyl72lUQhbaY/edit?usp=sharing– data discussions and what decisions we've made because of them (impact on design decisions): https://docs.google.com/presentation/d/1KeWNSEVC-lckczKiZxxhH77Mqpf6bCvfyl72lUQhbaY/edit?usp=sharing ", created: "Nov 21, 2025" }] },
  { key: "CPUX-5955", summary: "[UXD EPIC] Q1 -- CIAM continuous enhancements & optimization", issueType: "Epic", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Asumi Hasan", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/6369743b11c69c741844f221/d10a711c-3896-4dbd-9cc2-5c2ec4f803da/32", reporterName: "Kendra Marchant", description: "**Problem statement**\n\nWe assume that administrators and end-users experience friction and drop-offs during the authentication journey due to legacy configurations, a lack of streamlined self-service options, and inconsistent UI. This assumption is based on internal team observations and anecdotal feedback regarding the current CIAM (Customer Identity and Access Management) implementation.", dueDate: "", comments: [] },
  { key: "CPUX-5992", summary: "[UXD Epic] Chatbot Updates based off of research", issueType: "Epic", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Make", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### Problem Statement\n\n**We assume** that the current chatbot experience meets user needs; however, recent research and feedback indicate opportunities for meaningful improvement that have not yet been prioritized or translated into design updates. Without a structured approach to synthesizing insights, aligning with stakeholders, and iterating on designs, we risk leaving known usability issues unresolved and missing opportunities to improve effectiveness, clarity, and trust in the chatbot experience.\n\nThis epic focuses on taking research findings and stakeholder feedback, collaboratively prioritizing areas for improvement, and translating those priorities into updated chatbot designs. The work includes reviewing proposed updates with stakeholders to ensure alignment and feasibility, ultimately delivering informed, validated design improvements that better support user goals and expectations.\n\n### Definition of Done\n\nThis Epic should be Closed once the following criteria are met:\n\n* The primary deliverable or artifact is attached or linked to this epic.\n* The primary deliverable of this epic has been reviewed by stakeholders.\n* All child tasks or stories within this epic have been closed or transferred to a follow-up epic. If a follow-up epic is created, a link to it has been added to this epic.\n* If follow-up development work is needed, a link to it has been added to this epic.\n* _\\[Include any other criteria that needs to be met before closing this epic\\]_\n\n", dueDate: "", comments: [{ author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "Hey,   – can you close this one? we're going to do nothing for the current incarnation of Chameleon and instead work on a different solution.", created: "Feb 2, 2026" }] },
  { key: "CPUX-6068", summary: "Subscription 2026 1H vision work - stats and notification", issueType: "Epic", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "Explore", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Yichen Yu", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", reporterName: "Yichen Yu", description: "### What\n\nUse this epic as an parent ticket for the upcoming vision work for subscription UX. \n\n### Problem Statement\n\n_Assumption-based problem statement_\n\nWe assume that subscription users experiences frictions when using subscription bundle. This assumption is based on the user scenarios and product managers' feedback.\n\n### Definition of Done\n\nThis Epic should be Closed once the following criteria are met:\n\n* The primary deliverable or artifact is attached or linked to this epic.\n* The primary deliverable of this epic has been reviewed by stakeholders.\n* All child tasks or stories within this epic have been closed or transferred to a follow-up epic. If a follow-up epic is created, a link to it has been added to this epic.\n* If follow-up development work is needed, a link to it has been added to this epic.\n* _\\[Include any other criteria that needs to be met before closing this epic\\]_\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6160", summary: "[UX Spec] AuthZ onboarding -- Pick up where Asumi left off for existing converted user", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "", epicKey: "CPUX-5961", epicName: "[UXD EPIC] Q1  -- Create the AuthZ onboarding experience", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### Problem statement\n\nUsers will be confused about what the new workspace model is and how it affects them and their org structure. This assumption is based on user and content journeys.\n\n### What\n\nCreate mocks for the console home page that include:\n\n* A banner that informs the user what is happening \n* Widget exploration (could be a dedicated conversion widget or in the existing \"explore capabilities\"\n\nConsider how we can utilize pendo\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n\n", dueDate: "", comments: [] },
  { key: "CPUX-5399", summary: "[UX Spec] AuthZ onboarding -- Existing user converted automatically - Home page", issueType: "Story", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "UX Spec", epicKey: "CPUX-5961", epicName: "[UXD EPIC] Q1  -- Create the AuthZ onboarding experience", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Asumi Hasan", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/6369743b11c69c741844f221/d10a711c-3896-4dbd-9cc2-5c2ec4f803da/32", reporterName: "Asumi Hasan", description: "### Problem statement\n\nUsers will be confused about what the new workspace model is and how it affects them and their org structure. This assumption is based on user and content journeys.\n\n### What\n\nCreate mocks for the console home page that include:\n\n* A banner that informs the user what is happening \n* Widget exploration (could be a dedicated conversion widget or in the existing \"explore capabilities\"\n\nConsider how we can utilize pendo\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n\n", dueDate: "", comments: [{ author: "Asumi Hasan", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/6369743b11c69c741844f221/d10a711c-3896-4dbd-9cc2-5c2ec4f803da/32", body: "Next up in UXD AuthZ priorities. Target date and new requirements TBD.", created: "Nov 19, 2025" }, { author: "Asumi Hasan", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/6369743b11c69c741844f221/d10a711c-3896-4dbd-9cc2-5c2ec4f803da/32", body: "Experimented with AI prototyping in both Figma Make and Gemini Canvas, making 2 each. Flows are screenshotted and saved in miro: https://miro.com/app/board/uXjVLRRNQRo=/?moveToWidget=3458764662576635309&cot=14Initial mocks created in Figma: https://www.figma.com/design/2prc9oMdxOmZbERUdDinFs/Workspaces---Post-MVP?node-id=1197-42580&t=7pxjApxXYkVAhCUD-1All of the above handed off to SJ for review and help sharing at Management Fabric meetings (3/11 and 3/18)", created: "Mar 6, 2026" }] },
  { key: "CPUX-5961", summary: "[UXD EPIC] Q1  -- Create the AuthZ onboarding experience", issueType: "Epic", status: "In Progress", statusCategory: "In Progress", priority: "Medium", activityType: "", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Asumi Hasan", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/6369743b11c69c741844f221/d10a711c-3896-4dbd-9cc2-5c2ec4f803da/32", reporterName: "Kendra Marchant", description: "**Context:** With the introduction of AuthZ and workspace model on the Hybrid Cloud console, since it will change the UI and functions, we want to assist users with onboarding flows and documentation to help them get familiar with the new workspace model. \n\n**Problem statement:** We assume that users experiences confusion about what the new workspace model is and how it affects them and their org structure due to the introduction of a new workspace model. This assumption is based on user and content journeys. \n\n \n\n ", dueDate: "", comments: [] },
  { key: "CPUX-6129", summary: "[UX Research] Share out and and present Help Panel Findings to Stakeholders", issueType: "Story", status: "Review", statusCategory: "In Progress", priority: "Medium", activityType: "Consult", epicKey: "CPUX-5987", epicName: "[UXD EPIC] Help Panel Research", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### What\n\nShare out findings to stakeholders:\n\n* PM's -Exchange meeting on 3/9/26\n* UX team - 3/4/26\n* HCC - \n\n### Problem statement\n\nIn the initial 'crawl phase' of the ARH integration onto HCC, there are several experience, functionality, and feature-parity compromises that we had to make in this first launch.\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [] },
  { key: "CPUX-6064", summary: "[UX Research] Create Research findings deck for Help Panel Study", issueType: "Story", status: "Closed", statusCategory: "Done", priority: "Medium", activityType: "Make", epicKey: "CPUX-5987", epicName: "[UXD EPIC] Help Panel Research", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "SJ Cox", assigneeAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", reporterName: "SJ Cox", description: "### What\n\nAnalyz research and creat a research summary deck of findings from the 3 participants.\n\n### Problem statement\n\nIn the initial 'crawl phase' of the ARH integration onto HCC, there are several experience, functionality, and feature-parity compromises that we had to make in this first launch.\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "SJ Cox", authorAvatar: "https://secure.gravatar.com/avatar/27587de40ad5fbe91dd1f56a4a5df070?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSC-1.png", body: "Complete and starting to share out and present to stakeholders and UX teams", created: "Mar 9, 2026" }] },
  { key: "CPUX-6110", summary: "Enable custom month range selection in Swatch", issueType: "Story", status: "Review", statusCategory: "In Progress", priority: "Medium", activityType: "Enable", epicKey: "", epicName: "", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Yichen Yu", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", reporterName: "Yichen Yu", description: "### What\n\nEnable the custom monthly picker in the subscription usage pages as user requested for.\n\n### Problem statement\n\nSubscription usage users, especially users for on-demand usage struggles with reading the usage across multiple months. Data from customer support ticket and PM's engagement shows that multiple customers are experiencing the similar frictions. This will reduces manual effort and time spent aggregating data, improves reporting and governance workflows, enables better trend analysis and capacity planning, and enhances overall usability of Swatch reporting.\n\n### Definition of Done\n\nThis issue should be Closed once the following criteria are met.\n\n* The primary deliverable or artifact is attached or linked to this issue.\n* The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).\n* For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.\n* Follow-up tasks identified during the review have been created in the parent epic.\n* \\[Include any other criteria that need to be met before closing this issue\\]\n\n", dueDate: "", comments: [{ author: "Yichen Yu", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633b2eae2eaaa5dcfa164a94/afa1fff8-d49e-42d6-8c06-5f36066339b4/32", body: "Design is working in progress in this Figma file: https://www.figma.com/design/dLrYTRQa4jPgXW9PjU8nXN/Swatch-Monthly-picker?node-id=0-1&t=IoSXigpdfs0sxNH0-1 ", created: "Feb 26, 2026" }] },

  { key: "CPUX-5358", summary: "UX: Designs for creating users in HCC User Access", issueType: "Story", status: "Refinement", statusCategory: "To Do", priority: "Medium", activityType: "", epicKey: "CIAM-4761", epicName: "CREATE users directly from HCC User Access", storyPoints: null, sprintName: "HCC Sprint 1 2026", sprintState: "active" as JiraIssue["sprintState"], sprintStartDate: "March 11", sprintEndDate: "March 25", assigneeName: "Asumi Hasan", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/6369743b11c69c741844f221/d10a711c-3896-4dbd-9cc2-5c2ec4f803da/32", reporterName: "James Bailey", description: "User story: As an org-admin user, I can create a new user on User Access so I don't need to go to UGC to do so.\n\nDefinition of done: Provide designs for creating a user from within HCC User Access (informally known as platform RBAC).", dueDate: "", comments: [{ author: "James Bailey", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:50156ea1-3aec-4cd7-a8a0-8dda20905ef1/f9058f8c-454d-4a14-ba9b-f0174f288771/32", body: "Heads up to @Bekah Stephens as well in case you guys want to collab", created: "Jan 18, 2023" }] },
  { key: "CPUX-6179", summary: "[explore] Attempt to assemble dashboards/charts for UX interaction behavior questions", issueType: "Story", status: "New", statusCategory: "To Do", priority: "Medium", activityType: "Explore", epicKey: "CPUX-6177", epicName: "Measuring UX on HCC with Amplitude", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "Review the current list of key UX questions for Console dot services and assess which can be answered using Amplitude, documenting any gaps or limitations.\n\nKendra and Mary to choose the questions from the HCC Metrics and Analytics doc.", dueDate: "", comments: [] },
  { key: "CPUX-6178", summary: "[Explore] events in amplitude: what do they measure?", issueType: "Story", status: "To Do", statusCategory: "To Do", priority: "Medium", activityType: "Explore", epicKey: "CPUX-6177", epicName: "Measuring UX on HCC with Amplitude", storyPoints: null, sprintName: "", sprintState: "" as JiraIssue["sprintState"], sprintStartDate: "", sprintEndDate: "", assigneeName: "Kendra Marchant", assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", reporterName: "Kendra Marchant", description: "", dueDate: "", comments: [{ author: "Kendra Marchant", authorAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7/40177a56-70a9-478c-97ad-0d4bd7e9aa77/32", body: "@Mary Shakshober-Crossman Just fyi", created: "Mar 18, 2026" }] },
];

// ── Team account ID mapping (display name → Atlassian accountId) ──

const ACCOUNT_IDS: Record<string, string> = {
  "Asumi Hasan": "6369743b11c69c741844f221",
  "Kendra Marchant": "557058:78b37446-6818-4ae8-8fb9-02b4cfbecdc7",
  "Mary Shakshober-Crossman": "5b0ea3e8e249415c02f67c16",
  "SJ Cox": "557058:9b32883d-45fb-4054-9f65-038718aa31d2",
  "Yichen Yu": "633b2eae2eaaa5dcfa164a94",
};

// ── Status transition ID mapping (status name → transition ID) ──

const TRANSITION_IDS: Record<string, string> = {
  "New": "11",
  "Backlog": "21",
  "Refinement": "31",
  "To Do": "41",
  "In Progress": "51",
  "Review": "61",
  "Closed": "71",
};

// ── Sprint ID cache (populated when we fetch issues) ──

const sprintIdCache = new Map<string, number>();

// ── Parsing helpers ──
interface RawSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
}

interface RawComment {
  author: { displayName: string; avatarUrls: { "32x32": string } };
  body: unknown;
  created: string;
}

interface RawIssue {
  key: string;
  fields: {
    summary: string;
    issuetype: { name: string };
    status: { name: string; statusCategory: { name: string } };
    priority: { name: string };
    parent?: { key: string; fields: { summary: string; issuetype: { name: string } } };
    assignee?: { displayName: string; avatarUrls: { "32x32": string } } | null;
    reporter?: { displayName: string } | null;
    description?: unknown;
    comment?: { comments: RawComment[] };
    [key: string]: unknown;
  };
}

function formatDueDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSprintDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

interface AdfNode {
  type?: string;
  text?: string;
  content?: AdfNode[];
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

function adfToHtml(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string") {
    return node.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
  }
  if (typeof node !== "object") return "";
  const n = node as AdfNode;

  if (n.type === "text") {
    let text = (n.text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (n.marks) {
      for (const mark of n.marks) {
        switch (mark.type) {
          case "strong": text = `<strong>${text}</strong>`; break;
          case "em": text = `<em>${text}</em>`; break;
          case "underline": text = `<u>${text}</u>`; break;
          case "strike": text = `<s>${text}</s>`; break;
          case "code": text = `<code>${text}</code>`; break;
          case "link": {
            const href = mark.attrs?.href ?? "#";
            text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            break;
          }
        }
      }
    }
    return text;
  }

  const children = (n.content ?? []).map(adfToHtml).join("");

  switch (n.type) {
    case "doc": return children;
    case "paragraph": return children ? `<p>${children}</p>` : "<p>&nbsp;</p>";
    case "heading": {
      const level = (n.attrs?.level as number) ?? 3;
      return `<h${level}>${children}</h${level}>`;
    }
    case "bulletList": return `<ul>${children}</ul>`;
    case "orderedList": return `<ol>${children}</ol>`;
    case "listItem": return `<li>${children}</li>`;
    case "blockquote": return `<blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:8px 0;color:#555">${children}</blockquote>`;
    case "codeBlock": return `<pre style="background:#f4f4f4;padding:8px;border-radius:4px;overflow-x:auto"><code>${children}</code></pre>`;
    case "rule": return "<hr />";
    case "hardBreak": return "<br />";
    case "table": return `<table style="border-collapse:collapse;width:100%;margin:8px 0">${children}</table>`;
    case "tableRow": return `<tr>${children}</tr>`;
    case "tableHeader": return `<th style="border:1px solid #ddd;padding:6px;background:#f0f0f0;text-align:left">${children}</th>`;
    case "tableCell": return `<td style="border:1px solid #ddd;padding:6px">${children}</td>`;
    case "panel": return `<div style="border:1px solid #ddd;border-radius:4px;padding:12px;margin:8px 0;background:#f8f9fa">${children}</div>`;
    case "expand": {
      const title = (n.attrs?.title as string) || "Details";
      return `<details style="margin:8px 0"><summary><strong>${title}</strong></summary>${children}</details>`;
    }
    case "taskList": return `<ul style="list-style:none;padding-left:0">${children}</ul>`;
    case "taskItem": {
      const checked = n.attrs?.state === "DONE";
      return `<li>${checked ? "☑" : "☐"} ${children}</li>`;
    }
    case "inlineCard": {
      const url = (n.attrs?.url as string) ?? "";
      return url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>` : "";
    }
    case "mention": return `<strong>@${(n.attrs?.text as string) ?? "user"}</strong>`;
    case "emoji": return (n.attrs?.text as string) ?? (n.attrs?.shortName as string) ?? "";
    case "date": {
      const ts = n.attrs?.timestamp as number | string | undefined;
      if (ts) { const d = new Date(Number(ts)); return d.toLocaleDateString(); }
      return "";
    }
    case "status": return `<span style="background:#eee;padding:2px 6px;border-radius:3px;font-size:0.85em">${(n.attrs?.text as string) ?? ""}</span>`;
    case "mediaGroup":
    case "mediaSingle":
    case "media":
      return "";
    default:
      return children || "";
  }
}

function extractText(adf: unknown): string {
  return adfToHtml(adf);
}

function parseComments(raw: RawComment[]): JiraComment[] {
  return raw.map((c) => ({
    author: c.author.displayName,
    authorAvatar: c.author.avatarUrls["32x32"],
    body: extractText(c.body),
    created: new Date(c.created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  }));
}

function parseIssue(raw: RawIssue): JiraIssue {
  const f = raw.fields;
  const sprints = (f[FIELD_SPRINT] as RawSprint[] | null) ?? [];
  for (const s of sprints) {
    if (s.id && s.name) sprintIdCache.set(s.name, s.id);
  }
  const activeSprint = sprints.find((s) => s.state === "active");
  const futureSprint = sprints.find((s) => s.state === "future");
  const sprint = activeSprint ?? futureSprint ?? null;

  const activityField = f[FIELD_ACTIVITY_TYPE] as { value: string } | null;
  const parentIsEpic =
    f.parent?.fields?.issuetype?.name === "Epic";

  return {
    key: raw.key,
    summary: f.summary,
    issueType: f.issuetype.name,
    status: f.status.name,
    statusCategory: f.status.statusCategory.name,
    priority: f.priority.name,
    activityType: activityField?.value ?? "",
    epicName: parentIsEpic ? (f.parent?.fields?.summary ?? "") : "",
    epicKey: parentIsEpic ? (f.parent?.key ?? "") : "",
    storyPoints: (f[FIELD_STORY_POINTS] as number) ?? null,
    sprintName: sprint?.name ?? "",
    sprintState: (sprint?.state as JiraIssue["sprintState"]) ?? "",
    sprintStartDate: formatSprintDate(sprint?.startDate),
    sprintEndDate: formatSprintDate(sprint?.endDate),
    assigneeName: f.assignee?.displayName ?? "Unassigned",
    assigneeAvatar: f.assignee?.avatarUrls?.["32x32"] ?? "",
    reporterName: f.reporter?.displayName ?? "",
    description: extractText(f.description),
    dueDate: formatDueDate(f.duedate as string | null),
    comments: parseComments(f.comment?.comments ?? []),
  };
}

// ── Grouping ──

export function groupBySprint(issues: JiraIssue[]): SprintGroup[] {
  const activeMap = new Map<string, JiraIssue[]>();
  const futureMap = new Map<string, JiraIssue[]>();
  const backlog: JiraIssue[] = [];

  for (const issue of issues) {
    if (issue.sprintState === "active") {
      const list = activeMap.get(issue.sprintName) ?? [];
      list.push(issue);
      activeMap.set(issue.sprintName, list);
    } else if (issue.sprintState === "future") {
      const list = futureMap.get(issue.sprintName) ?? [];
      list.push(issue);
      futureMap.set(issue.sprintName, list);
    } else if (issue.statusCategory !== "Done") {
      backlog.push(issue);
    }
  }

  const groups: SprintGroup[] = [];

  for (const [name, sprintIssues] of activeMap) {
    const sample = sprintIssues[0];
    groups.push({
      name,
      state: "active",
      startDate: sample.sprintStartDate,
      endDate: sample.sprintEndDate,
      issues: sprintIssues,
    });
  }
  for (const [name, sprintIssues] of futureMap) {
    const sample = sprintIssues[0];
    groups.push({
      name,
      state: "future",
      startDate: sample.sprintStartDate,
      endDate: sample.sprintEndDate,
      issues: sprintIssues,
    });
  }
  if (backlog.length > 0) {
    groups.push({ name: "Backlog", state: "backlog", issues: backlog });
  }

  return groups;
}

// ── Fetching ──

async function jqlSearch(jql: string): Promise<JiraIssue[]> {
  const allIssues: JiraIssue[] = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      jql,
      maxResults: "100",
      fields: FIELDS.join(","),
    });
    if (nextPageToken) params.set("nextPageToken", nextPageToken);

    const res = await jiraFetch(
      `${PROXY_BASE}/ex/jira/${CLOUD_ID}/rest/api/3/search/jql?${params}`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${EMAIL}:${API_TOKEN}`)}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) throw new Error(`Jira API ${res.status}`);
    const data = await res.json();
    allIssues.push(...(data.issues ?? []).map(parseIssue));
    nextPageToken = data.isLast ? undefined : data.nextPageToken;
  } while (nextPageToken);

  return allIssues;
}

export async function fetchIssues(): Promise<JiraIssue[]> {
  if (!CLOUD_ID || !EMAIL || !API_TOKEN) {
    return STATIC_ISSUES;
  }

  try {
    const jql = `project = "${PROJECT_KEY}" AND component = "${COMPONENT}" AND issuetype != Epic ORDER BY updated DESC`;
    return await jqlSearch(jql);
  } catch (err) {
    console.error("Jira API error, falling back to static data", err);
    return STATIC_ISSUES;
  }
}

export function browseUrl(key: string): string {
  return `${BASE_URL}/browse/${key}`;
}

// ── Shared helpers ──

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${EMAIL}:${API_TOKEN}`)}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Atlassian-Token": "no-check",
  };
}

function jiraFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, credentials: "omit" });
}

function apiBase(): string {
  return `${PROXY_BASE}/ex/jira/${CLOUD_ID}`;
}

function toDueDate(display: string): string | undefined {
  if (!display) return undefined;
  const d = new Date(display);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().split("T")[0];
}

// ── Account ID resolution ──

export async function resolveAccountId(displayName: string): Promise<string | null> {
  if (ACCOUNT_IDS[displayName]) return ACCOUNT_IDS[displayName];
  try {
    const res = await jiraFetch(
      `${apiBase()}/rest/api/3/user/search?query=${encodeURIComponent(displayName)}&maxResults=5`,
      { headers: authHeaders() }
    );
    if (!res.ok) return null;
    const users = await res.json();
    const match = users.find((u: { displayName: string }) => u.displayName === displayName);
    if (match) {
      ACCOUNT_IDS[displayName] = match.accountId;
      return match.accountId;
    }
    return users[0]?.accountId ?? null;
  } catch {
    return null;
  }
}

// ── Sprint ID resolution ──

export function getSprintIdCache(): Map<string, number> {
  return sprintIdCache;
}

async function findBoardIds(): Promise<number[]> {
  try {
    const res = await jiraFetch(
      `${apiBase()}/rest/agile/1.0/board?projectKeyOrId=${PROJECT_KEY}&maxResults=20`,
      { headers: authHeaders() }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.values ?? []).map((b: { id: number }) => b.id);
  } catch {
    return [];
  }
}

async function resolveSprintId(sprintName: string): Promise<number | null> {
  if (sprintIdCache.has(sprintName)) return sprintIdCache.get(sprintName)!;
  const boardIds = await findBoardIds();
  for (const boardId of boardIds) {
    try {
      const res = await jiraFetch(
        `${apiBase()}/rest/agile/1.0/board/${boardId}/sprint?state=active,future&maxResults=50`,
        { headers: authHeaders() }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const s of data.values ?? []) {
        sprintIdCache.set(s.name, s.id);
      }
      if (sprintIdCache.has(sprintName)) return sprintIdCache.get(sprintName)!;
    } catch {
      continue;
    }
  }
  return null;
}

// ── Move issue to sprint or backlog ──

async function moveToSprint(issueKey: string, sprintName: string): Promise<void> {
  if (!sprintName || sprintName === "Backlog") {
    await jiraFetch(`${apiBase()}/rest/api/3/issue/${issueKey}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ fields: { [FIELD_SPRINT]: null } }),
    });
    return;
  }
  const sprintId = await resolveSprintId(sprintName);
  if (!sprintId) {
    console.warn(`Could not resolve sprint ID for "${sprintName}"`);
    return;
  }
  await jiraFetch(`${apiBase()}/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ fields: { [FIELD_SPRINT]: sprintId } }),
  });
}

// ── Transition issue status ──

export async function transitionIssue(issueKey: string, targetStatus: string): Promise<void> {
  const transitionId = TRANSITION_IDS[targetStatus];
  if (!transitionId) {
    console.warn(`No known transition for status "${targetStatus}"`);
    return;
  }
  await jiraFetch(`${apiBase()}/rest/api/3/issue/${issueKey}/transitions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ transition: { id: transitionId } }),
  });
}

// ── Add comment ──

export async function addComment(issueKey: string, body: string): Promise<void> {
  await jiraFetch(`${apiBase()}/rest/api/3/issue/${issueKey}/comment`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      body: {
        type: "doc",
        version: 1,
        content: [
          { type: "paragraph", content: [{ type: "text", text: body }] },
        ],
      },
    }),
  });
}

// ── Create issue (full workflow) ──

export async function createIssue(issue: JiraIssue): Promise<JiraIssue> {
  const fields: Record<string, unknown> = {
    project: { key: PROJECT_KEY },
    issuetype: { name: issue.issueType || "Story" },
    summary: issue.summary,
    components: [{ name: COMPONENT }],
  };

  if (issue.description) {
    const paragraphs = issue.description.split(/\n+/).filter((l) => l.trim());
    fields.description = {
      type: "doc",
      version: 1,
      content: paragraphs.map((p) => ({
        type: "paragraph",
        content: [{ type: "text", text: p }],
      })),
    };
  }
  // Priority is not settable on creation for this project; Jira assigns the default
  const dueDateIso = toDueDate(issue.dueDate);
  if (dueDateIso) fields.duedate = dueDateIso;
  if (issue.storyPoints != null) fields[FIELD_STORY_POINTS] = issue.storyPoints;
  if (issue.activityType) fields[FIELD_ACTIVITY_TYPE] = { value: issue.activityType };
  if (issue.epicKey) fields.parent = { key: issue.epicKey };

  const [assigneeId, reporterId] = await Promise.all([
    issue.assigneeName && issue.assigneeName !== "Unassigned"
      ? resolveAccountId(issue.assigneeName)
      : Promise.resolve(null),
    issue.reporterName ? resolveAccountId(issue.reporterName) : Promise.resolve(null),
  ]);

  if (assigneeId) fields.assignee = { accountId: assigneeId };
  if (reporterId) fields.reporter = { accountId: reporterId };

  const res = await jiraFetch(`${apiBase()}/rest/api/3/issue`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Jira create failed (${res.status}): ${errBody}`);
  }

  const created = await res.json();
  const newKey: string = created.key;

  const postCreateOps: Promise<void>[] = [];

  if (issue.sprintName && issue.sprintName !== "Backlog") {
    postCreateOps.push(moveToSprint(newKey, issue.sprintName));
  }

  if (issue.status && issue.status !== "To Do" && issue.status !== "New") {
    postCreateOps.push(transitionIssue(newKey, issue.status));
  }

  for (const c of issue.comments ?? []) {
    if (c.body) postCreateOps.push(addComment(newKey, c.body));
  }

  await Promise.allSettled(postCreateOps);

  const fetchRes = await jiraFetch(
    `${apiBase()}/rest/api/3/issue/${newKey}?fields=${FIELDS.join(",")}`,
    { headers: authHeaders() }
  );

  if (!fetchRes.ok) return { ...issue, key: newKey };
  const fullIssue = await fetchRes.json();
  return parseIssue(fullIssue);
}

// ── Update existing issue ──

export async function updateIssue(
  updated: JiraIssue,
  original: JiraIssue
): Promise<JiraIssue> {
  const fields: Record<string, unknown> = {};

  if (updated.summary !== original.summary) fields.summary = updated.summary;

  if (updated.description !== original.description) {
    const rawDesc = updated.description ?? "";
    const paragraphs = rawDesc.split(/\n+/).filter((l) => l.trim());
    fields.description = rawDesc.trim()
      ? {
          type: "doc",
          version: 1,
          content: paragraphs.map((p) => ({
            type: "paragraph",
            content: [{ type: "text", text: p }],
          })),
        }
      : null;
  }

  if (updated.priority !== original.priority && updated.priority) {
    fields.priority = { name: updated.priority };
  }

  const newDue = toDueDate(updated.dueDate);
  const oldDue = toDueDate(original.dueDate);
  if (newDue !== oldDue) fields.duedate = newDue ?? null;

  if (updated.storyPoints !== original.storyPoints) {
    fields[FIELD_STORY_POINTS] = updated.storyPoints;
  }

  if (updated.activityType !== original.activityType) {
    fields[FIELD_ACTIVITY_TYPE] = updated.activityType
      ? { value: updated.activityType }
      : null;
  }

  if (updated.epicKey !== original.epicKey) {
    fields.parent = updated.epicKey ? { key: updated.epicKey } : null;
  }

  if (updated.assigneeName !== original.assigneeName) {
    const id = updated.assigneeName && updated.assigneeName !== "Unassigned"
      ? await resolveAccountId(updated.assigneeName)
      : null;
    fields.assignee = id ? { accountId: id } : null;
  }

  if (updated.reporterName !== original.reporterName) {
    const id = updated.reporterName
      ? await resolveAccountId(updated.reporterName)
      : null;
    if (id) fields.reporter = { accountId: id };
  }

  if (Object.keys(fields).length > 0) {
    console.log(`[updateIssue] PUT ${updated.key} — fields being sent:`, JSON.stringify(fields, null, 2));
    const res = await jiraFetch(`${apiBase()}/rest/api/3/issue/${updated.key}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[updateIssue] PUT failed (${res.status}):`, errBody);
      throw new Error(`Jira update failed (${res.status}): ${errBody}`);
    }
    console.log(`[updateIssue] PUT ${updated.key} succeeded (${res.status})`);
  } else {
    console.log(`[updateIssue] No field changes detected for ${updated.key}`);
  }

  const postOps: Promise<void>[] = [];

  if (updated.status !== original.status) {
    postOps.push(transitionIssue(updated.key, updated.status));
  }

  if (updated.sprintName !== original.sprintName) {
    postOps.push(moveToSprint(updated.key, updated.sprintName));
  }

  const newComments = (updated.comments ?? []).filter(
    (c) => !(original.comments ?? []).some((oc) => oc.body === c.body && oc.created === c.created)
  );
  for (const c of newComments) {
    if (c.body) postOps.push(addComment(updated.key, c.body));
  }

  await Promise.allSettled(postOps);

  const verifyRes = await jiraFetch(
    `${apiBase()}/rest/api/3/issue/${updated.key}?fields=parent,${FIELDS.join(",")}`,
    { headers: authHeaders() }
  );

  if (!verifyRes.ok) return updated;
  const fullIssue = await verifyRes.json();

  const parentAfter = fullIssue.fields?.parent;
  console.log(`[updateIssue] VERIFY ${updated.key} — parent after update:`, JSON.stringify(parentAfter, null, 2));
  if (fields.parent) {
    const sentKey = (fields.parent as { key: string }).key;
    const actualKey = parentAfter?.key ?? "(none)";
    if (sentKey !== actualKey) {
      console.warn(`[updateIssue] PARENT MISMATCH: sent ${sentKey}, but Jira shows ${actualKey}`);
    } else {
      console.log(`[updateIssue] Parent change confirmed: ${actualKey}`);
    }
  }

  return parseIssue(fullIssue);
}

// ── Epics ──

const STATIC_EPICS: JiraEpic[] = [
  { key: "CPUX-6177", summary: "Measuring UX on HCC with Amplitude", status: "New" },
  { key: "CPUX-5922", summary: "[UXD EPIC] AuthZ and Subscriptions/billing accounts", status: "New" },
  { key: "CPUX-5956", summary: "[UXD EPIC] UXD-Driven in Q1", status: "In Progress" },
  { key: "CPUX-6011", summary: "[UXD EPIC] Dashboard functionality enhancements and storable AI-generated widget content", status: "In Progress" },
  { key: "CPUX-6165", summary: "Automation of cloud subscription integration", status: "In Progress" },
  { key: "CPUX-5776", summary: "Red Hat One Subscription workshop", status: "In Progress" },
  { key: "CPUX-5955", summary: "[UXD EPIC] Q1 -- CIAM continuous enhancements & optimization", status: "In Progress" },
  { key: "CPUX-6068", summary: "Subscription 2026 1H vision work - stats and notification", status: "In Progress" },
  { key: "CPUX-5961", summary: "[UXD EPIC] Q1 -- Create the AuthZ onboarding experience", status: "In Progress" },
  { key: "CPUX-5957", summary: "[UXD EPIC] Q1 Vision -- AI generated UI in HCC: next steps", status: "In Progress" },
  { key: "CPUX-5993", summary: "[UXD EPIC] Create Amplitude Resources for team", status: "In Progress" },
  { key: "CPUX-5967", summary: "[UXD EPIC] Amplitude analytics: discovery and planning", status: "Refinement" },
  { key: "CPUX-6130", summary: "[UX Epic] UX Updates based off of Chatbot and Help Panel research", status: "In Progress" },
  { key: "CPUX-5987", summary: "[UXD EPIC] Help Panel Research", status: "In Progress" },
  { key: "CPUX-5530", summary: "[UXD EPIC] Workspace interactions through milestone 5", status: "New" },
  { key: "CPUX-5983", summary: "[UXD EPIC] Notification for Subscription Usage", status: "In Progress" },
  { key: "CPUX-5544", summary: "[UXD EPIC] In-context help + AI-enabled help", status: "In Progress" },
  { key: "CPUX-6012", summary: "[UXD Epic] A catch-all epic for miscellaneous chroming UX work (navigation, masthead, etc.)", status: "In Progress" },
  { key: "CPUX-5986", summary: "[UXD EPIC] Research for Cross Organization Sharing", status: "Refinement" },
  { key: "CPUX-5540", summary: "[UXD EPIC] Notifications + Integrations", status: "In Progress" },
];

export async function fetchEpics(): Promise<JiraEpic[]> {
  if (!CLOUD_ID || !EMAIL || !API_TOKEN) {
    return STATIC_EPICS;
  }

  try {
    const jql = `project = "${PROJECT_KEY}" AND component = "${COMPONENT}" AND issuetype = Epic AND statusCategory != Done ORDER BY updated DESC`;
    const params = new URLSearchParams({
      jql,
      maxResults: "50",
      fields: "summary,status",
    });

    const res = await jiraFetch(
      `${PROXY_BASE}/ex/jira/${CLOUD_ID}/rest/api/3/search/jql?${params}`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${EMAIL}:${API_TOKEN}`)}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) throw new Error(`Jira API ${res.status}`);
    const data = await res.json();

    return (data.issues ?? []).map(
      (raw: { key: string; fields: { summary: string; status: { name: string } } }): JiraEpic => ({
        key: raw.key,
        summary: raw.fields.summary,
        status: raw.fields.status.name,
      })
    );
  } catch (err) {
    console.error("Epic fetch error, falling back to static data", err);
    return STATIC_EPICS;
  }
}
