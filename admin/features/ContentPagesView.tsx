import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { ContentPage, Locale } from "../domain/types";
import { RichTextLite } from "../components/RichTextLite";
import { FormField } from "../components/FormField";
import { CardSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import { dirOf, LOCALES, localeName, pageTitle } from "../../src/lib/i18n";
import {
  Save,
  AlertTriangle,
  AlertCircle,
  Eye,
  Check,
  Edit,
} from "lucide-react";

const slugs: ContentPage["slug"][] = ["hakkinda", "gizlilik", "kosullar", "iletisim"];

export const ContentPagesView: React.FC = () => {
  const { t, locale } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<ContentPage[]>([]);

  // Selected cell
  const [selectedSlug, setSelectedSlug] = useState<ContentPage["slug"]>("hakkinda");
  const [selectedLang, setSelectedLang] = useState<Locale>("tr");

  // Edit draft state
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "published">("published");
  const [saving, setSaving] = useState(false);

  // Sayfa adları arayüz dilinde, uygulamanın bilgi sayfası başlıklarından (src/lib/i18n.ts).
  const slugLabel = (slug: ContentPage["slug"]) => pageTitle[locale][slug];

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getContentPages();
      setPages(data);
    } catch (err) {
      setError(t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // Update edit form when selection changes
  useEffect(() => {
    const page = pages.find(p => p.slug === selectedSlug && p.lang === selectedLang);
    if (page) {
      setEditTitle(page.title);
      setEditBody(page.body);
      setEditStatus(page.status);
    } else {
      setEditTitle("");
      setEditBody("");
      setEditStatus("draft");
    }
  }, [selectedSlug, selectedLang, pages]);

  const activePage = pages.find(p => p.slug === selectedSlug && p.lang === selectedLang) || null;
  const isCurrentLangRtl = dirOf(selectedLang) === "rtl";

  // Check for missing or draft pages
  let missingTranslationsCount = 0;
  slugs.forEach(s => {
    LOCALES.forEach(l => {
      const match = pages.find(p => p.slug === s && p.lang === l);
      if (!match || match.status === "draft" || !match.body.trim()) {
        missingTranslationsCount++;
      }
    });
  });

  const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updatedPage: ContentPage = {
        id: activePage?.id || `cnt-${Math.random().toString(36).substring(2, 7)}`,
        slug: selectedSlug,
        lang: selectedLang,
        title: editTitle,
        body: editBody,
        status: editStatus,
        updatedAt: new Date().toISOString(),
      };
      await api.updateContentPage(updatedPage);
      addToast(t("toastSuccessSave"), "success");
      fetchPages();
    } catch {
      addToast(t("toastActionError"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <span className="sr-only">{t("loading")}</span>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-6 h-6" />}
        title={t("errorTitle")}
        description={error}
        action={{ label: t("retry"), onClick: fetchPages }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
            {t("contentTitle")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            {t("contentPagesSubtitle")}
          </p>
        </div>
      </div>

      {/* Missing Translation Warning Alert */}
      {missingTranslationsCount > 0 && (
        <div
          className="p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--durum-uyari-zemin)",
            borderColor: "var(--durum-uyari)",
            color: "var(--durum-uyari)",
          }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            {t("contentMissingWarning")} {t("contentPagesMissingCount", { count: missingTranslationsCount })}
          </span>
        </div>
      )}

      {/* 4x4 Translation Matrix Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        <div
          className="px-5 py-3 border-b font-semibold text-xs sm:text-sm flex items-center justify-between"
          style={{
            backgroundColor: "var(--zemin)",
            borderColor: "var(--kenar)",
            color: "var(--yazi)",
          }}
        >
          <span>{t("contentMatrix")} {t("contentPagesMatrixSize")}</span>
          <span className="text-xs font-normal" style={{ color: "var(--yazi-soluk)" }}>
            {t("contentPagesMatrixHint")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <caption className="sr-only">{t("contentMatrix")}</caption>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--kenar)", backgroundColor: "var(--zemin)" }}>
                <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: "var(--yazi)" }}>
                  {t("contentSlug")}
                </th>
                {LOCALES.map(l => (
                  <th key={l} scope="col" lang={l} className="py-2.5 px-4 font-semibold text-center" style={{ color: "var(--yazi)" }}>
                    {localeName[l]} ({l.toUpperCase()})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--kenar)" }}>
              {slugs.map(s => (
                <tr key={s}>
                  <td className="py-3 px-4 font-semibold text-xs" style={{ color: "var(--yazi)" }}>
                    {slugLabel(s)}
                    <span className="block font-mono text-[10px] force-ltr" style={{ color: "var(--yazi-soluk)" }}>
                      /{s}
                    </span>
                  </td>

                  {LOCALES.map(l => {
                    const match = pages.find(p => p.slug === s && p.lang === l);
                    const isSelected = selectedSlug === s && selectedLang === l;
                    const isPublished = match?.status === "published";
                    const hasContent = Boolean(match?.body.trim());

                    return (
                      <td key={l} className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlug(s);
                            setSelectedLang(l);
                          }}
                          aria-label={`${slugLabel(s)} · ${localeName[l]}`}
                          aria-pressed={isSelected}
                          className="cursor-pointer w-full py-2 px-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all"
                          style={{
                            backgroundColor: isSelected
                              ? "var(--renk-ana)"
                              : isPublished
                              ? "var(--durum-basarili-zemin)"
                              : "var(--zemin)",
                            borderColor: isSelected
                              ? "var(--renk-ana)"
                              : isPublished
                              ? "var(--durum-basarili)"
                              : "var(--kenar)",
                            color: isSelected
                              ? "var(--renk-ana-yazi)"
                              : isPublished
                              ? "var(--durum-basarili)"
                              : "var(--yazi-soluk)",
                          }}
                        >
                          <div className="flex items-center gap-1 font-semibold text-[11px]">
                            {isPublished ? <Check className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                            <span>
                              {isPublished
                                ? t("rulesStatusPublished")
                                : hasContent
                                ? t("rulesStatusDraft")
                                : t("contentPagesMissing")}
                            </span>
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor & RTL Preview Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor Form */}
        <form
          onSubmit={handleSave}
          className="p-5 rounded-xl border space-y-4"
          style={{
            backgroundColor: "var(--kart)",
            borderColor: "var(--kenar)",
            borderRadius: "var(--radius)",
          }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--kenar)" }}>
            <div>
              <h3 className="font-semibold text-sm sm:text-base" style={{ color: "var(--yazi)" }}>
                {t("contentPagesEditing", { page: slugLabel(selectedSlug), lang: selectedLang.toUpperCase() })}
              </h3>
              <p className="text-xs" style={{ color: "var(--yazi-soluk)" }}>
                {t("contentPagesMarkdownHint")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as "draft" | "published")}
                aria-label={t("contentStatusField")}
                className="cursor-pointer text-xs font-semibold px-2.5 py-1.5 rounded-lg border appearance-none"
                style={{
                  backgroundColor: "var(--zemin)",
                  borderColor: "var(--kenar)",
                  color: "var(--yazi)",
                }}
              >
                <option value="published">{t("contentPagesStatusLive")}</option>
                <option value="draft">{t("rulesStatusDraft")}</option>
              </select>
            </div>
          </div>

          <FormField label={t("contentTitleField")} required>
            <input
              type="text"
              value={editTitle}
              dir={isCurrentLangRtl ? "rtl" : "ltr"}
              onChange={e => setEditTitle(e.target.value)}
              className="p-2.5 text-xs sm:text-sm rounded-lg border transition-colors"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
                color: "var(--yazi)",
                borderRadius: "var(--radius)",
              }}
              required
            />
          </FormField>

          <FormField label={t("contentBodyField")} required>
            <RichTextLite
              value={editBody}
              onChange={setEditBody}
              dir={isCurrentLangRtl ? "rtl" : "ltr"}
              rows={10}
              placeholder={t("contentPagesBodyPlaceholder")}
            />
          </FormField>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !editTitle.trim() || !editBody.trim()}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: "var(--renk-ana)",
                color: "var(--renk-ana-yazi)",
                borderRadius: "var(--radius)",
              }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? t("contentPagesSaving") : t("save")}</span>
            </button>
          </div>
        </form>

        {/* Right: Live Preview (With special RTL handling for AR & FA per §A.1 and §H) */}
        <div
          className="p-5 rounded-xl border flex flex-col justify-between"
          style={{
            backgroundColor: "var(--kart)",
            borderColor: "var(--kenar)",
            borderRadius: "var(--radius)",
          }}
        >
          <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: "var(--kenar)" }}>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" style={{ color: "var(--renk-ana)" }} />
              <h3 className="font-semibold text-sm sm:text-base" style={{ color: "var(--yazi)" }}>
                {isCurrentLangRtl ? t("contentPreviewRtl") : t("contentPagesPreview")}
              </h3>
            </div>
            {isCurrentLangRtl && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: "var(--durum-uyari-zemin)",
                  color: "var(--durum-uyari)",
                }}
              >
                {t("contentPagesRtlActive")}
              </span>
            )}
          </div>

          <div
            className="flex-1 p-4 rounded-lg border overflow-y-auto"
            dir={isCurrentLangRtl ? "rtl" : "ltr"}
            lang={selectedLang}
            style={{
              backgroundColor: "var(--zemin)",
              borderColor: "var(--kenar)",
            }}
          >
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--yazi)" }}>
              {editTitle || <span className="opacity-40 italic">{t("contentPagesNoTitle")}</span>}
            </h2>

            <div
              className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap space-y-2"
              style={{ color: "var(--yazi)" }}
            >
              {editBody || <span className="opacity-40 italic">{t("contentPagesNoBody")}</span>}
            </div>

            {/* Teknik değerler RTL dillerde de soldan sağa kalır; yalnız belgeleme amaçlı örnek değerler. */}
            <div
              className="mt-6 pt-4 border-t text-xs flex flex-col gap-1.5"
              style={{ borderColor: "var(--kenar)" }}
            >
              <span className="font-semibold" style={{ color: "var(--yazi-soluk)" }}>
                {t("contentPagesLtrFields")}
              </span>
              <div className="flex flex-wrap gap-2">
                <code className="force-ltr font-mono text-xs px-2 py-0.5 rounded bg-yazi/5">
                  NCHK-YYYY-XXXXXXXX
                </code>
                <code className="force-ltr font-mono text-xs px-2 py-0.5 rounded bg-yazi/5">
                  192.0.2.24
                </code>
                <code className="force-ltr font-mono text-xs px-2 py-0.5 rounded bg-yazi/5">
                  destek@example.com
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
