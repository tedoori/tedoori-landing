"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// ---------- 아이콘 (선 굵기 1.8, 같은 모양 규칙) ----------

const PATHS = {
  check: "M4 10.5 8 14.5 16 5.5",
  plus: "M10 4v12M4 10h12",
  minus: "M4 10h12",
  chevronRight: "M8 5l5 5-5 5",
  chevronDown: "M5 8l5 5 5-5",
  arrowLeft: "M16 10H4m5-5-5 5 5 5",
  close: "M5 5l10 10M15 5 5 15",
  info: "M10 9v5M10 6.2v.1M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",
  alert: "M10 6v5M10 13.8v.1M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",
  search: "M9 15A6 6 0 1 0 9 3a6 6 0 0 0 0 12Zm4.5-1.5L17 17",
  bell: "M5 8a5 5 0 0 1 10 0c0 5 2 6 2 6H3s2-1 2-6Zm3.5 9a1.7 1.7 0 0 0 3 0",
  photo: "M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5v-8ZM3 13l4-4 3 3 2-2 5 5M13 8.5v.1",
  chat: "M4 5h12v8H9l-4 3v-3H4V5Z",
  leaf: "M5 15C5 8 9 4 16 4c0 7-4 11-11 11Zm0 0 6-6",
  home: "M4 9.5 10 4l6 5.5V16H4V9.5Z M8.5 16v-4h3v4",
  file: "M6 3h6l3 3v11H6V3Zm6 0v3h3M8.5 10h4M8.5 13h4",
  heart: "M10 16s-6-3.6-6-8a3.3 3.3 0 0 1 6-1.9A3.3 3.3 0 0 1 16 8c0 4.4-6 8-6 8Z",
  spinner: "M10 3a7 7 0 1 0 7 7",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "ui-ico" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d={PATHS[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- 버튼 ----------

type BtnVariant = "primary" | "soft" | "outline" | "ghost" | "neutral" | "gray";
type BtnSize = "xs" | "m" | "l";

export function Button({
  children,
  variant = "primary",
  size = "l",
  block,
  href,
  icon,
  ...rest
}: {
  children: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  block?: boolean;
  href?: string;
  icon?: IconName;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `btn btn--${variant} btn--${size}${block ? " btn--block" : ""} ${rest.className ?? ""}`.trim();
  const inner = (
    <>
      {icon && <Icon name={icon} />}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" {...rest} className={cls}>
      {inner}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  variant = "plain",
  size = "m",
  badge,
  ...rest
}: {
  icon: IconName;
  label: string;
  variant?: "plain" | "fill" | "solid" | "outline";
  size?: "sm" | "m";
  badge?: number | "dot";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const btn = (
    <button
      type="button"
      aria-label={label}
      {...rest}
      className={`ui-icon-btn${variant !== "plain" ? ` ui-icon-btn--${variant}` : ""}${size === "sm" ? " ui-icon-btn--sm" : ""}`}
    >
      <Icon name={icon} />
    </button>
  );
  if (badge === undefined) return btn;
  return (
    <span className="ui-badge-wrap">
      {btn}
      <Badge value={badge} />
    </span>
  );
}

export function Badge({ value }: { value: number | "dot" }) {
  if (value === "dot") return <span className="ui-badge ui-badge--dot" aria-label="새 소식" />;
  return <span className="ui-badge">{value > 99 ? "99+" : value}</span>;
}

export function Fab({ children, icon = "plus", onClick }: { children: ReactNode; icon?: IconName; onClick?: () => void }) {
  return (
    <button type="button" className="ui-fab" onClick={onClick}>
      <Icon name={icon} />
      {children}
    </button>
  );
}

// ---------- 선택 ----------

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="ui-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  children,
  selected,
  onClick,
  disabled,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="ui-chip" aria-pressed={!!selected} onClick={onClick} disabled={disabled}>
      {selected && <Icon name="check" className="ui-ico" />}
      {children}
    </button>
  );
}

export function OptionBox({
  title,
  desc,
  selected,
  onClick,
}: {
  title: string;
  desc?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="ui-option" aria-pressed={!!selected} onClick={onClick}>
      <span>
        {title}
        {desc && <span className="ui-option__desc">{desc}</span>}
      </span>
      {selected && <Icon name="check" />}
    </button>
  );
}

export function Checkbox({
  label,
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  label: ReactNode;
  checked: boolean;
  indeterminate?: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <label className="ui-check">
      <input ref={ref} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" style={{ display: "flex", flexDirection: "column" }}>
      {options.map((o) => (
        <label key={o.value} className="ui-check">
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function Switch({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="ui-switch-row">
      <span className="ui-switch-row__text" id={id}>
        <strong>{label}</strong>
        {desc && <span>{desc}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={id} className="ui-switch" onClick={() => onChange(!checked)} />
    </div>
  );
}

export function Stepper({
  value,
  min = 0,
  max = 99,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="ui-stepper" role="group" aria-label={label}>
      <button type="button" aria-label="줄이기" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="minus" />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="늘리기" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

// ---------- 입력 ----------

export function TextField({
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  helper,
  maxLength,
  clearable,
  variant = "box",
  multiline,
  type = "text",
  disabled,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  maxLength?: number;
  clearable?: boolean;
  variant?: "box" | "line";
  multiline?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const cls = `ui-input${variant === "line" ? " ui-input--line" : ""}${multiline ? " ui-textarea" : ""}`;
  return (
    <div className={`ui-field${error ? " ui-field--error" : ""}`}>
      <label className="ui-field__label" htmlFor={id}>
        {label}
        {required && <em> *</em>}
      </label>
      <div className="ui-field__box">
        {multiline ? (
          <textarea
            id={id}
            className={cls}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            id={id}
            type={type}
            className={cls}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {clearable && value && !multiline && (
          <button type="button" className="ui-field__clear" aria-label="지우기" onClick={() => onChange("")}>
            <Icon name="close" />
          </button>
        )}
      </div>
      {(error || helper || maxLength) && (
        <div className="ui-field__foot">
          <span role={error ? "alert" : undefined}>{error ?? helper}</span>
          {maxLength && (
            <span>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const id = useId();
  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="ui-input ui-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ---------- 상태 · 안내 ----------

export type QuoteStatus = "received" | "checking" | "visit" | "needs" | "quoted" | "done" | "completed" | "hold" | "canceled";
const STATUS_LABEL: Record<QuoteStatus, string> = {
  received: "접수됨",
  checking: "확인 중",
  visit: "실측 예정",
  needs: "보완 필요",
  quoted: "견적 도착",
  done: "진행 확정",
  completed: "완료",
  hold: "보류",
  canceled: "취소됨",
};

/** 테두리 고유 지표: 견적 진행 상태 */
export function StatusBadge({ status }: { status: QuoteStatus }) {
  return <span className={`ui-status ui-status--${status}`}>{STATUS_LABEL[status]}</span>;
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
}) {
  const icon: IconName = tone === "success" ? "check" : tone === "info" ? "info" : "alert";
  return (
    <div className={`ui-callout ui-callout--${tone}`} role={tone === "danger" ? "alert" : undefined}>
      <Icon name={icon} />
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div className="ui-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export function Steps({ items, current }: { items: string[]; current: number }) {
  return (
    <ol className="ui-steps">
      {items.map((s, i) => (
        <li key={s} className={i < current ? "is-done" : i === current ? "is-now" : ""} aria-current={i === current ? "step" : undefined}>
          <span className="ui-steps__dot">{i < current ? <Icon name="check" className="ui-ico" /> : i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="ui-tooltip">
      {children}
      <span className="ui-tooltip__bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

// ---------- 탐색 ----------

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="ui-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}>
          {t.label}
          {t.count !== undefined && <span className="ui-tabs__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function ListItem({
  icon,
  title,
  detail,
  suffix,
  onClick,
}: {
  icon?: IconName;
  title: string;
  detail?: string;
  suffix?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="ui-list-item" onClick={onClick}>
      {icon && (
        <span className="ui-list-item__prefix">
          <Icon name={icon} />
        </span>
      )}
      <span className="ui-list-item__body">
        <span className="ui-list-item__title">{title}</span>
        {detail && <span className="ui-list-item__detail">{detail}</span>}
      </span>
      {suffix}
      <Icon name="chevronRight" />
    </button>
  );
}

export function Accordion({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="ui-accordion">
      {items.map((it) => (
        <details key={it.q}>
          <summary>
            {it.q}
            <Icon name="chevronDown" />
          </summary>
          <div className="ui-accordion__body">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

export function EmptyState({ icon = "file", title, desc, action }: { icon?: IconName; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="ui-empty">
      <span className="ui-empty__icon">
        <Icon name={icon} />
      </span>
      <strong>{title}</strong>
      {desc && <p>{desc}</p>}
      {action}
    </div>
  );
}

// ---------- 떠 있는 요소 ----------

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, onClose]);
}

export function Dialog({
  open,
  title,
  desc,
  confirm,
  cancel = "취소",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  desc?: string;
  confirm: string;
  cancel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="ui-dim" onClick={onClose}>
      <div className="ui-dialog" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
        <div className="ui-dialog__actions">
          <Button variant="gray" size="m" onClick={onClose}>
            {cancel}
          </Button>
          <Button size="m" onClick={onConfirm}>
            {confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BottomSheet({
  open,
  title,
  items,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  items: string[];
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="ui-dim ui-dim--sheet" onClick={onClose}>
      <div className="ui-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="ui-sheet__handle" />
        <h2>{title}</h2>
        <div className="ui-sheet__list">
          {items.map((it) => (
            <button key={it} type="button" onClick={() => onSelect(it)}>
              {it}
              <Icon name="chevronRight" />
            </button>
          ))}
        </div>
        <Button variant="gray" block onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ msg: string; action?: { label: string; run: () => void } } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const node = toast ? (
    <div className="ui-toast" role="status">
      <Icon name="check" />
      {toast.msg}
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.run();
            setToast(null);
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  ) : null;
  return { show: setToast, node };
}
