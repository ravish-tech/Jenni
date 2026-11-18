import {
  use,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from 'react';
import { formatFileSize, validateUploadFile } from '@jenni/core/behaviors/file-upload.js';
import { FieldContext, cx, flag, useControllable, type Tone } from './types';

export interface RejectedFileEntry {
  file: File;
  error: string;
}

export interface FileUploadProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: File[];
  defaultValue?: File[];
  onValueChange?: (files: File[]) => void;
  onReject?: (rejected: RejectedFileEntry[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  variant?: 'dropzone' | 'compact';
  tone?: Tone;
  label?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  invalid?: boolean;
}

export function FileUpload({
  value,
  defaultValue = [],
  onValueChange,
  onReject,
  accept,
  multiple = true,
  maxSize,
  maxFiles,
  variant = 'dropzone',
  tone,
  label,
  hint,
  disabled = false,
  invalid = false,
  className,
  ...rest
}: FileUploadProps) {
  const field = use(FieldContext);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [files, setFiles] = useControllable<File[]>(value, defaultValue, onValueChange);
  const [rejected, setRejected] = useState<RejectedFileEntry[]>([]);
  const [dragging, setDragging] = useState(false);

  const isDisabled = disabled || !!field?.disabled;
  const isInvalid = invalid || !!field?.invalid || rejected.length > 0;

  const computedHint =
    hint ??
    ([accept, maxSize ? `up to ${formatFileSize(maxSize)}` : null].filter(Boolean).join(' · ') || undefined);

  const processFiles = (incoming: FileList | File[]) => {
    if (isDisabled) return;
    const validNext: File[] = multiple ? [...files] : [];
    const nextRejected: RejectedFileEntry[] = multiple ? [...rejected] : [];
    const newlyRejected: RejectedFileEntry[] = [];

    for (const file of Array.from(incoming)) {
      const err = validateUploadFile(file, { maxSize, accept });
      if (err) {
        const entry = { file, error: err };
        nextRejected.push(entry);
        newlyRejected.push(entry);
        continue;
      }
      if (maxFiles !== undefined && validNext.length >= maxFiles) {
        const entry = { file, error: `Maximum ${maxFiles} files allowed` };
        nextRejected.push(entry);
        newlyRejected.push(entry);
        continue;
      }
      validNext.push(file);
      if (!multiple) break;
    }

    setFiles(validNext);
    setRejected(nextRejected);
    if (newlyRejected.length) onReject?.(newlyRejected);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
  };

  const handleDragEnter = (e: ReactDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (isDisabled) return;
    dragDepthRef.current += 1;
    setDragging(true);
  };

  const handleDragOver = (e: ReactDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!isDisabled && e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: ReactDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragging(false);
  };

  const handleDrop = (e: ReactDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    if (e.dataTransfer?.files?.length) processFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={cx('j-file-upload', className)}
      data-j-managed=""
      data-variant={variant === 'compact' ? 'compact' : undefined}
      data-tone={tone}
      data-dragging={flag(dragging)}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-invalid={isInvalid ? 'true' : undefined}
      {...rest}
    >
      <label
        className="j-file-upload__dropzone"
        data-dragging={flag(dragging)}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-invalid={isInvalid ? 'true' : undefined}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id={field?.id}
          ref={inputRef}
          type="file"
          className="j-file-upload__input"
          accept={accept}
          multiple={multiple || undefined}
          disabled={isDisabled || undefined}
          aria-describedby={field?.describedBy}
          onChange={handleInputChange}
        />

        {variant === 'compact' ? (
          <>
            <span className="j-file-upload__lead">
              <span className="j-file-upload__icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 10.5V3M5 5.5 8 2.5l3 3" />
                  <path d="M2.5 11v1.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V11" />
                </svg>
              </span>
              <span className="j-file-upload__content">
                <span className="j-file-upload__title">{label ?? 'Attach files or drop here'}</span>
                {computedHint != null && <span className="j-file-upload__hint">{computedHint}</span>}
              </span>
            </span>
            <span className="j-file-upload__cta">Browse</span>
          </>
        ) : (
          <>
            <span className="j-file-upload__icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 10.5V3M5 5.5 8 2.5l3 3" />
                <path d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />
              </svg>
            </span>
            <span className="j-file-upload__content">
              <span className="j-file-upload__title">
                {label ?? (
                  <>
                    Drop files here or <span className="j-file-upload__browse">browse</span>
                  </>
                )}
              </span>
              {computedHint != null && <span className="j-file-upload__hint">{computedHint}</span>}
            </span>
          </>
        )}
      </label>

      {(files.length > 0 || rejected.length > 0) && (
        <ul className="j-file-upload__list">
          {files.map((file, idx) => (
            <li key={`ok-${file.name}-${idx}`} className="j-file-upload__item">
              <span className="j-file-upload__file-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2H4.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.5L9.5 2Z" />
                  <path d="M9.5 2v3.5H13" />
                </svg>
              </span>
              <div className="j-file-upload__meta">
                <span className="j-file-upload__name">{file.name}</span>
                <span className="j-file-upload__size">{formatFileSize(file.size)}</span>
              </div>
              <button
                type="button"
                className="j-file-upload__remove"
                aria-label={`Remove ${file.name}`}
                disabled={isDisabled || undefined}
                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                </svg>
              </button>
            </li>
          ))}

          {rejected.map((item, idx) => (
            <li key={`err-${item.file.name}-${idx}`} className="j-file-upload__item" data-invalid="">
              <span className="j-file-upload__file-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3.5M8 11h.01" />
                </svg>
              </span>
              <div className="j-file-upload__meta">
                <span className="j-file-upload__name">{item.file.name}</span>
                <span className="j-file-upload__error">
                  {formatFileSize(item.file.size)} · {item.error}
                </span>
              </div>
              <button
                type="button"
                className="j-file-upload__remove"
                aria-label={`Dismiss ${item.file.name}`}
                disabled={isDisabled || undefined}
                onClick={() => setRejected((prev) => prev.filter((_, i) => i !== idx))}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
