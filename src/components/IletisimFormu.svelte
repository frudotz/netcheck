<script lang="ts">
  // İletişim formu (görev 06) — gönderim sonrası bildirim + temizleme.
  // NetCheck'in sunucusu yoktur: mesaj hiçbir yere gönderilmez ve saklanmaz (bildirimde açıkça belirtilir).
  import type { Locale } from "$lib/i18n";

  let { lang = "tr" }: { lang?: Locale } = $props();

  const metin: Record<Locale, Record<string, string>> = {
    tr: {
      ad: "İsim", eposta: "E-posta", konu: "Konu", mesaj: "Mesaj", gonder: "Gönder",
      adOrnek: "Adınız Soyadınız", epostaOrnek: "ornek@eposta.com", konuOrnek: "Örn. tanılama sonucu hakkında",
      mesajOrnek: "Mesajınızı yazın (en az 10 karakter)",
      basari: "Mesajınız iletildi.", not: "Bu bir ders projesi demosudur: mesaj bir sunucuya gönderilmez ve saklanmaz.",
      kapat: "Kapat", hata: "Lütfen tüm alanları doldurun; e-posta geçerli, mesaj en az 10 karakter olmalı.",
    },
    en: {
      ad: "Name", eposta: "Email", konu: "Subject", mesaj: "Message", gonder: "Send",
      adOrnek: "Your full name", epostaOrnek: "name@example.com", konuOrnek: "e.g. about a diagnostic result",
      mesajOrnek: "Write your message (at least 10 characters)",
      basari: "Your message has been delivered.", not: "This is a course project demo: the message is not sent to any server and is not stored.",
      kapat: "Close", hata: "Please fill in all fields; the email must be valid and the message at least 10 characters.",
    },
    ar: {
      ad: "الاسم", eposta: "البريد الإلكتروني", konu: "الموضوع", mesaj: "الرسالة", gonder: "إرسال",
      adOrnek: "الاسم الكامل", epostaOrnek: "name@example.com", konuOrnek: "مثال: حول نتيجة التشخيص",
      mesajOrnek: "اكتب رسالتك (10 أحرف على الأقل)",
      basari: "تم إرسال رسالتك.", not: "هذا عرض توضيحي لمشروع دراسي: لا تُرسَل الرسالة إلى أي خادم ولا تُحفَظ.",
      kapat: "إغلاق", hata: "يرجى ملء جميع الحقول؛ يجب أن يكون البريد الإلكتروني صالحًا والرسالة 10 أحرف على الأقل.",
    },
    fa: {
      ad: "نام", eposta: "ایمیل", konu: "موضوع", mesaj: "پیام", gonder: "ارسال",
      adOrnek: "نام و نام خانوادگی", epostaOrnek: "name@example.com", konuOrnek: "مثلاً دربارهٔ نتیجهٔ عیب‌یابی",
      mesajOrnek: "پیام خود را بنویسید (حداقل ۱۰ نویسه)",
      basari: "پیام شما ارسال شد.", not: "این نسخهٔ نمایشی یک پروژهٔ درسی است: پیام به هیچ سروری ارسال و ذخیره نمی‌شود.",
      kapat: "بستن", hata: "لطفاً همهٔ فیلدها را پر کنید؛ ایمیل باید معتبر و پیام حداقل ۱۰ نویسه باشد.",
    },
  };

  const t = $derived(metin[lang]);

  let ad = $state("");
  let eposta = $state("");
  let konu = $state("");
  let mesaj = $state("");
  let gonderildi = $state(false);
  let denendi = $state(false);

  const gecerli = $derived(
    ad.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta.trim()) &&
      konu.trim().length >= 2 &&
      mesaj.trim().length >= 10,
  );

  function gonder(event: SubmitEvent) {
    event.preventDefault();
    denendi = true;
    if (!gecerli) return;
    gonderildi = true;
    ad = eposta = konu = mesaj = "";
    denendi = false;
  }
</script>

<form class="form" onsubmit={gonder} novalidate>
  {#if gonderildi}
    <div class="bildirim" role="status">
      <div>
        <strong>{t.basari}</strong>
        <p>{t.not}</p>
      </div>
      <button type="button" class="kapat" onclick={() => (gonderildi = false)}>{t.kapat}</button>
    </div>
  {/if}

  <label>
    {t.ad}
    <input name="ad" autocomplete="name" bind:value={ad} placeholder={t.adOrnek} required minlength="2" />
  </label>
  <label>
    {t.eposta}
    <input name="eposta" type="email" autocomplete="email" dir="ltr" bind:value={eposta} placeholder={t.epostaOrnek} required />
  </label>
  <label>
    {t.konu}
    <input name="konu" bind:value={konu} placeholder={t.konuOrnek} required minlength="2" />
  </label>
  <label>
    {t.mesaj}
    <textarea name="mesaj" rows="5" bind:value={mesaj} placeholder={t.mesajOrnek} required minlength="10"></textarea>
  </label>

  {#if denendi && !gecerli}
    <p class="hata" role="alert">{t.hata}</p>
  {/if}

  <button class="btn" type="submit">{t.gonder}</button>
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 12px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
  }

  input,
  textarea {
    padding: 12px;
    border: 1px solid var(--kenar);
    border-radius: 10px;
    background: var(--zemin);
    color: var(--yazi);
    font: inherit;
    font-weight: 400;
  }

  textarea {
    resize: vertical;
  }

  input:focus,
  textarea:focus {
    outline: 2px solid var(--renk-ana);
    outline-offset: 1px;
  }

  input[dir="ltr"] {
    text-align: start;
  }

  .bildirim {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--durum-basarili-zemin);
    color: var(--durum-basarili);
  }

  .bildirim p {
    margin: 2px 0 0;
    font-size: 13px;
  }

  .kapat {
    flex-shrink: 0;
    white-space: nowrap;
    border: 0;
    background: transparent;
    color: inherit;
    font-weight: 600;
    font-size: 13px;
  }

  .hata {
    margin: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--durum-hata-zemin);
    color: var(--durum-hata);
    font-size: 13px;
  }
</style>
