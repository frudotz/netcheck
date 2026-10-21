# İstem Günlükleri

Her görev için yapay zeka aracına ne istendiğinin, aracın ne önerdiğinin, neyin düzeltildiğinin ve sonucun nasıl doğrulandığının kaydı. Çalışma sırası: [`AGENTS.md` § Çalışma döngüsü](../../AGENTS.md#çalışma-döngüsü).

## Dosya adı

- Her görev için tek dosya: `NN-kisa-ad.md`. `NN` görev numarasıdır, `kisa-ad` görev dalının son parçasıdır: `feature/10-calisma-yontemi` → `10-calisma-yontemi.md`.
- Alt görevlerde nokta yerine tire: Görev 09.1 → `09-1-master-korumasi.md`.
- Numarası olmayan bir iş (ör. bir göreve hazırlık) dal adının son parçasıyla kaydedilir: `feature/uygulama-dili` → `uygulama-dili.md`.
- Dosya, görev dalında açılır ve aynı PR ile birleşir. Aynı görevde yeni bir istem verilirse yeni dosya açılmaz, aynı dosyaya eklenir.

## Bölümler

Her günlük bu sırayla şu başlıkları taşır:

1. **Araç ve model:** araç, model ve tarih (örn. Claude Code, Claude Opus 5.5, 2026-10-21).
2. **Şartname:** [`docs/gorev-sartnamesi.md`](../gorev-sartnamesi.md) şablonu doldurulmuş olarak.
3. **İstem:** araca verilen istem, olduğu gibi. Birden çok istem varsa sırayla.
4. **Plan:** aracın değişiklikten önce sunduğu plan ve onaylanıp onaylanmadığı.
5. **Düzeltmeler:** planda ya da sonuçta sizin değiştirdiğiniz yerler ve nedeni.
6. **Doğrulama:** çalıştırılan komutlar ve gerçek sonuçları, elle denenen adımlar. Çalıştırılmayan kontrol "yapılmadı" diye yazılır.
7. **Bilinen sınırlamalar ve açık maddeler:** yapılmayan ya da doğrulanamayan her şey.
8. **PR:** PR bağlantısı.

## Kurallar

- Günlüğe gizli anahtar, parola, kişisel veri (öğrenci numarası, e-posta) ve eğitmenin özel raporu yazılmaz.
- Ekran görüntüsü yalnız görev dosyası istiyorsa eklenir ([`AGENTS.md` § 5](../../AGENTS.md#5-arayüz-doğrulama-tarayıcı-otomasyonu)). Görsel `docs/kanit/NN-kisa-ad-*.png` adıyla durur ve günlükten link verilir; genel IP, cihaz adı veya kişisel bilgi içeren görüntü maskelenmeden eklenmez.

## Günlükler

| Görev | Günlük |
|---|---|
| 09.1 Master dalını koruma | [`09-1-master-korumasi.md`](09-1-master-korumasi.md) |
| 10 Çalışma yöntemi | [`10-calisma-yontemi.md`](10-calisma-yontemi.md) |
| 11 Veri sözleşmesi | [`11-veri-sozlesmesi.md`](11-veri-sozlesmesi.md) |
| Uygulama dili (Görev 12–14 hazırlığı, karar C-2) | [`uygulama-dili.md`](uygulama-dili.md) |
| 12 Kart bileşeni | [`12-kart-bileseni.md`](12-kart-bileseni.md) |
| 13 Liste ve üç durum | [`13-liste-ve-uc-durum.md`](13-liste-ve-uc-durum.md) |
| 14 Detay ekranı | [`14-detay-ekrani.md`](14-detay-ekrani.md) |
| 15 Rust komutu | [`15-rust-komutu.md`](15-rust-komutu.md) |
| Yönetim panelini projeye taşıma (eğitmenin 21.10 raporu) | [`admin-panel-tasima.md`](admin-panel-tasima.md) |
| 16 Batch 02 denetimi | [`16-batch-02-denetimi.md`](16-batch-02-denetimi.md) |
