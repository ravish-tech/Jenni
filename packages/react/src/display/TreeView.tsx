import {
  createContext,
  useCallback,
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
  /** Marks a node whose children are loaded asynchronously on first expand. */
  lazy?: boolean;
  /** Alias indicating this node has expandable children even before `children` are loaded. */
  hasChildren?: boolean;
  /** Explicit loading spinner override for this node. */
  loading?: boolean;
  children?: TreeNode[];
}

interface TreeViewContextValue {
  selectedSet: Set<string>;
  expandedSet: Set<string>;
  loadingSet: Set<string>;
  focusedValue: string | undefined;
  expandOnClick: boolean;
  hasLazyLoader: boolean;
  getLoadedChildren: (value: string) => TreeNode[] | undefined;
  isExpandedNow: (value: string) => boolean;
  registerNode: (value: string, node: TreeNode) => void;
  unregisterNode: (value: string) => void;
  select: (value: string) => void;
  toggleExpand: (
    value: string,
    force?: boolean,
    node?: TreeNode,
    itemEl?: HTMLElement | null,
  ) => void | Promise<void>;
  registerDefaultExpanded: (value: string) => void;
  setFocused: (value: string) => void;
  ensureInitialFocus: (value: string) => void;
}

const TreeViewContext = createContext<TreeViewContextValue | null>(null);

function toArray(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  return val ? [val] : [];
}

function findNodeInList(
  list: TreeNode[] | undefined,
  targetId: string,
  loadedMap: Record<string, TreeNode[]>,
): TreeNode | undefined {
  if (!list) return undefined;
  for (const n of list) {
    if (n.id === targetId) return n;
    const nested =
      findNodeInList(n.children, targetId, loadedMap) ??
      findNodeInList(loadedMap[n.id], targetId, loadedMap);
    if (nested) return nested;
  }
  return undefined;
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
  /** Async loader invoked when expanding a `lazy` / `hasChildren` node whose children haven't loaded yet. */
  loadChildren?: (node: TreeNode) => Promise<TreeNode[] | void>;
  /** Fired when a lazy node loads (or requests loading of) children. */
  onLoadChildren?: (node: TreeNode, children?: TreeNode[]) => void;
  /** Fired when `loadChildren` rejects. */
  onLoadError?: (error: unknown, node: TreeNode) => void;
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
  loadChildren,
  onLoadChildren,
  onLoadError,
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
  const [loadingSet, setLoadingSet] = useState<Set<string>>(() => new Set());
  const [loadedChildrenMap, setLoadedChildrenMap] = useState<Record<string, TreeNode[]>>({});

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
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  const registeredDefaultsRef = useRef<Set<string>>(new Set());
  const nodeRegistryRef = useRef<Map<string, TreeNode>>(new Map());
  const expandedSetRef = useRef<Set<string>>(expandedSet);
  expandedSetRef.current = expandedSet;
  const loadedMapRef = useRef<Record<string, TreeNode[]>>(loadedChildrenMap);
  loadedMapRef.current = loadedChildrenMap;
  const nodesRef = useRef<TreeNode[] | undefined>(nodes);
  nodesRef.current = nodes;

  const registerNode = useCallback((val: string, node: TreeNode) => {
    nodeRegistryRef.current.set(val, node);
  }, []);

  const unregisterNode = useCallback((val: string) => {
    nodeRegistryRef.current.delete(val);
  }, []);

  const isExpandedNow = useCallback((val: string) => expandedSetRef.current.has(val), []);

  const commitExpanded = useCallback(
    (val: string, nextOpen: boolean) => {
      const latestSet = expandedSetRef.current;
      const currentlyOpen = latestSet.has(val);
      if (nextOpen === currentlyOpen) return;

      const currentArr = Array.from(latestSet);
      const next = nextOpen ? [...currentArr, val] : currentArr.filter((v) => v !== val);
      expandedSetRef.current = new Set(next);
      if (!isExpandedControlled) {
        setInternalExpanded((prev) => {
          const has = prev.includes(val);
          if (nextOpen === has) return prev;
          return nextOpen ? [...prev, val] : prev.filter((v) => v !== val);
        });
      }
      onExpandedChange?.(next);
    },
    [isExpandedControlled, onExpandedChange],
  );

  const setLoadingState = useCallback((val: string, active: boolean) => {
    setLoadingSet((prev) => {
      const has = prev.has(val);
      if (active === has) return prev;
      const next = new Set(prev);
      if (active) next.add(val);
      else next.delete(val);
      return next;
    });
  }, []);

  const toggleExpand = useCallback(
    (
      val: string,
      force?: boolean,
      explicitNode?: TreeNode,
      itemEl?: HTMLElement | null,
    ): void | Promise<void> => {
      const existingTask = inFlightRef.current.get(val);
      if (existingTask) return existingTask;

      const currentlyOpen = expandedSetRef.current.has(val);
      const nextOpen = force !== undefined ? force : !currentlyOpen;
      if (!nextOpen) {
        commitExpanded(val, false);
        return;
      }

      let resolvedNode =
        explicitNode ??
        findNodeInList(nodesRef.current, val, loadedMapRef.current) ??
        nodeRegistryRef.current.get(val);
      if (!resolvedNode && itemEl?.hasAttribute('data-lazy')) {
        const labelText = itemEl.querySelector('.j-tree__label')?.textContent?.trim() ?? val;
        resolvedNode = { id: val, label: labelText, lazy: true };
      }

      const isLazy = Boolean(resolvedNode?.lazy || resolvedNode?.hasChildren);
      const hasStaticChildren = Boolean(
        resolvedNode?.children && resolvedNode.children.length > 0,
      );
      const hasCachedChildren = Object.prototype.hasOwnProperty.call(loadedMapRef.current, val);

      if (isLazy && !hasStaticChildren && !hasCachedChildren && resolvedNode) {
        const targetNode = resolvedNode;
        if (loadChildren) {
          setLoadingState(val, true);
          const task = Promise.resolve()
            .then(() => loadChildren(targetNode))
            .then(
              (result) => {
                inFlightRef.current.delete(val);
                setLoadingState(val, false);
                if (Array.isArray(result)) {
                  loadedMapRef.current = { ...loadedMapRef.current, [val]: result };
                  setLoadedChildrenMap((prev) => ({ ...prev, [val]: result }));
                  commitExpanded(val, true);
                  onLoadChildren?.(targetNode, result);
                } else {
                  commitExpanded(val, true);
                  onLoadChildren?.(targetNode);
                }
              },
              (err) => {
                inFlightRef.current.delete(val);
                setLoadingState(val, false);
                commitExpanded(val, false);
                onLoadError?.(err, targetNode);
              },
            );
          inFlightRef.current.set(val, task);
          return task;
        }

        onLoadChildren?.(targetNode);
        commitExpanded(val, true);
        return;
      }

      commitExpanded(val, true);
    },
    [commitExpanded, loadChildren, onLoadChildren, onLoadError, setLoadingState],
  );

  const getLoadedChildren = useCallback(
    (val: string) => loadedChildrenMap[val],
    [loadedChildrenMap],
  );

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

    return {
      selectedSet,
      expandedSet,
      loadingSet,
      focusedValue,
      expandOnClick,
      hasLazyLoader: Boolean(loadChildren),
      getLoadedChildren,
      isExpandedNow,
      registerNode,
      unregisterNode,
      select,
      toggleExpand,
      registerDefaultExpanded: (val: string) => {
        if (registeredDefaultsRef.current.has(val)) return;
        registeredDefaultsRef.current.add(val);
        if (isExpandedControlled) return;
        expandedSetRef.current = new Set([...expandedSetRef.current, val]);
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
    loadingSet,
    focusedValue,
    expandOnClick,
    loadChildren,
    getLoadedChildren,
    isExpandedNow,
    registerNode,
    unregisterNode,
    toggleExpand,
    multiple,
    isSelectedControlled,
    isExpandedControlled,
    onValueChange,
  ]);

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !treeRef.current) return;
    const res = treeKeydown(treeRef.current, event.nativeEvent);
    if (!res) return;
    const val = res.item.dataset.value;
    if (!val) return;
    if (res.action === 'focus') {
      setFocusedValue(val);
    } else if (res.action === 'expand') {
      void ctx.toggleExpand(val, true, undefined, res.item);
    } else if (res.action === 'collapse') {
      void ctx.toggleExpand(val, false, undefined, res.item);
    } else if (res.action === 'select') {
      if (event.key === 'Enter' && expandOnClick && res.item.hasAttribute('aria-expanded')) {
        void ctx.toggleExpand(val, undefined, undefined, res.item);
      }
      ctx.select(val);
    }
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
  lazy?: boolean;
  hasChildren?: boolean;
  loading?: boolean;
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
  lazy = false,
  hasChildren: hasChildrenProp = false,
  loading = false,
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

  const isLazy = Boolean(node?.lazy || node?.hasChildren || lazy || hasChildrenProp);
  const staticChildren = node?.children;
  const loadedChildren = tree?.getLoadedChildren(itemKey);
  const effectiveChildren =
    staticChildren && staticChildren.length > 0 ? staticChildren : loadedChildren;
  const hasLoadedEmpty =
    loadedChildren !== undefined &&
    loadedChildren.length === 0 &&
    (!staticChildren || staticChildren.length === 0);
  const hasSlotChildren = children != null;
  const hasBranch = Boolean(
    (effectiveChildren && effectiveChildren.length > 0) ||
      hasSlotChildren ||
      (isLazy && !hasLoadedEmpty),
  );
  const hasRenderedChildren = Boolean(
    (effectiveChildren && effectiveChildren.length > 0) || hasSlotChildren,
  );
  const isLoading = Boolean(node?.loading || loading || tree?.loadingSet.has(itemKey));

  const effectiveNode = useMemo<TreeNode>(
    () =>
      node ?? {
        id: itemKey,
        label: itemLabel,
        icon,
        meta,
        disabled: itemDisabled,
        lazy: isLazy,
        hasChildren: hasChildrenProp,
        loading,
      },
    [node, itemKey, itemLabel, icon, meta, itemDisabled, isLazy, hasChildrenProp, loading],
  );

  const resolvedIcon =
    node?.icon ?? icon ?? (hasBranch || isLazy ? 'folder' : 'file');

  const registerNode = tree?.registerNode;
  const unregisterNode = tree?.unregisterNode;

  useEffect(() => {
    if (!registerNode || !unregisterNode) return;
    registerNode(itemKey, effectiveNode);
    return () => {
      unregisterNode(itemKey);
    };
  }, [registerNode, unregisterNode, itemKey, effectiveNode]);

  const didRegisterRef = useRef(false);

  useEffect(() => {
    if (didRegisterRef.current) return;
    didRegisterRef.current = true;
    if (defaultExpanded && tree) tree.registerDefaultExpanded(itemKey);
    if (!itemDisabled && tree) tree.ensureInitialFocus(itemKey);
    if (
      tree &&
      tree.hasLazyLoader &&
      isLazy &&
      (!staticChildren || staticChildren.length === 0) &&
      loadedChildren === undefined &&
      tree.isExpandedNow(itemKey)
    ) {
      void tree.toggleExpand(itemKey, true, effectiveNode);
    }
  }, [
    defaultExpanded,
    itemDisabled,
    tree,
    itemKey,
    isLazy,
    staticChildren,
    loadedChildren,
    effectiveNode,
  ]);

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
    if (itemDisabled || !hasBranch || isLoading) return;
    if (tree) {
      tree.setFocused(itemKey);
      void tree.toggleExpand(itemKey, undefined, effectiveNode);
    } else {
      setLocalExpanded((prev) => !prev);
    }
  };

  const handleRowClick = () => {
    if (itemDisabled) return;
    if (tree) {
      tree.setFocused(itemKey);
      if (hasBranch && tree.expandOnClick && !isLoading) {
        void tree.toggleExpand(itemKey, undefined, effectiveNode);
      }
      tree.select(itemKey);
    } else {
      if (hasBranch) setLocalExpanded((prev) => !prev);
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
        data-lazy={isLazy ? '' : undefined}
        data-loaded-empty={hasLoadedEmpty ? '' : undefined}
        aria-expanded={hasBranch ? (isExpanded ? 'true' : 'false') : undefined}
        aria-busy={isLoading ? 'true' : undefined}
        aria-owns={hasRenderedChildren ? groupId : undefined}
        aria-selected={isSelected ? 'true' : 'false'}
        aria-disabled={itemDisabled ? 'true' : undefined}
        tabIndex={tabIndex}
        onClick={handleRowClick}
        onFocus={() => !itemDisabled && tree?.setFocused(itemKey)}
      >
        {hasBranch || isLoading ? (
          <button
            type="button"
            className="j-tree__chevron j-tree__toggle"
            data-loading={isLoading ? '' : undefined}
            tabIndex={-1}
            aria-hidden="true"
            onClick={handleChevronClick}
          >
            {isLoading ? (
              <span className="j-tree__spinner" aria-hidden="true" />
            ) : (
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
            )}
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

      {hasRenderedChildren && (
        <div className="j-tree__branch" role="none">
          <ul id={groupId} className="j-tree__group" role="group">
            {effectiveChildren && effectiveChildren.length > 0
              ? effectiveChildren.map((child) => <TreeItem key={child.id} node={child} />)
              : children}
          </ul>
        </div>
      )}
    </li>
  );
}
