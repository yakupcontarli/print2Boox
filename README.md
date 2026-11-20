# Print to Boox (Manifest V3)

[🇹🇷 Türkçe](#türkçe) | [🇬🇧 English](#english) | [📦 Kurulum / Installation](INSTALL.md) | [🚀 Releases](https://github.com/yakupcontarli/print2Boox/releases)

---

<a name="türkçe"></a>
## 🇹🇷 Türkçe Açıklama

**Print to Boox**, Google Chrome, Microsoft Edge, Brave ve Mozilla Firefox üzerinden gezindiğiniz herhangi bir web sayfasını veya açtığınız herhangi bir PDF dosyasını tek tıkla **Onyx Boox** e-kitap okuyucu cihazınıza aktarmanızı sağlayan modern bir Manifest V3 tarayıcı eklentisidir.

> ℹ️ **Kaynak & Kredi:** Bu proje, [deemstone/print2Boox](https://github.com/deemstone/print2Boox) açık kaynaklı Manifest V2 projesi temel alınarak günümüz standartlarına uyarlanmış, baştan sona modernize edilmiş ve yeni özelliklerle zenginleştirilmiş halidir.

### 🌟 Özellikler
- **🖨️ Tam Formatlı PDF Yazdırma (`Ctrl + P`):** Herhangi bir web sayfasını, makaleyi veya yerel PDF dosyasını Chrome/Edge/Brave yazdırma menüsünden (*Print to Boox* seçerek) cihazınıza kitap/belge olarak anında gönderin. *(Not: `printerProvider` API'si Chromium'a özgü olduğu için doğrudan yazıcı olarak PDF gönderimi Chrome/Edge/Brave/Opera'da çalışır; Firefox'ta PushRead desteklenir.)*
- **🌐 Tek Tıkla PushRead (Webpage Gönderimi):** Sayfayı e-okuma modunda okumak için eklenti simgesinden veya sağ tık menüsünden tek tıkla Boox PushRead servisine iletin.
- **⚡ Otomatik Cihaz Senkronizasyonu (NeoCloud Sync):** Dosyalar web paneline girmeye veya ek butona basmaya gerek kalmadan, doğrudan cihazınızın ekranına ve BooxDrop gelen kutusuna canlı olarak düşer.
- **🌍 Tüm Sunucu ve Modellerle Uyumlu:** Global (`push.boox.com`), Avrupa (`eur.boox.com`), ABD (`us.boox.com`) ve Çin (`send2boox.com`) sunucularını ve tüm Boox modellerini (Note Air, Palma, Tab Ultra, Nova, Page, Poke vb.) destekler.

---

### 📦 İndirme & Kurulum (Downloads — v0.0.10)
Detaylı anlatım için [**INSTALL.md (Kurulum Rehberi)**](INSTALL.md) dosyasına bakabilirsiniz.

| Tarayıcı | Paket Formatı | Doğrudan İndir |
| :--- | :--- | :--- |
| **Chrome / Edge / Brave** | `.crx` (Önerilen) | [**`print2Boox-Chrome.crx`**](https://github.com/yakupcontarli/print2Boox/releases/download/v0.0.10/print2Boox-Chrome.crx) |
| **Chrome / Edge / Brave** | `.zip` (Klasör / Mağaza) | [**`print2Boox-Chrome.zip`**](https://github.com/yakupcontarli/print2Boox/releases/download/v0.0.10/print2Boox-Chrome.zip) |
| **Mozilla Firefox** | `.xpi` (Önerilen) | [**`print2Boox-Firefox.xpi`**](https://github.com/yakupcontarli/print2Boox/releases/download/v0.0.10/print2Boox-Firefox.xpi) |
| **Mozilla Firefox** | `.zip` (Arşiv) | [**`print2Boox-Firefox.zip`**](https://github.com/yakupcontarli/print2Boox/releases/download/v0.0.10/print2Boox-Firefox.zip) |

### 📝 Sürüm Notları (v0.0.10)
- **Chrome Web Mağazası MV3 Uyumluluğu:** Uzaktan kod referansı içeren eski `analytics.js`, `error.js` ve kullanılmayan `options.*` dosyaları ile gereksiz `webRequest` izni kaldırıldı.
- **Bildirim Düzeltmesi:** `push.boox.com` ve diğer Boox sayfalarına her girişte/yenilemede tekrarlanan *"Giriş başarılı"* bildirimleri yalnızca yeni oturum açıldığında gösterilecek şekilde düzeltildi.
- **Firefox Uyumluluğu:** Firefox MV3 (`background.scripts` + `gecko` kimliği) ve `printerProvider` olmayan ortamlarda güvenli başlatma desteği eklendi.

---

### ⚠️ ÖNEMLİ KULLANIM ŞARTI: Tarayıcıdan Giriş Yapma
Eklentinin cihazınıza dosya gönderebilmesi için tarayıcınızda Boox hesabınızın açık olması gerekir:
1. Eklenti simgesine tıklayın ve kullandığınız sunucuyu seçin (Örn: **Global - `push.boox.com`** veya **EUR - `eur.boox.com`**).
2. Açılan sekmede Boox hesabınıza **giriş yapın**.
3. Giriş yaptıktan sonra eklenti oturumunuzu ve cihazınızı otomatik olarak tanıyacaktır!

---

### 🚀 Kullanım
1. **PDF Olarak Göndermek İçin:** Göndermek istediğiniz sayfada veya PDF'te `Ctrl + P` yapın $\rightarrow$ Hedef yazıcı olarak **Print to Boox** seçin $\rightarrow$ **Yazdır**'a tıklayın.
2. **Web Sayfası (PushRead) Olarak Göndermek İçin:** Eklenti simgesine tıklayıp **"Bu Sayfayı Boox'a Gönder (PushRead)"** butonuna basın veya sayfaya sağ tıklayıp menüden seçin.

---

### 🤖 Şeffaflık ve Geliştirme Bildirimi (AI Attribution)
Bu proje, [deemstone/print2Boox](https://github.com/deemstone/print2Boox) orijinal deposu kaynak alınarak **Yapay Zeka Destekli Yazılım Mühendisliği (AI-Assisted Software Engineering)** yöntemleriyle Manifest V3 mimarisine yükseltilmiş, Aliyun OSS akışı yenilenmiş ve canlı ağ tersine mühendislik analizleriyle modern NeoCloud senkronizasyon protokolleri entegre edilerek geliştirilmiştir.

---

### 📄 Lisans & Teşekkür
- Orijinal Çalışma: [deemstone/print2Boox](https://github.com/deemstone/print2Boox)
- Lisans: MIT License. Onyx Boox topluluğu için ücretsiz ve açık kaynaklıdır.

---
---

<a name="english"></a>
## 🇬🇧 English Description

**Print to Boox** is a modern Manifest V3 browser extension for Google Chrome, Microsoft Edge, Brave, and Mozilla Firefox that allows you to seamlessly send any webpage, article, or PDF document directly to your **Onyx Boox** e-reader device with a single click.

> ℹ️ **Credits & Origin:** This project is a modernized, enhanced, and rewritten Manifest V3 version based on the original open-source [deemstone/print2Boox](https://github.com/deemstone/print2Boox) project.

### 🌟 Key Features
- **🖨️ Full-Layout PDF Printing (`Ctrl + P`):** Print any webpage or opened PDF file directly to your Boox e-reader library via Chrome/Edge/Brave native print menu (*Print to Boox*). *(Note: Since `printerProvider` is a Chromium-only API, direct virtual printer PDF upload works on Chrome/Edge/Brave/Opera; Firefox supports PushRead.)*
- **🌐 One-Click PushRead (Webpage Push):** Send clean article/webpage clippings directly to your Boox PushRead app from the popup or right-click context menu.
- **⚡ Instant Real-Time Device Sync (NeoCloud):** Files automatically drop into your Boox device's BooxDrop / Push notification queue without requiring manual web dashboard interaction.
- **🌍 Universal Compatibility:** Fully supports all Boox cloud server regions (Global `push.boox.com`, Europe `eur.boox.com`, US `us.boox.com`, China `send2boox.com`) and all Onyx Boox models (Note Air, Palma, Tab Ultra, Nova, Page, Poke, etc.).

---

### 📦 Downloads & Installation (v0.0.10)
For complete step-by-step instructions, see [**INSTALL.md (Installation Guide)**](INSTALL.md).

| Browser | Package Format | Direct Download |
| :--- | :--- | :--- |
| **Chrome / Edge / Brave** | `.crx` (Recommended) | [**`print2Boox-Chrome.crx`**](https://github.com/yakupcontarli/print2Boox/releases/download/v0.0.10/print2Boox-Chrome.crx) |
| **Chrome / Edge / Brave** | `.zip` (Folder / Store) | [**`print2Boox-Chrome.zip`**](https://github.com/yakupcontarli/print2Boox/releases/download/v0.0.10/print2Boox-Chrome.zip) |
| **Mozilla Firefox** | `.xpi` (Recommended) | [**`print2Boox-Firefox.xpi`**](https://github.com/yakupcontarli/print2Boox/releases/download/v0.0.10/print2Boox-Firefox.xpi) |
| **Mozilla Firefox** | `.zip` (Archive) | [**`print2Boox-Firefox.zip`**](https://github.com/yakupcontarli/print2Boox/releases/download/v0.0.10/print2Boox-Firefox.zip) |

### 📝 Release Notes (v0.0.10)
- **Chrome Web Store MV3 Compliance:** Removed legacy `analytics.js` (remote code reference), `error.js`, unused `options.*` template files, and the unused `webRequest` permission.
- **Notification Fix:** Prevented repeated *"Login successful"* notifications on every visit/refresh of `push.boox.com`; notifications now appear only on a new login or account/region switch.
- **Firefox Compatibility:** Added Firefox MV3 manifest packaging (`background.scripts` + `gecko` ID) and safe guards when `chrome.printerProvider` is unavailable.

---

### ⚠️ IMPORTANT REQUIREMENT: Browser Login
To allow the extension to route files to your Boox device, you must be logged into your Boox account in your browser:
1. Click on the **Print to Boox** extension icon and select your account server region (e.g., **Global `push.boox.com`** or **EUR `eur.boox.com`**).
2. **Log in** to your Onyx Boox account in the opened tab.
3. The extension will automatically detect your active authentication and paired devices!

---

### 🚀 How to Use
1. **To Print as PDF:** Press `Ctrl + P` on any webpage or PDF $\rightarrow$ Select destination printer **Print to Boox** $\rightarrow$ Click **Print**.
2. **To Send Webpage URL (PushRead):** Click the extension icon and hit **"Send this page to Boox (PushRead)"** or simply right-click anywhere on the page and select the context menu option.

---

### 🤖 Transparency & Development Notice (AI Attribution)
This extension was modernized from the original [deemstone/print2Boox](https://github.com/deemstone/print2Boox) codebase to Chrome Manifest V3 standards and enhanced using **AI-Assisted Software Engineering** practices, incorporating real-time reverse-engineered Onyx Boox NeoCloud sync protocols.

---

### 📄 License & Credits
- Upstream Base: [deemstone/print2Boox](https://github.com/deemstone/print2Boox)
- License: MIT License. Free and open source for the Onyx Boox community.
