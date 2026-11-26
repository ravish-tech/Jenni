import {
  useMemo,
  type CSSProperties,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  normalizeCodeLanguage,
  tokenizeCodeLines,
} from 'jenni-core/behaviors/code-block.js';
import { CopyButton } from './CopyButton';
import { attr } from './types';

export type CodeBlockVariant = 'surface' | 'outline' | 'contrast';

export interface CodeBlockProps
  extends Omit<ComponentProps<'div'>, 'children' | 'onCopy'> {
  /** Source code string rendered inside the block. */
  code: string;
  /** Syntax language identifier (`ts`, `tsx`, `js`, `jsx`, `vue`, `html`, `css`, `json`, `sql`, `sh`, `bash`, `diff`, `python`, `yaml`, or `plain`). */
  language?: string;
  /** Optional file path or title displayed in the header bar. */
  filename?: string;
  /** Render a tabular-numeral line number gutter. */
  lineNumbers?: boolean;
  /** Starting 1-based line number when `lineNumbers` or `highlightLines` is used. */
  startLine?: number;
  /** Line numbers to emphasize with `--j-code-line-highlight`. */
  highlightLines?: readonly number[];
  /** Enable unified diff line parsing (`+`, `-`, `@@`). Enabled automatically when `language === 'diff'`. */
  diff?: boolean;
  /** Soft-wrap long lines instead of scrolling horizontally. */
  wrap?: boolean;
  /** Show a copy-to-clipboard button for the raw `code`. */
  copyable?: boolean;
  /** Constrain scrollable viewport height (number in px or CSS length). */
  maxHeight?: string | number;
  /** Container surface and border treatment. */
  variant?: CodeBlockVariant;
  /** Custom trailing header action controls rendered before the copy button. */
  actions?: ReactNode;
  /** Fired when the built-in copy button copies `code`. */
  onCopy?: (value: string) => void;
}

export function CodeBlock({
  code,
  language = 'plain',
  filename,
  lineNumbers = false,
  startLine = 1,
  highlightLines,
  diff,
  wrap = false,
  copyable = true,
  maxHeight,
  variant = 'outline',
  actions,
  onCopy,
  className,
  style,
  ...rest
}: CodeBlockProps) {
  const normalizedLang = normalizeCodeLanguage(language);
  const rawLang = language.trim().toLowerCase();
  const displayLanguage =
    !rawLang || rawLang === 'plain' || rawLang === 'plaintext' || rawLang === 'text'
      ? ''
      : rawLang;

  const isDiff = diff !== undefined ? diff : normalizedLang === 'diff';

  const highlightSet = useMemo(
    () => new Set<number>(highlightLines ?? []),
    [highlightLines],
  );

  const lines = useMemo(
    () =>
      tokenizeCodeLines(code, language, {
        startLine,
        diff: isDiff,
      }),
    [code, language, startLine, isDiff],
  );

  const showHeader = Boolean(filename || displayLanguage || actions != null);

  let mergedStyle: CSSProperties | undefined = style;
  if (maxHeight != null) {
    const maxVal = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
    mergedStyle = {
      ...style,
      ['--j-code-max-h' as string]: maxVal,
    } as CSSProperties;
  }

  return (
    <div
      {...rest}
      data-j-managed=""
      className={className ? `j-code-block ${className}` : 'j-code-block'}
      data-variant={attr(variant, 'outline')}
      data-lang={normalizedLang}
      data-line-numbers={lineNumbers ? '' : undefined}
      data-wrap={wrap ? '' : undefined}
      style={mergedStyle}
    >
      {showHeader && (
        <div className="j-code-block__header">
          <div className="j-code-block__meta">
            {filename && <span className="j-code-block__filename">{filename}</span>}
            {displayLanguage && (
              <span className="j-code-block__lang">{displayLanguage}</span>
            )}
          </div>
          {(actions != null || copyable) && (
            <div className="j-code-block__actions">
              {actions}
              {copyable && (
                <CopyButton
                  value={code}
                  size="xs"
                  variant="ghost"
                  ariaLabel="Copy code"
                  onCopy={onCopy}
                />
              )}
            </div>
          )}
        </div>
      )}

      <div className="j-code-block__body">
        {!showHeader && copyable && (
          <div className="j-code-block__floating-actions">
            <CopyButton
              value={code}
              size="xs"
              variant="ghost"
              ariaLabel="Copy code"
              onCopy={onCopy}
            />
          </div>
        )}

        <pre
          className="j-code-block__pre"
          tabIndex={maxHeight != null ? 0 : undefined}
        >
          <code className="j-code-block__code">
            {lines.map((line) => (
              <span
                key={line.lineNumber}
                className="j-code-block__line"
                data-highlighted={highlightSet.has(line.lineNumber) ? '' : undefined}
                data-diff={line.diff ?? undefined}
              >
                {lineNumbers && (
                  <span className="j-code-block__gutter" aria-hidden="true">
                    {line.lineNumber}
                  </span>
                )}
                <span className="j-code-block__content">
                  {line.tokens.map((tok, ti) => (
                    <span
                      key={ti}
                      className="j-code-tok"
                      data-tok={tok.type}
                    >
                      {tok.text}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
