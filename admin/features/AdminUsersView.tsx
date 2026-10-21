import React, { useState, useEffect } from "react";
import { api } from "../api/mockAdapter";
import { AdminUser, AdminRole } from "../domain/types";
import { DataTable, Column } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Check,
  X,
  Mail,
  User,
  Shield,
} from "lucide-react";

export const AdminUsersView: React.FC = () => {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("support");
  const [inviting, setInviting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdmins();
      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    try {
      setInviting(true);
      await api.inviteAdmin({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        active: true,
      });
      addToast("Yönetici daveti başarıyla gönderildi.", "success");
      setInviteName("");
      setInviteEmail("");
      setInviteRole("support");
      setInviteModalOpen(false);
      fetchAdmins();
    } catch {
      addToast(t("toastActionError"), "error");
    } finally {
      setInviting(false);
    }
  };

  const getRoleLabel = (role: AdminRole): string => {
    switch (role) {
      case "owner":
        return t("roleOwner");
      case "support":
        return t("roleSupport");
      case "content":
        return t("roleContent");
      case "viewer":
        return t("roleViewer");
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: t("adminName"),
      sortable: true,
      render: a => (
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: "var(--zemin)",
              color: "var(--renk-ana)",
              border: "1px solid var(--kenar)",
            }}
          >
            {a.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-xs sm:text-sm" style={{ color: "var(--yazi)" }}>
              {a.name}
            </div>
            <div className="font-mono text-xs force-ltr" style={{ color: "var(--yazi-soluk)" }}>
              {a.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: t("adminRoleCol"),
      render: a => {
        const isOwner = a.role === "owner";
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: isOwner ? "var(--durum-basarili-zemin)" : "var(--zemin)",
              color: isOwner ? "var(--durum-basarili)" : "var(--yazi)",
              border: "1px solid var(--kenar)",
            }}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{getRoleLabel(a.role)}</span>
          </span>
        );
      },
    },
    {
      key: "active",
      header: t("adminStatus"),
      render: a => (
        <StatusBadge
          tone={a.active ? "success" : "neutral"}
          label={a.active ? t("adminActive") : t("adminPassive")}
          size="sm"
        />
      ),
    },
    {
      key: "lastLoginAt",
      header: t("adminLastLogin"),
      sortable: true,
      render: a => {
        if (!a.lastLoginAt) return <span style={{ color: "var(--yazi-soluk)" }}>Hiç giriş yapmadı</span>;
        return (
          <span className="font-mono text-xs" style={{ color: "var(--yazi)" }}>
            {new Date(a.lastLoginAt).toLocaleString("tr-TR")}
          </span>
        );
      },
    },
  ];

  // Role - Permission Matrix Definition
  const permissions = [
    {
      role: "owner" as AdminRole,
      title: "Sistem Sahibi (Owner)",
      view: true,
      edit: true,
      publish: true,
      delete: true,
      pii: true,
    },
    {
      role: "support" as AdminRole,
      title: "Destek Uzmanı (Support)",
      view: true,
      edit: true,
      publish: false,
      delete: false,
      pii: true,
    },
    {
      role: "content" as AdminRole,
      title: "İçerik Yöneticisi (Content)",
      view: true,
      edit: true,
      publish: true,
      delete: false,
      pii: false,
    },
    {
      role: "viewer" as AdminRole,
      title: "Salt Okunur İzleyici (Viewer)",
      view: true,
      edit: false,
      publish: false,
      delete: false,
      pii: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Invite Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
            {t("adminsTitle")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            Yönetim paneline erişim yetkisi olan yöneticiler ve rol tabanlı izin matrisi
          </p>
        </div>

        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: "var(--renk-ana)",
            color: "var(--renk-ana-yazi)",
            borderRadius: "var(--radius)",
          }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t("adminInvite")}</span>
        </button>
      </div>

      {/* Admin Users Table */}
      <DataTable<AdminUser>
        columns={columns}
        rows={admins}
        rowKey={a => a.id}
        loading={loading}
        error={error}
        onRetry={fetchAdmins}
        exportFilename="netcheck-yoneticiler.csv"
        caption="Yöneticiler Listesi"
      />

      {/* Role - Permission Matrix Section */}
      <div
        className="p-5 rounded-xl border space-y-4"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        <div className="border-b pb-3" style={{ borderColor: "var(--kenar)" }}>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--yazi)" }}>
            <ShieldCheck className="w-4 h-4" style={{ color: "var(--renk-ana)" }} />
            <span>{t("permMatrix")}</span>
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            Her rolün panel üzerindeki operasyonel yetki sınırları
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <caption className="sr-only">{t("permMatrix")}</caption>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--kenar)", backgroundColor: "var(--zemin)" }}>
                <th scope="col" className="py-2.5 px-3 font-semibold" style={{ color: "var(--yazi)" }}>
                  Rol
                </th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-center" style={{ color: "var(--yazi)" }}>
                  {t("permView")}
                </th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-center" style={{ color: "var(--yazi)" }}>
                  {t("permEdit")}
                </th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-center" style={{ color: "var(--yazi)" }}>
                  {t("permPublish")}
                </th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-center" style={{ color: "var(--yazi)" }}>
                  {t("permDelete")}
                </th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-center" style={{ color: "var(--yazi)" }}>
                  {t("permRevealPii")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--kenar)" }}>
              {permissions.map(p => (
                <tr key={p.role} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-semibold" style={{ color: "var(--yazi)" }}>
                    {p.title}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.view ? (
                      <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 mx-auto text-red-500 opacity-40" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.edit ? (
                      <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 mx-auto text-red-500 opacity-40" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.publish ? (
                      <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 mx-auto text-red-500 opacity-40" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.delete ? (
                      <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 mx-auto text-red-500 opacity-40" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.pii ? (
                      <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 mx-auto text-red-500 opacity-40" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Admin Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={t("adminInvite")}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg border hover:opacity-80"
              style={{
                backgroundColor: "transparent",
                borderColor: "var(--kenar)",
                color: "var(--yazi)",
                borderRadius: "var(--radius)",
              }}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              form="invite-form"
              disabled={inviting || !inviteName.trim() || !inviteEmail.trim()}
              className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: "var(--renk-ana)",
                color: "var(--renk-ana-yazi)",
                borderRadius: "var(--radius)",
              }}
            >
              {inviting ? "Davet Gönderiliyor..." : "Davetiye Gönder"}
            </button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
          <FormField label={t("adminName")} required>
            <input
              type="text"
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              placeholder="Örn: Ayşe Kaya"
              className="p-2.5 text-xs sm:text-sm rounded-lg border focus-visible:outline-none"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
                color: "var(--yazi)",
                borderRadius: "var(--radius)",
              }}
              required
            />
          </FormField>

          <FormField label={t("adminEmail")} required>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="ad@kurum.com"
              className="p-2.5 text-xs sm:text-sm rounded-lg border focus-visible:outline-none"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
                color: "var(--yazi)",
                borderRadius: "var(--radius)",
              }}
              required
            />
          </FormField>

          <FormField label={t("adminRoleCol")} required>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as AdminRole)}
              className="cursor-pointer p-2.5 text-xs sm:text-sm rounded-lg border focus-visible:outline-none appearance-none"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
                color: "var(--yazi)",
                borderRadius: "var(--radius)",
              }}
            >
              <option value="support">Destek Uzmanı (Support)</option>
              <option value="content">İçerik Yöneticisi (Content)</option>
              <option value="viewer">Salt Okunur İzleyici (Viewer)</option>
              <option value="owner">Sistem Sahibi (Owner)</option>
            </select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
