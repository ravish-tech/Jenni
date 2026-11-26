import type { ComponentProps, ReactNode } from 'react';
import { Icon } from './Icon';
import { attr } from './types';

export type TimelineSize = 'sm' | 'md';
export type TimelineLine = 'solid' | 'dashed';
export type TimelineTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface TimelineEntry {
  id?: string | number;
  title?: ReactNode;
  time?: ReactNode;
  description?: ReactNode;
  tone?: TimelineTone;
  icon?: string;
  dot?: ReactNode;
  active?: boolean;
  line?: TimelineLine;
  children?: ReactNode;
}

export interface TimelineProps extends ComponentProps<'ol'> {
  /** Compact (`sm`) or default (`md`) event spacing and typography. */
  size?: TimelineSize;
  /** Connector rail style across items. */
  line?: TimelineLine;
  /** Optional data-driven shorthand items. */
  items?: TimelineEntry[];
}

export interface TimelineItemProps extends Omit<ComponentProps<'li'>, 'title'> {
  /** Event headline. */
  title?: ReactNode;
  /** Timestamp label rendered in `tabular-nums`. */
  time?: ReactNode;
  /** Secondary event summary. */
  description?: ReactNode;
  /** Semantic status tone for the step marker. */
  tone?: TimelineTone;
  /** Icon name rendered via `Icon` inside `.j-timeline__marker`. */
  icon?: string;
  /** Custom marker node overriding `icon` and the default ring. */
  dot?: ReactNode;
  /** Highlights the current/in-flight step with an optical halo ring. */
  active?: boolean;
  /** Per-item override for the trailing vertical connector rail. */
  line?: TimelineLine;
}

export function TimelineItem({
  title,
  time,
  description,
  tone = 'neutral',
  icon,
  dot,
  active = false,
  line,
  className,
  children,
  ...rest
}: TimelineItemProps) {
  const markerContent = dot ?? (icon ? <Icon name={icon} /> : null);
  const hasHeader = title != null || time != null;

  return (
    <li
      {...rest}
      className={className ? `j-timeline__item ${className}` : 'j-timeline__item'}
      data-tone={attr(tone, 'neutral')}
      data-active={active ? '' : undefined}
      data-line={line}
      aria-current={active ? 'step' : undefined}
    >
      <div className="j-timeline__axis" aria-hidden="true">
        <div className="j-timeline__marker-wrap">
          <span className="j-timeline__marker">{markerContent}</span>
        </div>
        <span className="j-timeline__rail" />
      </div>

      <div className="j-timeline__content">
        {hasHeader && (
          <div className="j-timeline__header">
            {title != null && <span className="j-timeline__title">{title}</span>}
            {time != null && <span className="j-timeline__time">{time}</span>}
          </div>
        )}
        {description != null && <p className="j-timeline__description">{description}</p>}
        {children != null && <div className="j-timeline__details">{children}</div>}
      </div>
    </li>
  );
}

export function Timeline({
  size = 'md',
  line = 'solid',
  items,
  className,
  children,
  ...rest
}: TimelineProps) {
  return (
    <ol
      {...rest}
      className={className ? `j-timeline ${className}` : 'j-timeline'}
      data-size={attr(size, 'md')}
      data-line={attr(line, 'solid')}
    >
      {items && items.length > 0
        ? items.map((entry, idx) => (
            <TimelineItem
              key={entry.id ?? idx}
              title={entry.title}
              time={entry.time}
              description={entry.description}
              tone={entry.tone}
              icon={entry.icon}
              dot={entry.dot}
              active={entry.active}
              line={entry.line}
            >
              {entry.children}
            </TimelineItem>
          ))
        : children}
    </ol>
  );
}
