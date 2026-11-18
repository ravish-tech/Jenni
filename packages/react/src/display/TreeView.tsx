import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { treeKeydown } from 'jenni-core/behaviors/tree-view.js';
import { attr, type DisplaySize, type DisplayTone } from './types';

export interface TreeNode {
  id: string;
  label: ReactNode;
  icon?: 'folder' | 'file' | 'none' | ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
  children?: TreeNode[];
}

interface TreeViewContextValue {
  selectedSet: Set<string>;
  expandedSet: Set<string>;
  focusedValue: string | undefined;
  expandOnClick: boolean;
  select: (value: string) => void;
  toggleExpand: (value: string, force?: boolean) => void;
  registerDefaultExpanded: (value: string) => void;
  setFocused: (value: string) => void;
  ensureInitialFocus: (value: string) => void;
}

const TreeViewContext = createContext<TreeViewContextValue | null>(null);

function toArray(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  return val ? [val] : [];
}

export interface TreeViewProps extends Omit<ComponentProps<'ul'>, 'defaultValue' | 'onSelect'> {
  nodes?: TreeNode[];
  multiple?: boolean;
  guides?: boolean;
  size?: DisplaySize;
  tone?: DisplayTone;
  label?: string;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  expandOnClick?: boolean;
}

export function TreeView({
  nodes,
  multiple = false,
  guides = true,
  size = 'md',
  tone,
  label = 'Tree',
  value,
  defaultValue,
  onValueChange,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  expandOnClick = true,
  className,
  children,
  onKeyDown,
  ...rest
}: TreeViewProps) {
  const [internalSelected, setInternalSelected] = useState<string[]>(() => toArray(defaultValue));
  const [internalExpanded, setInternalExpanded] = useState<string[]>(() => [...defaultExpanded]);
  const [focusedValue, setFocusedValue] = useState<string | undefined>(
    () => toArray(value ?? defaultValue)[0],
  );

  const isSelectedControlled = value !== undefined;
  const isExpandedControlled = expanded !== undefined;

  const selectedSet = useMemo(
    () => new Set(isSelectedControlled ? toArray(value) : internalSelected),
    [isSelectedControlled, value, internalSelected],
  );

  const expandedSet = useMemo(
    () => new Set(isExpandedControlled ? expanded : internalExpanded),
    [isExpandedControlled, expanded, internalExpanded],
  );

  const treeRef = useRef<HTMLUListElement | null>(null);

  const ctx = useMemo<TreeViewContextValue>(() => {
    const select = (val: string) => {
      const current = Array.from(selectedSet);
      if (multiple) {
        const next = selectedSet.has(val)
          ? current.filter((v) => v !== val)
          : [...current, val];
        if (!isSelectedControlled) setInternalSelected(next);
        onValueChange?.(next);
      } else {
        if (!isSelectedControlled) setInternalSelected([val]);
        onValueChange?.(val);
      }
      setFocusedValue(val);
    };

    const toggleExpand = (val: string, force?: boolean) => {
      const current = Array.from(expandedSet);
      const currentlyOpen = expandedSet.has(val);
      const nextOpen = force !== undefined ? force : !currentlyOpen;
      if (nextOpen === currentlyOpen) return;

      const next = nextOpen ? [...current, val] : current.filter((v) => v !== val);
      if (!isExpandedControlled) setInternalExpanded(next);
      onExpandedChange?.(next);
    };

    return {
      selectedSet,
      expandedSet,
      focusedValue,
      expandOnClick,
      select,
      toggleExpand,
      registerDefaultExpanded: (val: string) => {
        if (isExpandedControlled) return;
        setInternalExpanded((prev) => (prev.includes(val) ? prev : [...prev, val]));
      },
      setFocused: setFocusedValue,
      ensureInitialFocus: (val: string) => {
        setFocusedValue((prev) => (prev === undefined ? val : prev));
      },
    };
  }, [
    selectedSet,
    expandedSet,
    focusedValue,
    expandOnClick,
    multiple,
    isSelectedControlled,
    isExpandedControlled,
    onValueChange,
    onExpandedChange,
  ]);

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !treeRef.current) return;
    const res = treeKeydown(treeRef.current, event.nativeEvent);
    if (!res) return;
    const val = res.item.dataset.value;
    if (!val) return;
    if (res.action === 'focus') setFocusedValue(val);
    else if (res.action === 'expand') ctx.toggleExpand(val, true);
    else if (res.action === 'collapse') ctx.toggleExpand(val, false);
    else if (res.action === 'select') ctx.select(val);
  };

  return (
    <TreeViewContext value={ctx}>
      <ul
        ref={treeRef}
        role="tree"
        aria-label={label}
        aria-multiselectable={multiple ? 'true' : undefined}
        {...rest}
        data-j-managed=""
        className={className ? `j-tree ${className}` : 'j-tree'}
        data-guides={guides ? '' : undefined}
        data-size={attr(size, 'md')}
        data-tone={tone}
        onKeyDown={handleKeyDown}
      >
        {nodes && nodes.length > 0
          ? nodes.map((node) => <TreeItem key={node.id} node={node} />)
          : children}
      </ul>
    </TreeViewContext>
  );
}

export interface TreeItemProps extends Omit<ComponentProps<'li'>, 'children'> {
  value?: string;
  label?: ReactNode;
  icon?: 'folder' | 'file' | 'none' | ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
  defaultExpanded?: boolean;
  node?: TreeNode;
  children?: ReactNode;
}

export function TreeItem({
  value,
  label,
  icon,
  meta,
  disabled = false,
  defaultExpanded = false,
  node,
  className,
  children,
  ...rest
}: TreeItemProps) {
  const autoId = useId();
  const groupId = `${autoId}-group`;
  const tree = useContext(TreeViewContext);

  const itemKey = node?.id ?? value ?? autoId;
  const itemLabel = node?.label ?? label;
  const itemMeta = node?.meta ?? meta;
  const itemDisabled = Boolean(node?.disabled ?? disabled);
  const childNodes = node?.children;
  const hasChildren = Boolean((childNodes && childNodes.length > 0) || children != null);
  const resolvedIcon = node?.icon ?? icon ?? (hasChildren ? 'folder' : 'file');

  useEffect(() => {
    if (defaultExpanded && tree) tree.registerDefaultExpanded(itemKey);
    if (!itemDisabled && tree) tree.ensureInitialFocus(itemKey);
  }, [defaultExpanded, itemDisabled, tree, itemKey]);

  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const [localSelected, setLocalSelected] = useState(false);

  const isExpanded = tree ? tree.expandedSet.has(itemKey) : localExpanded;
  const isSelected = tree ? tree.selectedSet.has(itemKey) : localSelected;
  const tabIndex = itemDisabled
    ? -1
    : !tree
      ? 0
      : tree.focusedValue === itemKey
        ? 0
        : -1;

  const handleChevronClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (itemDisabled || !hasChildren) return;
    if (tree) {
      tree.setFocused(itemKey);
      tree.toggleExpand(itemKey);
    } else {
      setLocalExpanded((prev) => !prev);
    }
  };

  const handleRowClick = () => {
    if (itemDisabled) return;
    if (tree) {
      tree.setFocused(itemKey);
      if (hasChildren && tree.expandOnClick) {
        tree.toggleExpand(itemKey);
      }
      tree.select(itemKey);
    } else {
      if (hasChildren) setLocalExpanded((prev) => !prev);
      setLocalSelected((prev) => !prev);
    }
  };

  const renderIcon = () => {
    if (resolvedIcon === 'none') return null;
    if (resolvedIcon === 'folder') {
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.88a1.5 1.5 0 0 1 1.06.44l.94.94a1 1 0 0 0 .7.29h3.42A1.5 1.5 0 0 1 14 6.17v5.33A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5v-7Z" />
        </svg>
      );
    }
    if (resolvedIcon === 'file') {
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9.5 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6L9.5 2Z" />
          <path d="M9 2v4h4" />
        </svg>
      );
    }
    return resolvedIcon;
  };

  const iconContent = renderIcon();

  return (
    <li
      {...rest}
      role="none"
      className={className ? `j-tree__node ${className}` : 'j-tree__node'}
    >
      <div
        className="j-tree__item"
        role="treeitem"
        data-value={itemKey}
        aria-expanded={hasChildren ? (isExpanded ? 'true' : 'false') : undefined}
        aria-owns={hasChildren ? groupId : undefined}
        aria-selected={isSelected ? 'true' : 'false'}
        aria-disabled={itemDisabled ? 'true' : undefined}
        tabIndex={tabIndex}
        onClick={handleRowClick}
        onFocus={() => !itemDisabled && tree?.setFocused(itemKey)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="j-tree__chevron"
            tabIndex={-1}
            aria-hidden="true"
            onClick={handleChevronClick}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6.25 4.25 10 8l-3.75 3.75" />
            </svg>
          </button>
        ) : (
          <span className="j-tree__spacer" aria-hidden="true" />
        )}

        {iconContent != null && (
          <span className="j-tree__icon" aria-hidden="true">
            {iconContent}
          </span>
        )}

        <span className="j-tree__label">{itemLabel}</span>

        {itemMeta != null && <span className="j-tree__meta">{itemMeta}</span>}
      </div>

      {hasChildren && (
        <div className="j-tree__branch" role="none">
          <ul id={groupId} className="j-tree__group" role="group">
            {childNodes && childNodes.length > 0
              ? childNodes.map((child) => <TreeItem key={child.id} node={child} />)
              : children}
          </ul>
        </div>
      )}
    </li>
  );
}
