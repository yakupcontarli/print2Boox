// content.js - Boox Web Sitelerinden Oturum ve Cihaz Bilgilerini Otomatik Çekme
'use strict';

function extractAndSyncAuth() {
  const hostname = window.location.hostname;
  let token = null;
  let devices = [];

  // 1. localStorage kontrolü
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const val = localStorage.getItem(key);
    if (!val) continue;

    const lowerKey = key.toLowerCase();
    if (lowerKey === 'token' || lowerKey === 'auth_token' || lowerKey === 'access_token' || lowerKey === 'onyx_token') {
      if (typeof val === 'string' && val.length > 8 && !val.startsWith('{')) {
        token = val.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '');
      }
    }

    if (val.startsWith('{') || val.startsWith('[')) {
      try {
        const obj = JSON.parse(val);

        // Token bulma
        const findTokenInObj = (o) => {
          if (!o || typeof o !== 'object') return null;
          if (o.token && typeof o.token === 'string' && o.token.length > 8) return o.token;
          if (o.accessToken && typeof o.accessToken === 'string' && o.accessToken.length > 8) return o.accessToken;
          if (o.auth_token && typeof o.auth_token === 'string' && o.auth_token.length > 8) return o.auth_token;
          for (const k in o) {
            const res = findTokenInObj(o[k]);
            if (res) return res;
          }
          return null;
        };

        if (!token) {
          const found = findTokenInObj(obj);
          if (found) token = found.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '');
        }

        // Cihaz bilgilerini (MAC, Model vb.) bulma
        const findDevicesInObj = (o) => {
          if (!o || typeof o !== 'object') return null;
          if (Array.isArray(o)) {
            const devList = o.filter(item => item && (item.mac || item.deviceModel || item.model || item.sn));
            if (devList.length > 0) return devList;
          }
          for (const k in o) {
            if (k.toLowerCase().includes('device') || k.toLowerCase().includes('bind')) {
              const res = findDevicesInObj(o[k]);
              if (res) return res;
            }
          }
          return null;
        };

        const foundDevs = findDevicesInObj(obj);
        if (foundDevs && foundDevs.length > 0) {
          devices = foundDevs;
        }

      } catch (e) {}
    }
  }

  // 2. Cookie kontrolü
  if (!token) {
    const match = document.cookie.match(/(?:^|;\s*)(?:token|auth_token|access_token|onyx_token)=([^;]+)/i);
    if (match) {
      token = decodeURIComponent(match[1]).replace(/^Bearer\s+/i, '');
    }
  }

  if (token) {
    try {
      chrome.runtime.sendMessage({
        action: 'syncTokenFromPage',
        token: token,
        domain: hostname,
        devices: devices
      });
    } catch (e) {}
  }
}

extractAndSyncAuth();
window.addEventListener('storage', extractAndSyncAuth);

let attempts = 0;
const interval = setInterval(() => {
  extractAndSyncAuth();
  attempts++;
  if (attempts > 20) clearInterval(interval);
}, 2000);
