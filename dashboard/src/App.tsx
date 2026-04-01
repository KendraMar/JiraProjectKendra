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
  SearchInput,
  Form,
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
import { SyncAltIcon, ArrowsAltVIcon, LongArrowAltDownIcon, LongArrowAltUpIcon, ExclamationCircleIcon, ExclamationTriangleIcon, GripVerticalIcon, EllipsisVIcon, ExternalLinkAltIcon, ListIcon, MagicIcon, PaperclipIcon, LinkIcon, PlusCircleIcon } from "@patternfly/react-icons";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import type { JiraIssue, JiraEpic, JiraComment, SprintGroup } from "./types";
import { fetchIssues, fetchEpics, groupBySprint, browseUrl, createIssue, updateIssue, moveToSprint, attachFile, fetchSingleIssue } from "./services/jiraService";
import { SprintHighlightsModal } from "./SprintHighlightsModal";

const JIRA_CPUX_BOARD_URL =
  "https://redhat.atlassian.net/jira/software/c/projects/CPUX/boards/6195";

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

// ── Persisted state hook (survives HMR and data refreshes) ──

function usePersistedState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
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
  const filterKey = droppableId.replace(/[^a-zA-Z0-9]/g, "_");
  const [activeSortIndex, setActiveSortIndex] = usePersistedState<number | undefined>(`sort_idx:${filterKey}`, undefined);
  const [activeSortDirection, setActiveSortDirection] = usePersistedState<"asc" | "desc">(`sort_dir:${filterKey}`, "asc");
  const [ownerFilter, setOwnerFilter] = usePersistedState<string[]>(`filter_owner:${filterKey}`, []);
  const [statusFilter, setStatusFilter] = usePersistedState<string[]>(`filter_status:${filterKey}`, []);
  const [epicFilter, setEpicFilter] = usePersistedState<string[]>(`filter_epic:${filterKey}`, []);

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
          valA = (a.assigneeName.split(" ")[0] ?? "").toLowerCase();
          valB = (b.assigneeName.split(" ")[0] ?? "").toLowerCase();
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

function DroppableTab({ droppableId, label, subtitle, isActive, onClick, style }: { droppableId: string; label: string; subtitle?: string; isActive: boolean; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <Droppable droppableId={droppableId} type="ISSUE">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          onClick={onClick}
          style={{
            ...style,
            padding: "8px 16px 10px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            borderBottom: snapshot.isDraggingOver
              ? "3px solid var(--pf-t--global--color--brand--default)"
              : isActive
                ? "3px solid var(--pf-t--global--color--brand--default)"
                : "3px solid transparent",
            backgroundColor: snapshot.isDraggingOver
              ? "var(--pf-t--global--background--color--secondary--default)"
              : "transparent",
            fontWeight: isActive ? 600 : 400,
            outline: snapshot.isDraggingOver
              ? "2px dashed var(--pf-t--global--color--brand--default)"
              : "none",
            outlineOffset: -2,
            borderRadius: snapshot.isDraggingOver ? 4 : 0,
            boxShadow: snapshot.isDraggingOver ? "0 0 8px rgba(0,102,204,0.25)" : "none",
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span>{label}</span>
            {subtitle && (
              <span style={{ fontSize: "0.75em", fontWeight: 400, color: "var(--pf-t--global--text--color--subtle)" }}>
                {subtitle}
              </span>
            )}
          </span>
          <div style={{ display: "none" }}>{provided.placeholder}</div>
        </div>
      )}
    </Droppable>
  );
}

function SprintTabs({ sprintGroups, allEpicNames, onClickKey, onModify, onClone, onCreate, onOpenSprintHighlights }: { sprintGroups: SprintGroup[]; allEpicNames: string[]; onClickKey: (issue: JiraIssue) => void; onModify: (issue: JiraIssue) => void; onClone: (issue: JiraIssue) => void; onCreate: (sprintName: string, sprintState: "active" | "future" | "backlog", startDate?: string, endDate?: string) => void; onOpenSprintHighlights: (group: SprintGroup) => void }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const defaultTab = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    for (let i = 0; i < HCC_SPRINTS.length; i++) {
      const start = new Date(`${HCC_SPRINTS[i].startDate} ${year}`);
      const end = new Date(`${HCC_SPRINTS[i].endDate} ${year}`);
      end.setHours(23, 59, 59, 999);
      if (today >= start && today <= end) return i;
    }
    return 0;
  }, []);
  const [activeTab, setActiveTab] = usePersistedState("sprint_active_tab", defaultTab);

  const tabs: SprintGroup[] = HCC_SPRINTS.map(({ name, startDate, endDate }) => {
    const found = sprintGroups.find((g) => g.name === name);
    return found
      ? { ...found, startDate: found.startDate || startDate, endDate: found.endDate || endDate }
      : { name, state: "future" as const, startDate, endDate, issues: [] };
  });

  const tabCount = tabs.length;
  const maxTabIndex = Math.max(0, tabCount - 1);
  useEffect(() => {
    if (activeTab > maxTabIndex || activeTab < 0) {
      setActiveTab(Math.min(defaultTab, maxTabIndex));
    }
  }, [activeTab, maxTabIndex, defaultTab, setActiveTab]);

  const safeTabIndex = Math.min(Math.max(0, activeTab), maxTabIndex);
  const activeTabData = tabs[safeTabIndex];

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
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--pf-t--global--border--color--default)", marginBottom: 8 }}>
        {tabs.map((tab, idx) => (
          <DroppableTab
            key={tab.name}
            droppableId={`tab:${tab.state}:${tab.name}`}
            label={tab.name.replace(" 2026", "")}
            subtitle={tab.startDate ? `${tab.startDate} – ${tab.endDate}` : undefined}
            isActive={idx === safeTabIndex}
            onClick={() => setActiveTab(idx)}
            style={{ marginRight: 32 }}
          />
        ))}
      </div>
      {activeTabData && (
        <>
          <div style={{ padding: "12px 0", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="primary" size="sm" onClick={() => onCreate(activeTabData.name, activeTabData.state as "active" | "future", activeTabData.startDate, activeTabData.endDate)}>+ Create story in this sprint</Button>
            <Button variant="secondary" size="sm" icon={<MagicIcon />} onClick={() => onOpenSprintHighlights(activeTabData)}>Generate sprint highlights</Button>
          </div>
          <SprintTable group={activeTabData} allEpicNames={allEpicNames} onClickKey={onClickKey} droppableId={`sprint:${activeTabData.state}:${activeTabData.name}`} onModify={onModify} onClone={onClone} />
        </>
      )}
    </ExpandableSection>
  );
}

// ── Backlog section ──

function BacklogSection({ group, allEpicNames, onClickKey, onModify, onClone, onCreate, forceExpand }: { group: SprintGroup; allEpicNames: string[]; onClickKey: (issue: JiraIssue) => void; onModify: (issue: JiraIssue) => void; onClone: (issue: JiraIssue) => void; onCreate: () => void; forceExpand?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expanded = forceExpand || isExpanded;

  return (
    <Droppable droppableId="backlog-header" type="ISSUE">
      {(headerProvided, headerSnapshot) => (
        <div
          ref={headerProvided.innerRef}
          {...headerProvided.droppableProps}
          style={{
            borderRadius: 6,
            transition: "all 0.2s ease",
            border: headerSnapshot.isDraggingOver
              ? "2px dashed var(--pf-t--global--color--status--warning--default)"
              : "2px solid transparent",
            backgroundColor: headerSnapshot.isDraggingOver
              ? "var(--pf-t--global--background--color--primary--default)"
              : "transparent",
            boxShadow: headerSnapshot.isDraggingOver ? "0 0 8px rgba(240,171,0,0.3)" : "none",
          }}
        >
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
            isExpanded={expanded}
            onToggle={(_event, exp) => setIsExpanded(exp)}
          >
            <div style={{ padding: "12px 0" }}>
              <Button variant="primary" size="sm" onClick={onCreate}>+ Create story in the backlog</Button>
            </div>
            <SprintTable group={group} allEpicNames={allEpicNames} onClickKey={onClickKey} droppableId="backlog" onModify={onModify} onClone={onClone} />
          </ExpandableSection>
          <div style={{ display: "none" }}>{headerProvided.placeholder}</div>
        </div>
      )}
    </Droppable>
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
  typeAhead = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  highlight?: boolean;
  typeAhead?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = typeAhead && filterText
    ? options.filter((o) => o.label.toLowerCase().includes(filterText.toLowerCase()))
    : options;

  const displayValue = options.find((o) => o.value === value)?.label || value;

  const handleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setFilterText("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={handleOpen}
      isExpanded={isOpen}
      isFullWidth
      style={highlight ? { color: "var(--pf-t--global--color--status--danger--default)" } : undefined}
    >
      {typeAhead && isOpen ? (
        <input
          ref={inputRef}
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder={displayValue || `Search ${label}…`}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            width: "100%",
            fontSize: "inherit",
            fontFamily: "inherit",
            color: "inherit",
          }}
        />
      ) : (
        displayValue || `Select ${label}`
      )}
    </MenuToggle>
  );

  return (
    <Select
      role="menu"
      aria-label={label}
      isOpen={isOpen}
      selected={value}
      onSelect={(_event, val) => {
        onSelect(val as string);
        setIsOpen(false);
        setFilterText("");
      }}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setFilterText("");
      }}
      toggle={toggle}
    >
      {filteredOptions.length === 0 ? (
        <SelectOption isDisabled value="__no_match__">No matches</SelectOption>
      ) : (
        filteredOptions.map((opt) => (
          <SelectOption key={opt.value} value={opt.value} isSelected={value === opt.value}>
            {opt.label}
          </SelectOption>
        ))
      )}
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
  const [uploading, setUploading] = useState(false);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [commentDragOver, setCommentDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descFileInputRef = useRef<HTMLInputElement>(null);
  const [descDirty, setDescDirty] = useState(false);
  const descEditorRef = useRef<HTMLDivElement>(null);

  const patch = (partial: Partial<JiraIssue>) => setDraft((prev) => ({ ...prev, ...partial }));

  const syncDescFromEditor = () => {
    if (descEditorRef.current) {
      patch({ description: descEditorRef.current.innerHTML });
      setDescDirty(true);
    }
  };

  const execDesc = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    descEditorRef.current?.focus();
  };

  const handleDescFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !issue.key || isClone) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await attachFile(issue.key, file);
        const isImage = file.type.startsWith("image/");
        const proxyUrl = result.url.replace("https://api.atlassian.com", "/jira-img");
        if (descEditorRef.current) {
          descEditorRef.current.focus();
          if (isImage) {
            document.execCommand("insertHTML", false,
              `<a href="${proxyUrl}" target="_blank" rel="noopener noreferrer"><img src="${proxyUrl}" alt="${result.filename}" style="max-width:100%;border-radius:4px;margin:4px 0;cursor:pointer" /></a>`);
          } else {
            document.execCommand("insertHTML", false,
              `<a href="${result.url}" target="_blank" rel="noopener noreferrer">📎 ${result.filename}</a>`);
          }
          syncDescFromEditor();
        }
      }
    } catch (err) {
      console.error("File upload failed", err);
      alert(`Upload failed: ${(err as Error).message}`);
    } finally {
      setUploading(false);
      if (descFileInputRef.current) descFileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!descDirty) {
      onUpdate({ ...draft, description: issue.description });
    } else {
      const liveHtml = descEditorRef.current?.innerHTML ?? draft.description;
      onUpdate({ ...draft, description: liveHtml });
    }
  };
  const handleCancel = () => onClose();

  const insertBullet = () => {
    setNewComment((prev) => {
      const lines = prev.split("\n");
      const lastLine = lines[lines.length - 1];
      if (lastLine.startsWith("- ")) return prev;
      const prefix = prev && !prev.endsWith("\n") ? "\n" : "";
      return prev + prefix + "- ";
    });
  };

  const insertUrl = () => {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    const label = window.prompt("Link text (leave blank to use URL):", "") || url;
    setNewComment((prev) => {
      const separator = prev && !prev.endsWith("\n") && !prev.endsWith(" ") ? " " : "";
      return prev + separator + `[${label}](${url})`;
    });
  };

  const handleCommentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setCommentFiles((prev) => [...prev, ...Array.from(files)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCommentDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCommentDragOver(false);
    if (isClone) return;
    const files = e.dataTransfer.files;
    if (files?.length) {
      setCommentFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeCommentFile = (index: number) => {
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addComment = async () => {
    const text = newComment.trim();
    const hasFiles = commentFiles.length > 0;
    if (!text && !hasFiles) return;
    setUploadError("");

    const imgify = (s: string) =>
      s.replace(/!\[([^\]]*)\]\((\/jira-img\/[^\s)]+|https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" title="Click to view full size"><img src="$2" alt="$1" style="max-width:100%;border-radius:4px;margin:4px 0;cursor:pointer" /></a>');
    const linkify = (s: string) =>
      imgify(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    const lines = text ? text.split("\n") : [];
    const htmlParts: string[] = [];
    let bulletBuffer: string[] = [];
    const flushBullets = () => {
      if (bulletBuffer.length) {
        htmlParts.push("<ul>" + bulletBuffer.map((b) => `<li>${linkify(b)}</li>`).join("") + "</ul>");
        bulletBuffer = [];
      }
    };
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        bulletBuffer.push(trimmed.slice(2));
      } else {
        flushBullets();
        if (trimmed) htmlParts.push(`<p>${linkify(trimmed)}</p>`);
      }
    }
    flushBullets();

    if (hasFiles && issue.key && !isClone) {
      setUploading(true);
      try {
        for (const file of commentFiles) {
          const result = await attachFile(issue.key, file);
          const isImage = file.type.startsWith("image/");
          const proxyUrl = result.url.replace("https://api.atlassian.com", "/jira-img");
          if (isImage) {
            htmlParts.push(`<a href="${proxyUrl}" target="_blank" rel="noopener noreferrer" title="Click to view full size"><img src="${proxyUrl}" alt="${result.filename}" style="max-width:100%;border-radius:4px;margin:4px 0;cursor:pointer" /></a>`);
          } else {
            htmlParts.push(`<p><a href="${result.url}" target="_blank" rel="noopener noreferrer">📎 ${result.filename}</a></p>`);
          }
        }
      } catch (err) {
        console.error("File upload failed", err);
        setUploadError(`Upload failed: ${(err as Error).message}`);
        setUploading(false);
        return;
      }
      setUploading(false);
    } else if (hasFiles) {
      for (const file of commentFiles) {
        htmlParts.push(`<p>📎 ${file.name}</p>`);
      }
    }

    const now = new Date();
    const comment: JiraComment = {
      author: "You",
      authorAvatar: "",
      body: htmlParts.join(""),
      created: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      createdIso: now.toISOString(),
    };
    setDraft((prev) => ({ ...prev, comments: [comment, ...prev.comments] }));
    setNewComment("");
    setCommentFiles([]);
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
  const epicSelectOptions = allEpicNames.map((e) => {
    const key = epicNameToKey.get(e) ?? "";
    return { value: e, label: key ? `${key}  —  ${e}` : e };
  });

  return (
    <DrawerPanelContent widths={{ default: "width_50" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <DrawerHead>
          <div style={{ flex: 1 }}>
            {isClone ? (
              <>
                <Label color="blue" style={{ marginBottom: 8 }}>
                  {draft.sprintName
                    ? `New story in ${draft.sprintName}${draft.sprintStartDate || draft.sprintEndDate ? `, ${draft.sprintStartDate ?? ""}–${draft.sprintEndDate ?? ""}` : ""}`
                    : "New story in Backlog"}
                </Label>
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
            <div style={{ border: "1px solid var(--pf-t--global--border--color--default)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 2, padding: "4px 6px", background: "var(--pf-t--global--background--color--secondary--default)", borderBottom: "1px solid var(--pf-t--global--border--color--default)", flexWrap: "wrap", alignItems: "center" }}>
                <Tooltip content="Bold (Cmd+B)">
                  <Button variant="plain" size="sm" onClick={() => execDesc("bold")} aria-label="Bold" style={{ padding: "2px 6px" }}>
                    <strong>B</strong>
                  </Button>
                </Tooltip>
                <Tooltip content="Italic (Cmd+I)">
                  <Button variant="plain" size="sm" onClick={() => execDesc("italic")} aria-label="Italic" style={{ padding: "2px 6px" }}>
                    <em>I</em>
                  </Button>
                </Tooltip>
                <Tooltip content="Heading">
                  <Button variant="plain" size="sm" onClick={() => execDesc("formatBlock", "<h3>")} aria-label="Heading" style={{ padding: "2px 6px", fontWeight: 700 }}>
                    H
                  </Button>
                </Tooltip>
                <Tooltip content="Bullet list">
                  <Button variant="plain" size="sm" onClick={() => execDesc("insertUnorderedList")} aria-label="Bullet list" style={{ padding: "2px 6px" }}>
                    <ListIcon />
                  </Button>
                </Tooltip>
                <Tooltip content="Numbered list">
                  <Button variant="plain" size="sm" onClick={() => execDesc("insertOrderedList")} aria-label="Numbered list" style={{ padding: "2px 6px" }}>
                    1.
                  </Button>
                </Tooltip>
                <Tooltip content={isClone ? "Save first to attach files" : "Attach file to description"}>
                  <Button variant="plain" size="sm" onClick={() => descFileInputRef.current?.click()} aria-label="Attach file" style={{ padding: "2px 6px" }} isDisabled={isClone || uploading} isLoading={uploading}>
                    <PaperclipIcon />
                  </Button>
                </Tooltip>
                <input type="file" ref={descFileInputRef} style={{ display: "none" }} multiple onChange={handleDescFileUpload} />
              </div>
              <div
                ref={(el) => {
                  (descEditorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                  if (el && !el.dataset.init) {
                    el.innerHTML = draft.description || "";
                    el.dataset.init = "1";
                  }
                }}
                className="description-view"
                contentEditable
                suppressContentEditableWarning
                onInput={() => setDescDirty(true)}
                onBlur={syncDescFromEditor}
                style={{
                  minHeight: 80,
                  padding: 8,
                  outline: "none",
                  ...(isClone ? { color: "var(--pf-t--global--color--status--danger--default)" } : {}),
                }}
              />
            </div>
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
                  <PanelSelect label="Epic" value={draft.epicName} options={epicSelectOptions} onSelect={(v) => patch({ epicName: v, epicKey: epicNameToKey.get(v) ?? "" })} highlight={isClone} typeAhead />
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
            <div
              style={{
                marginBottom: 12,
                border: commentDragOver ? "2px dashed var(--pf-t--global--color--brand--default, #0066cc)" : "2px dashed transparent",
                borderRadius: 6,
                padding: commentDragOver ? 8 : 0,
                background: commentDragOver ? "rgba(0,102,204,0.05)" : "transparent",
                transition: "all 0.15s ease",
              }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setCommentDragOver(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setCommentDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setCommentDragOver(false); }}
              onDrop={handleCommentDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                multiple
                onChange={handleCommentFileSelect}
              />
              <div style={{ marginBottom: 4, display: "flex", gap: 2 }}>
                <Tooltip content="Insert bullet list">
                  <Button variant="plain" size="sm" onClick={insertBullet} aria-label="Insert bullet list" style={{ padding: "2px 6px" }}>
                    <ListIcon />
                  </Button>
                </Tooltip>
                <Tooltip content="Insert link">
                  <Button variant="plain" size="sm" onClick={insertUrl} aria-label="Insert link" style={{ padding: "2px 6px" }}>
                    <LinkIcon />
                  </Button>
                </Tooltip>
                <Tooltip content={isClone ? "Save the issue first to attach files" : "Attach file or drag & drop"}>
                  <Button
                    variant="plain"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file"
                    style={{ padding: "2px 6px" }}
                    isDisabled={isClone || uploading}
                    isLoading={uploading}
                  >
                    <PaperclipIcon />
                  </Button>
                </Tooltip>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <TextArea
                  value={newComment}
                  onChange={(_e, val) => setNewComment(val)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      const lines = newComment.split("\n");
                      const lastLine = lines[lines.length - 1];
                      if (lastLine.startsWith("- ") || lastLine.startsWith("* ")) {
                        e.preventDefault();
                        setNewComment((prev) => prev + "\n- ");
                        return;
                      }
                      e.preventDefault();
                      addComment();
                    }
                  }}
                  aria-label="Add a comment"
                  placeholder={commentDragOver ? "Drop files here…" : "Add a comment… (use - for bullets, drag & drop files here)"}
                  rows={2}
                  autoResize
                  style={{ flex: 1 }}
                />
                <Button
                  variant="primary"
                  onClick={addComment}
                  isDisabled={(!newComment.trim() && commentFiles.length === 0) || uploading}
                  isLoading={uploading}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {uploading ? "Uploading…" : "Add"}
                </Button>
              </div>
              {commentFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {commentFiles.map((file, idx) => (
                    <Label
                      key={`${file.name}-${idx}`}
                      color="blue"
                      onClose={() => removeCommentFile(idx)}
                      icon={<PaperclipIcon />}
                    >
                      {file.name}{file.size < 1024 * 1024 ? ` (${Math.round(file.size / 1024)} KB)` : ` (${(file.size / (1024 * 1024)).toFixed(1)} MB)`}
                    </Label>
                  ))}
                </div>
              )}
              {uploadError && (
                <Alert variant="danger" isInline isPlain title={uploadError} style={{ marginTop: 8 }} actionClose={<AlertActionCloseButton onClose={() => setUploadError("")} />} />
              )}
              {commentDragOver && (
                <div style={{ textAlign: "center", padding: "8px 0", color: "var(--pf-t--global--color--brand--default, #0066cc)", fontSize: "0.85em", fontWeight: 600 }}>
                  Drop files to attach to this comment
                </div>
              )}
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
                      <div
                        className="description-view"
                        style={{ marginTop: 4, paddingLeft: 32 }}
                        dangerouslySetInnerHTML={{ __html: c.body }}
                      />
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
              <Content component="small">{issue.epicKey ? `${issue.epicKey}  —  ` : ""}{issue.epicName}</Content>
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

// ── Epic create panel (drawer) ──

const PROBLEM_TYPE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "problem-statement-uxd-data-driven", label: "Yes — UXD Data-driven" },
  { value: "problem-statement-data-driven", label: "Yes — Data-driven" },
  { value: "problem-statement-assumption", label: "No — Assumption-based" },
];

type EpicFormState = {
  title: string;
  what: string;
  status: string;
  assigneeName: string;
  reporterName: string;
  problemType: "" | "problem-statement-uxd-data-driven" | "problem-statement-data-driven" | "problem-statement-assumption";
  targetUser: string;
  specificIssue: string;
  dataSource: string;
  specificMetrics: string;
  impact: string;
  reason: string;
  assumptionSource: string;
  definitionOfDone: string;
  additionalContext: string;
};

function EpicCreatePanel({
  epicForm,
  setEpicForm,
  onSave,
  onClose,
  isSaving,
  allStatuses,
  allMembers,
}: {
  epicForm: EpicFormState;
  setEpicForm: React.Dispatch<React.SetStateAction<EpicFormState>>;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
  allStatuses: string[];
  allMembers: string[];
}) {
  const [problemTypeOpen, setProblemTypeOpen] = useState(false);
  const contextFileRef = useRef<HTMLInputElement>(null);

  const patch = (partial: Partial<EpicFormState>) =>
    setEpicForm((prev) => ({ ...prev, ...partial }));

  const insertContextBullet = () => {
    setEpicForm((prev) => {
      const val = prev.additionalContext;
      const lines = val.split("\n");
      const lastLine = lines[lines.length - 1];
      if (lastLine.startsWith("- ")) return prev;
      const prefix = val && !val.endsWith("\n") ? "\n" : "";
      return { ...prev, additionalContext: val + prefix + "- " };
    });
  };

  const insertContextUrl = () => {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    const label = window.prompt("Link text (leave blank to use URL):", "") || url;
    setEpicForm((prev) => {
      const val = prev.additionalContext;
      const separator = val && !val.endsWith("\n") && !val.endsWith(" ") ? " " : "";
      return { ...prev, additionalContext: val + separator + `[${label}](${url})` };
    });
  };

  const handleContextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const names = Array.from(files).map((f) => f.name);
    setEpicForm((prev) => {
      const val = prev.additionalContext;
      const separator = val && !val.endsWith("\n") ? "\n" : "";
      const entries = names.map((n) => `- 📎 ${n}`).join("\n");
      return { ...prev, additionalContext: val + separator + entries };
    });
    if (contextFileRef.current) contextFileRef.current.value = "";
  };

  const statusOptions = allStatuses.map((s) => ({ value: s, label: s }));
  const memberOptions = allMembers.map((m) => ({ value: m, label: m }));

  const sectionStyle: React.CSSProperties = {
    backgroundColor: "var(--pf-t--global--background--color--secondary--default)",
    borderRadius: 8,
    padding: "12px 16px",
    marginTop: 4,
  };

  return (
    <DrawerPanelContent widths={{ default: "width_50" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <DrawerHead>
          <div style={{ flex: 1 }}>
            <Label color="purple" style={{ marginBottom: 8 }}>New Epic</Label>
            <TextArea
              value={epicForm.title}
              onChange={(_e, val) => patch({ title: val })}
              placeholder="[UXD EPIC] Your title here"
              rows={1}
              resizeOrientation="vertical"
              aria-label="Epic title"
              style={{ fontSize: "1.25rem", fontWeight: 600 }}
            />
          </div>
          <DrawerActions>
            <DrawerCloseButton onClick={onClose} />
          </DrawerActions>
        </DrawerHead>
        <DrawerPanelBody style={{ flex: 1, overflowY: "auto", paddingLeft: 24 }}>
          <Flex spaceItems={{ default: "spaceItemsMd" }} alignItems={{ default: "alignItemsCenter" }} style={{ marginBottom: 12 }} flexWrap={{ default: "wrap" }}>
            <FlexItem>
              <FormGroup label="Status" fieldId="epic-status">
                <PanelSelect label="Status" value={epicForm.status} options={statusOptions} onSelect={(v) => patch({ status: v })} />
              </FormGroup>
            </FlexItem>
            <FlexItem>
              <FormGroup label="Assignee" fieldId="epic-assignee">
                <PanelSelect label="Assignee" value={epicForm.assigneeName} options={memberOptions} onSelect={(v) => patch({ assigneeName: v })} />
              </FormGroup>
            </FlexItem>
            <FlexItem>
              <FormGroup label="Reporter" fieldId="epic-reporter">
                <PanelSelect label="Reporter" value={epicForm.reporterName} options={memberOptions} onSelect={(v) => patch({ reporterName: v })} />
              </FormGroup>
            </FlexItem>
          </Flex>
          <Form>
            {/* ── What ── */}
            <Divider style={{ margin: "8px 0" }} />
            <FormGroup label="What" fieldId="epic-what">
              <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)", marginBottom: 4, display: "block" }}>
                Describe the primary outcome of this epic. What deliverable will be produced?
              </Content>
              <TextArea
                id="epic-what"
                value={epicForm.what}
                onChange={(_e, val) => patch({ what: val })}
                placeholder="e.g., A redesigned onboarding wizard that reduces setup time for new HCC administrators."
                rows={3}
                resizeOrientation="vertical"
              />
            </FormGroup>

            <FormGroup label="Data informed?" fieldId="epic-problem-type">
              <Select
                role="menu"
                aria-label="Problem statement format"
                isOpen={problemTypeOpen}
                selected={epicForm.problemType}
                onSelect={(_e, val) => { patch({ problemType: val as EpicFormState["problemType"] }); setProblemTypeOpen(false); }}
                onOpenChange={setProblemTypeOpen}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setProblemTypeOpen((p) => !p)} isExpanded={problemTypeOpen} isFullWidth>
                    {PROBLEM_TYPE_OPTIONS.find((o) => o.value === epicForm.problemType)?.label || "Select…"}
                  </MenuToggle>
                )}
              >
                {PROBLEM_TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                  <SelectOption key={o.value} value={o.value}>{o.label}</SelectOption>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Target User (optional)" fieldId="epic-target-user-main">
              <TextArea id="epic-target-user-main" value={epicForm.targetUser} onChange={(_e, v) => patch({ targetUser: v })} placeholder="e.g., New HCC administrators" rows={1} resizeOrientation="vertical" />
            </FormGroup>
            <FormGroup label="Specific Issue (optional)" fieldId="epic-specific-issue-main">
              <TextArea id="epic-specific-issue-main" value={epicForm.specificIssue} onChange={(_e, v) => patch({ specificIssue: v })} placeholder="e.g., misconfiguring cluster settings during initial setup" rows={1} resizeOrientation="vertical" />
            </FormGroup>
            <FormGroup label="Data Source (optional)" fieldId="epic-data-source-main">
              <TextArea id="epic-data-source-main" value={epicForm.dataSource} onChange={(_e, v) => patch({ dataSource: v })} placeholder="e.g., analytics, user research, support tickets" rows={1} resizeOrientation="vertical" />
            </FormGroup>
            <FormGroup label="Impact (optional)" fieldId="epic-impact-main">
              <TextArea id="epic-impact-main" value={epicForm.impact} onChange={(_e, v) => patch({ impact: v })} placeholder="e.g., increased support tickets and delayed time-to-value" rows={1} resizeOrientation="vertical" />
            </FormGroup>

            {/* ── Problem Statement ── */}

            {(epicForm.problemType === "problem-statement-uxd-data-driven" || epicForm.problemType === "problem-statement-data-driven") && (
              <div style={sectionStyle}>
                <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)", marginBottom: 8, display: "block" }}>
                  Must cite a specific data source and metric. Be concrete (e.g., &ldquo;28% misconfiguration rate&rdquo; not &ldquo;many users struggle&rdquo;).
                </Content>
                <FormGroup label="Target User" fieldId="epic-target-user">
                  <TextArea id="epic-target-user" value={epicForm.targetUser} onChange={(_e, v) => patch({ targetUser: v })} placeholder="e.g., New HCC administrators" rows={1} resizeOrientation="vertical" />
                </FormGroup>
                <FormGroup label="Specific Issue" fieldId="epic-specific-issue">
                  <TextArea id="epic-specific-issue" value={epicForm.specificIssue} onChange={(_e, v) => patch({ specificIssue: v })} placeholder="e.g., misconfiguring cluster settings during initial setup" rows={1} resizeOrientation="vertical" />
                </FormGroup>
                <FormGroup label="Data Source" fieldId="epic-data-source">
                  <TextArea id="epic-data-source" value={epicForm.dataSource} onChange={(_e, v) => patch({ dataSource: v })} placeholder="e.g., analytics, user research, support tickets" rows={1} resizeOrientation="vertical" />
                </FormGroup>
                <FormGroup label="Specific Metrics" fieldId="epic-metrics">
                  <TextArea id="epic-metrics" value={epicForm.specificMetrics} onChange={(_e, v) => patch({ specificMetrics: v })} placeholder="e.g., 28% misconfiguration rate in first 7 days" rows={1} resizeOrientation="vertical" />
                </FormGroup>
                <FormGroup label="Impact" fieldId="epic-impact">
                  <TextArea id="epic-impact" value={epicForm.impact} onChange={(_e, v) => patch({ impact: v })} placeholder="e.g., increased support tickets and delayed time-to-value" rows={1} resizeOrientation="vertical" />
                </FormGroup>
              </div>
            )}

            {epicForm.problemType === "problem-statement-assumption" && (
              <div style={sectionStyle}>
                <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)", marginBottom: 8, display: "block" }}>
                  Must state what the assumption is based on. Name the source even if informal (e.g., &ldquo;PM feedback in Q4 retro&rdquo;).
                </Content>
                <FormGroup label="Target User" fieldId="epic-target-user-a">
                  <TextArea id="epic-target-user-a" value={epicForm.targetUser} onChange={(_e, v) => patch({ targetUser: v })} placeholder="e.g., Developers using the API console" rows={1} resizeOrientation="vertical" />
                </FormGroup>
                <FormGroup label="Specific Issue" fieldId="epic-specific-issue-a">
                  <TextArea id="epic-specific-issue-a" value={epicForm.specificIssue} onChange={(_e, v) => patch({ specificIssue: v })} placeholder="e.g., difficulty discovering available endpoints" rows={1} resizeOrientation="vertical" />
                </FormGroup>
                <FormGroup label="Reason" fieldId="epic-reason">
                  <TextArea id="epic-reason" value={epicForm.reason} onChange={(_e, v) => patch({ reason: v })} placeholder="e.g., lack of contextual documentation in the console" rows={1} resizeOrientation="vertical" />
                </FormGroup>
                <FormGroup label="Assumption Source" fieldId="epic-assumption-source">
                  <TextArea id="epic-assumption-source" value={epicForm.assumptionSource} onChange={(_e, v) => patch({ assumptionSource: v })} placeholder="e.g., PM feedback in Q4 retro, limited user interviews" rows={1} resizeOrientation="vertical" />
                </FormGroup>
              </div>
            )}

            {/* ── Definition of Done ── */}
            <Divider style={{ margin: "12px 0 8px" }} />
            <FormGroup label="Definition of Done" fieldId="epic-dod">
              <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)", marginBottom: 4, display: "block" }}>
                Standard criteria (edit as needed):
              </Content>
              <TextArea
                id="epic-dod"
                value={epicForm.definitionOfDone}
                onChange={(_e, val) => patch({ definitionOfDone: val })}
                rows={5}
                resizeOrientation="vertical"
              />
            </FormGroup>

            {/* ── Additional Context ── */}
            <Divider style={{ margin: "12px 0 8px" }} />
            <FormGroup label="Additional Context (optional)" fieldId="epic-context">
              <input
                type="file"
                ref={contextFileRef}
                style={{ display: "none" }}
                multiple
                onChange={handleContextFileUpload}
              />
              <div style={{ marginBottom: 4, display: "flex", gap: 2 }}>
                <Tooltip content="Insert bullet list">
                  <Button variant="plain" size="sm" onClick={insertContextBullet} aria-label="Insert bullet list" style={{ padding: "2px 6px" }}>
                    <ListIcon />
                  </Button>
                </Tooltip>
                <Tooltip content="Insert link">
                  <Button variant="plain" size="sm" onClick={insertContextUrl} aria-label="Insert link" style={{ padding: "2px 6px" }}>
                    <LinkIcon />
                  </Button>
                </Tooltip>
                <Tooltip content="Attach file reference">
                  <Button variant="plain" size="sm" onClick={() => contextFileRef.current?.click()} aria-label="Attach file" style={{ padding: "2px 6px" }}>
                    <PaperclipIcon />
                  </Button>
                </Tooltip>
              </div>
              <TextArea
                id="epic-context"
                value={epicForm.additionalContext}
                onChange={(_e, val) => patch({ additionalContext: val })}
                placeholder="Links to Figma, Google Docs, research findings, competitive analysis, etc."
                rows={3}
                resizeOrientation="vertical"
              />
            </FormGroup>
          </Form>
        </DrawerPanelBody>
        {(() => {
          const missing: string[] = [];
          if (!epicForm.title.trim()) missing.push("Epic Title");
          if (!epicForm.what.trim()) missing.push("What");
          if (!epicForm.status) missing.push("Status");
          if (!epicForm.assigneeName) missing.push("Assignee");
          if (!epicForm.reporterName) missing.push("Reporter");
          if (!epicForm.problemType) missing.push("Data informed?");
          if (!epicForm.definitionOfDone.trim()) missing.push("Definition of Done");
          const canSave = missing.length === 0;
          const tooltipText = canSave
            ? "Create this epic in Jira"
            : `Missing required fields: ${missing.join(", ")}`;
          return (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "12px 16px",
            borderTop: "1px solid var(--pf-t--global--border--color--default)",
            backgroundColor: "var(--pf-t--global--background--color--primary--default)",
            display: "flex",
            gap: 8,
          }}
        >
          <Tooltip
            content={tooltipText}
            position="top"
          >
            <span>
              <Button
                variant="primary"
                onClick={onSave}
                isDisabled={!canSave || isSaving}
                isLoading={isSaving}
              >
                Create Epic in Jira
              </Button>
            </span>
          </Tooltip>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </div>
          );
        })()}
      </div>
    </DrawerPanelContent>
  );
}

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
  const [searchTerm, setSearchTerm] = usePersistedState("dashboard_search", "");
  const [epicsExpanded, setEpicsExpanded] = usePersistedState("epics_expanded", false);
  const [epicDropdownOpen, setEpicDropdownOpen] = useState(false);
  const [epicPanelOpen, setEpicPanelOpen] = useState(false);
  const [epicForm, setEpicForm] = useState<EpicFormState>({
    title: "[UXD EPIC] ",
    what: "",
    status: "To Do",
    assigneeName: "Kendra Marchant",
    reporterName: "Kendra Marchant",
    problemType: "",
    targetUser: "",
    specificIssue: "",
    dataSource: "",
    specificMetrics: "",
    impact: "",
    reason: "",
    assumptionSource: "",
    definitionOfDone:
      "- The primary deliverable or artifact is attached or linked to this epic.\n" +
      "- The primary deliverable of this epic has been reviewed by stakeholders.\n" +
      "- All child tasks or stories within this epic have been closed or transferred to a follow-up epic.\n" +
      "- If follow-up development work is needed, a link to it has been added to this epic.",
    additionalContext: "",
  });
  const [epicSaving, setEpicSaving] = useState(false);
  const [highlightSprintGroup, setHighlightSprintGroup] = useState<SprintGroup | null>(null);
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedIssue) loadData();
    }, 30_000);
    return () => clearInterval(interval);
  }, [loadData, selectedIssue]);

  const normalizedSearch = searchTerm.toLowerCase().trim();

  const filteredIssues = useMemo(() => {
    if (!normalizedSearch) return issues;
    return issues.filter((i) =>
      i.key.toLowerCase().includes(normalizedSearch) ||
      i.summary.toLowerCase().includes(normalizedSearch) ||
      i.assigneeName.toLowerCase().includes(normalizedSearch) ||
      i.reporterName.toLowerCase().includes(normalizedSearch) ||
      i.status.toLowerCase().includes(normalizedSearch) ||
      i.epicName.toLowerCase().includes(normalizedSearch) ||
      i.activityType.toLowerCase().includes(normalizedSearch) ||
      i.sprintName.toLowerCase().includes(normalizedSearch)
    );
  }, [issues, normalizedSearch]);

  const filteredEpics = useMemo(() => {
    if (!normalizedSearch) return epics;
    return epics.filter((e) =>
      e.key.toLowerCase().includes(normalizedSearch) ||
      e.summary.toLowerCase().includes(normalizedSearch) ||
      e.status.toLowerCase().includes(normalizedSearch)
    );
  }, [epics, normalizedSearch]);

  const sprintGroups = groupBySprint(filteredIssues);

  const allEpicNames = useMemo(
    () => epics.map((e) => e.summary).sort(),
    [epics]
  );

  const epicNameToKey = useMemo(
    () => new Map(epics.map((e) => [e.summary, e.key])),
    [epics]
  );

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

  const handleModify = useCallback(async (issue: JiraIssue) => {
    setEpicPanelOpen(false);
    setIsCloneMode(false);
    setIsBacklogCreate(false);
    const fresh = await fetchSingleIssue(issue.key);
    const baseline = fresh ?? issue;
    console.log(`[handleModify] ${issue.key} — storyPoints local=${issue.storyPoints}, fresh=${baseline.storyPoints}`);
    originalIssueRef.current = { ...baseline, comments: [...(baseline.comments ?? [])] };
    setSelectedIssue(baseline);
    if (fresh) {
      setIssues((prev) => prev.map((i) => (i.key === fresh.key ? fresh : i)));
    }
  }, []);

  const DEFAULT_DESCRIPTION_HTML = [
    "<h3>What</h3>",
    "<p>[Describe the objective of this task. What deliverable will be produced once it is completed?]</p>",
    "<h3>Definition of Done</h3>",
    "<p>This issue should be Closed once the following criteria are met.</p>",
    "<ul>",
    "<li>The primary deliverable or artifact is attached or linked to this issue.</li>",
    "<li>The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).</li>",
    "<li>For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.</li>",
    "<li>Follow-up tasks identified during the review have been created in the parent epic.</li>",
    "<li>[Include any other criteria that need to be met before closing this issue]</li>",
    "</ul>",
  ].join("\n");

  const handleClone = useCallback((issue: JiraIssue) => {
    cloneCounter.current += 1;
    const clonedIssue: JiraIssue = {
      ...issue,
      key: `CPUX-NEW-${cloneCounter.current}`,
      summary: `Clone of ${issue.key}`,
      description: DEFAULT_DESCRIPTION_HTML,
      comments: [],
    };
    setIsCloneMode(true);
    setSelectedIssue(clonedIssue);
  }, [DEFAULT_DESCRIPTION_HTML]);

  const handleCreateIssue = useCallback((sprintName: string, sprintState: "active" | "future" | "backlog", startDate?: string, endDate?: string) => {
    setEpicPanelOpen(false);
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
      sprintStartDate: startDate ?? "",
      sprintEndDate: endDate ?? "",
      assigneeName: "",
      assigneeAvatar: "",
      reporterName: "Kendra Marchant",
      description: DEFAULT_DESCRIPTION_HTML,
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
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;

    const srcId = source.droppableId;
    const targetId = destination.droppableId;
    if (srcId === targetId) return;

    const normalize = (id: string) => id.replace(/^(tab|sprint):/, "drop:");
    if (normalize(srcId) === normalize(targetId)) return;

    let targetSprintName: string;

    if (targetId === "backlog" || targetId === "backlog-header") {
      targetSprintName = "Backlog";
      setIssues((prev) =>
        prev.map((issue) =>
          issue.key === draggableId
            ? { ...issue, sprintName: "", sprintState: "" as const }
            : issue
        )
      );
    } else {
      const [, state, ...nameParts] = targetId.split(":");
      targetSprintName = nameParts.join(":");
      setIssues((prev) =>
        prev.map((issue) =>
          issue.key === draggableId
            ? { ...issue, sprintName: targetSprintName, sprintState: state as "active" | "future" | "closed" | "" }
            : issue
        )
      );
    }

    moveToSprint(draggableId, targetSprintName)
      .then(() => addToast(`${draggableId} moved to ${targetSprintName}`))
      .catch((err) => {
        console.error("Failed to move issue", err);
        addToast(`Failed to move ${draggableId}: ${(err as Error).message}`, "danger");
        loadData();
      });
  }, [addToast, loadData]);

  const [saving, setSaving] = useState(false);

  const handleIssueUpdate = useCallback(async (updated: JiraIssue) => {
    if (isCloneMode) {
      setSaving(true);
      try {
        const prefix = updated.activityType ? `[${updated.activityType}] ` : "";
        const summaryNoPrefix = updated.summary.replace(/^\[[^\]]+\]\s*/, "");
        const finalSummary = prefix + summaryNoPrefix;
        const created = await createIssue({ ...updated, summary: finalSummary });
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

  const handleCreateEpic = useCallback(async () => {
    if (!epicForm.title.trim()) return;
    setEpicSaving(true);
    try {
      const descriptionParts: string[] = [];

      if (epicForm.what.trim()) {
        descriptionParts.push(`<h3>What</h3>\n<p>${epicForm.what.trim()}</p>`);
      }

      if ((epicForm.problemType === "problem-statement-uxd-data-driven" || epicForm.problemType === "problem-statement-data-driven") && epicForm.targetUser.trim()) {
        const stmt =
          `${epicForm.targetUser.trim()} struggles with ${epicForm.specificIssue.trim() || "[specific issue]"}. ` +
          `Data from ${epicForm.dataSource.trim() || "[source]"} shows ${epicForm.specificMetrics.trim() || "[metrics]"}. ` +
          `This impacts ${epicForm.impact.trim() || "[user goal/business goal]"}.`;
        descriptionParts.push(`<h3>Problem Statement</h3>\n<p>${stmt}</p>`);
      } else if (epicForm.problemType === "problem-statement-assumption" && epicForm.targetUser.trim()) {
        const stmt =
          `We assume that ${epicForm.targetUser.trim()} experiences ${epicForm.specificIssue.trim() || "[specific issue]"} ` +
          `due to ${epicForm.reason.trim() || "[reason]"}. ` +
          `This assumption is based on ${epicForm.assumptionSource.trim() || "[source]"}.`;
        descriptionParts.push(`<h3>Problem Statement</h3>\n<p>${stmt}</p>`);
      }

      const allDodLines = epicForm.definitionOfDone.trim().split("\n");
      const bullets = allDodLines
        .map((l) => l.replace(/^-\s*/, "").trim())
        .filter(Boolean)
        .map((l) => `<li>${l}</li>`)
        .join("\n");
      if (bullets) {
        descriptionParts.push(
          `<h3>Definition of Done</h3>\n<p>This Epic should be Closed once the following criteria are met:</p>\n<ul>\n${bullets}\n</ul>`
        );
      }

      if (epicForm.additionalContext.trim()) {
        descriptionParts.push(`<h3>Additional Context</h3>\n<p>${epicForm.additionalContext.trim()}</p>`);
      }

      const epicIssue: JiraIssue = {
        key: "",
        summary: epicForm.title.trim(),
        issueType: "Epic",
        status: epicForm.status || "To Do",
        statusCategory: "To Do",
        priority: "Unprioritized",
        activityType: "",
        epicName: "",
        epicKey: "",
        storyPoints: null,
        sprintName: "",
        sprintState: "",
        sprintStartDate: "",
        sprintEndDate: "",
        assigneeName: epicForm.assigneeName,
        assigneeAvatar: "",
        reporterName: epicForm.reporterName,
        description: descriptionParts.join("\n"),
        dueDate: "",
        comments: [],
      };

      const created = await createIssue(epicIssue);
      addToast(`Epic ${created.key} created successfully`);
      setEpicPanelOpen(false);
      loadData(true);
    } catch (err) {
      console.error("Failed to create epic", err);
      addToast(`Failed to create epic: ${(err as Error).message}`, "danger");
    } finally {
      setEpicSaving(false);
    }
  }, [epicForm, addToast, loadData]);

  const handleEpicPanelClose = useCallback(() => {
    setEpicPanelOpen(false);
  }, []);

  const drawerPanel = selectedIssue ? (
    <IssueDetailPanel
      key={selectedIssue.key + (isCloneMode ? "-clone" : "")}
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
  ) : epicPanelOpen ? (
    <EpicCreatePanel
      epicForm={epicForm}
      setEpicForm={setEpicForm}
      onSave={handleCreateEpic}
      onClose={handleEpicPanelClose}
      isSaving={epicSaving}
      allStatuses={allStatuses}
      allMembers={allMembers}
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
      {highlightSprintGroup ? (
        <SprintHighlightsModal
          isOpen
          onClose={() => setHighlightSprintGroup(null)}
          sprintGroup={highlightSprintGroup}
          sprintOptions={sprintGroups.filter((g) => g.state !== "backlog")}
          addToast={addToast}
        />
      ) : null}
      <Drawer isExpanded={selectedIssue !== null || epicPanelOpen} onExpand={() => {}}>
        <DrawerContent panelContent={drawerPanel ?? <></>}>
          <DrawerContentBody onClick={() => { if (selectedIssue) handlePanelClose(); if (epicPanelOpen) handleEpicPanelClose(); }}>
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
                  <div>
                    <Title headingLevel="h1" size="4xl">
                      Consolepuffs Jira Board
                    </Title>
                    <Content component="p" style={{ color: "var(--pf-t--global--text--color--subtle)", marginTop: 4, fontSize: "1.25rem" }}>
                      {import.meta.env.VITE_JIRA_EMAIL}
                    </Content>
                  </div>
                </div>
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup align={{ default: "alignEnd" }}>
              <ToolbarItem>
                <SearchInput
                  placeholder="Search stories, epics, people…"
                  value={searchTerm}
                  onChange={(_e, val) => setSearchTerm(val)}
                  onClear={() => setSearchTerm("")}
                  style={{ minWidth: 280 }}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Button
                  variant="secondary"
                  icon={<ExternalLinkAltIcon />}
                  component="a"
                  href={JIRA_CPUX_BOARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View board in JIRA
                </Button>
              </ToolbarItem>
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
                      onOpenSprintHighlights={setHighlightSprintGroup}
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
                      forceExpand={!!normalizedSearch}
                    />
                  </CardBody>
                </Card>
              </FlexItem>

              {/* ── Epics card ── */}
              <FlexItem>
              <Card>
                <CardBody>
                  <ExpandableSection
                    isExpanded={!!normalizedSearch || epicsExpanded}
                    onToggle={(_e, exp) => setEpicsExpanded(exp)}
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
                            {filteredEpics.length}
                          </Label>
                        </FlexItem>
                      </Flex>
                    }
                  >
                    <div style={{ padding: "12px 0" }}>
                      <Dropdown
                        isOpen={epicDropdownOpen}
                        onSelect={() => setEpicDropdownOpen(false)}
                        onOpenChange={setEpicDropdownOpen}
                        toggle={(toggleRef) => (
                          <MenuToggle
                            ref={toggleRef}
                            onClick={() => setEpicDropdownOpen((prev) => !prev)}
                            isExpanded={epicDropdownOpen}
                            variant="primary"
                            icon={<PlusCircleIcon />}
                          >
                            Create Epic
                          </MenuToggle>
                        )}
                        popperProps={{ position: "start" }}
                      >
                        <DropdownList>
                          <DropdownItem
                            key="cursor"
                            component="a"
                            href={`cursor://file/${import.meta.env.VITE_PROJECT_PATH || ""}/epic-template.md`}
                            icon={<ExternalLinkAltIcon />}
                          >
                            Help me write the epic in Cursor
                          </DropdownItem>
                          <DropdownItem
                            key="form"
                            onClick={() => {
                              setEpicForm({
                                title: "[UXD EPIC] ",
                                what: "",
                                status: "To Do",
                                assigneeName: "Kendra Marchant",
                                reporterName: "Kendra Marchant",
                                problemType: "",
                                targetUser: "",
                                specificIssue: "",
                                dataSource: "",
                                specificMetrics: "",
                                impact: "",
                                reason: "",
                                assumptionSource: "",
                                definitionOfDone:
                                  "- The primary deliverable or artifact is attached or linked to this epic.\n" +
                                  "- The primary deliverable of this epic has been reviewed by stakeholders.\n" +
                                  "- All child tasks or stories within this epic have been closed or transferred to a follow-up epic.\n" +
                                  "- If follow-up development work is needed, a link to it has been added to this epic.",
                                additionalContext: "",
                              });
                              setSelectedIssue(null);
                              setEpicPanelOpen(true);
                            }}
                            icon={<ListIcon />}
                          >
                            Show me a GUI form
                          </DropdownItem>
                        </DropdownList>
                      </Dropdown>
                    </div>
                    <Table aria-label="Active Epics table" variant="compact">
                      <Thead>
                        <Tr>
                          <Th width={15}>Key</Th>
                          <Th>Summary</Th>
                          <Th width={15}>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredEpics.map((epic) => (
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
              {normalizedSearch && filteredIssues.length === 0 && filteredEpics.length === 0 && (
                <FlexItem>
                  <Card>
                    <CardBody>
                      <Flex justifyContent={{ default: "justifyContentCenter" }} style={{ padding: 32 }}>
                        <FlexItem>
                          <Content component="p" style={{ fontSize: "1.1rem", color: "var(--pf-t--global--text--color--subtle)" }}>
                            No results found for &ldquo;{searchTerm}&rdquo;
                          </Content>
                        </FlexItem>
                      </Flex>
                    </CardBody>
                  </Card>
                </FlexItem>
              )}
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
