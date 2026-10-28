import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { ContactMessage } from "../domain/types";
import { StatusBadge, type StatusTone } from "../components/StatusBadge";
import { FilterBar, type FilterConfig } from "../components/FilterBar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import { LOCALES, localeName } from "../../src/lib/i18n";
import {
  Send,
  Lock,
  AlertOctagon,
  User,
  CheckCircle2,
  Inbox,
} from "lucide-react";

export const MessagesView: React.FC = () => {
  const { t, locale } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  // Atanabilecek kişiler: ad ve kimlik; kullanıcı listesi izni istemeyen uçtan gelir.
  const [admins, setAdmins] = useState<{ id: string; name: string }[]>([]);

  // Selected message for thread
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);

  // Reply form state
  const [replyBody, setReplyBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string | number | boolean | undefined>>({});

  // Bulk spam
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkSpam, setConfirmBulkSpam] = useState(false);

  const fetchMessagesAndAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const [msgData, adminData] = await Promise.all([
        api.getMessages({ search, filters, pageSize: 50 }),
        api.getMessageAssignees(),
      ]);
      setMessages(msgData.items);
      setAdmins(adminData);
      if (!selectedMsgId && msgData.items.length > 0) {
        setSelectedMsgId(msgData.items[0].id);
      }
    } catch {
      setError(t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessagesAndAdmins();
  }, [search, filters]);

  const activeMessage = messages.find(m => m.id === selectedMsgId) || null;

  const handleSendReply = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeMessage || !replyBody.trim()) return;
    try {
      setSubmittingReply(true);
      const updated = await api.replyMessage(activeMessage.id, replyBody.trim(), isInternalNote);
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      setReplyBody("");
      addToast(isInternalNote ? t("messagesToastNoteSaved") : t("messagesToastReplySent"), "success");
    } catch {
      addToast(t("toastActionError"), "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: ContactMessage["status"]) => {
    if (!activeMessage) return;
    try {
      const updated = await api.updateMessageStatus(activeMessage.id, newStatus);
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      addToast(t("messagesToastStatusUpdated", { status: getStatusLabel(newStatus) }), "success");
    } catch {
      addToast(t("toastActionError"), "error");
    }
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    if (!activeMessage) return;
    try {
      const updated = await api.assignMessage(activeMessage.id, assigneeId || undefined);
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      addToast(t("messagesToastAssigneeUpdated"), "success");
    } catch {
      addToast(t("toastActionError"), "error");
    }
  };

  const handleBulkSpam = async () => {
    try {
      await api.markMessageSpam(selectedIds);
      addToast(t("messagesToastMarkedSpam", { count: selectedIds.length }), "success");
      setSelectedIds([]);
      setConfirmBulkSpam(false);
      fetchMessagesAndAdmins();
    } catch {
      addToast(t("toastActionError"), "error");
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: t("msgStatus"),
      type: "select",
      options: [
        { value: "new", label: t("msgStatusNew") },
        { value: "in-progress", label: t("msgStatusInProgress") },
        { value: "answered", label: t("msgStatusAnswered") },
        { value: "spam", label: t("msgStatusSpam") },
      ],
    },
    {
      key: "lang",
      label: t("language"),
      type: "select",
      // Dil adları her dilde kendi yazımıyla gösterilir (src/lib/i18n.ts).
      options: LOCALES.map(l => ({ value: l, label: localeName[l] })),
    },
  ];

  const getStatusTone = (status: ContactMessage["status"]): StatusTone => {
    switch (status) {
      case "new":
        return "info";
      case "in-progress":
        return "warning";
      case "answered":
        return "success";
      case "spam":
        return "danger";
    }
  };

  const getStatusLabel = (status: ContactMessage["status"]): string => {
    switch (status) {
      case "new":
        return t("msgStatusNew");
      case "in-progress":
        return t("msgStatusInProgress");
      case "answered":
        return t("msgStatusAnswered");
      case "spam":
        return t("msgStatusSpam");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Bulk Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
            {t("navMessages")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            {t("messagesSubtitle")}
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmBulkSpam(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg hover:opacity-90"
            style={{
              backgroundColor: "var(--durum-hata)",
              color: "var(--durum-hata-zemin)",
              borderRadius: "var(--radius)",
            }}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{t("messagesMarkSpamCount", { count: selectedIds.length })}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("messagesSearchPlaceholder")}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
        onClear={() => {
          setSearch("");
          setFilters({});
        }}
      />

      {/* Main Split Layout: Left List + Right Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left: Message List */}
        <div
          className="lg:col-span-5 rounded-xl border flex flex-col overflow-hidden"
          style={{
            backgroundColor: "var(--kart)",
            borderColor: "var(--kenar)",
            borderRadius: "var(--radius)",
          }}
        >
          <div
            className="p-3 border-b flex items-center justify-between text-xs font-semibold"
            style={{
              backgroundColor: "var(--zemin)",
              borderColor: "var(--kenar)",
              color: "var(--yazi)",
            }}
          >
            <span>{t("messagesInboxCount", { count: messages.length })}</span>
            {messages.length > 0 && (
              <label className="flex items-center gap-1.5 cursor-pointer font-normal" style={{ color: "var(--yazi-soluk)" }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === messages.length}
                  onChange={e => {
                    if (e.target.checked) setSelectedIds(messages.map(m => m.id));
                    else setSelectedIds([]);
                  }}
                  className="rounded"
                />
                <span>{t("selectAll")}</span>
              </label>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--kenar)" }}>
            {loading ? (
              <div className="p-8 text-center text-xs" style={{ color: "var(--yazi-soluk)" }}>
                {t("loading")}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-xs" role="alert" style={{ color: "var(--durum-hata)" }}>
                {error}
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-xs italic" style={{ color: "var(--yazi-soluk)" }}>
                {t("emptyTitle")}
              </div>
            ) : (
              messages.map(msg => {
                const isSelected = msg.id === selectedMsgId;
                const isChecked = selectedIds.includes(msg.id);
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMsgId(msg.id)}
                    className="p-3.5 cursor-pointer transition-colors hover:bg-yazi/5 flex gap-2.5 items-start"
                    style={{
                      backgroundColor: isSelected ? "var(--zemin)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        e.stopPropagation();
                        if (isChecked) setSelectedIds(selectedIds.filter(id => id !== msg.id));
                        else setSelectedIds([...selectedIds, msg.id]);
                      }}
                      className="mt-1 cursor-pointer rounded"
                      aria-label={t("messagesSelectOne")}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs sm:text-sm truncate" style={{ color: "var(--yazi)" }}>
                          {msg.name}
                        </span>
                        <span className="font-mono text-[10px] whitespace-nowrap" style={{ color: "var(--yazi-soluk)" }}>
                          {new Date(msg.createdAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      <p className="text-xs font-medium truncate mb-1" style={{ color: "var(--yazi)" }}>
                        {msg.subject || t("messagesNoSubject")}
                      </p>

                      <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--yazi-soluk)" }}>
                        {msg.message}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t text-[11px]" style={{ borderColor: "var(--kenar)" }}>
                        <StatusBadge
                          tone={getStatusTone(msg.status)}
                          label={getStatusLabel(msg.status)}
                          size="sm"
                        />
                        <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--kenar)", color: "var(--yazi-soluk)" }}>
                          {msg.lang}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Conversation Thread & Actions */}
        <div
          className="lg:col-span-7 rounded-xl border flex flex-col justify-between overflow-hidden"
          style={{
            backgroundColor: "var(--kart)",
            borderColor: "var(--kenar)",
            borderRadius: "var(--radius)",
          }}
        >
          {activeMessage ? (
            <>
              {/* Thread Header */}
              <div
                className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{
                  backgroundColor: "var(--zemin)",
                  borderColor: "var(--kenar)",
                }}
              >
                <div>
                  <h3 className="text-base font-bold" style={{ color: "var(--yazi)" }}>
                    {activeMessage.subject || t("messagesDefaultSubject")}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs mt-1 force-ltr" style={{ color: "var(--yazi-soluk)" }}>
                    <span className="font-medium" style={{ color: "var(--yazi)" }}>
                      {activeMessage.name}
                    </span>
                    <span>&lt;{activeMessage.email}&gt;</span>
                    <span>· {new Date(activeMessage.createdAt).toLocaleString(locale)}</span>
                  </div>
                </div>

                {/* Status & Assignee dropdowns */}
                <div className="flex items-center gap-2">
                  {/* Status selector */}
                  <select
                    value={activeMessage.status}
                    onChange={e => handleStatusChange(e.target.value as ContactMessage["status"])}
                    aria-label={t("msgStatus")}
                    className="cursor-pointer text-xs font-semibold px-2.5 py-1.5 rounded-lg border appearance-none"
                    style={{
                      backgroundColor: "var(--kart)",
                      borderColor: "var(--kenar)",
                      color: "var(--yazi)",
                    }}
                  >
                    <option value="new">{t("msgStatusNew")}</option>
                    <option value="in-progress">{t("msgStatusInProgress")}</option>
                    <option value="answered">{t("msgStatusAnswered")}</option>
                    <option value="spam">{t("msgStatusSpam")}</option>
                  </select>

                  {/* Assignee selector */}
                  <select
                    value={activeMessage.assignee ?? ""}
                    onChange={e => handleAssigneeChange(e.target.value)}
                    aria-label={t("msgAssignee")}
                    className="cursor-pointer text-xs font-medium px-2.5 py-1.5 rounded-lg border appearance-none"
                    style={{
                      backgroundColor: "var(--kart)",
                      borderColor: "var(--kenar)",
                      color: "var(--yazi)",
                    }}
                  >
                    <option value="">{t("msgUnassigned")}</option>
                    {admins.map(adm => (
                      <option key={adm.id} value={adm.id}>
                        {adm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message Body & Replies */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {/* Initial user message */}
                <div
                  className="p-4 rounded-xl border leading-relaxed text-xs sm:text-sm"
                  style={{
                    backgroundColor: "var(--zemin)",
                    borderColor: "var(--kenar)",
                    color: "var(--yazi)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b" style={{ borderColor: "var(--kenar)" }}>
                    <span className="font-semibold text-xs flex items-center gap-1.5" style={{ color: "var(--renk-ana)" }}>
                      <User className="w-3.5 h-3.5" />
                      {t("messagesUserMessage")}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: "var(--yazi-soluk)" }}>
                      {new Date(activeMessage.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap" dir="auto">{activeMessage.message}</p>
                </div>

                {/* Replies list */}
                {activeMessage.replies.map(rep => {
                  const author = admins.find(a => a.id === rep.authorId);
                  return (
                    <div
                      key={rep.id}
                      className="p-4 rounded-xl border text-xs sm:text-sm leading-relaxed"
                      style={{
                        backgroundColor: rep.internal ? "var(--durum-uyari-zemin)" : "var(--kart)",
                        borderColor: rep.internal ? "var(--durum-uyari)" : "var(--renk-ana)",
                        borderInlineStartWidth: "4px",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold flex items-center gap-1.5 text-xs">
                          {rep.internal ? (
                            <>
                              <Lock className="w-3.5 h-3.5" style={{ color: "var(--durum-uyari)" }} />
                              <span style={{ color: "var(--durum-uyari)" }}>
                                {t("messagesInternalNoteBy", { name: author?.name || t("messagesUnknownAdmin") })}
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--renk-ana)" }} />
                              <span style={{ color: "var(--renk-ana)" }}>
                                {t("messagesReplyBy", { name: author?.name || t("messagesSupportTeam") })}
                              </span>
                            </>
                          )}
                        </span>
                        <span className="text-[11px] font-mono" style={{ color: "var(--yazi-soluk)" }}>
                          {new Date(rep.at).toLocaleString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap" dir="auto" style={{ color: "var(--yazi)" }}>
                        {rep.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t space-y-3" style={{ borderColor: "var(--kenar)" }}>
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium" style={{ color: "var(--yazi)" }}>
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={e => setIsInternalNote(e.target.checked)}
                      className="rounded"
                    />
                    <span>{t("messagesSaveAsInternal")}</span>
                  </label>

                  <span className="text-[11px]" style={{ color: "var(--yazi-soluk)" }}>
                    {isInternalNote ? t("messagesInternalHint") : t("messagesReplyHint")}
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    aria-label={t("msgReply")}
                    placeholder={
                      isInternalNote
                        ? t("messagesInternalPlaceholder")
                        : t("messagesReplyPlaceholder")
                    }
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: "var(--zemin)",
                      borderColor: "var(--kenar)",
                      color: "var(--yazi)",
                      borderRadius: "var(--radius)",
                    }}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="submit"
                    disabled={submittingReply || !replyBody.trim()}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-50 transition-opacity"
                    style={{
                      backgroundColor: isInternalNote ? "var(--durum-uyari)" : "var(--renk-ana)",
                      color: isInternalNote ? "var(--durum-uyari-zemin)" : "var(--renk-ana-yazi)",
                      borderRadius: "var(--radius)",
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {submittingReply
                        ? t("messagesSaving")
                        : isInternalNote
                        ? t("msgInternalNote")
                        : t("msgSendReply")}
                    </span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center" style={{ color: "var(--yazi-soluk)" }}>
              <Inbox className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">{t("messagesSelectPrompt")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Spam Confirmation */}
      <ConfirmDialog
        isOpen={confirmBulkSpam}
        onClose={() => setConfirmBulkSpam(false)}
        onConfirm={handleBulkSpam}
        title={t("messagesConfirmSpamTitle")}
        message={t("messagesConfirmSpamMessage", { count: selectedIds.length })}
        confirmLabel={t("msgMarkSpam")}
        tone="danger"
        requireReason={false}
      />
    </div>
  );
};
