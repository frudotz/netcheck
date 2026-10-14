import React from "react";
import { NetworkSnapshot } from "../domain/types";
import { MaskedValue } from "./MaskedValue";
import { StatusBadge } from "./StatusBadge";
import { Wifi, Network, Smartphone, HelpCircle, Check, X } from "lucide-react";
import { useI18n } from "../i18n";

export interface NetworkSnapshotViewProps {
  network: NetworkSnapshot;
  onRevealSensitive?: (fieldName: string, value: string) => void;
}

export const NetworkSnapshotView: React.FC<NetworkSnapshotViewProps> = ({
  network,
  onRevealSensitive,
}) => {
  const { t } = useI18n();

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case "wifi":
        return <Wifi className="w-3.5 h-3.5" />;
      case "ethernet":
        return <Network className="w-3.5 h-3.5" />;
      case "cellular":
        return <Smartphone className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Key-Value Cards */}
      <div
        className="p-5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        {/* Hostname */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--yazi-soluk)" }}>
            Cihaz Adı (Hostname)
          </span>
          <MaskedValue
            value={network.hostname}
            fallbackText={t("valNotFound")}
            onReveal={v => onRevealSensitive?.("hostname", v)}
          />
        </div>

        {/* Local IPv4 */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--yazi-soluk)" }}>
            Yerel IPv4 Adresi
          </span>
          <MaskedValue
            value={network.localIPv4}
            fallbackText={t("valUnavailable")}
            onReveal={v => onRevealSensitive?.("localIPv4", v)}
          />
        </div>

        {/* Local IPv6 */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--yazi-soluk)" }}>
            Yerel IPv6 Adresi
          </span>
          <MaskedValue
            value={network.localIPv6}
            fallbackText={t("valNotFound")}
            onReveal={v => onRevealSensitive?.("localIPv6", v)}
          />
        </div>

        {/* Gateway */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--yazi-soluk)" }}>
            Ağ Geçidi (Gateway)
          </span>
          <MaskedValue
            value={network.gateway}
            fallbackText={t("valUnavailable")}
            onReveal={v => onRevealSensitive?.("gateway", v)}
          />
        </div>

        {/* DNS Servers */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--yazi-soluk)" }}>
            DNS Sunucuları
          </span>
          {network.dnsServers && network.dnsServers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {network.dnsServers.map((dns, idx) => (
                <MaskedValue
                  key={idx}
                  value={dns}
                  onReveal={v => onRevealSensitive?.(`dnsServer[${idx}]`, v)}
                />
              ))}
            </div>
          ) : (
            <span className="text-xs italic" style={{ color: "var(--yazi-soluk)" }}>
              {t("valNotFound")}
            </span>
          )}
        </div>

        {/* Connection Type */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--yazi-soluk)" }}>
            {t("reportConnectionType")}
          </span>
          <div>
            <StatusBadge
              tone="info"
              label={network.connectionType.toUpperCase()}
              icon={getConnectionIcon(network.connectionType)}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Network Interfaces Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        <div
          className="px-5 py-3.5 border-b font-semibold text-sm flex items-center justify-between"
          style={{
            borderColor: "var(--kenar)",
            backgroundColor: "var(--zemin)",
            color: "var(--yazi)",
          }}
        >
          <span>{t("interfacesList")}</span>
          <span className="text-xs font-normal" style={{ color: "var(--yazi-soluk)" }}>
            {network.interfaces?.length ?? 0} Arayüz
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">{t("interfacesList")}</caption>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--kenar)", backgroundColor: "var(--zemin)" }}>
                <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: "var(--yazi)" }}>
                  {t("interfaceName")}
                </th>
                <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: "var(--yazi)" }}>
                  {t("interfaceType")}
                </th>
                <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: "var(--yazi)" }}>
                  {t("interfaceIp")}
                </th>
                <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: "var(--yazi)" }}>
                  {t("interfaceMac")}
                </th>
                <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: "var(--yazi)" }}>
                  {t("interfaceState")}
                </th>
                <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: "var(--yazi)" }}>
                  {t("interfaceDefault")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--kenar)" }}>
              {network.interfaces && network.interfaces.length > 0 ? (
                network.interfaces.map((iface, idx) => (
                  <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium" style={{ color: "var(--yazi)" }}>
                      {iface.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize">{iface.type}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <MaskedValue
                        value={iface.ipv4}
                        fallbackText={t("valUnavailable")}
                        onReveal={v => onRevealSensitive?.(`${iface.name}.ipv4`, v)}
                      />
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <MaskedValue
                        value={iface.mac}
                        fallbackText={t("valUnavailable")}
                        onReveal={v => onRevealSensitive?.(`${iface.name}.mac`, v)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: iface.isUp ? "var(--durum-basarili-zemin)" : "var(--durum-hata-zemin)",
                          color: iface.isUp ? "var(--durum-basarili)" : "var(--durum-hata)",
                        }}
                      >
                        {iface.isUp ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{iface.isUp ? "UP" : "DOWN"}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {iface.isDefault ? (
                        <span
                          className="px-2 py-0.5 text-xs font-semibold rounded-full"
                          style={{
                            backgroundColor: "var(--renk-ana)",
                            color: "var(--renk-ana-yazi)",
                          }}
                        >
                          Varsayılan
                        </span>
                      ) : (
                        <span style={{ color: "var(--yazi-soluk)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center italic" style={{ color: "var(--yazi-soluk)" }}>
                    {t("valNotFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
