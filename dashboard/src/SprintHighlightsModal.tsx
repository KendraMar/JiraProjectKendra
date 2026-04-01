import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type Ref,
} from "react";
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Button,
  Checkbox,
  Content,
  Flex,
  FlexItem,
  Dropdown,
  DropdownItem,
  DropdownList,
  Label,
  MenuToggle,
  type MenuToggleElement,
  Modal,
  Spinner,
  TextArea,
  Title,
  Wizard,
  WizardFooterWrapper,
  WizardStep,
  useWizardContext,
  type WizardStepType,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { EyeIcon, EyeSlashIcon, GripVerticalIcon } from "@patternfly/react-icons";
import CheckIcon from "@patternfly/react-icons/dist/esm/icons/check-icon";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import { css } from "@patternfly/react-styles";
import inlineEditStyles from "@patternfly/react-styles/css/components/InlineEdit/inline-edit";
import wizardStyles from "@patternfly/react-styles/css/components/Wizard/wizard";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { toPng } from "html-to-image";

import type { JiraComment, JiraIssue, SprintGroup } from "./types";
import { fetchCommentsForIssue } from "./services/jiraService";
import {
  buildThematicHighlightSections,
  emptyHighlightBuckets,
  highlightBucketsToPlainText,
  highlightBucketsVisibleOnly,
  isHighlightEligibleStatus,
  newHighlightRowId,
  sectionsToHighlightBuckets,
  sprintDateWindow,
  sprintYearFromSprintName,
  THEMATIC_GROUP_ORDER,
  type HighlightBucketState,
  type HighlightRow,
  type ThematicGroupId,
} from "./sprintHighlights";
import {
  SprintHighlightsSlideCapture,
  SLIDE_CAPTURE_HEIGHT,
  SLIDE_CAPTURE_WIDTH,
} from "./SprintHighlightsSlideCapture";

const STEP_SELECT = "hl-select";
const STEP_EDIT = "hl-edit";
const STEP_SLIDE = "hl-slide";

function cloneHighlightBuckets(b: HighlightBucketState): HighlightBucketState {
  return Object.fromEntries(THEMATIC_GROUP_ORDER.map((g) => [g, [...b[g]]])) as HighlightBucketState;
}

function removeHighlightRowById(buckets: HighlightBucketState, rowId: string): HighlightBucketState {
  const next = cloneHighlightBuckets(buckets);
  for (const g of THEMATIC_GROUP_ORDER) {
    const i = next[g].findIndex((r) => r.id === rowId);
    if (i >= 0) {
      next[g].splice(i, 1);
      break;
    }
  }
  return next;
}

/** Apply draft: trim; empty removes the row. */
function applyHighlightDraft(buckets: HighlightBucketState, rowId: string, draft: string): HighlightBucketState {
  const t = draft.trim();
  const next = cloneHighlightBuckets(buckets);
  for (const g of THEMATIC_GROUP_ORDER) {
    const i = next[g].findIndex((r) => r.id === rowId);
    if (i < 0) continue;
    if (t === "") next[g].splice(i, 1);
    else next[g][i] = { ...next[g][i]!, text: t };
    break;
  }
  return next;
}

/** Discard edit: remove row only if committed text is still empty (new manual line). */
function cancelHighlightDraft(buckets: HighlightBucketState, rowId: string): HighlightBucketState {
  for (const g of THEMATIC_GROUP_ORDER) {
    const row = buckets[g].find((r) => r.id === rowId);
    if (row && row.text.trim() === "") return removeHighlightRowById(buckets, rowId);
  }
  return buckets;
}

function SprintHighlightRowInlineEdit({
  row,
  groupName,
  isEditing,
  draft,
  onDraftChange,
  onStartEdit,
  onSave,
  onCancel,
}: {
  row: HighlightRow;
  groupName: string;
  isEditing: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const rowLabel = `${groupName} highlight`;
  return (
    <div
      className={css(
        inlineEditStyles.inlineEdit,
        isEditing ? inlineEditStyles.modifiers.inlineEditable : ""
      )}
      style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "4px" }}
    >
      <div
        className={css(inlineEditStyles.inlineEditGroup, inlineEditStyles.modifiers.column)}
        style={{ flex: "1 1 200px", minWidth: 0, alignItems: "stretch" }}
      >
        <div className={inlineEditStyles.inlineEditValue}>
          {row.text.trim() ? (
            <Content component="p" style={{ margin: 0 }}>
              {row.text}
            </Content>
          ) : (
            <Content component="p" style={{ margin: 0, color: "var(--pf-t--global--text--color--placeholder)" }}>
              <em>New highlight — add text below</em>
            </Content>
          )}
        </div>
        <div className={inlineEditStyles.inlineEditInput}>
          <TextArea
            aria-label={`Edit ${rowLabel}`}
            value={draft}
            onChange={(_e, v) => onDraftChange(v)}
            rows={4}
            resizeOrientation="vertical"
          />
        </div>
      </div>
      <div
        className={css(
          inlineEditStyles.inlineEditGroup,
          inlineEditStyles.modifiers.iconGroup,
          inlineEditStyles.modifiers.actionGroup
        )}
      >
        <div className={css(inlineEditStyles.inlineEditAction, inlineEditStyles.modifiers.valid)}>
          <Button
            variant="plain"
            type="button"
            aria-label={`Save ${rowLabel}`}
            onClick={onSave}
            icon={<CheckIcon />}
          />
        </div>
        <div className={inlineEditStyles.inlineEditAction}>
          <Button
            variant="plain"
            type="button"
            aria-label={`Cancel editing ${rowLabel}`}
            onClick={onCancel}
            icon={<TimesIcon />}
          />
        </div>
      </div>
      <div className={css(inlineEditStyles.inlineEditAction, inlineEditStyles.modifiers.enableEditable)}>
        <Button
          variant="plain"
          type="button"
          aria-label={`Edit ${rowLabel}`}
          onClick={onStartEdit}
          icon={<PencilAltIcon />}
        />
      </div>
    </div>
  );
}

type StatusLabelColor = "blue" | "green" | "grey" | "orange" | "red" | "purple" | "teal";

function statusLabelColor(statusCategory: string): StatusLabelColor {
  if (statusCategory === "In Progress") return "blue";
  if (statusCategory === "Done") return "green";
  return "grey";
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Sprint tab the modal was opened from; also the initial dropdown selection. */
  sprintGroup: SprintGroup;
  /** Sprints shown in the header dropdown (e.g. active + future, excluding backlog). */
  sprintOptions: SprintGroup[];
  addToast: (title: string, variant?: "success" | "danger") => void;
};

async function copySlidePngToClipboard(dataUrl: string): Promise<void> {
  const pngBlob = await (await fetch(dataUrl)).blob();
  try {
    const html = `<meta charset="utf-8"><img src="${dataUrl}" width="${String(SLIDE_CAPTURE_WIDTH)}" height="${String(SLIDE_CAPTURE_HEIGHT)}" alt="Sprint highlights slide" />`;
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": pngBlob,
        "text/html": new Blob([html], { type: "text/html" }),
      }),
    ]);
  } catch {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
  }
}

function SprintHighlightsWizardHeader({
  sprintOptions,
  selectedSprint,
  onSelectSprint,
}: {
  sprintOptions: SprintGroup[];
  selectedSprint: SprintGroup;
  onSelectSprint: (group: SprintGroup) => void;
}) {
  const { close } = useWizardContext();
  const [sprintMenuOpen, setSprintMenuOpen] = useState(false);

  const menuSprintOptions = useMemo(() => {
    const byName = new Map(sprintOptions.map((g) => [g.name, g]));
    if (!byName.has(selectedSprint.name)) {
      return [selectedSprint, ...sprintOptions];
    }
    return sprintOptions;
  }, [sprintOptions, selectedSprint]);

  return (
    <div className={css(wizardStyles.wizardHeader)}>
      <div
        className={css(wizardStyles.wizardClose)}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "var(--pf-t--global--spacer--xs)",
        }}
      >
        <Dropdown
          id="sprint-highlights-sprint-picker"
          isOpen={sprintMenuOpen}
          onOpenChange={setSprintMenuOpen}
          onSelect={() => setSprintMenuOpen(false)}
          toggle={(toggleRef: Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              variant="plainText"
              isExpanded={sprintMenuOpen}
              onClick={() => setSprintMenuOpen((o) => !o)}
              aria-label="Choose sprint for highlights"
              style={{
                // Wizard header forces xl on all `.wizardClose button`; restore MenuToggle tokens (see PF Menu toggle).
                fontSize: "var(--pf-v6-c-menu-toggle--FontSize)",
                lineHeight: "var(--pf-v6-c-menu-toggle--LineHeight)",
              }}
            >
              <span
                style={{
                  display: "block",
                  maxWidth: "min(40vw, 20rem)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedSprint.name}
              </span>
            </MenuToggle>
          )}
          popperProps={{ enableFlip: true, appendTo: () => document.body }}
        >
          <DropdownList>
            {menuSprintOptions.map((g) => (
              <DropdownItem
                key={g.name}
                id={`sprint-highlights-sprint-${g.name}`}
                onClick={() => {
                  onSelectSprint(g);
                  setSprintMenuOpen(false);
                }}
              >
                {g.name}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
        <Button variant="plain" aria-label="Close sprint highlights" onClick={() => close()} icon={<TimesIcon />} />
      </div>
      <div className={css(wizardStyles.wizardTitle)}>
        <h2 className={css(wizardStyles.wizardTitleText)} id="sprint-highlights-wizard-title">
          Generate sprint highlights
        </h2>
      </div>
      <div className={css(wizardStyles.wizardDescription)} id="sprint-highlights-wizard-desc">
        <Content component="p">
          Automatically generate highlights of what&apos;s been worked on in this sprint and copy a ready-to-add report
          to your clipboard.
        </Content>
      </div>
    </div>
  );
}

export function SprintHighlightsModal({ isOpen, onClose, sprintGroup, sprintOptions, addToast }: Props) {
  const [activeSprintGroup, setActiveSprintGroup] = useState<SprintGroup>(() => sprintGroup);
  const [wizardInstanceKey, setWizardInstanceKey] = useState(0);
  const [wizardStepId, setWizardStepId] = useState(STEP_SELECT);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightBuckets, setHighlightBuckets] = useState<HighlightBucketState>(() => emptyHighlightBuckets());
  const [slidePngDataUrl, setSlidePngDataUrl] = useState<string | null>(null);
  const [slideGenerating, setSlideGenerating] = useState(false);
  const [slideError, setSlideError] = useState("");
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const slideRef = useRef<HTMLDivElement>(null);
  const openerSprintRef = useRef(sprintGroup);
  const sprintOptionsRef = useRef(sprintOptions);
  openerSprintRef.current = sprintGroup;
  sprintOptionsRef.current = sprintOptions;

  const year = useMemo(() => sprintYearFromSprintName(activeSprintGroup.name), [activeSprintGroup.name]);

  const slideBuckets = useMemo(() => highlightBucketsVisibleOnly(highlightBuckets), [highlightBuckets]);

  const eligibleIssues = useMemo(
    () => activeSprintGroup.issues.filter((i) => isHighlightEligibleStatus(i.status)),
    [activeSprintGroup.issues]
  );

  const resetWizardForSprint = useCallback((group: SprintGroup) => {
    setActiveSprintGroup(group);
    setWizardInstanceKey((k) => k + 1);
    setWizardStepId(STEP_SELECT);
    setSelectedKeys(new Set(group.issues.filter((i) => isHighlightEligibleStatus(i.status)).map((i) => i.key)));
    setHighlightBuckets(emptyHighlightBuckets());
    setError("");
    setLoading(false);
    setSlidePngDataUrl(null);
    setSlideError("");
    setSlideGenerating(false);
    setEditingHighlightId(null);
    setEditDraft("");
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const opener = openerSprintRef.current;
    const opts = sprintOptionsRef.current;
    const fresh = opts.find((g) => g.name === opener.name) ?? opener;
    resetWizardForSprint(fresh);
  }, [isOpen, sprintGroup.name, resetWizardForSprint]);

  const handleSprintChange = useCallback(
    (group: SprintGroup) => {
      if (group.name === activeSprintGroup.name) return;
      const opts = sprintOptionsRef.current;
      const fresh = opts.find((g) => g.name === group.name) ?? group;
      resetWizardForSprint(fresh);
    },
    [activeSprintGroup.name, resetWizardForSprint]
  );

  useLayoutEffect(() => {
    if (wizardStepId !== STEP_SLIDE) return;
    const el = slideRef.current;
    if (!el) return;
    let cancelled = false;
    setSlideGenerating(true);
    setSlideError("");
    setSlidePngDataUrl(null);

    const frame = requestAnimationFrame(() => {
      toPng(el, {
        pixelRatio: 2,
        width: SLIDE_CAPTURE_WIDTH,
        height: SLIDE_CAPTURE_HEIGHT,
        cacheBust: true,
        backgroundColor: "#ffffff",
      })
        .then((dataUrl) => {
          if (!cancelled) {
            setSlidePngDataUrl(dataUrl);
            setSlideGenerating(false);
          }
        })
        .catch((e: Error) => {
          if (!cancelled) {
            setSlideError(e.message || "Could not render slide image");
            setSlideGenerating(false);
          }
        });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [wizardStepId, slideBuckets, activeSprintGroup.name]);

  const toggleKey = useCallback((key: string, checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const generateHighlights = useCallback(async (): Promise<boolean> => {
    const win = sprintDateWindow(activeSprintGroup.startDate, activeSprintGroup.endDate, year);
    if (!win) {
      setError("Could not parse sprint start/end dates for this tab.");
      return false;
    }
    if (selectedKeys.size === 0) {
      setError("Select at least one story to include.");
      return false;
    }

    setLoading(true);
    setError("");
    try {
      const commentsByKey = new Map<string, JiraComment[]>();
      const keys = [...selectedKeys];
      for (const key of keys) {
        const issue = activeSprintGroup.issues.find((i) => i.key === key);
        if (!issue) continue;
        let list: JiraComment[] = [];
        try {
          list = await fetchCommentsForIssue(key);
        } catch {
          list = [];
        }
        if (list.length === 0) list = issue.comments ?? [];
        commentsByKey.set(key, list);
      }

      const sections = buildThematicHighlightSections(activeSprintGroup.issues, selectedKeys, commentsByKey, win);
      const total = sections.reduce((n, s) => n + s.bullets.length, 0);
      if (total === 0) {
        setError(
          "No highlight lines were generated. Only stories in In Progress, Review, or Closed (Done also counts as completed) are included — adjust statuses or your selection."
        );
        return false;
      }
      setHighlightBuckets(sectionsToHighlightBuckets(sections));
      return true;
    } catch (e) {
      setError((e as Error).message || "Failed to build highlights.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeSprintGroup, selectedKeys, year]);

  const handleCopyPlainText = useCallback(async () => {
    try {
      const text = highlightBucketsToPlainText(highlightBuckets, activeSprintGroup.name);
      await navigator.clipboard.writeText(text);
      addToast("Plain-text highlights copied to clipboard");
    } catch {
      addToast("Could not copy to clipboard", "danger");
    }
  }, [highlightBuckets, activeSprintGroup.name, addToast]);

  const handleCopySlide = useCallback(async () => {
    if (!slidePngDataUrl) return;
    try {
      await copySlidePngToClipboard(slidePngDataUrl);
      addToast("Slide image copied — paste into Google Slides or your deck");
    } catch {
      addToast("Could not copy slide to clipboard", "danger");
    }
  }, [slidePngDataUrl, addToast]);

  const toggleHighlightHidden = useCallback((rowId: string) => {
    setHighlightBuckets((prev) => {
      const next = Object.fromEntries(
        THEMATIC_GROUP_ORDER.map((g) => [g, [...prev[g]]])
      ) as HighlightBucketState;
      for (const g of THEMATIC_GROUP_ORDER) {
        const i = next[g].findIndex((r) => r.id === rowId);
        if (i >= 0) {
          const row = next[g][i]!;
          next[g][i] = { ...row, hidden: !row.hidden };
          break;
        }
      }
      return next;
    });
  }, []);

  const flushOpenHighlightEdit = useCallback(() => {
    if (!editingHighlightId) return;
    setHighlightBuckets((prev) => applyHighlightDraft(prev, editingHighlightId, editDraft));
    setEditingHighlightId(null);
    setEditDraft("");
  }, [editingHighlightId, editDraft]);

  const startEditHighlight = useCallback(
    (rowId: string, currentCommittedText: string) => {
      if (editingHighlightId && editingHighlightId !== rowId) {
        setHighlightBuckets((prev) => applyHighlightDraft(prev, editingHighlightId, editDraft));
      }
      setEditingHighlightId(rowId);
      setEditDraft(currentCommittedText);
    },
    [editingHighlightId, editDraft]
  );

  const saveHighlightEdit = useCallback(() => {
    if (!editingHighlightId) return;
    setHighlightBuckets((prev) => applyHighlightDraft(prev, editingHighlightId, editDraft));
    setEditingHighlightId(null);
    setEditDraft("");
  }, [editingHighlightId, editDraft]);

  const cancelHighlightEdit = useCallback(() => {
    if (!editingHighlightId) return;
    setHighlightBuckets((prev) => cancelHighlightDraft(prev, editingHighlightId));
    setEditingHighlightId(null);
    setEditDraft("");
  }, [editingHighlightId]);

  const addManualHighlight = useCallback(
    (groupId: ThematicGroupId) => {
      const newId = newHighlightRowId();
      setHighlightBuckets((prev) => {
        let p = prev;
        if (editingHighlightId) {
          p = applyHighlightDraft(p, editingHighlightId, editDraft);
        }
        const next = cloneHighlightBuckets(p);
        next[groupId] = [{ id: newId, text: "" }, ...next[groupId]];
        return next;
      });
      setEditingHighlightId(newId);
      setEditDraft("");
    },
    [editingHighlightId, editDraft]
  );

  const onHighlightDragEnd = useCallback((result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const srcGroup = source.droppableId as ThematicGroupId;
    const destGroup = destination.droppableId as ThematicGroupId;

    setHighlightBuckets((prev) => {
      const next = Object.fromEntries(
        THEMATIC_GROUP_ORDER.map((g) => [g, [...prev[g]]])
      ) as HighlightBucketState;
      const srcList = next[srcGroup];
      const [moved] = srcList.splice(source.index, 1);
      if (!moved) return prev;
      if (srcGroup === destGroup) {
        srcList.splice(destination.index, 0, moved);
        return next;
      }
      next[destGroup].splice(destination.index, 0, moved);
      return next;
    });
  }, []);

  const hasAnyVisibleHighlights = useMemo(() => {
    const fromBuckets = THEMATIC_GROUP_ORDER.some((g) =>
      highlightBuckets[g].some((r) => !r.hidden && r.text.trim().length > 0)
    );
    if (fromBuckets) return true;
    if (editingHighlightId && editDraft.trim().length > 0) return true;
    return false;
  }, [highlightBuckets, editingHighlightId, editDraft]);

  const eligibleSelectionHeaderChecked = useMemo((): boolean | null => {
    if (eligibleIssues.length === 0) return false;
    let n = 0;
    for (const i of eligibleIssues) {
      if (selectedKeys.has(i.key)) n += 1;
    }
    if (n === 0) return false;
    if (n === eligibleIssues.length) return true;
    return null;
  }, [eligibleIssues, selectedKeys]);

  const handleWizardClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const wizardFooter = useCallback(
    (
      activeStep: WizardStepType,
      goNext: (e: ReactMouseEvent<HTMLButtonElement>) => void | Promise<void>,
      goBack: (e: ReactMouseEvent<HTMLButtonElement>) => void | Promise<void>,
      wizardClose: (e: ReactMouseEvent<HTMLButtonElement>) => void | Promise<void>
    ) => {
      if (!activeStep) {
        return <WizardFooterWrapper>{null}</WizardFooterWrapper>;
      }

      if (activeStep.id === STEP_SELECT) {
        return (
          <WizardFooterWrapper>
            <ActionList>
              <ActionListGroup>
                <ActionListItem>
                  <Button variant="secondary" isDisabled>
                    Back
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button
                    variant="primary"
                    onClick={async (e) => {
                      const ok = await generateHighlights();
                      if (ok) void goNext(e);
                    }}
                    isDisabled={loading || eligibleIssues.length === 0 || selectedKeys.size === 0}
                    isLoading={loading}
                  >
                    {loading ? "Generating…" : "Generate highlights"}
                  </Button>
                </ActionListItem>
              </ActionListGroup>
              <ActionListGroup>
                <ActionListItem>
                  <Button variant="link" onClick={(e) => void wizardClose(e)}>
                    Cancel
                  </Button>
                </ActionListItem>
              </ActionListGroup>
            </ActionList>
          </WizardFooterWrapper>
        );
      }

      if (activeStep.id === STEP_EDIT) {
        return (
          <WizardFooterWrapper>
            <ActionList>
              <ActionListGroup>
                <ActionListItem>
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      flushOpenHighlightEdit();
                      void goBack(e);
                    }}
                  >
                    Back
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      flushOpenHighlightEdit();
                      void goNext(e);
                    }}
                    isDisabled={!hasAnyVisibleHighlights}
                  >
                    Create highlights slide
                  </Button>
                </ActionListItem>
              </ActionListGroup>
              <ActionListGroup>
                <ActionListItem>
                  <Button variant="link" onClick={(e) => void wizardClose(e)}>
                    Cancel
                  </Button>
                </ActionListItem>
              </ActionListGroup>
            </ActionList>
          </WizardFooterWrapper>
        );
      }

      if (activeStep.id === STEP_SLIDE) {
        return (
          <WizardFooterWrapper>
            <ActionList>
              <ActionListGroup>
                <ActionListItem>
                  <Button variant="secondary" onClick={(e) => void goBack(e)}>
                    Back
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button
                    variant="primary"
                    onClick={() => void handleCopySlide()}
                    isDisabled={!slidePngDataUrl || slideGenerating}
                  >
                    Create highlights slide
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button
                    variant="secondary"
                    onClick={() => void handleCopyPlainText()}
                    isDisabled={!hasAnyVisibleHighlights}
                  >
                    Copy text
                  </Button>
                </ActionListItem>
              </ActionListGroup>
              <ActionListGroup>
                <ActionListItem>
                  <Button variant="link" onClick={(e) => void wizardClose(e)}>
                    Cancel
                  </Button>
                </ActionListItem>
              </ActionListGroup>
            </ActionList>
          </WizardFooterWrapper>
        );
      }

      return <WizardFooterWrapper>{null}</WizardFooterWrapper>;
    },
    [
      generateHighlights,
      loading,
      eligibleIssues.length,
      selectedKeys.size,
      hasAnyVisibleHighlights,
      handleCopyPlainText,
      handleCopySlide,
      slidePngDataUrl,
      slideGenerating,
      flushOpenHighlightEdit,
    ]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleWizardClose}
      variant="large"
      aria-labelledby="sprint-highlights-wizard-title"
      aria-describedby="sprint-highlights-wizard-desc"
    >
      <Wizard
        key={wizardInstanceKey}
        height="min(78vh, 760px)"
        width="min(100%, 1120px)"
        navAriaLabel="Sprint highlights steps"
        header={
          <SprintHighlightsWizardHeader
            sprintOptions={sprintOptions}
            selectedSprint={activeSprintGroup}
            onSelectSprint={handleSprintChange}
          />
        }
        footer={wizardFooter}
        onClose={handleWizardClose}
        onStepChange={(_e, current) => setWizardStepId(String(current.id))}
        isVisitRequired
        shouldFocusContent
      >
        <WizardStep
          id={STEP_SELECT}
          name="Select stories"
          body={{ "aria-label": "Select stories for sprint highlights" }}
        >
          {error ? <Alert variant="danger" isInline title={error} style={{ marginBottom: 12 }} /> : null}
          {activeSprintGroup.issues.length === 0 ? (
            <Content component="p">No stories in this sprint.</Content>
          ) : eligibleIssues.length === 0 ? (
            <Content component="p">
              No stories in <strong>In Progress</strong>, <strong>Review</strong>, or <strong>Closed</strong>{" "}
              (including <strong>Done</strong>) in this sprint — nothing to include in highlights.
            </Content>
          ) : (
            <>
              <Alert
                variant="info"
                isInline
                title="Select which of your in-progress, in-preview, and completed stories you'd like to be taken into consideration when generating highlights."
                style={{ marginBottom: 16 }}
              />
              <Table aria-label="Stories eligible for sprint highlights" borders>
                <Thead>
                  <Tr>
                    <Th>
                      <Checkbox
                        id="hl-eligible-bulk-select"
                        aria-label="Select all eligible stories"
                        isChecked={eligibleSelectionHeaderChecked}
                        onChange={(_e, checked) => {
                          if (checked) {
                            setSelectedKeys(new Set(eligibleIssues.map((i) => i.key)));
                          } else {
                            setSelectedKeys(new Set());
                          }
                        }}
                      />
                    </Th>
                    <Th>Jira number</Th>
                    <Th>Summary</Th>
                    <Th>Owner</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {eligibleIssues.map((issue: JiraIssue) => (
                    <Tr key={issue.key}>
                      <Td>
                        <Checkbox
                          id={`hl-${issue.key}`}
                          isChecked={selectedKeys.has(issue.key)}
                          onChange={(_e, checked) => toggleKey(issue.key, checked)}
                          aria-label={`Include ${issue.key}`}
                        />
                      </Td>
                      <Td dataLabel="Jira number">{issue.key}</Td>
                      <Td>{issue.summary}</Td>
                      <Td>{issue.assigneeName}</Td>
                      <Td>
                        <Label color={statusLabelColor(issue.statusCategory)} isCompact>
                          {issue.status}
                        </Label>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </>
          )}
        </WizardStep>

        <WizardStep id={STEP_EDIT} name="Edit highlights" body={{ "aria-label": "Edit and reorder highlights" }}>
          <DragDropContext onDragEnd={onHighlightDragEnd}>
            <Flex direction={{ default: "column" }} spaceItems={{ default: "spaceItemsMd" }}>
              <FlexItem>
                <Alert
                  variant="info"
                  isInline
                  title="Reorder highlights, reassign highlights to different group titles, hide highlights from being included in the highlights deck, edit the phrasing of highlights, and manually add in highlights that weren't accounted for in JIRA."
                />
              </FlexItem>
              {THEMATIC_GROUP_ORDER.map((groupId, si) => (
                <FlexItem
                  key={groupId}
                  style={si > 0 ? { paddingBlockStart: "var(--pf-t--global--spacer--sm)" } : undefined}
                >
                  <Flex
                    direction={{ default: "row" }}
                    flexWrap={{ default: "wrap" }}
                    alignItems={{ default: "alignItemsBaseline" }}
                    spaceItems={{ default: "spaceItemsMd" }}
                    style={{ marginBottom: 8 }}
                  >
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        {groupId}
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="link" isInline type="button" onClick={() => addManualHighlight(groupId)}>
                        + Add manual highlight
                      </Button>
                    </FlexItem>
                  </Flex>
                  <Droppable droppableId={groupId} type="SPRINT_HIGHLIGHT">
                    {(dropProvided, dropSnapshot) => (
                      <ul
                        ref={dropProvided.innerRef}
                        {...dropProvided.droppableProps}
                        className="sprint-highlights-dnd-list"
                        aria-label={`${groupId} highlights`}
                        style={{
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                          minHeight: dropSnapshot.isUsingPlaceholder ? 40 : 8,
                        }}
                      >
                        {highlightBuckets[groupId].map((row, index) => (
                          <Draggable
                            key={row.id}
                            draggableId={row.id}
                            index={index}
                            isDragDisabled={editingHighlightId === row.id}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <li
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={
                                  row.hidden
                                    ? "sprint-highlight-dnd-row sprint-highlight-dnd-row--hidden"
                                    : "sprint-highlight-dnd-row"
                                }
                                style={{
                                  ...dragProvided.draggableProps.style,
                                  ...(dragSnapshot.isDragging
                                    ? {
                                        background: "var(--pf-t--global--background--color--primary--default)",
                                        boxShadow: "var(--pf-t--global--box-shadow--md)",
                                        borderRadius: "var(--pf-t--global--border--radius--small)",
                                      }
                                    : {}),
                                }}
                              >
                                <span
                                  {...dragProvided.dragHandleProps}
                                  className="sprint-highlight-dnd-handle"
                                  aria-label="Drag to reorder or move to another group"
                                >
                                  <GripVerticalIcon />
                                </span>
                                <Button
                                  variant="plain"
                                  type="button"
                                  aria-label={
                                    row.hidden
                                      ? "Include in slide and plain-text copy"
                                      : "Hide from slide and plain-text copy"
                                  }
                                  aria-pressed={Boolean(row.hidden)}
                                  className="sprint-highlight-dnd-visibility"
                                  onClick={() => toggleHighlightHidden(row.id)}
                                  icon={row.hidden ? <EyeIcon /> : <EyeSlashIcon />}
                                />
                                <SprintHighlightRowInlineEdit
                                  row={row}
                                  groupName={groupId}
                                  isEditing={editingHighlightId === row.id}
                                  draft={editingHighlightId === row.id ? editDraft : row.text}
                                  onDraftChange={setEditDraft}
                                  onStartEdit={() => startEditHighlight(row.id, row.text)}
                                  onSave={saveHighlightEdit}
                                  onCancel={cancelHighlightEdit}
                                />
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {dropProvided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </FlexItem>
              ))}
            </Flex>
          </DragDropContext>
        </WizardStep>

        <WizardStep id={STEP_SLIDE} name="Slide preview" body={{ "aria-label": "Sprint highlights slide preview" }}>
          {slideError ? (
            <Alert variant="danger" isInline title={slideError} style={{ marginBottom: 16 }} />
          ) : null}
          <Flex
            direction={{ default: "column" }}
            spaceItems={{ default: "spaceItemsLg" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            {slideGenerating ? (
              <FlexItem>
                <Spinner size="xl" aria-label="Rendering slide" />
              </FlexItem>
            ) : null}
            {slidePngDataUrl && !slideGenerating ? (
              <FlexItem style={{ width: "100%", textAlign: "center" }}>
                <img
                  src={slidePngDataUrl}
                  alt={`Sprint highlights slide for ${activeSprintGroup.name}`}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "var(--pf-t--global--border--radius--default)",
                    border: "1px solid var(--pf-t--global--border--color--default)",
                    boxShadow: "var(--pf-t--global--box-shadow--md)",
                  }}
                />
              </FlexItem>
            ) : null}
          </Flex>
          <div className="sprint-slide-capture-host" aria-hidden>
            <SprintHighlightsSlideCapture
              ref={slideRef}
              sprintTitle={activeSprintGroup.name}
              buckets={slideBuckets}
            />
          </div>
        </WizardStep>
      </Wizard>
    </Modal>
  );
}
