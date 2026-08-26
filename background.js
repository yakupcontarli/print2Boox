/*
 * chrome printer provider - Manifest V3 Service Worker
 */
'use strict';

// Service Worker ortamında eksik olan global DOM nesneleri için uyumluluk shimi
self.window = self;
self.document = {
  location: {
    protocol: 'https:'
  }
};
var document = self.document;
var window = self;

importScripts('aliyun-oss-sdk-6.0.0.min.js');

const ga = function(...args) {
  console.log('[Analytics]:', ...args);
};

const notification_icon = "images/icon-128.png";
const { version: VERSION } = chrome.runtime.getManifest();

const Util = {
  guid: function guid() {
    return Util.s4() + Util.s4() + '-' + Util.s4() + '-' + Util.s4() + '-' + Util.s4() + '-' + Util.s4() + Util.s4() + Util.s4();
  },
  uuid: function uuid() {
    return Util.s4() + Util.s4() + Util.s4() + Util.s4() + Util.s4() + Util.s4() + Util.s4() + Util.s4();
  },
  s4: function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
};

const CAPABILITIES = ' {      "version": "1.0",      "printer": {       "supported_content_type": [          {"content_type": "application/pdf","min_version":"1.5","max_version":"1.5"},          {"content_type": "image/pwg-raster"}        ],        "copies": {          "default": 1,          "max": 100        },        "color":{          "option": [            {"type":  "STANDARD_COLOR", "is_default":  true},            {"type":  "STANDARD_MONOCHROME"}          ]        },        "duplex":{          "option": [            {"type": "NO_DUPLEX", "is_default":  true },            {"type": "LONG_EDGE"},            {"type": "SHORT_EDGE"}          ]        },        "collate": { "default": true},        "page_orientation":{"option":[{"type":"PORTRAIT","is_default":true},{"type":"LANDSCAPE"}]},        "margins":{"option":[{"type":"BORDERLESS","top":0,"left":0,"right":0,"bottom":0},{"type":"STANDARD","is_default":true},{"type":"CUSTOM"}]},        "media_size": {      "option": [        {          "name": "ISO_A4",          "width_microns": 210000,          "height_microns": 297000,          "is_default": false        },         {          "name": "ISO_A5",          "width_microns": 105000,          "height_microns": 148500,          "is_default": false        },        {          "name": "NA_INDEX_4X6",          "width_microns": 100000,          "height_microns": 150000        },        {          "name": "NA_LETTER",          "width_microns": 215900,          "height_microns": 279400,          "is_default": true        }      ]    }      }    } ';
const cdd = JSON.parse(CAPABILITIES);

const openedTabs = {};

// Sağ tık menüsü oluştur
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "boox_push_page",
    title: "Bu Sayfayı Boox'a Gönder (PushRead)",
    contexts: ["page", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "boox_push_page") {
    const targetUrl = info.linkUrl || info.pageUrl || tab?.url;
    const targetTitle = tab?.title || "Web Sayfası";
    if (targetUrl) {
      pushUrlToBoox(targetUrl, targetTitle);
    }
  }
});

async function gotoLogin(domain){
  if( !domain ){
    throw new Error('gotoLogin need domain!');
  }
  chrome.tabs.create({
    active: true,
    url: `https://${domain}/`,
  }, function(tab) {
    if (tab && tab.id) {
      openedTabs[tab.id] = tab;
    }
  });
}

// Token doğrulama ve kullanıcı bilgilerini kaydetme
async function verifyAndSaveUser(token, siteDomain, extraDevices) {
  if (!token || !siteDomain) return false;

  console.log(`Verifying token for domain: ${siteDomain}`);
  try {
    const rawToken = token.replace(/^Bearer\s+/i, '');
    let res = await fetch(`https://${siteDomain}/api/1/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rawToken}`
      }
    });

    if (res.status === 401 || res.status === 403) {
      res = await fetch(`https://${siteDomain}/api/1/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': rawToken
        }
      });
    }

    if (!res.ok) {
      console.warn(`User check returned status ${res.status}`);
      return false;
    }

    const json = await res.json();
    if (json && json.data) {
      const uid = json.data.uid || json.data.userUid || json.data.id;
      const user = {
        boox_auth_token: rawToken,
        siteDomain: siteDomain,
        token: rawToken,
        userName: json.data.nickname || json.data.email || json.data.username || 'Boox User',
        userId: json.data.id,
        userUid: String(uid),
        avatarUrl: json.data.avatarUrl || '',
        version: VERSION
      };

      if (extraDevices && extraDevices.length > 0) {
        user.userDevices = extraDevices;
      }

      await chrome.storage.local.set(user);
      console.log('User verified and saved:', user);

      chrome.notifications.create('loginSuccess' + Date.now(), {
        type: "basic",
        iconUrl: notification_icon,
        title: "Print to Boox",
        message: `Giriş başarılı: ${user.userName} (${siteDomain})`,
        priority: 1
      }, (nid) => {
        setTimeout(() => { chrome.notifications.clear(nid); }, 4000);
      });

      return true;
    }
  } catch (err) {
    console.error('verifyAndSaveUser error:', err);
  }
  return false;
}

// Sekmeleri tarayıp açık Boox sekmelerinden token çekme
async function scanOpenBooxTabs() {
  const tabs = await chrome.tabs.query({
    url: [
      "*://*.boox.com/*",
      "*://*.send2boox.com/*"
    ]
  });

  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          let tok = null;
          let devs = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            if (!val) continue;
            const lk = key.toLowerCase();
            if (lk === 'token' || lk === 'auth_token' || lk === 'access_token' || lk === 'onyx_token') {
              if (typeof val === 'string' && val.length > 8 && !val.startsWith('{')) {
                tok = val.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '');
              }
            }
            if (val.startsWith('{') || val.startsWith('[')) {
              try {
                const obj = JSON.parse(val);
                const findTok = (o) => {
                  if (!o || typeof o !== 'object') return null;
                  if (o.token && typeof o.token === 'string' && o.token.length > 8) return o.token;
                  if (o.accessToken && typeof o.accessToken === 'string' && o.accessToken.length > 8) return o.accessToken;
                  if (o.auth_token && typeof o.auth_token === 'string' && o.auth_token.length > 8) return o.auth_token;
                  for (const k in o) {
                    const found = findTok(o[k]);
                    if (found) return found;
                  }
                  return null;
                };
                if (!tok) {
                  const f = findTok(obj);
                  if (f) tok = f.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '');
                }

                const findDevs = (o) => {
                  if (!o || typeof o !== 'object') return null;
                  if (Array.isArray(o)) {
                    const devList = o.filter(item => item && (item.mac || item.deviceModel || item.model || item.sn));
                    if (devList.length > 0) return devList;
                  }
                  for (const k in o) {
                    if (k.toLowerCase().includes('device') || k.toLowerCase().includes('bind')) {
                      const res = findDevs(o[k]);
                      if (res) return res;
                    }
                  }
                  return null;
                };
                const fd = findDevs(obj);
                if (fd && fd.length > 0) devs = fd;
              } catch(e){}
            }
          }
          return {
            token: tok,
            domain: window.location.hostname,
            devices: devs
          };
        }
      });

      const res = results?.[0]?.result;
      if (res && res.token && res.domain) {
        const ok = await verifyAndSaveUser(res.token, res.domain, res.devices);
        if (ok) return true;
      }
    } catch (e) {
      console.warn('Could not inspect tab:', tab.id, e);
    }
  }
  return false;
}

// URL'yi doğrudan Boox PushRead servisine gönderme (HAR Analizi ile Çözümlenen Endpoint)
async function pushUrlToBoox(url, title) {
  try {
    const { token, siteDomain } = await getToken();
    const API_PREFIX = `https://${siteDomain}/api/1`;
    const rawToken = token.replace(/^Bearer\s+/i, '');

    const payload = {
      url: url,
      parentFolder: null
    };

    console.log('Sending URL to Boox PushRead (/webpage/url):', payload);

    let res = await fetch(`${API_PREFIX}/webpage/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rawToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      res = await fetch(`${API_PREFIX}/webpage/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': rawToken
        },
        body: JSON.stringify(payload)
      });
    }

    let json = null;
    try {
      json = await res.json();
    } catch(e) {}

    console.log('pushUrl response:', res.status, json);

    if (res.ok && json && (json.result_code === 0 || json.code === 0 || json.code === 200)) {
      chrome.notifications.create('pushUrlSuccess' + Date.now(), {
        type: "basic",
        iconUrl: notification_icon,
        title: "Boox PushRead",
        message: `Web sayfası PushRead'e gönderildi: ${title || url}`,
        priority: 1
      }, (nid) => {
        setTimeout(() => { chrome.notifications.clear(nid); }, 4000);
      });
      return { success: true };
    } else {
      throw new Error(json?.message || `HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('pushUrl error:', err);
    chrome.notifications.create('pushUrlFailed' + Date.now(), {
      type: "basic",
      iconUrl: notification_icon,
      title: "Gönderim Başarısız",
      message: `Hata: ${err.message}`,
      priority: 1
    });
    return { success: false, error: err.message };
  }
}

// Runtime mesajlarını dinle
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message && message.action === 'syncTokenFromPage') {
    verifyAndSaveUser(message.token, message.domain, message.devices);
    sendResponse({ status: 'received' });
    return true;
  }

  if (message && message.action === 'scanTabs') {
    scanOpenBooxTabs().then((found) => {
      sendResponse({ status: found ? 'ok' : 'not_found' });
    });
    return true;
  }

  if (message && message.action === 'pushUrl') {
    pushUrlToBoox(message.url, message.title).then((res) => {
      sendResponse(res);
    });
    return true;
  }

  if (message && message.action === 'gotoLogin' && message.domain) {
    gotoLogin(message.domain);
    sendResponse({ status: 'ok' });
    return true;
  }

  if (message && message.action === 'logout') {
    chrome.storage.local.clear(() => {
      sendResponse({ status: 'logged_out' });
    });
    return true;
  }
});

chrome.tabs.onCreated.addListener(function(tab){
  const { openerTabId } = tab;
  if( openerTabId && openedTabs[openerTabId] ){
    openedTabs[tab.id] = tab;
  }
});

chrome.tabs.onRemoved.addListener(function (tabId){
  if(openedTabs[tabId]){
    delete openedTabs[tabId];
  }
});

async function getToken(){
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['boox_auth_token', 'siteDomain', 'version', 'userUid', 'userId', 'userDevices'], function(result) {
      const token = result.boox_auth_token;
      const siteDomain = result.siteDomain;
      let userUid = result.userUid || result.userId;
      const savedDevices = result.userDevices || [];

      if( !token || !siteDomain || !userUid ){
        return reject( new Error(chrome.i18n.getMessage("please_login_first") || "Lütfen önce Boox hesabınıza giriş yapın.") );
      }

      resolve({ token, siteDomain, userUid, savedDevices });
    });
  });
}

// Printer Provider
chrome.printerProvider.onGetPrintersRequested.addListener(async function(e) {
  e([{
    id: "Print to Boox",
    name: "Print to Boox"
  }]);
});

chrome.printerProvider.onGetCapabilityRequested.addListener(function(e, r) {
  return r(cdd);
});

chrome.printerProvider.onPrintRequested.addListener(function(e, r) {
  console.log('onPrintRequested triggered:', e);

  // Chrome'a hemen OK yanıtı ver ki yazdırma penceresi anında kapansın
  r("OK");

  // Dosya yükleme ve iletim arka planda kesintisiz çalışsın
  pushFile(e).then(() => {
    console.log('pushFile completed successfully');
  }).catch((err) => {
    ga('send', 'exception', err.message, err.stack);
    console.error(`pushFile Failed: ${err}`, err);
  });
});

async function getOssClient(API_PREFIX, token) {
  const rawToken = token.replace(/^Bearer\s+/i, '');
  let headers = { 'Authorization': `Bearer ${rawToken}` };

  let creds = null;
  try {
    let credsRes = await fetch(`${API_PREFIX}/config/stss`, { method: 'GET', headers });
    if (credsRes.ok) {
      let j = await credsRes.json();
      creds = j.data;
    }
  } catch(e) {}

  if (!creds || !creds.AccessKeyId) {
    let credsRes = await fetch(`${API_PREFIX}/stss/`, { method: 'GET', headers });
    if (credsRes.status === 401) {
      credsRes = await fetch(`${API_PREFIX}/stss/`, { method: 'GET', headers: { 'Authorization': rawToken } });
    }
    let j = await credsRes.json();
    creds = j.data;
  }

  let zone = {};
  try {
    let zoneRes = await fetch(`${API_PREFIX}/push/bucket`, { method: 'GET', headers });
    if (zoneRes.status === 401) {
      zoneRes = await fetch(`${API_PREFIX}/push/bucket`, { method: 'GET', headers: { 'Authorization': rawToken } });
    }
    let j = await zoneRes.json();
    zone = j.data || {};
  } catch(e) {}

  const bucket = zone.bucket || creds?.bucket || 'onyx-cloud-us';
  const region = zone.region || creds?.region || 'oss-us-west-1';

  console.log(`OSS Client Init: Bucket=${bucket}, Region=${region}`);

  const client = new OSS({
    region: region,
    accessKeyId: creds.AccessKeyId,
    accessKeySecret: creds.AccessKeySecret,
    stsToken: creds.SecurityToken,
    bucket: bucket,
    secure: true
  });
  return client;
}

// Dosya adını Android / Boox dosya sistemi için güvenli hale getirme
function sanitizeFilename(name) {
  return (name || 'document')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

// Kullanıcının hesabına bağlı tüm Boox cihazlarını dinamik olarak çekme
async function getUserDevices(token, API_PREFIX, savedDevices) {
  const rawToken = token.replace(/^Bearer\s+/i, '');
  let devices = Array.isArray(savedDevices) ? [...savedDevices] : [];

  try {
    const endpoints = [
      `${API_PREFIX}/users/getDevice/`,
      `${API_PREFIX}/users/deviceList`,
      `${API_PREFIX}/devices`
    ];

    for (const ep of endpoints) {
      try {
        let res = await fetch(ep, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${rawToken}`
          }
        });
        if (!res.ok) {
          res = await fetch(ep, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': rawToken
            }
          });
        }
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
            devices = json.data;
            chrome.storage.local.set({ userDevices: devices });
            break;
          }
        }
      } catch(e){}
    }
  } catch (e) {
    console.warn('getUserDevices failed:', e);
  }

  return devices;
}

// NeoCloud CouchDB / Sync Gateway üzerinden her kullanıcı ve cihaz için dinamik anında push
async function sendToNeoCloud(siteDomain, userUid, token, data, client, devices) {
  const rawToken = token.replace(/^Bearer\s+/i, '');
  const now = Date.now();
  const isoDate = new Date(now).toISOString();

  // İndirme için pre-signed GET URL oluştur
  let getUrl = '';
  try {
    getUrl = client.signatureUrl(data.resourceKey, {
      expires: 3600 * 24 * 7,
      response: {
        'content-disposition': 'attachment'
      }
    });
    if (getUrl.startsWith('http://')) {
      getUrl = getUrl.replace('http://', 'https://');
    }
  } catch(e) {
    console.warn('signatureUrl GET error:', e);
  }

  // Eğer kullanıcıda birden fazla cihaz varsa her birine, yoksa genel kanala yayınla
  const targetDevices = (devices && devices.length > 0) ? devices : [{ mac: '', deviceModel: '' }];
  const docs = [];

  for (const dev of targetDevices) {
    const uuid = Util.guid().replace(/-/g, '').substring(0, 24);
    const mac = dev.mac || '';
    const deviceModel = dev.deviceModel || dev.model || '';

    const innerContent = {
      category: [],
      tags: [],
      formats: [data.resourceType || "pdf"],
      viewCount: 0,
      downloadCount: 0,
      commentsCount: 0,
      size: data.size,
      sourceType: 0,
      childCount: 0,
      pushNum: 1,
      isFolder: "no",
      parent: null,
      _id: uuid,
      storage: {
        pdf: {
          oss: {
            displayName: data.name,
            expires: 0,
            key: data.resourceKey,
            provider: "oss",
            size: String(data.size),
            bucket: data.bucket || "onyx-cloud-us",
            url: getUrl
          }
        }
      },
      userId: userUid,
      name: data.name,
      ownerId: userUid,
      title: data.name,
      distributeChannel: "onyx",
      guid: uuid,
      mac: mac,
      deviceModel: deviceModel,
      updatedAt: now
    };

    docs.push({
      _id: uuid,
      contentType: "digital_content",
      createdAt: isoDate,
      dbId: `${userUid}-MESSAGE`,
      msgType: 2,
      name: data.name,
      size: data.size,
      uniqueId: uuid,
      updatedAt: now,
      user: userUid,
      check: true,
      content: JSON.stringify(innerContent)
    });
  }

  const payload = { docs };
  console.log('Sending dynamic docs to NeoCloud Sync Gateway (_bulk_docs):', payload);

  try {
    const res = await fetch(`https://${siteDomain}/neocloud/_bulk_docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rawToken}`,
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const resJson = await res.json();
    console.log('NeoCloud _bulk_docs response:', res.status, resJson);
    return res.ok;
  } catch(e) {
    console.warn('sendToNeoCloud failed:', e);
    return false;
  }
}

async function pushFile(task) {
  ga('send', 'event', 'pushFile', 'start');

  const { contentType, document: fileBlob, title } = task;

  async function postData(data, token, API_PREFIX) {
    const rawToken = token.replace(/^Bearer\s+/i, '');
    const bearerToken = `Bearer ${rawToken}`;
    
    const obj = {
      data: data,
      type: 'digital_content',
      all: true,
      push: true,
      needPush: 1
    };

    console.log('Sending saveAndPush payload:', JSON.stringify(obj));

    let res = await fetch(`${API_PREFIX}/push/saveAndPush`, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': bearerToken,
      },
      body: JSON.stringify(obj)
    });

    let json = null;
    try {
      json = await res.json();
    } catch(e) {}

    if (!res.ok || (json && json.result_code !== 0 && json.code !== 0 && json.code !== 200 && json.result_code !== undefined)) {
      res = await fetch(`${API_PREFIX}/push/saveAndPush`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': rawToken,
        },
        body: JSON.stringify(obj)
      });
      try {
        json = await res.json();
      } catch(e) {}
    }

    return { res, json };
  }

  function dataObj(userUid, fileSize) {
    var ext = (contentType.split('/').pop() || 'pdf').toLowerCase();
    if (ext.includes('pdf')) ext = 'pdf';
    var key = `${userUid}/push/${Util.uuid()}.${ext}`;
    var cleanTitle = sanitizeFilename(title);
    var filename = `${cleanTitle}.${ext}`;
    
    return {
      name: filename,
      title: filename,
      resourceType: ext,
      resourceKey: key,
      resourceDisplayName: filename,
      size: fileSize,
      storageType: 1,
      needPush: 1,
      push: true
    };
  }

  let data = {};

  try{
    const { token, siteDomain, userUid, savedDevices } = await getToken();
    const API_PREFIX = `https://${siteDomain}/api/1`;
    
    // 1. Binary ArrayBuffer al
    const arrayBuffer = await fileBlob.arrayBuffer();
    data = dataObj(userUid, arrayBuffer.byteLength);
    
    // 2. OSS istemcisini al
    const client = await getOssClient(API_PREFIX, token);
    
    // 3. Pre-signed PUT URL oluştur ve yükle
    let putUrl = client.signatureUrl(data.resourceKey, {
      method: 'PUT',
      'Content-Type': contentType || 'application/pdf'
    });
    if (putUrl.startsWith('http://')) {
      putUrl = putUrl.replace('http://', 'https://');
    }

    console.log('Uploading PDF directly to OSS:', putUrl);
    const uploadRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType || 'application/pdf'
      },
      body: arrayBuffer
    });

    if (!uploadRes.ok) {
      throw new Error(`OSS Upload hatası: HTTP ${uploadRes.status}`);
    }
    console.log('OSS upload başarılı, dosya boyutu:', arrayBuffer.byteLength);
    
    // 4. Boox API'ye kaydet (saveAndPush)
    data.bucket = client.options.bucket;
    const { res, json } = await postData(data, token, API_PREFIX);

    console.log('Boox saveAndPush API yanıtı:', json);

    // 5. Giriş yapan kullanıcının kendi Boox cihazlarını dinamik keşfet ve NeoCloud'a ilet
    const devices = await getUserDevices(token, API_PREFIX, savedDevices);
    await sendToNeoCloud(siteDomain, userUid, token, data, client, devices);

    chrome.notifications.create('pushSuccess'+ Date.now(), {
      type: "basic",
      iconUrl: notification_icon,
      title: "BooxPrinter",
      message: `Başarıyla gönderildi: ${data.name}`,
      priority: 1,
    }, function(nid){
      setTimeout(() => {
        chrome.notifications.clear(nid);
      }, 4000);
    });
    ga('send', 'event', 'pushFile', 'success');

  } catch(e){
    chrome.notifications.create('pushFailed'+ Date.now(), {
      type: "basic",
      iconUrl: notification_icon,
      title: "Gönderim Başarısız",
      message: `Hata: ${e.message}`,
      priority: 1,
    });
    ga('send', 'event', 'pushFile', 'failed', e.message);

    throw e;
  }
}
