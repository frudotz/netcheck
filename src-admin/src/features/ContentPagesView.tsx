import React, { useState, useEffect } from "react";
import { api } from "../api/nativeAdapter";
import { ContentPage, Lang } from "../domain/types";
import { RichTextLite } from "../components/RichTextLite";
import { StatusBadge } from "../components/StatusBadge";
import { FormField } from "../components/FormField";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import {
  FileCode,
  Save,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Eye,
  Check,
  Edit,
} from "lucide-react";

export const ContentPagesView: React.FC = () => {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<ContentPage[]>([]);

  // Selected cell
  const [selectedSlug, setSelectedSlug] = useState<ContentPage["slug"]>("hakkinda");
  const [selectedLang, setSelectedLang] = useState<Lang>("tr");

  // Edit draft state
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "published">("published");
  const [saving, setSaving] = useState(false);

  const slugs: { id: ContentPage["slug"]; label: string }[] = [
    { id: "hakkinda", label: "Hakkında" },
    { id: "gizlilik", label: "Gizlilik Politikası" },
    { id: "kosullar", label: "Kullanım Koşulları" },
    { id: "iletisim", label: "İletişim & Destek" },
  ];

  const langs: { id: Lang; label: string; isRtl: boolean }[] = [
    { id: "tr", label: "Türkçe (TR)", isRtl: false },
    { id: "en", label: "English (EN)", isRtl: false },
    { id: "ar", label: "العربية (AR)", isRtl: true },
    { id: "fa", label: "فارسی (FA)", isRtl: true },
  ];

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getContentPages();
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDesc"));
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
  const isCurrentLangRtl = selectedLang === "ar" || selectedLang === "fa";

  // Check for missing or draft pages
  let missingTranslationsCount = 0;
  slugs.forEach(s => {
    langs.forEach(l => {
      const match = pages.find(p => p.slug === s.id && p.lang === l.id);
      if (!match || match.status === "draft" || !match.body.trim()) {
        missingTranslationsCount++;
      }
    });
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updatedPage: ContentPage = {
        id: activePage?.id ?? "",
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
    } catch (error) {
      addToast(error instanceof Error ? error.message : t("toastActionError"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
            {t("contentTitle")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            Uygulama içi statik bilgi ve yasal metinlerin 4 dilde yönetimi
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
            {t("contentMissingWarning")} ({missingTranslationsCount} sayfa henüz yayınlanmamış veya taslak durumdadır).
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
          <span>{t("contentMatrix")} (4 Sayfa × 4 Dil)</span>
          <span className="text-xs font-normal" style={{ color: "var(--yazi-soluk)" }}>
            Düzenlemek için bir hücreye tıklayın
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{t("contentMatrix")}</caption>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--kenar)", backgroundColor: "var(--zemin)" }}>
                <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: "var(--yazi)" }}>
                  {t("contentSlug")}
                </th>
                {langs.map(l => (
                  <th key={l.id} scope="col" className="py-2.5 px-4 font-semibold text-center" style={{ color: "var(--yazi)" }}>
                    {l.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--kenar)" }}>
              {slugs.map(s => (
                <tr key={s.id}>
                  <td className="py-3 px-4 font-semibold text-xs" style={{ color: "var(--yazi)" }}>
                    {s.label}
                    <span className="block font-mono text-[10px]" style={{ color: "var(--yazi-soluk)" }}>
                      /{s.id}
                    </span>
                  </td>

                  {langs.map(l => {
                    const match = pages.find(p => p.slug === s.id && p.lang === l.id);
                    const isSelected = selectedSlug === s.id && selectedLang === l.id;
                    const isPublished = match?.status === "published";
                    const hasContent = Boolean(match?.body.trim());

                    return (
                      <td key={l.id} className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlug(s.id);
                            setSelectedLang(l.id);
                          }}
                          className="cursor-pointer w-full py-2 px-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all focus-visible:outline-none"
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
                            <span>{isPublished ? "Yayında" : hasContent ? "Taslak" : "Eksik"}</span>
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
              <h3 className="font-semibold text-sm sm:text-base capitalize" style={{ color: "var(--yazi)" }}>
                Düzenle: {slugs.find(s => s.id === selectedSlug)?.label} ({selectedLang.toUpperCase()})
              </h3>
              <p className="text-xs" style={{ color: "var(--yazi-soluk)" }}>
                Markdown etiketleri ile biçimlendirme yapabilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as "draft" | "published")}
                className="cursor-pointer text-xs font-semibold px-2.5 py-1.5 rounded-lg border appearance-none"
                style={{
                  backgroundColor: "var(--zemin)",
                  borderColor: "var(--kenar)",
                  color: "var(--yazi)",
                }}
              >
                <option value="published">Yayında (Canlı)</option>
                <option value="draft">Taslak</option>
              </select>
            </div>
          </div>

          <FormField label={t("contentTitleField")} required>
            <input
              type="text"
              value={editTitle}
              dir={isCurrentLangRtl ? "rtl" : "ltr"}
              onChange={e => setEditTitle(e.target.value)}
              className="p-2.5 text-xs sm:text-sm rounded-lg border transition-colors focus-visible:outline-none"
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
              placeholder="İçerik metnini buraya girin..."
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
              <span>{saving ? "Kaydediliyor..." : t("save")}</span>
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
                {isCurrentLangRtl ? t("contentPreviewRtl") : "Canlı Önizleme"}
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
                RTL Düzeni Aktif
              </span>
            )}
          </div>

          <div
            className="flex-1 p-4 rounded-lg border overflow-y-auto"
            dir={isCurrentLangRtl ? "rtl" : "ltr"}
            style={{
              backgroundColor: "var(--zemin)",
              borderColor: "var(--kenar)",
            }}
          >
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--yazi)" }}>
              {editTitle || <span className="opacity-40 italic">Başlık girilmedi</span>}
            </h2>

            <div
              className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap space-y-2"
              style={{ color: "var(--yazi)" }}
            >
              {editBody || <span className="opacity-40 italic">İçerik girilmedi</span>}
            </div>

            {/* Simulated technical details ensuring LTR on RTL locales per §A.1 */}
            <div
              className="mt-6 pt-4 border-t text-xs flex flex-col gap-1.5"
              style={{ borderColor: "var(--kenar)" }}
            >
              <span className="font-semibold" style={{ color: "var(--yazi-soluk)" }}>
                Teknik Bilgi Alanları (Her zaman LTR kalır):
              </span>
              <div className="flex flex-wrap gap-2">
                <code className="force-ltr font-mono text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
                  ID: NCHK-2026-3F9A0C71
                </code>
                <code className="force-ltr font-mono text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
                  IP: 192.168.1.24
                </code>
                <code className="force-ltr font-mono text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
                  support@netcheck.internal
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
