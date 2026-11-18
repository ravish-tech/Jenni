import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type Ref,
} from 'react';
import { createShell, type ShellController } from 'jenni-core/behaviors/shell.js';
import {
  attr,
  cx,
  mergeRefs,
  useControllable,
  type ShellLayout,
  type ShellPane,
  type ShellSide,
  type ShellVariant,
} from './types';

export interface AppShellHandle {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: (next?: boolean) => void;
  toggleDock: (next?: boolean) => void;
  toggleAside: (next?: boolean) => void;
  closeAside: () => void;
  setActivePane: (pane: ShellPane) => void;
  readonly element: HTMLDivElement | null;
}

export interface AppShellProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  layout?: ShellLayout;
  variant?: ShellVariant;
  sidebarSide?: ShellSide;
  embedded?: boolean;
  height?: string | number;
  dockHeight?: string | number;
  asideWidth?: string | number;
  railLabel?: string;
  subnavLabel?: string;
  asideLabel?: string;
  dockLabel?: string;
  bannerLabel?: string;
  masterLabel?: string;
  shellRef?: Ref<AppShellHandle | null>;
  sidebarOpen?: boolean;
  defaultSidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  activePane?: ShellPane;
  defaultActivePane?: ShellPane;
  onActivePaneChange?: (pane: ShellPane) => void;
  dockOpen?: boolean;
  defaultDockOpen?: boolean;
  onDockOpenChange?: (open: boolean) => void;
  asideOpen?: boolean;
  defaultAsideOpen?: boolean;
  onAsideOpenChange?: (open: boolean) => void;
  banner?: ReactNode;
  statusbar?: ReactNode;
  sidebar?: ReactNode | ((api: { sidebarOpen: boolean; closeSidebar: () => void }) => ReactNode);
  rail?: ReactNode;
  subnav?: ReactNode;
  topbar?:
    | ReactNode
    | ((api: {
        sidebarOpen: boolean;
        toggleSidebar: (next?: boolean) => void;
        dockOpen: boolean;
        toggleDock: (next?: boolean) => void;
        asideOpen: boolean;
        toggleAside: (next?: boolean) => void;
      }) => ReactNode);
  subbar?: ReactNode;
  bottombar?: ReactNode;
  aside?:
    | ReactNode
    | ((api: {
        asideOpen: boolean;
        toggleAside: (next?: boolean) => void;
        closeAside: () => void;
      }) => ReactNode);
  dock?: ReactNode | ((api: { dockOpen: boolean; toggleDock: (next?: boolean) => void }) => ReactNode);
  master?:
    | ReactNode
    | ((api: { activePane: ShellPane | undefined; setActivePane: (pane: ShellPane) => void }) => ReactNode);
  children?:
    | ReactNode
    | ((api: { activePane: ShellPane | undefined; setActivePane: (pane: ShellPane) => void }) => ReactNode);
}

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    layout = 'sidebar',
    variant = 'flat',
    sidebarSide = 'start',
    embedded,
    height,
    dockHeight,
    asideWidth,
    railLabel = 'Activity rail',
    subnavLabel = 'Secondary navigation',
    asideLabel = 'Inspector',
    dockLabel = 'Panel dock',
    bannerLabel = 'System announcement',
    masterLabel = 'Item list',
    shellRef,
    sidebarOpen,
    defaultSidebarOpen = false,
    onSidebarOpenChange,
    activePane,
    defaultActivePane,
    onActivePaneChange,
    dockOpen,
    defaultDockOpen = true,
    onDockOpenChange,
    asideOpen,
    defaultAsideOpen = true,
    onAsideOpenChange,
    banner,
    statusbar,
    sidebar,
    rail,
    subnav,
    topbar,
    subbar,
    bottombar,
    aside,
    dock,
    master,
    style,
    className,
    children,
    ...rest
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<ShellController | null>(null);
  const [isOpen, setOpen] = useControllable(sidebarOpen, defaultSidebarOpen, onSidebarOpenChange);
  const [currentPane, setCurrentPane] = useControllable<ShellPane | undefined>(
    activePane,
    defaultActivePane,
    onActivePaneChange ? (p) => p && onActivePaneChange(p) : undefined,
  );
  const [isDockOpen, setDockOpen] = useControllable(dockOpen, defaultDockOpen, onDockOpenChange);
  const [isAsideOpen, setAsideOpen] = useControllable(asideOpen, defaultAsideOpen, onAsideOpenChange);
  const [isAsideDrawerOpen, setAsideDrawerOpen] = useState(false);
  const [effectiveAsideOpen, setEffectiveAsideOpen] = useState<boolean>(isAsideOpen);

  const getAsideThreshold = useCallback(() => {
    if (layout === 'floating-dock') return 760;
    if (layout === 'copilot' || layout === 'holy-grail') return 1024;
    return 960;
  }, [layout]);

  const toggleSidebar = useCallback(
    (next?: boolean) => {
      if (ctrlRef.current) {
        ctrlRef.current.toggle(next);
        return;
      }
      const val = typeof next === 'boolean' ? next : !isOpen;
      setOpen(val);
    },
    [isOpen, setOpen],
  );

  const toggleDock = useCallback(
    (next?: boolean) => {
      if (ctrlRef.current) {
        ctrlRef.current.toggleDock(next);
        return;
      }
      const val = typeof next === 'boolean' ? next : !isDockOpen;
      setDockOpen(val);
    },
    [isDockOpen, setDockOpen],
  );

  const toggleAside = useCallback(
    (next?: boolean) => {
      if (ctrlRef.current) {
        ctrlRef.current.toggleAside(next);
        return;
      }
      const threshold = getAsideThreshold();
      const width = rootRef.current?.clientWidth ?? 1200;
      if (width > 0 && width < threshold) {
        const val = typeof next === 'boolean' ? next : !isAsideDrawerOpen;
        setAsideDrawerOpen(val);
        setEffectiveAsideOpen(val);
        return;
      }
      const val = typeof next === 'boolean' ? next : !isAsideOpen;
      setAsideOpen(val);
      setEffectiveAsideOpen(val);
    },
    [getAsideThreshold, isAsideDrawerOpen, isAsideOpen, setAsideOpen],
  );

  const closeAside = useCallback(() => {
    if (isAsideDrawerOpen || ctrlRef.current?.isAsideDrawerOpen()) {
      setAsideDrawerOpen(false);
      ctrlRef.current?.toggleAsideDrawer(false);
      return;
    }
    const width = rootRef.current?.clientWidth ?? 1200;
    if (width > 0 && width < getAsideThreshold()) return;
    setAsideOpen(false);
    ctrlRef.current?.toggleAside(false);
  }, [isAsideDrawerOpen, getAsideThreshold, setAsideOpen]);

  const setActivePane = useCallback(
    (pane: ShellPane) => {
      setCurrentPane(pane);
    },
    [setCurrentPane],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ctrl = createShell(el, {
      onOpenChange: (next) => setOpen(next),
      onAsideOpenChange: (next) => setAsideOpen(next),
      onAsideDrawerChange: (next) => setAsideDrawerOpen(next),
      onDockOpenChange: (next) => setDockOpen(next),
      onEffectiveAsideChange: (next) => setEffectiveAsideOpen(next),
    });
    ctrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, [setOpen, setAsideOpen, setDockOpen]);

  useEffect(() => {
    if (ctrlRef.current && ctrlRef.current.isOpen() !== isOpen) {
      ctrlRef.current.toggle(isOpen);
    }
  }, [isOpen]);

  useEffect(() => {
    const domDockOpen = !rootRef.current?.hasAttribute('data-dock-collapsed');
    if (ctrlRef.current && domDockOpen !== isDockOpen) {
      ctrlRef.current.toggleDock(isDockOpen);
    }
  }, [isDockOpen]);

  useEffect(() => {
    const width = rootRef.current?.clientWidth ?? 0;
    if (width === 0 || width >= getAsideThreshold()) {
      setEffectiveAsideOpen(isAsideOpen);
    }
  }, [isAsideOpen, getAsideThreshold]);

  useEffect(() => {
    setAsideDrawerOpen(false);
    ctrlRef.current?.toggleAsideDrawer(false);
  }, [layout]);

  useImperativeHandle(
    shellRef,
    () => ({
      openSidebar: () => toggleSidebar(true),
      closeSidebar: () => toggleSidebar(false),
      toggleSidebar,
      toggleDock,
      toggleAside,
      closeAside,
      setActivePane,
      get element() {
        return rootRef.current;
      },
    }),
    [toggleSidebar, toggleDock, toggleAside, closeAside, setActivePane],
  );

  const MainTag: ElementType = embedded ? 'div' : 'main';
  const StatusTag: ElementType = embedded ? 'div' : 'footer';

  const customVars: Record<string, string> = {};
  if (height != null) {
    customVars['--j-shell-h'] = typeof height === 'number' ? `${height}px` : height;
  }
  if (dockHeight != null) {
    customVars['--j-dock-h'] = typeof dockHeight === 'number' ? `${dockHeight}px` : dockHeight;
  }
  if (asideWidth != null) {
    customVars['--j-aside-w'] = typeof asideWidth === 'number' ? `${asideWidth}px` : asideWidth;
  }
  const mergedStyle: CSSProperties | undefined =
    Object.keys(customVars).length > 0 ? { ...style, ...customVars } : style;

  const topbarNode =
    typeof topbar === 'function'
      ? topbar({
          sidebarOpen: isOpen,
          toggleSidebar,
          dockOpen: isDockOpen,
          toggleDock,
          asideOpen: effectiveAsideOpen,
          toggleAside,
        })
      : topbar;
  const sidebarNode =
    typeof sidebar === 'function'
      ? sidebar({ sidebarOpen: isOpen, closeSidebar: () => toggleSidebar(false) })
      : sidebar;
  const asideNode =
    typeof aside === 'function'
      ? aside({ asideOpen: effectiveAsideOpen, toggleAside, closeAside })
      : aside;
  const dockNode = typeof dock === 'function' ? dock({ dockOpen: isDockOpen, toggleDock }) : dock;
  const masterNode =
    typeof master === 'function' ? master({ activePane: currentPane, setActivePane }) : master;
  const childrenNode =
    typeof children === 'function' ? children({ activePane: currentPane, setActivePane }) : children;

  const isColumnSimple =
    layout === 'centered' ||
    layout === 'bars' ||
    layout === 'topnav' ||
    layout === 'focus' ||
    layout === 'floating-dock';

  const isGlobalHeaderWorkspace =
    layout === 'header-sidebar' ||
    layout === 'holy-grail' ||
    layout === 'ide' ||
    layout === 'command-center';

  return (
    <div
      {...rest}
      ref={mergeRefs(rootRef, forwardedRef)}
      className={cx('j-shell', className)}
      data-layout={attr(layout, 'sidebar')}
      data-variant={attr(variant, 'flat')}
      data-sidebar-side={attr(sidebarSide, 'start')}
      data-active-pane={currentPane}
      data-embedded={embedded ? '' : undefined}
      data-sidebar-open={isOpen ? '' : undefined}
      data-aside-open={isAsideDrawerOpen ? '' : undefined}
      data-aside-collapsed={!isAsideOpen ? '' : undefined}
      data-dock-collapsed={!isDockOpen ? '' : undefined}
      style={mergedStyle}
    >
      {isColumnSimple ? (
        <>
          {banner != null && (
            <div className="j-shell__banner" role="region" aria-label={bannerLabel}>
              {banner}
            </div>
          )}
          {topbarNode}
          {subbar != null && <div className="j-shell__subbar">{subbar}</div>}
          <MainTag className="j-shell__main">{childrenNode}</MainTag>
          {aside != null && (
            <>
              <aside className="j-shell__aside" aria-label={asideLabel}>
                {asideNode}
              </aside>
              <button
                type="button"
                className="j-shell__backdrop"
                tabIndex={-1}
                aria-label="Close panel"
              />
            </>
          )}
          {dock != null && (
            <section
              className="j-shell__dock"
              aria-label={dockLabel}
              data-collapsed={!isDockOpen ? '' : undefined}
            >
              {dockNode}
            </section>
          )}
          {bottombar}
          {statusbar != null && <StatusTag className="j-shell__statusbar">{statusbar}</StatusTag>}
        </>
      ) : isGlobalHeaderWorkspace ? (
        <>
          {banner != null && (
            <div className="j-shell__banner" role="region" aria-label={bannerLabel}>
              {banner}
            </div>
          )}
          {topbarNode}
          {subbar != null && layout === 'command-center' && (
            <div className="j-shell__subbar">{subbar}</div>
          )}

          <div className="j-shell__workspace">
            {rail != null && (
              <nav className="j-shell__rail" aria-label={railLabel}>
                {rail}
              </nav>
            )}
            {sidebarNode}
            {subnav != null && (
              <nav className="j-shell__subnav" aria-label={subnavLabel}>
                {subnav}
              </nav>
            )}
            {(sidebar != null || rail != null || subnav != null || aside != null) && (
              <button
                type="button"
                className="j-shell__backdrop"
                tabIndex={-1}
                aria-label="Close panel"
              />
            )}

            <div className="j-shell__body">
              {subbar != null && layout !== 'command-center' && (
                <div className="j-shell__subbar">{subbar}</div>
              )}

              {master != null ? (
                <div className="j-shell__stage">
                  <section className="j-shell__master" aria-label={masterLabel}>
                    {masterNode}
                  </section>
                  <MainTag className="j-shell__detail">{childrenNode}</MainTag>
                </div>
              ) : aside != null || dock != null ? (
                <div className="j-shell__stage">
                  <div className="j-shell__center">
                    <MainTag className="j-shell__main">{childrenNode}</MainTag>
                    {dock != null && (
                      <section
                        className="j-shell__dock"
                        aria-label={dockLabel}
                        data-collapsed={!isDockOpen ? '' : undefined}
                      >
                        {dockNode}
                      </section>
                    )}
                  </div>
                  {aside != null && (
                    <aside className="j-shell__aside" aria-label={asideLabel}>
                      {asideNode}
                    </aside>
                  )}
                </div>
              ) : (
                <MainTag className="j-shell__main">{childrenNode}</MainTag>
              )}
            </div>
          </div>

          {bottombar}
          {statusbar != null && <StatusTag className="j-shell__statusbar">{statusbar}</StatusTag>}
        </>
      ) : (
        <>
          {rail != null && (
            <nav className="j-shell__rail" aria-label={railLabel}>
              {rail}
            </nav>
          )}
          {sidebarNode}
          {subnav != null && (
            <nav className="j-shell__subnav" aria-label={subnavLabel}>
              {subnav}
            </nav>
          )}
          {(sidebar != null || rail != null || subnav != null || aside != null) && (
            <button
              type="button"
              className="j-shell__backdrop"
              tabIndex={-1}
              aria-label="Close navigation"
            />
          )}
          <div className="j-shell__body">
            {banner != null && (
              <div className="j-shell__banner" role="region" aria-label={bannerLabel}>
                {banner}
              </div>
            )}
            {topbarNode}
            {subbar != null && <div className="j-shell__subbar">{subbar}</div>}

            {layout === 'split' || layout === 'three-pane' || master != null ? (
              <div className="j-shell__stage">
                {master != null && (
                  <section className="j-shell__master" aria-label={masterLabel}>
                    {masterNode}
                  </section>
                )}
                <MainTag className="j-shell__detail">{childrenNode}</MainTag>
              </div>
            ) : layout === 'workspace' ||
              layout === 'studio' ||
              layout === 'copilot' ||
              aside != null ||
              dock != null ? (
              <div className="j-shell__stage">
                <div className="j-shell__center">
                  <MainTag className="j-shell__main">{childrenNode}</MainTag>
                  {dock != null && (
                    <section
                      className="j-shell__dock"
                      aria-label={dockLabel}
                      data-collapsed={!isDockOpen ? '' : undefined}
                    >
                      {dockNode}
                    </section>
                  )}
                </div>
                {aside != null && (
                  <aside className="j-shell__aside" aria-label={asideLabel}>
                    {asideNode}
                  </aside>
                )}
              </div>
            ) : (
              <MainTag className="j-shell__main">{childrenNode}</MainTag>
            )}

            {bottombar}
            {statusbar != null && <StatusTag className="j-shell__statusbar">{statusbar}</StatusTag>}
          </div>
        </>
      )}
    </div>
  );
});
