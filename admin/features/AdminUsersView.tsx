import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { AdminUser, AdminRole } from "../domain/types";
import { DataTable, type Column } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import { errorKey } from "../context/AdminAuthContext";
import {
  UserPlus,
  ShieldCheck,
  Check,
  X,
  Shield,
} from "lucide-react";

export const AdminUsersView: React.FC = () => {
  const { t, locale } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("support");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdmins();
      setAdmins(data);
    } catch {
      setError(t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleInvite = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim() || invitePassword.length < 8) return;
    try {
      setInviting(true);
      await api.inviteAdmin({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        active: true,
        password: invitePassword,
      });
      addToast(t("adminsToastInvited"), "success");
      setInviteName("");
      setInviteEmail("");
      setInviteRole("support");
      setInvitePassword("");
      setInviteModalOpen(false);
      fetchAdmins();
    } catch (err) {
      // Var olan e-posta `conflict`, süper yönetici rolü yetkisiz çağrıda `forbidden` döner.
      addToast(t(errorKey(err)), "error");
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
            aria-hidden="true"
          >
            {a.name.slice(0, 2).toLocaleUpperCase(locale)}
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
        if (!a.lastLoginAt) return <span style={{ color: "var(--yazi-soluk)" }}>{t("adminsNeverLoggedIn")}</span>;
        return (
          <span className="font-mono text-xs" style={{ color: "var(--yazi)" }}>
            {new Date(a.lastLoginAt).toLocaleString(locale)}
          </span>
        );
      },
    },
  ];

  // Role - Permission Matrix Definition (rol adları sözlükten, getRoleLabel)
  const permissions: { role: AdminRole; view: boolean; edit: boolean; publish: boolean; delete: boolean; pii: boolean }[] = [
    { role: "owner", view: true, edit: true, publish: true, delete: true, pii: true },
    { role: "support", view: true, edit: true, publish: false, delete: false, pii: true },
    { role: "content", view: true, edit: true, publish: true, delete: false, pii: false },
    { role: "viewer", view: true, edit: false, publish: false, delete: false, pii: false },
  ];

  // İzin hücresi: simge görsel, metin ekran okuyucu için.
  const permissionCell = (allowed: boolean) => (
    <td className="py-3 px-3 text-center">
      {allowed ? (
        <Check className="w-4 h-4 mx-auto text-basarili" aria-hidden="true" />
      ) : (
        <X className="w-4 h-4 mx-auto text-hata opacity-40" aria-hidden="true" />
      )}
      <span className="sr-only">{allowed ? t("adminsPermAllowed") : t("adminsPermDenied")}</span>
    </td>
  );

  return (
    <div className="space-y-6">
      {/* Title & Invite Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
            {t("adminsTitle")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            {t("adminsSubtitle")}
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
        caption={t("adminsTableCaption")}
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
            {t("adminsPermMatrixDesc")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <caption className="sr-only">{t("permMatrix")}</caption>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--kenar)", backgroundColor: "var(--zemin)" }}>
                <th scope="col" className="py-2.5 px-3 font-semibold text-start" style={{ color: "var(--yazi)" }}>
                  {t("adminRoleCol")}
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
                <tr key={p.role} className="hover:bg-yazi/5 transition-colors">
                  <th scope="row" className="py-3 px-3 font-semibold text-start" style={{ color: "var(--yazi)" }}>
                    {getRoleLabel(p.role)}
                  </th>
                  {permissionCell(p.view)}
                  {permissionCell(p.edit)}
                  {permissionCell(p.publish)}
                  {permissionCell(p.delete)}
                  {permissionCell(p.pii)}
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
              disabled={inviting || !inviteName.trim() || !inviteEmail.trim() || invitePassword.length < 8}
              className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: "var(--renk-ana)",
                color: "var(--renk-ana-yazi)",
                borderRadius: "var(--radius)",
              }}
            >
              {inviting ? t("adminsInviting") : t("adminsSendInvite")}
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
              placeholder={t("adminsNamePlaceholder")}
              className="p-2.5 text-xs sm:text-sm rounded-lg border"
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
              placeholder={t("adminsEmailPlaceholder")}
              className="p-2.5 text-xs sm:text-sm rounded-lg border force-ltr"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
                color: "var(--yazi)",
                borderRadius: "var(--radius)",
              }}
              required
            />
          </FormField>

          <FormField label={t("adminPassword")} hint={t("adminsPasswordHint")} required>
            <input
              type="password"
              autoComplete="new-password"
              value={invitePassword}
              onChange={e => setInvitePassword(e.target.value)}
              minLength={8}
              maxLength={128}
              className="p-2.5 text-xs sm:text-sm rounded-lg border"
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
              className="cursor-pointer p-2.5 text-xs sm:text-sm rounded-lg border appearance-none"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
                color: "var(--yazi)",
                borderRadius: "var(--radius)",
              }}
            >
              {(["support", "content", "viewer", "owner"] as AdminRole[]).map(role => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
