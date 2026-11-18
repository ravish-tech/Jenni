import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  DEFAULT_TOOLBAR_GROUPS,
  TOOLBAR_META,
  applyLinkAtRange,
  countProseStats,
  execRichTextAction,
  isEditorEmpty,
  readActiveFormats,
  removeLinkAtRange,
  restoreSelectionRange,
  saveSelectionRange,
  type ActiveFormats,
} from '@jenni/core/behaviors/rich-text.js';
import {
  cx,
  flag,
  mergeRefs,
  useControllable,
  type RichTextAction,
  type Tone,
} from './types';
import { useFieldProps } from './useFieldProps';

export type { RichTextAction };

export interface RichTextEditorProps
  extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (html: string) => void;
  placeholder?: string;
  minRows?: number;
  minHeight?: string | number;
  toolbar?: RichTextAction[][] | RichTextAction[];
  showFooter?: boolean;
  tone?: Tone;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
}

const EMPTY_FORMATS: ActiveFormats = {
  block: 'p',
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
  bulletList: false,
  orderedList: false,
  link: false,
  linkHref: '',
};

export function RichTextEditor({
  value,
  defaultValue = '',
  onValueChange,
  placeholder = 'Write something…',
  minRows = 5,
  minHeight,
  toolbar,
  showFooter = true,
  tone,
  readOnly = false,
  disabled,
  invalid,
  name,
  className,
  style,
  ref,
  ...rest
}: RichTextEditorProps) {
  const field = useFieldProps(invalid);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [current, setCurrent] = useControllable<string>(value, defaultValue, onValueChange);
  const [formats, setFormats] = useState<ActiveFormats>(EMPTY_FORMATS);
  const [empty, setEmpty] = useState(() => !current);
  const [stats, setStats] = useState(() => countProseStats(current || ''));
  const [linkBarOpen, setLinkBarOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');

  const isDisabled = !!(disabled || field.disabled);
  const isInvalid = !!(invalid || field['aria-invalid']);

  const toolbarGroups: RichTextAction[][] = !toolbar
    ? DEFAULT_TOOLBAR_GROUPS
    : toolbar.length === 0
      ? []
      : Array.isArray(toolbar[0])
        ? (toolbar as RichTextAction[][])
        : [toolbar as RichTextAction[]];

  const syncMetrics = () => {
    const el = editorRef.current;
    if (!el) return;
    setEmpty(isEditorEmpty(el));
    setFormats(readActiveFormats(el));
    setStats(countProseStats(el));
  };

  const emitHtml = () => {
    const el = editorRef.current;
    if (!el) return;
    const isEmpty = isEditorEmpty(el);
    setEmpty(isEmpty);
    setFormats(readActiveFormats(el));
    setStats(countProseStats(el));
    const nextHtml = isEmpty ? '' : el.innerHTML;
    setCurrent(nextHtml);
  };

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const curHtml = isEditorEmpty(el) ? '' : el.innerHTML;
    if ((current || '') !== curHtml) {
      el.innerHTML = current || '';
      syncMetrics();
    }
  }, [current]);

  useEffect(() => {
    const onSelChange = () => {
      const el = editorRef.current;
      if (!el) return;
      const sel = document.getSelection();
      if (sel?.anchorNode && el.contains(sel.anchorNode)) {
        setFormats(readActiveFormats(el));
      }
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, []);

  const openLinkBar = () => {
    const el = editorRef.current;
    if (!el || isDisabled || readOnly) return;
    savedRangeRef.current = saveSelectionRange(el);
    const f = readActiveFormats(el);
    setLinkDraft(f.linkHref || '');
    setLinkBarOpen(true);
    requestAnimationFrame(() => {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    });
  };

  const closeLinkBar = (restore = true) => {
    setLinkBarOpen(false);
    if (restore && editorRef.current) {
      restoreSelectionRange(editorRef.current, savedRangeRef.current);
      syncMetrics();
    }
  };

  const applyLink = () => {
    if (!editorRef.current) return;
    applyLinkAtRange(editorRef.current, savedRangeRef.current, linkDraft);
    setLinkBarOpen(false);
    emitHtml();
  };

  const removeLink = () => {
    if (!editorRef.current) return;
    removeLinkAtRange(editorRef.current, savedRangeRef.current);
    setLinkBarOpen(false);
    emitHtml();
  };

  const triggerAction = (act: RichTextAction) => {
    const el = editorRef.current;
    if (!el || isDisabled || readOnly) return;
    if (act === 'link') {
      if (linkBarOpen) closeLinkBar(true);
      else openLinkBar();
      return;
    }
    execRichTextAction(el, act);
    emitHtml();
  };

  const handleEditorKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isDisabled || readOnly || !editorRef.current) return;
    const mod = e.metaKey || e.ctrlKey;
    if (!mod || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'b') {
      e.preventDefault();
      triggerAction('bold');
    } else if (k === 'i') {
      e.preventDefault();
      triggerAction('italic');
    } else if (k === 'u') {
      e.preventDefault();
      triggerAction('underline');
    } else if (k === 'e') {
      e.preventDefault();
      triggerAction('code');
    } else if (k === 'k') {
      e.preventDefault();
      openLinkBar();
    }
  };

  const isActionActive = (act: RichTextAction) => {
    if (act === 'p' || act === 'h2' || act === 'h3' || act === 'blockquote') {
      return formats.block === act;
    }
    if (
      act === 'bold' ||
      act === 'italic' ||
      act === 'underline' ||
      act === 'strike' ||
      act === 'code' ||
      act === 'bulletList' ||
      act === 'orderedList' ||
      act === 'link'
    ) {
      return formats[act];
    }
    return false;
  };

  const contentStyle: CSSProperties = {
    '--_rte-rows': String(minRows),
    ...(minHeight != null
      ? { '--_rte-min-h': typeof minHeight === 'number' ? `${minHeight}px` : minHeight }
      : {}),
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={cx('j-rich-text', className)}
      style={style}
      data-j-managed=""
      data-tone={tone}
      data-readonly={flag(readOnly)}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-invalid={isInvalid ? 'true' : undefined}
      {...rest}
    >
      {name && <input type="hidden" name={name} value={current} />}

      {!readOnly && toolbarGroups.length > 0 && (
        <div
          className="j-rich-text__toolbar"
          role="toolbar"
          aria-label="Text formatting"
          onMouseDown={(e) => e.preventDefault()}
        >
          {toolbarGroups.map((group, gIdx) => (
            <span key={gIdx} style={{ display: 'contents' }}>
              {gIdx > 0 && <span className="j-rich-text__sep" aria-hidden="true" />}
              <div className="j-rich-text__group">
                {group.map((act) => {
                  const toggleable = act !== 'clear' && act !== 'undo' && act !== 'redo';
                  return (
                    <button
                      key={act}
                      type="button"
                      className="j-rich-text__btn"
                      data-action={act}
                      title={TOOLBAR_META[act].label}
                      aria-label={TOOLBAR_META[act].label}
                      aria-pressed={
                        toggleable ? (isActionActive(act) ? 'true' : 'false') : undefined
                      }
                      disabled={isDisabled || undefined}
                      onClick={() => triggerAction(act)}
                    >
                      {act === 'bold' ? (
                        <strong>B</strong>
                      ) : act === 'italic' ? (
                        <em style={{ fontFamily: 'Georgia, serif' }}>I</em>
                      ) : act === 'underline' ? (
                        <span style={{ textDecoration: 'underline' }}>U</span>
                      ) : act === 'strike' ? (
                        <span style={{ textDecoration: 'line-through' }}>S</span>
                      ) : act === 'code' ? (
                        <span style={{ fontFamily: 'var(--j-font-mono)', fontSize: 11 }}>
                          &lt;/&gt;
                        </span>
                      ) : (
                        TOOLBAR_META[act].short
                      )}
                    </button>
                  );
                })}
              </div>
            </span>
          ))}
        </div>
      )}

      {linkBarOpen && !readOnly && (
        <div className="j-rich-text__link-bar">
          <input
            ref={linkInputRef}
            type="url"
            className="j-rich-text__link-input"
            aria-label="Link URL"
            placeholder="https://example.com"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                closeLinkBar(true);
              }
            }}
          />
          <button
            type="button"
            className="j-rich-text__link-btn"
            data-primary=""
            onClick={applyLink}
          >
            Apply
          </button>
          {formats.link && (
            <button
              type="button"
              className="j-rich-text__link-btn"
              data-danger=""
              onClick={removeLink}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            className="j-rich-text__link-btn"
            onClick={() => closeLinkBar(true)}
          >
            Cancel
          </button>
        </div>
      )}

      <div
        id={field.id}
        ref={mergeRefs(editorRef)}
        className="j-rich-text__content"
        role="textbox"
        aria-multiline="true"
        contentEditable={!isDisabled && !readOnly}
        suppressContentEditableWarning
        aria-readonly={readOnly ? 'true' : undefined}
        aria-describedby={field['aria-describedby']}
        aria-invalid={field['aria-invalid']}
        data-placeholder={placeholder}
        data-empty={flag(empty)}
        style={contentStyle}
        onInput={emitHtml}
        onKeyDown={handleEditorKeyDown}
        onKeyUp={syncMetrics}
        onMouseUp={syncMetrics}
      />

      {showFooter && (
        <div className="j-rich-text__footer">
          <span>{readOnly ? 'Read-only' : 'Rich text'}</span>
          <span className="j-rich-text__counts">
            {stats.words} {stats.words === 1 ? 'word' : 'words'} · {stats.chars}{' '}
            {stats.chars === 1 ? 'char' : 'chars'}
          </span>
        </div>
      )}
    </div>
  );
}
