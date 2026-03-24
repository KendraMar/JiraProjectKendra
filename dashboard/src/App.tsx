import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  Page,
  Masthead,
  MastheadMain,
  MastheadBrand,
  PageSection,
  Label,
  Button,
  Spinner,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  Flex,
  FlexItem,
  Content,
  ExpandableSection,
  Card,
  CardBody,
  Tabs,
  Tab,
  TabTitleText,
  Select,
  SelectOption,
  MenuToggle,
  type MenuToggleElement,
  Badge,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  DrawerHead,
  DrawerPanelBody,
  DrawerActions,
  DrawerCloseButton,
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Divider,
  TextArea,
  FormGroup,
  Dropdown,
  DropdownItem,
  DropdownList,
  Alert,
  AlertGroup,
  AlertActionCloseButton,
  Tooltip,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@patternfly/react-table";
import { SyncAltIcon, ArrowsAltVIcon, LongArrowAltDownIcon, LongArrowAltUpIcon, ExclamationCircleIcon, ExclamationTriangleIcon, GripVerticalIcon, EllipsisVIcon } from "@patternfly/react-icons";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import type { JiraIssue, JiraEpic, JiraComment, SprintGroup } from "./types";
import { fetchIssues, fetchEpics, groupBySprint, browseUrl, createIssue, updateIssue } from "./services/jiraService";

// ── Label color helpers ──

// ── Due date urgency helper ──

function dueDateIcon(dueDate: string): React.ReactNode {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return <ExclamationCircleIcon style={{ color: "var(--pf-t--global--color--status--danger--default)", marginLeft: 6, fontSize: "1.8em" }} title="Overdue" />;
  }
  if (diffDays <= 2) {
    return <ExclamationTriangleIcon style={{ color: "var(--pf-t--global--color--status--warning--default)", marginLeft: 6, fontSize: "1.8em" }} title="Due soon" />;
  }
  return null;
}

type LabelColor =
  | "blue"
  | "green"
  | "grey"
  | "orange"
  | "red"
  | "purple"
  | "teal";

function statusColor(category: string): LabelColor {
  if (category === "In Progress") return "blue";
  if (category === "Done") return "green";
  return "grey";
}

function activityColor(activity: string): LabelColor {
  switch (activity) {
    case "Explore":
      return "teal";
    case "Make":
      return "blue";
    case "Enable":
      return "purple";
    case "Consult":
      return "orange";
    case "Orient":
      return "green";
    case "Monitor":
      return "grey";
    default:
      return "grey";
  }
}

// ── Inline column filter dropdown ──

const iconStyle: React.CSSProperties = { fontSize: "0.7em", color: "var(--pf-t--global--text--color--subtle)" };
const iconActiveStyle: React.CSSProperties = { ...iconStyle, color: "var(--pf-t--global--color--brand--default)" };

function ColumnFilter({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={(e) => { e.stopPropagation(); setIsOpen((prev) => !prev); }}
      isExpanded={isOpen}
      variant="plain"
      aria-label={`Filter ${label}`}
      style={{ padding: 0, lineHeight: 1 }}
    >
      <FilterIcon style={selected.length > 0 ? iconActiveStyle : iconStyle} />
      {selected.length > 0 && (
        <Badge isRead style={{ marginLeft: 2, fontSize: "0.65em" }}>{selected.length}</Badge>
      )}
    </MenuToggle>
  );

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <Select
        role="menu"
        aria-label={`Filter by ${label}`}
        isOpen={isOpen}
        selected={selected}
        onSelect={(_event, value) => onSelect(value as string)}
        onOpenChange={setIsOpen}
        toggle={toggle}
      >
        {options.map((opt) => (
          <SelectOption
            key={opt}
            value={opt}
            hasCheckbox
            isSelected={selected.includes(opt)}
          >
            {opt}
          </SelectOption>
        ))}
      </Select>
    </span>
  );
}

// ── Inline sort button ──

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Sort by ${label}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
    >
      {!active ? (
        <ArrowsAltVIcon style={iconStyle} />
      ) : direction === "asc" ? (
        <LongArrowAltDownIcon style={iconActiveStyle} />
      ) : (
        <LongArrowAltUpIcon style={iconActiveStyle} />
      )}
    </button>
  );
}

// ── Sprint issue table ──

const OWNER_COL = 0;
const STATUS_COL = 4;
const EPIC_COL = 5;

function SprintTable({ group, allEpicNames, onClickKey, droppableId, onModify, onClone }: { group: SprintGroup; allEpicNames: string[]; onClickKey: (issue: JiraIssue) => void; droppableId: string; onModify: (issue: JiraIssue) => void; onClone: (issue: JiraIssue) => void }) {
  const [activeSortIndex, setActiveSortIndex] = useState<number | undefined>(undefined);
  const [activeSortDirection, setActiveSortDirection] = useState<"asc" | "desc">("asc");
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [epicFilter, setEpicFilter] = useState<string[]>([]);

  const ownerOptions = useMemo(
    () => [...new Set(group.issues.map((i) => i.assigneeName))].sort(),
    [group.issues]
  );
  const statusOptions = useMemo(
    () => [...new Set(group.issues.map((i) => i.status))].sort(),
    [group.issues]
  );
  const epicOptions = useMemo(
    () => allEpicNames.length > 0 ? allEpicNames : [...new Set(group.issues.map((i) => i.epicName).filter(Boolean))].sort(),
    [allEpicNames, group.issues]
  );

  const toggleFilter = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) =>
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const filteredAndSorted = useMemo(() => {
    let result = group.issues;
    if (ownerFilter.length > 0)
      result = result.filter((i) => ownerFilter.includes(i.assigneeName));
    if (statusFilter.length > 0)
      result = result.filter((i) => statusFilter.includes(i.status));
    if (epicFilter.length > 0)
      result = result.filter((i) => epicFilter.includes(i.epicName));

    if (activeSortIndex !== undefined) {
      result = [...result].sort((a, b) => {
        let valA = "";
        let valB = "";
        if (activeSortIndex === OWNER_COL) {
          valA = a.assigneeName.toLowerCase();
          valB = b.assigneeName.toLowerCase();
        } else if (activeSortIndex === STATUS_COL) {
          valA = a.status.toLowerCase();
          valB = b.status.toLowerCase();
        } else if (activeSortIndex === EPIC_COL) {
          valA = a.epicName.toLowerCase();
          valB = b.epicName.toLowerCase();
        }
        const cmp = valA.localeCompare(valB);
        return activeSortDirection === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [group.issues, ownerFilter, statusFilter, epicFilter, activeSortIndex, activeSortDirection]);

  const handleSort = (col: number) => {
    if (activeSortIndex === col) {
      setActiveSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setActiveSortIndex(col);
      setActiveSortDirection("asc");
    }
  };

  return (
    <Table aria-label={`${group.name} issues`} variant="compact" style={{ width: "100%" }}>
      <Thead>
        <Tr>
          <Th style={{ width: 36, overflow: "visible" }} aria-label="Drag handle" />
          <Th style={{ whiteSpace: "nowrap", overflow: "visible", textOverflow: "clip", paddingRight: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              Owner
              <ColumnFilter label="Owner" options={ownerOptions} selected={ownerFilter} onSelect={(v) => toggleFilter(setOwnerFilter, v)} />
              <SortButton label="Owner" active={activeSortIndex === OWNER_COL} direction={activeSortDirection} onClick={() => handleSort(OWNER_COL)} />
            </span>
          </Th>
          <Th style={{ whiteSpace: "nowrap", overflow: "visible", textOverflow: "clip", paddingRight: 16 }}>Jira number</Th>
          <Th style={{ overflow: "visible", textOverflow: "clip", paddingRight: 16 }}>Summary</Th>
          <Th style={{ whiteSpace: "nowrap", overflow: "visible", textOverflow: "clip", paddingRight: 16 }}>Activity Type</Th>
          <Th style={{ whiteSpace: "nowrap", overflow: "visible", textOverflow: "clip", paddingRight: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              Status
              <ColumnFilter label="Status" options={statusOptions} selected={statusFilter} onSelect={(v) => toggleFilter(setStatusFilter, v)} />
              <SortButton label="Status" active={activeSortIndex === STATUS_COL} direction={activeSortDirection} onClick={() => handleSort(STATUS_COL)} />
            </span>
          </Th>
          <Th style={{ whiteSpace: "nowrap", overflow: "visible", textOverflow: "clip", paddingRight: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              Epic
              <ColumnFilter label="Epic" options={epicOptions} selected={epicFilter} onSelect={(v) => toggleFilter(setEpicFilter, v)} />
              <SortButton label="Epic" active={activeSortIndex === EPIC_COL} direction={activeSortDirection} onClick={() => handleSort(EPIC_COL)} />
            </span>
          </Th>
          <Th style={{ whiteSpace: "nowrap", overflow: "visible", textOverflow: "clip", width: "8%" }}>Story Points</Th>
          <Th style={{ whiteSpace: "nowrap", overflow: "visible", textOverflow: "clip", width: "8%" }}>Due Date</Th>
          <Th style={{ overflow: "visible", textOverflow: "clip" }}>Latest Comment</Th>
          <Th style={{ width: 48, overflow: "visible" }} aria-label="Actions" />
        </Tr>
      </Thead>
      <Droppable droppableId={droppableId} type="ISSUE">
        {(provided, snapshot) => (
          <Tbody ref={provided.innerRef} {...provided.droppableProps} style={snapshot.isDraggingOver ? { backgroundColor: "var(--pf-t--global--background--color--secondary--default)" } : undefined}>
            {filteredAndSorted.length === 0 && !snapshot.isDraggingOver ? (
              <Tr>
                <Td colSpan={11}>
                  <Content component="p">No tickets in this sprint yet.</Content>
                </Td>
              </Tr>
            ) : (
              filteredAndSorted.map((issue, index) => (
                <IssueRow key={issue.key} issue={issue} index={index} onClickKey={onClickKey} onModify={onModify} onClone={onClone} />
              ))
            )}
            {provided.placeholder}
          </Tbody>
        )}
      </Droppable>
    </Table>
  );
}

// ── Tabbed sprint section ──

const HCC_SPRINTS: { name: string; startDate: string; endDate: string }[] = [
  { name: "HCC Sprint 1 2026", startDate: "March 9", endDate: "March 20" },
  { name: "HCC Sprint 2 2026", startDate: "March 23", endDate: "April 3" },
  { name: "HCC Sprint 3 2026", startDate: "April 6", endDate: "April 17" },
  { name: "HCC Sprint 4 2026", startDate: "April 20", endDate: "May 1" },
];

function SprintTabs({ sprintGroups, allEpicNames, onClickKey, onModify, onClone, onCreate }: { sprintGroups: SprintGroup[]; allEpicNames: string[]; onClickKey: (issue: JiraIssue) => void; onModify: (issue: JiraIssue) => void; onClone: (issue: JiraIssue) => void; onCreate: (sprintName: string, sprintState: "active" | "future" | "backlog") => void }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const tabs: SprintGroup[] = HCC_SPRINTS.map(({ name, startDate, endDate }) => {
    const found = sprintGroups.find((g) => g.name === name);
    return found
      ? { ...found, startDate: found.startDate || startDate, endDate: found.endDate || endDate }
      : { name, state: "future" as const, startDate, endDate, issues: [] };
  });

  const totalTickets = tabs.reduce((sum, t) => sum + t.issues.length, 0);

  return (
    <ExpandableSection
      toggleContent={
        <Flex
          spaceItems={{ default: "spaceItemsSm" }}
          alignItems={{ default: "alignItemsCenter" }}
        >
          <FlexItem>
            <Title headingLevel="h3" size="lg">
              HCC Sprints
            </Title>
          </FlexItem>
          <FlexItem>
            <Label color="blue" isCompact>
              {totalTickets} tickets
            </Label>
          </FlexItem>
        </Flex>
      }
      isExpanded={isExpanded}
      onToggle={(_event, expanded) => setIsExpanded(expanded)}
    >
      <Tabs
        activeKey={activeTab}
        onSelect={(_event, key) => setActiveTab(key as number)}
        aria-label="HCC Sprint tabs"
        style={{ gap: 32 }}
      >
        {tabs.map((tab, idx) => (
          <Tab
            key={tab.name}
            eventKey={idx}
            style={{ marginRight: 48 }}
            title={
              <TabTitleText>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <span>
                    {tab.name.replace(" 2026", "")}
                  </span>
                  {tab.startDate && (
                    <span style={{ fontSize: "0.75em", fontWeight: 400, color: "var(--pf-t--global--text--color--subtle)" }}>
                      {tab.startDate} – {tab.endDate}
                    </span>
                  )}
                </span>
              </TabTitleText>
            }
          >
            <div style={{ padding: "12px 0" }}>
              <Button variant="primary" size="sm" onClick={() => onCreate(tab.name, tab.state as "active" | "future")}>+ Create story in this sprint</Button>
            </div>
            <SprintTable group={tab} allEpicNames={allEpicNames} onClickKey={onClickKey} droppableId={`sprint:${tab.state}:${tab.name}`} onModify={onModify} onClone={onClone} />
          </Tab>
        ))}
      </Tabs>
    </ExpandableSection>
  );
}

// ── Backlog section ──

function BacklogSection({ group, allEpicNames, onClickKey, onModify, onClone, onCreate }: { group: SprintGroup; allEpicNames: string[]; onClickKey: (issue: JiraIssue) => void; onModify: (issue: JiraIssue) => void; onClone: (issue: JiraIssue) => void; onCreate: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ExpandableSection
      toggleContent={
        <Flex
          spaceItems={{ default: "spaceItemsSm" }}
          alignItems={{ default: "alignItemsCenter" }}
        >
          <FlexItem>
            <Title headingLevel="h3" size="lg">
              Backlog
            </Title>
          </FlexItem>
          <FlexItem>
            <Label color="orange" isCompact>
              {group.issues.length} tickets
            </Label>
          </FlexItem>
        </Flex>
      }
      isExpanded={isExpanded}
      onToggle={(_event, expanded) => setIsExpanded(expanded)}
    >
      <div style={{ padding: "12px 0" }}>
        <Button variant="primary" size="sm" onClick={onCreate}>+ Create story in the backlog</Button>
      </div>
      <SprintTable group={group} allEpicNames={allEpicNames} onClickKey={onClickKey} droppableId="backlog" onModify={onModify} onClone={onClone} />
    </ExpandableSection>
  );
}

// ── Issue detail drawer panel ──

// ── Story points options with explanations ──

const STORY_POINT_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "0 — a very simple work item, entered primarily for transparency" },
  { value: 1, label: "1 — expected to require less than 25% of the Sprint to complete" },
  { value: 2, label: "2 — expected to require between 25-40% of the Sprint to complete" },
  { value: 3, label: "3 — expected to require between 40-60% of the Sprint to complete" },
  { value: 5, label: "5 — expected to require between 60-90% of the Sprint to complete" },
  { value: 8, label: "8 — expected to require most (90%+) of the Sprint to complete" },
  { value: 13, label: "13 — expected to require the full Sprint; likely too big, split or create an Epic" },
];

const ACTIVITY_TYPES = ["Consult", "Enable", "Explore", "Make", "Orient"];

// ── Reusable inline select for the detail panel ──

function PanelSelect({
  label,
  value,
  options,
  onSelect,
  highlight = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  highlight?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen((prev) => !prev)}
      isExpanded={isOpen}
      isFullWidth
      style={highlight ? { color: "var(--pf-t--global--color--status--danger--default)" } : undefined}
    >
      {value || `Select ${label}`}
    </MenuToggle>
  );

  return (
    <Select
      role="menu"
      aria-label={label}
      isOpen={isOpen}
      selected={value}
      onSelect={(_event, val) => { onSelect(val as string); setIsOpen(false); }}
      onOpenChange={setIsOpen}
      toggle={toggle}
    >
      {options.map((opt) => (
        <SelectOption key={opt.value} value={opt.value} isSelected={value === opt.value}>
          {opt.label}
        </SelectOption>
      ))}
    </Select>
  );
}

function IssueDetailPanel({
  issue,
  onClose,
  onUpdate,
  allStatuses,
  allMembers,
  allEpicNames,
  epicNameToKey,
  isClone = false,
  isBacklog = false,
  isSaving = false,
}: {
  issue: JiraIssue;
  onClose: () => void;
  onUpdate: (updated: JiraIssue) => void;
  allStatuses: string[];
  allMembers: string[];
  allEpicNames: string[];
  epicNameToKey: Map<string, string>;
  isClone?: boolean;
  isBacklog?: boolean;
  isSaving?: boolean;
}) {
  const [draft, setDraft] = useState<JiraIssue>({ ...issue });
  const [descExpanded, setDescExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [plainDesc, setPlainDesc] = useState("");

  const patch = (partial: Partial<JiraIssue>) => setDraft((prev) => ({ ...prev, ...partial }));

  const handleSave = () => onUpdate(draft);
  const handleCancel = () => onClose();

  const addComment = () => {
    const text = newComment.trim();
    if (!text) return;
    const comment: JiraComment = {
      author: "You",
      authorAvatar: "",
      body: text,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setDraft((prev) => ({ ...prev, comments: [comment, ...prev.comments] }));
    setNewComment("");
  };

  const missingFields: string[] = [];
  if (!draft.summary.trim()) missingFields.push("Summary");
  if (!draft.status) missingFields.push("Status");
  if (!draft.assigneeName || draft.assigneeName === "Unassigned") missingFields.push("Assignee");
  if (!draft.reporterName) missingFields.push("Reporter");
  if (!draft.description?.trim()) missingFields.push("Description");
  if (!draft.activityType) missingFields.push("Activity Type");
  if (draft.storyPoints == null) missingFields.push("Story Points");
  if (!draft.epicName) missingFields.push("Epic");
  if (!isBacklog && !draft.sprintName) missingFields.push("Sprint");

  const allFieldsFilled = missingFields.length === 0;

  const hasChanges = isClone || (
    draft.summary !== issue.summary ||
    draft.status !== issue.status ||
    draft.assigneeName !== issue.assigneeName ||
    draft.reporterName !== issue.reporterName ||
    draft.description !== issue.description ||
    draft.activityType !== issue.activityType ||
    draft.storyPoints !== issue.storyPoints ||
    draft.dueDate !== issue.dueDate ||
    draft.epicName !== issue.epicName ||
    draft.epicKey !== issue.epicKey ||
    draft.sprintName !== issue.sprintName ||
    draft.comments.length !== issue.comments.length
  );

  const canSave = allFieldsFilled && hasChanges;

  const statusOptions = allStatuses.map((s) => ({ value: s, label: s }));
  const memberOptions = allMembers.map((m) => ({ value: m, label: m }));
  const activityOptions = ACTIVITY_TYPES.map((a) => ({ value: a, label: a }));
  const spOptions = STORY_POINT_OPTIONS.map((sp) => ({ value: String(sp.value), label: sp.label }));
  const epicSelectOptions = allEpicNames.map((e) => ({ value: e, label: e }));

  return (
    <DrawerPanelContent widths={{ default: "width_50" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <DrawerHead>
          <div style={{ flex: 1 }}>
            {isClone ? (
              <>
                <Label color="blue" style={{ marginBottom: 8 }}>New story in this sprint</Label>
                <TextArea
                  value={draft.summary}
                  onChange={(_e, val) => patch({ summary: val })}
                  aria-label="Issue title"
                  autoResize
                  rows={1}
                  style={{ marginTop: 8, fontSize: "var(--pf-t--global--font--size--heading--h2)", fontWeight: 700, color: "var(--pf-t--global--color--status--danger--default)" }}
                />
              </>
            ) : (
              <>
                <Breadcrumb>
                  {issue.epicKey && (
                    <BreadcrumbItem>
                      <a href={browseUrl(issue.epicKey)} target="_blank" rel="noopener noreferrer">
                        {issue.epicKey}
                      </a>
                    </BreadcrumbItem>
                  )}
                  <BreadcrumbItem>
                    <a href={browseUrl(issue.key)} target="_blank" rel="noopener noreferrer">
                      {issue.key}
                    </a>
                  </BreadcrumbItem>
                </Breadcrumb>
                <TextArea
                  value={draft.summary}
                  onChange={(_e, val) => patch({ summary: val })}
                  aria-label="Issue title"
                  autoResize
                  rows={1}
                  style={{ marginTop: 8, fontSize: "var(--pf-t--global--font--size--heading--h2)", fontWeight: 700, width: "100%" }}
                />
              </>
            )}
            <Flex spaceItems={{ default: "spaceItemsMd" }} alignItems={{ default: "alignItemsCenter" }} style={{ marginTop: 12 }} flexWrap={{ default: "wrap" }}>
              <FlexItem>
                <FormGroup label="Status" fieldId="panel-status">
                  <PanelSelect label="Status" value={draft.status} options={statusOptions} onSelect={(v) => patch({ status: v })} highlight={isClone} />
                </FormGroup>
              </FlexItem>
              <FlexItem>
                <FormGroup label="Assignee" fieldId="panel-assignee">
                  <PanelSelect label="Assignee" value={draft.assigneeName} options={memberOptions} onSelect={(v) => patch({ assigneeName: v })} highlight={isClone} />
                </FormGroup>
              </FlexItem>
              <FlexItem>
                <FormGroup label="Reporter" fieldId="panel-reporter">
                  <PanelSelect label="Reporter" value={draft.reporterName} options={memberOptions} onSelect={(v) => patch({ reporterName: v })} highlight={isClone} />
                </FormGroup>
              </FlexItem>
            </Flex>
          </div>
          <DrawerActions>
            <DrawerCloseButton onClick={handleCancel} />
          </DrawerActions>
        </DrawerHead>

        <DrawerPanelBody style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          <Divider style={{ marginBottom: 16 }} />

          <ExpandableSection
            toggleText="Description"
            isExpanded={descExpanded}
            onToggle={(_e, expanded) => setDescExpanded(expanded)}
          >
            {editingDesc ? (
              <TextArea
                value={plainDesc}
                onChange={(_e, val) => setPlainDesc(val)}
                onBlur={() => { patch({ description: plainDesc }); setEditingDesc(false); }}
                aria-label="Description"
                autoResize
                rows={6}
                autoFocus
                style={{
                  width: "100%",
                  ...(isClone ? { color: "var(--pf-t--global--color--status--danger--default)" } : {}),
                }}
              />
            ) : (
              <div
                className="description-view"
                onClick={() => {
                  const tmp = document.createElement("div");
                  tmp.innerHTML = draft.description || "";
                  setPlainDesc(tmp.textContent || "");
                  setEditingDesc(true);
                }}
                style={{
                  cursor: "text",
                  minHeight: 60,
                  padding: 8,
                  border: "1px solid var(--pf-t--global--border--color--default)",
                  borderRadius: 4,
                  ...(isClone ? { color: "var(--pf-t--global--color--status--danger--default)" } : {}),
                }}
                dangerouslySetInnerHTML={{ __html: draft.description || "<em>Click to edit…</em>" }}
              />
            )}
          </ExpandableSection>

          <Divider style={{ margin: "16px 0" }} />

          <ExpandableSection
            toggleText="Details"
            isExpanded={detailsExpanded}
            onToggle={(_e, expanded) => setDetailsExpanded(expanded)}
          >
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Activity Type</DescriptionListTerm>
                <DescriptionListDescription>
                  <PanelSelect label="Activity Type" value={draft.activityType} options={activityOptions} onSelect={(v) => patch({ activityType: v })} highlight={isClone} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Story Points</DescriptionListTerm>
                <DescriptionListDescription>
                  <PanelSelect
                    label="Story Points"
                    value={draft.storyPoints != null ? String(draft.storyPoints) : ""}
                    options={spOptions}
                    onSelect={(v) => patch({ storyPoints: Number(v) })}
                    highlight={isClone}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Due Date<br /><span style={{ fontSize: "0.75em", fontWeight: 400, color: "var(--pf-t--global--color--nonstatus--gray--dark)" }}>(Optional)</span></DescriptionListTerm>
                <DescriptionListDescription>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="date"
                      value={draft.dueDate ? new Date(draft.dueDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const d = new Date(val + "T00:00:00");
                          const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                          patch({ dueDate: formatted });
                        } else {
                          patch({ dueDate: "" });
                        }
                      }}
                      style={{
                        padding: "4px 8px",
                        border: "1px solid var(--pf-t--global--border--color--default)",
                        borderRadius: 4,
                        ...(isClone ? { color: "var(--pf-t--global--color--status--danger--default)" } : {}),
                      }}
                    />
                    {dueDateIcon(draft.dueDate)}
                  </span>
                </DescriptionListDescription>
              </DescriptionListGroup>
              {!isBacklog && (
              <DescriptionListGroup>
                <DescriptionListTerm>Sprint</DescriptionListTerm>
                <DescriptionListDescription>
                  <PanelSelect
                    label="Sprint"
                    value={draft.sprintName || "Backlog"}
                    options={[
                      ...HCC_SPRINTS.map((s) => ({ value: s.name, label: s.name })),
                      { value: "Backlog", label: "Backlog" },
                    ]}
                    onSelect={(v) => {
                      if (v === "Backlog") {
                        patch({ sprintName: "", sprintState: "" as const });
                      } else {
                        const idx = HCC_SPRINTS.findIndex((s) => s.name === v);
                        const state = idx === 0 ? "active" : "future";
                        patch({ sprintName: v, sprintState: state as "active" | "future" });
                      }
                    }}
                    highlight={isClone}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>Epic</DescriptionListTerm>
                <DescriptionListDescription>
                  <PanelSelect label="Epic" value={draft.epicName} options={epicSelectOptions} onSelect={(v) => patch({ epicName: v, epicKey: epicNameToKey.get(v) ?? "" })} highlight={isClone} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </ExpandableSection>

          <Divider style={{ margin: "16px 0" }} />

          <ExpandableSection
            toggleText={`Comments (${draft.comments.length})`}
            isExpanded={commentsExpanded}
            onToggle={(_e, expanded) => setCommentsExpanded(expanded)}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
              <TextArea
                value={newComment}
                onChange={(_e, val) => setNewComment(val)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                aria-label="Add a comment"
                placeholder="Add a comment…"
                rows={2}
                autoResize
                style={{ flex: 1 }}
              />
              <Button variant="primary" onClick={addComment} isDisabled={!newComment.trim()} style={{ whiteSpace: "nowrap" }}>Add</Button>
            </div>

            <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
              {draft.comments.length === 0 ? (
                <Content component="small">No comments yet.</Content>
              ) : (
                <Flex direction={{ default: "column" }} spaceItems={{ default: "spaceItemsMd" }}>
                  {draft.comments.map((c, idx) => (
                    <FlexItem key={idx}>
                      <Flex spaceItems={{ default: "spaceItemsSm" }} alignItems={{ default: "alignItemsCenter" }}>
                        {c.authorAvatar && (
                          <FlexItem>
                            <img src={c.authorAvatar} alt={c.author} style={{ width: 24, height: 24, borderRadius: "50%" }} />
                          </FlexItem>
                        )}
                        <FlexItem>
                          <Content component="small"><strong>{c.author}</strong> · {c.created}</Content>
                        </FlexItem>
                      </Flex>
                      <div style={{ whiteSpace: "pre-wrap", marginTop: 4, paddingLeft: 32 }}>
                        {c.body}
                      </div>
                    </FlexItem>
                  ))}
                </Flex>
              )}
            </div>
          </ExpandableSection>
        </DrawerPanelBody>

        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid var(--pf-t--global--border--color--default)",
            backgroundColor: "var(--pf-t--global--background--color--primary--default)",
            display: "flex",
            gap: 12,
            flexShrink: 0,
          }}
        >
          {!canSave && !isSaving ? (
            <Tooltip
              content={
                !allFieldsFilled
                  ? `All fields except for Due Date must have a selection. You haven't entered a value for ${missingFields.join(", ")}.`
                  : "No changes have been made."
              }
            >
              <span tabIndex={0} style={{ display: "inline-block" }}>
                <Button variant="primary" isDisabled style={{ pointerEvents: "none" }}>
                  {isClone ? "Create" : "Save"}
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button variant="primary" onClick={handleSave} isLoading={isSaving} isDisabled={isSaving}>
              {isSaving ? "Creating…" : isClone ? "Create" : "Save"}
            </Button>
          )}
          <Button variant="link" onClick={handleCancel}>Cancel</Button>
        </div>
      </div>
    </DrawerPanelContent>
  );
}

// ── Single issue table row ──

function IssueRow({ issue, index, onClickKey, onModify, onClone }: { issue: JiraIssue; index: number; onClickKey: (issue: JiraIssue) => void; onModify: (issue: JiraIssue) => void; onClone: (issue: JiraIssue) => void }) {
  const [isKebabOpen, setIsKebabOpen] = useState(false);

  return (
    <Draggable draggableId={issue.key} index={index}>
      {(provided, snapshot) => (
        <Tr
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            ...(snapshot.isDragging
              ? { display: "table", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }
              : {}),
          }}
        >
          <Td style={{ width: 40 }}>
            <span
              {...provided.dragHandleProps}
              style={{ cursor: "grab", display: "inline-flex", alignItems: "center", color: "var(--pf-t--global--text--color--subtle)" }}
            >
              <GripVerticalIcon />
            </span>
          </Td>
          <Td dataLabel="Owner">
            <Flex
              spaceItems={{ default: "spaceItemsSm" }}
              alignItems={{ default: "alignItemsCenter" }}
              flexWrap={{ default: "nowrap" }}
            >
              {issue.assigneeAvatar ? (
                <FlexItem>
                  <img
                    src={issue.assigneeAvatar}
                    alt={issue.assigneeName}
                    title={issue.assigneeName}
                    style={{ width: 24, height: 24, borderRadius: "50%" }}
                  />
                </FlexItem>
              ) : null}
              <FlexItem>
                <Content component="small">{issue.assigneeName}</Content>
              </FlexItem>
            </Flex>
          </Td>
          <Td dataLabel="Key" style={{ whiteSpace: "nowrap" }}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onClickKey(issue); }}
              style={{ cursor: "pointer" }}
            >
              {issue.key}
            </a>
          </Td>
          <Td dataLabel="Summary">{issue.summary}</Td>
          <Td dataLabel="Activity Type">
            {issue.activityType ? (
              <Label color={activityColor(issue.activityType)} isCompact>
                {issue.activityType}
              </Label>
            ) : (
              <Content component="small">--</Content>
            )}
          </Td>
          <Td dataLabel="Status">
            <Label color={statusColor(issue.statusCategory)} isCompact>
              {issue.status}
            </Label>
          </Td>
          <Td dataLabel="Epic">
            {issue.epicName ? (
              <Content component="small">{issue.epicName}</Content>
            ) : (
              <Content component="small">--</Content>
            )}
          </Td>
          <Td dataLabel="Story Points">
            {issue.storyPoints != null ? issue.storyPoints : "--"}
          </Td>
          <Td dataLabel="Due Date" style={{ whiteSpace: "nowrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              {issue.dueDate || "--"}
              {dueDateIcon(issue.dueDate)}
            </span>
          </Td>
          <Td dataLabel="Latest Comment" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
            {issue.comments && issue.comments.length > 0 ? (() => {
              const latest = issue.comments[issue.comments.length - 1];
              const tmp = document.createElement("div");
              tmp.innerHTML = latest.body;
              const plain = tmp.textContent || "";
              return (
                <Content component="small" style={{ lineHeight: 1.4 }}>
                  <strong>{latest.created}</strong>{" — "}
                  {plain.length > 112 ? plain.slice(0, 112) + "…" : plain}
                </Content>
              );
            })() : (
              <Content component="small">--</Content>
            )}
          </Td>
          <Td dataLabel="Actions" style={{ width: 48 }}>
            <Dropdown
              isOpen={isKebabOpen}
              onSelect={() => setIsKebabOpen(false)}
              onOpenChange={setIsKebabOpen}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  variant="plain"
                  onClick={() => setIsKebabOpen((prev) => !prev)}
                  isExpanded={isKebabOpen}
                  aria-label="Row actions"
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
              popperProps={{ position: "right" }}
            >
              <DropdownList>
                <DropdownItem key="modify" onClick={() => onModify(issue)}>Modify</DropdownItem>
                <DropdownItem key="clone" onClick={() => onClone(issue)}>Clone</DropdownItem>
              </DropdownList>
            </Dropdown>
          </Td>
        </Tr>
      )}
    </Draggable>
  );
}

// ── Main App ──

// ── Main App ──

export default function App() {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [epics, setEpics] = useState<JiraEpic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
  const originalIssueRef = useRef<JiraIssue | null>(null);
  const [isCloneMode, setIsCloneMode] = useState(false);
  const [isBacklogCreate, setIsBacklogCreate] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; title: string; variant: "success" | "danger" }[]>([]);
  const cloneCounter = useRef(0);
  const toastIdRef = useRef(0);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [issueData, epicData] = await Promise.all([
        fetchIssues(),
        fetchEpics(),
      ]);
      setIssues(issueData);
      setEpics(epicData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sprintGroups = groupBySprint(issues);

  const allEpicNames = useMemo(
    () => epics.map((e) => e.summary).sort(),
    [epics]
  );

  const epicNameToKey = useMemo(
    () => new Map(epics.map((e) => [e.summary, e.key])),
    [epics]
  );

  const handleDragEnd = useCallback((result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const targetId = destination.droppableId;

    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.key !== draggableId) return issue;

        if (targetId === "backlog") {
          return { ...issue, sprintName: "", sprintState: "" as const };
        }

        const [, state, ...nameParts] = targetId.split(":");
        const sprintName = nameParts.join(":");
        return {
          ...issue,
          sprintName,
          sprintState: state as "active" | "future" | "closed" | "",
        };
      })
    );
  }, []);

  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadBrand>{undefined}</MastheadBrand>
      </MastheadMain>
    </Masthead>
  );

  const allStatuses = useMemo(
    () => [...new Set(issues.map((i) => i.status))].sort(),
    [issues]
  );
  const allMembers = useMemo(
    () => ["Asumi Hasan", "Kendra Marchant", "Mary Shakshober-Crossman", "SJ Cox", "Yichen Yu"],
    []
  );

  const handleModify = useCallback((issue: JiraIssue) => {
    setIsCloneMode(false);
    setIsBacklogCreate(false);
    originalIssueRef.current = { ...issue, comments: [...(issue.comments ?? [])] };
    setSelectedIssue(issue);
  }, []);

  const handleClone = useCallback((issue: JiraIssue) => {
    cloneCounter.current += 1;
    const clonedIssue: JiraIssue = {
      ...issue,
      key: `CPUX-NEW-${cloneCounter.current}`,
      summary: `Clone of ${issue.key}`,
      comments: [],
    };
    setIsCloneMode(true);
    setSelectedIssue(clonedIssue);
  }, []);

  const handleCreateIssue = useCallback((sprintName: string, sprintState: "active" | "future" | "backlog") => {
    cloneCounter.current += 1;
    const newIssue: JiraIssue = {
      key: `CPUX-NEW-${cloneCounter.current}`,
      summary: "",
      issueType: "Story",
      status: "To Do",
      statusCategory: "To Do",
      priority: "Unprioritized",
      activityType: "",
      epicName: "",
      epicKey: "",
      storyPoints: null,
      sprintName: sprintState === "backlog" ? "" : sprintName,
      sprintState: sprintState === "backlog" ? "" : sprintState,
      sprintStartDate: "",
      sprintEndDate: "",
      assigneeName: "",
      assigneeAvatar: "",
      reporterName: "Kendra Marchant",
      description: "",
      dueDate: "",
      comments: [],
    };
    setIsCloneMode(true);
    setIsBacklogCreate(sprintState === "backlog");
    setSelectedIssue(newIssue);
  }, []);

  const addToast = useCallback((title: string, variant: "success" | "danger" = "success") => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((prev) => [...prev, { id, title, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  }, []);

  const [saving, setSaving] = useState(false);

  const handleIssueUpdate = useCallback(async (updated: JiraIssue) => {
    if (isCloneMode) {
      setSaving(true);
      try {
        const created = await createIssue(updated);
        setIssues((prev) => [...prev, created]);
        const destination = created.sprintName || "Backlog";
        addToast(`${created.key} created and added to ${destination}`);
        setIsCloneMode(false);
        setSelectedIssue(null);
      } catch (err) {
        console.error("Failed to create Jira issue", err);
        addToast(`Failed to create issue: ${(err as Error).message}`, "danger");
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      try {
        const original = originalIssueRef.current;
        let saved: JiraIssue;
        if (original) {
          saved = await updateIssue(updated, original);
        } else {
          saved = updated;
        }
        setIssues((prev) => prev.map((i) => (i.key === saved.key ? saved : i)));
        originalIssueRef.current = { ...saved, comments: [...(saved.comments ?? [])] };
        setSelectedIssue(saved);
        addToast(`${saved.key} updated successfully`);
      } catch (err) {
        console.error("Failed to update Jira issue", err);
        addToast(`Failed to update ${updated.key}: ${(err as Error).message}`, "danger");
      } finally {
        setSaving(false);
      }
    }
  }, [isCloneMode, addToast]);

  const handlePanelClose = useCallback(() => {
    setIsCloneMode(false);
    setIsBacklogCreate(false);
    setSelectedIssue(null);
  }, []);

  const drawerPanel = selectedIssue ? (
    <IssueDetailPanel
      issue={selectedIssue}
      onClose={handlePanelClose}
      onUpdate={handleIssueUpdate}
      allStatuses={allStatuses}
      allMembers={allMembers}
      allEpicNames={allEpicNames}
      epicNameToKey={epicNameToKey}
      isClone={isCloneMode}
      isBacklog={isBacklogCreate}
      isSaving={saving}
    />
  ) : undefined;

  return (
    <Page masthead={masthead}>
      <AlertGroup isToast isLiveRegion>
        {toasts.map((t) => (
          <Alert
            key={t.id}
            variant={t.variant}
            title={t.title}
            actionClose={<AlertActionCloseButton onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />}
          />
        ))}
      </AlertGroup>
      <Drawer isExpanded={selectedIssue !== null} onExpand={() => {}}>
        <DrawerContent panelContent={drawerPanel ?? <></>}>
          <DrawerContentBody onClick={() => { if (selectedIssue) handlePanelClose(); }}>
      {/* ── Header toolbar ── */}
      <PageSection aria-label="Dashboard header">
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                  <img
                    src="/consolepuffs-logo.jpg"
                    alt="Consolepuffs"
                    style={{ borderRadius: 6 }}
                  />
                  <Title headingLevel="h1" size="4xl">
                    Consolepuffs Jira Board
                  </Title>
                </div>
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup align={{ default: "alignEnd" }}>
              <ToolbarItem>
                <Button
                  variant="primary"
                  icon={<SyncAltIcon />}
                  isLoading={refreshing}
                  isDisabled={refreshing}
                  onClick={() => loadData(true)}
                >
                  {refreshing ? "Refreshing…" : "Refresh"}
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </PageSection>

      {/* ── Loading state ── */}
      {loading ? (
        <PageSection aria-label="Loading" isFilled>
          <Flex justifyContent={{ default: "justifyContentCenter" }}>
            <Spinner size="xl" aria-label="Loading tickets" />
          </Flex>
        </PageSection>
      ) : (
        <PageSection
          isFilled
          aria-label="Dashboard content"
          style={{ backgroundColor: "var(--pf-t--global--background--color--secondary--default)" }}
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            <Flex
              direction={{ default: "column" }}
              spaceItems={{ default: "spaceItemsLg" }}
            >
              {/* ── Sprints card ── */}
              <FlexItem>
                <Card>
                  <CardBody>
                    <SprintTabs
                      sprintGroups={sprintGroups.filter(
                        (g) => g.state !== "backlog"
                      )}
                      allEpicNames={allEpicNames}
                      onClickKey={handleModify}
                      onModify={handleModify}
                      onClone={handleClone}
                      onCreate={handleCreateIssue}
                    />
                  </CardBody>
                </Card>
              </FlexItem>

              {/* ── Backlog card ── */}
              <FlexItem>
                <Card>
                  <CardBody>
                    <BacklogSection
                      group={sprintGroups.find((g) => g.state === "backlog") ?? { name: "Backlog", state: "backlog", issues: [] }}
                      allEpicNames={allEpicNames}
                      onClickKey={handleModify}
                      onModify={handleModify}
                      onClone={handleClone}
                      onCreate={() => handleCreateIssue("Backlog", "backlog")}
                    />
                  </CardBody>
                </Card>
              </FlexItem>

              {/* ── Epics card ── */}
              <FlexItem>
              <Card>
                <CardBody>
                  <ExpandableSection
                    toggleContent={
                      <Flex
                        spaceItems={{ default: "spaceItemsSm" }}
                        alignItems={{ default: "alignItemsCenter" }}
                      >
                        <FlexItem>
                          <Title headingLevel="h3" size="lg">
                            Active Epics
                          </Title>
                        </FlexItem>
                        <FlexItem>
                          <Label color="purple" isCompact>
                            {epics.length}
                          </Label>
                        </FlexItem>
                      </Flex>
                    }
                  >
                    <Table aria-label="Active Epics table" variant="compact">
                      <Thead>
                        <Tr>
                          <Th width={15}>Key</Th>
                          <Th>Summary</Th>
                          <Th width={15}>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {epics.map((epic) => (
                          <Tr key={epic.key}>
                            <Td dataLabel="Key">
                              <a href={browseUrl(epic.key)} target="_blank" rel="noopener noreferrer">
                                {epic.key}
                              </a>
                            </Td>
                            <Td dataLabel="Summary">{epic.summary}</Td>
                            <Td dataLabel="Status">
                              <Label
                                color={
                                  epic.status === "In Progress"
                                    ? "blue"
                                    : epic.status === "Refinement"
                                      ? "orange"
                                      : "grey"
                                }
                                isCompact
                              >
                                {epic.status}
                              </Label>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </ExpandableSection>
                </CardBody>
              </Card>
            </FlexItem>
            </Flex>
          </DragDropContext>
        </PageSection>
      )}
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </Page>
  );
}
