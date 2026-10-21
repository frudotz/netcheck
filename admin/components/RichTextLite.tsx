import React, { useRef } from "react";
import { Bold, List, Link as LinkIcon, Heading2 } from "lucide-react";
import { useI18n } from "../i18n";

export interface RichTextLiteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  dir?: "ltr" | "rtl";
}

export const RichTextLite: React.FC<RichTextLiteProps> = ({
  value,
  onChange,
  placeholder,
  rows = 8,
  dir = "ltr",
}) => {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    const replacement = `${prefix}${selected || t("richTextSampleWord")}${suffix}`;
    const nextValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextValue);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 0);
  };

  return (
    <div
      className="flex flex-col border rounded-lg overflow-hidden"
      style={{
        borderColor: "var(--kenar)",
        backgroundColor: "var(--kart)",
        borderRadius: "var(--radius)",
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-1 p-1.5 border-b flex-wrap"
        style={{
          backgroundColor: "var(--zemin)",
          borderColor: "var(--kenar)",
        }}
      >
        <button
          type="button"
          onClick={() => insertTag("**", "**")}
          className="cursor-pointer p-1.5 rounded hover:bg-yazi/5"
          title={t("richTextBold")}
          aria-label={t("richTextBold")}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag("\n## ", "\n")}
          className="cursor-pointer p-1.5 rounded hover:bg-yazi/5"
          title={t("richTextHeading")}
          aria-label={t("richTextHeading")}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag("\n* ", "")}
          className="cursor-pointer p-1.5 rounded hover:bg-yazi/5"
          title={t("richTextList")}
          aria-label={t("richTextList")}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag("[", "](https://...)")}
          className="cursor-pointer p-1.5 rounded hover:bg-yazi/5"
          title={t("richTextLink")}
          aria-label={t("richTextLink")}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Editor text area */}
      <textarea
        ref={textareaRef}
        rows={rows}
        dir={dir}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3.5 text-sm font-mono leading-relaxed resize-y"
        style={{
          backgroundColor: "var(--kart)",
          color: "var(--yazi)",
        }}
      />
    </div>
  );
};
