'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const userPanel = document.getElementById('user_panel');
  const actionSection = document.getElementById('action_section');
  const loginSection = document.getElementById('login_section');
  const userNameEl = document.getElementById('user_name');
  const siteDomainEl = document.getElementById('site_domain');
  const avatarEl = document.getElementById('avatar');
  const logoutBtn = document.getElementById('btn_logout');
  const syncBtn = document.getElementById('btn_sync');
  const statusMsg = document.getElementById('status_msg');
  const pushUrlBtn = document.getElementById('btn_push_url');
  const printPdfBtn = document.getElementById('btn_print_pdf');
  const actionStatus = document.getElementById('action_status');

  function checkLoginStatus() {
    chrome.storage.local.get(['userName', 'avatarUrl', 'siteDomain', 'boox_auth_token'], (data) => {
      if (data.boox_auth_token && (data.userName || data.siteDomain)) {
        userPanel.style.display = 'block';
        actionSection.style.display = 'flex';
        loginSection.style.display = 'none';
        userNameEl.innerText = data.userName || 'Boox Kullanıcısı';
        siteDomainEl.innerText = data.siteDomain ? `(${data.siteDomain})` : '';
        if (data.avatarUrl) {
          avatarEl.src = data.avatarUrl;
        }
      } else {
        userPanel.style.display = 'none';
        actionSection.style.display = 'none';
        loginSection.style.display = 'block';
      }
    });
  }

  // URL Push Butonu
  if (pushUrlBtn) {
    pushUrlBtn.addEventListener('click', async () => {
      actionStatus.style.display = 'block';
      actionStatus.style.color = '#1976d2';
      actionStatus.innerText = 'Sayfa gönderiliyor...';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
        actionStatus.style.color = '#d32f2f';
        actionStatus.innerText = 'Bu sayfa gönderilemez.';
        return;
      }

      chrome.runtime.sendMessage({
        action: 'pushUrl',
        url: tab.url,
        title: tab.title || 'Web Sayfası'
      }, (res) => {
        if (res && res.success) {
          actionStatus.style.color = '#2e7d32';
          actionStatus.innerText = '✅ Sayfa PushRead\'e gönderildi!';
          setTimeout(() => { window.close(); }, 1500);
        } else {
          actionStatus.style.color = '#d32f2f';
          actionStatus.innerText = `❌ Hata: ${res?.error || 'Gönderilemedi'}`;
        }
      });
    });
  }

  // PDF Yazdırma Butonu
  if (printPdfBtn) {
    printPdfBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.print()
        });
        window.close();
      }
    });
  }

  const bindLoginButton = (id, domain) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'gotoLogin', domain: domain });
      });
    }
  };

  bindLoginButton('gotoLogin_pb', 'push.boox.com');
  bindLoginButton('gotoLogin_eur', 'eur.boox.com');
  bindLoginButton('gotoLogin_us', 'us.boox.com');
  bindLoginButton('gotoLogin_s2b', 'send2boox.com');

  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#1976d2';
      statusMsg.innerText = 'Sekmeler taranıyor...';

      chrome.runtime.sendMessage({ action: 'scanTabs' }, (response) => {
        if (response && response.status === 'ok') {
          statusMsg.style.color = '#2e7d32';
          statusMsg.innerText = 'Giriş başarıyla algılandı!';
          setTimeout(checkLoginStatus, 500);
        } else {
          statusMsg.style.color = '#d32f2f';
          statusMsg.innerText = 'Açık sekmede giriş bulunamadı. Lütfen giriş yapın.';
        }
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'logout' }, () => {
        checkLoginStatus();
      });
    });
  }

  checkLoginStatus();
});
