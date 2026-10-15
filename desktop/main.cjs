const { app, BrowserWindow, ipcMain, safeStorage, dialog, shell, Tray, Menu, nativeImage, Notification } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { randomUUID } = require('node:crypto');
const publishers = require('./publishers.cjs');
app.setName('Webstudio Social');
const profiles = {
  instagram: 'https://www.instagram.com/webstudio_expert/',
  linkedin: 'https://www.linkedin.com/in/enrico-gross-7bb190444/',
  website: 'https://www.webstudio-expert.de/',
  crm: 'https://www.webstudio-expert.de/crm',
  meta: 'https://developers.facebook.com/apps/',
  linkedinDeveloper: 'https://www.linkedin.com/developers/apps',
  guide: 'https://github.com/Erygros/webstudio/blob/main/desktop/README.md',
};
let win, tray, state, file, quitting = false, queue = Promise.resolve();
const uiFile = path.join(__dirname, 'ui', 'index.html');
const uiUrl = pathToFileURL(uiFile).href;
const serialize = work => {
  const result = queue.then(work);
  queue = result.catch(() => {});
  return result;
};
async function persist() {
  const temporary = `${file}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
  await fs.rename(temporary, file);
}
function publicState() {
  const accounts = Object.fromEntries(Object.entries(state.accounts).map(([key, value]) => {
    const { token, ...visible } = value;
    return [key, { ...visible, hasToken: Boolean(token) }];
  }));
  return { posts: state.posts, paused: state.paused, accounts, profiles, startup: app.getLoginItemSettings().openAtLogin, dataDirectory: app.getPath('userData') };
}
function platform(value) {
  if (!['instagram', 'linkedin'].includes(value)) throw new Error('Unbekannte Plattform.');
  return value;
}
function text(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function connectionReady(key) {
  const c = state.accounts[key];
  return Boolean(c.token && (key === 'instagram' ? c.accountId : c.author));
}
async function tokenFor(key) {
  try { return safeStorage.decryptString(Buffer.from(state.accounts[key].token, 'base64')); }
  catch { throw new Error('Der gespeicherte Token lässt sich nicht entschlüsseln. Bitte erneut verbinden.'); }
}
function postById(id) {
  const post = state.posts.find(item => item.id === id);
  if (!post) throw new Error('Beitrag nicht gefunden.');
  return post;
}
async function send(post) {
  if (!connectionReady(post.platform)) throw new Error('Bitte zuerst das Konto unter „Konten“ verbinden.');
  post.status = 'publishing'; post.error = ''; await persist();
  try {
    const result = await publishers.publish(post, state.accounts[post.platform], await tokenFor(post.platform), async container => {
      post.containerId = container; await persist();
    });
    post.status = 'published'; post.remoteId = result.id; post.url = result.url;
    post.publishedAt = new Date().toISOString();
  } catch (error) {
    post.status = error.uncertain ? 'review' : 'failed';
    post.error = error.message || 'Veröffentlichung fehlgeschlagen.';
  }
  // If persistence fails after an API success, disk still says publishing, recovered as review.
  await persist();
  if (Notification.isSupported()) new Notification({ title: 'Webstudio Social', body: post.status === 'published' ? `„${post.title}“ veröffentlicht.` : `„${post.title}“ benötigt deine Prüfung.` }).show();
}
function handle(name, work) {
  ipcMain.handle(`social:${name}`, (event, value) => {
    if (event.sender !== win?.webContents || event.senderFrame !== win.webContents.mainFrame || event.senderFrame.url !== uiUrl) throw new Error('Nicht erlaubte Anfrage.');
    return serialize(async () => {
      try { return { ok: true, value: await work(value) }; }
      catch (error) { return { ok: false, error: error.message || 'Aktion fehlgeschlagen.' }; }
    });
  });
}
function registerHandlers() {
  handle('state', () => publicState());
  handle('save', async input => {
    if (!input || typeof input !== 'object') throw new Error('Ungültiger Beitrag.');
    const key = platform(input.platform);
    const old = input.id ? postById(input.id) : null;
    if (old && ['published', 'publishing', 'review'].includes(old.status)) throw new Error('Diesen Beitrag kannst du nicht bearbeiten. Prüfe gegebenenfalls zuerst dein Profil.');
    const content = text(input.text, 10000);
    const limit = key === 'instagram' ? 2200 : 3000;
    if (!content || content.length > limit) throw new Error(`Der Beitrag benötigt 1 bis ${limit} Zeichen.`);
    if (state.posts.length >= 5000 && !old) throw new Error('Maximal 5000 Beiträge. Bitte alte Entwürfe löschen.');
    const scheduled = input.status === 'scheduled';
    const date = scheduled ? new Date(input.scheduledAt) : null;
    if (scheduled && (!date || !Number.isFinite(date.getTime()) || date.getTime() <= Date.now())) throw new Error('Bitte einen zukünftigen Zeitpunkt wählen.');
    if (scheduled && !connectionReady(key)) throw new Error('Vor dem Einplanen bitte das Konto verbinden. Entwürfe kannst du bereits speichern.');
    const imageUrl = text(input.imageUrl, 2048);
    if (key === 'instagram' && scheduled) publishers.validateImage(imageUrl);
    const post = { id: old?.id || randomUUID(), platform: key, title: text(input.title, 100) || 'Ohne Titel', text: content, imageUrl: key === 'instagram' ? imageUrl : '',
      status: scheduled ? 'scheduled' : 'draft', scheduledAt: date?.toISOString() || '', createdAt: old?.createdAt || new Date().toISOString(), error: '' };
    // Changed drafts must get a fresh Instagram container so the caption/image cannot be stale.
    if (old) Object.assign(old, post, { containerId: undefined }); else state.posts.push(post);
    await persist(); return publicState();
  });
  handle('remove', async id => {
    const post = postById(id);
    if (post.status === 'publishing') throw new Error('Der Beitrag wird gerade gesendet.');
    state.posts = state.posts.filter(item => item.id !== id); await persist(); return publicState();
  });
  handle('publish', async id => {
    const post = postById(id);
    if (!['draft', 'failed', 'scheduled'].includes(post.status)) throw new Error('Bitte diesen Beitrag zuerst auf der Plattform prüfen; ein erneutes Senden ist gesperrt.');
    if (!connectionReady(post.platform)) throw new Error('Bitte zuerst unter „Konten“ verbinden.');
    if (post.platform === 'instagram') publishers.validateImage(post.imageUrl);
    const choice = await dialog.showMessageBox(win, { type: 'question', buttons: ['Abbrechen', 'Jetzt veröffentlichen'], defaultId: 0, cancelId: 0,
      message: `„${post.title}“ öffentlich auf ${post.platform === 'instagram' ? 'Instagram' : 'LinkedIn'} veröffentlichen?`, detail: post.text });
    if (choice.response === 1) await send(post);
    return publicState();
  });
  handle('settings', async input => {
    if (!input || typeof input !== 'object') throw new Error('Ungültige Einstellungen.');
    const key = platform(input.platform), old = state.accounts[key];
    const next = { ...old, version: text(input.version, 12), checkedAt: '', checkMessage: '' };
    if (key === 'instagram') {
      next.accountId = text(input.accountId, 40) || old.accountId;
      if (!/^v\d{1,2}\.0$/.test(next.version)) throw new Error('Instagram-API-Version (z. B. v25.0) prüfen.');
    } else {
      next.author = text(input.author, 150) || old.author;
      if (!/^20\d{2}(0[1-9]|1[0-2])$/.test(next.version)) throw new Error('LinkedIn-API-Version (YYYYMM) prüfen.');
    }
    const token = text(input.token, 10000);
    if (token) {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows-Verschlüsselung ist nicht verfügbar. Token wird nicht gespeichert.');
      const identity = await publishers.identify(key, next, token);
      const choice = await dialog.showMessageBox(win, { type: 'question', buttons: ['Abbrechen', 'Dieses Konto verbinden'], defaultId: 0, cancelId: 0,
        message: `${identity.name} mit Webstudio Social verbinden?`, detail: `Plattform: ${key}\nKonto-ID: ${identity.id}\nPrüfe, dass dies dein eigenes vorgesehenes Profil ist. Es wird kein Beitrag veröffentlicht.` });
      if (choice.response !== 1) throw new Error('Kontoverbindung abgebrochen.');
      if (key === 'instagram') next.accountId = identity.id; else next.author = identity.id;
      next.token = safeStorage.encryptString(token).toString('base64');
    }
    if (!next.token) throw new Error('Bitte einen Zugangstoken eintragen.');
    if (key === 'instagram' ? !/^\d{5,40}$/.test(next.accountId) : !/^urn:li:person:[\w-]+$/.test(next.author)) throw new Error('Konto-ID fehlt. Bitte einen gültigen neuen Token eintragen, um sie zu ermitteln.');
    state.accounts[key] = next;
    if (typeof input.startup === 'boolean') app.setLoginItemSettings({ openAtLogin: input.startup, args: ['--background'] });
    await persist(); return publicState();
  });
  handle('resolve', async id => {
    const post = postById(id);
    if (post.status !== 'review') throw new Error('Dieser Beitrag benötigt keine Eingangsprüfung.');
    const choice = await dialog.showMessageBox(win, { type: 'warning', buttons: ['Abbrechen', 'Bereits veröffentlicht', 'Nicht veröffentlicht – als Entwurf'], defaultId: 0, cancelId: 0,
      message: 'Hast du dein Profil auf der Plattform geprüft?', detail: 'Bei einer unterbrochenen Antwort kann der Beitrag bereits öffentlich sein. Wähle „als Entwurf“ nur, wenn du die Veröffentlichung sicher ausgeschlossen hast.' });
    if (choice.response === 1) { post.status = 'published'; post.confirmedAt = new Date().toISOString(); post.manuallyConfirmed = true; post.error = ''; }
    if (choice.response === 2) { post.status = 'draft'; post.scheduledAt = ''; post.containerId = undefined; post.error = ''; }
    await persist(); return publicState();
  });
  handle('check', async key => {
    platform(key);
    const message = await publishers.check(key, state.accounts[key], await tokenFor(key));
    state.accounts[key].checkedAt = new Date().toISOString(); state.accounts[key].checkMessage = message;
    await persist(); return publicState();
  });
  handle('disconnect', async key => {
    platform(key); delete state.accounts[key].token; state.accounts[key].checkedAt = ''; state.accounts[key].checkMessage = '';
    state.paused = true; await persist(); return publicState();
  });
  handle('pause', async value => {
    if (typeof value !== 'boolean') throw new Error('Ungültige Auswahl.');
    state.paused = value; await persist(); return publicState();
  });
  handle('open', async key => {
    if (!Object.hasOwn(profiles, key)) throw new Error('Unbekanntes Ziel.');
    await shell.openExternal(profiles[key]);
  });
  handle('export', async () => {
    const result = await dialog.showSaveDialog(win, { defaultPath: 'webstudio-beitraege.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!result.canceled) await fs.writeFile(result.filePath, JSON.stringify({ exportedAt: new Date().toISOString(), posts: state.posts }, null, 2));
    return !result.canceled;
  });
  handle('image', async data => {
    if (typeof data !== 'string' || !/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(data) || data.length > 12000000) throw new Error('Ungültiges Bild.');
    const result = await dialog.showSaveDialog(win, { defaultPath: 'webstudio-beitrag.jpg', filters: [{ name: 'JPEG', extensions: ['jpg'] }] });
    if (!result.canceled) await fs.writeFile(result.filePath, Buffer.from(data.split(',')[1], 'base64'));
    return !result.canceled;
  });
}
function showWindow() { win.show(); win.focus(); }
async function tick() {
  if (state.paused) return;
  const due = state.posts.filter(p => p.status === 'scheduled' && new Date(p.scheduledAt).getTime() <= Date.now()).sort((a,b) => a.scheduledAt.localeCompare(b.scheduledAt));
  for (const post of due) {
    if (Date.now() - new Date(post.scheduledAt).getTime() > 15 * 60 * 1000) {
      post.status = 'failed'; post.error = 'Termin um mehr als 15 Minuten verpasst. Bitte einen neuen Zeitpunkt wählen oder manuell veröffentlichen.'; await persist(); continue;
    }
    if (!connectionReady(post.platform)) { post.status = 'failed'; post.error = 'Kontoverbindung fehlt. Bitte erneut verbinden.'; await persist(); continue; }
    await send(post);
  }
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) showWindow(); });
  app.whenReady().then(async () => {
    if (process.platform === 'win32') app.setAppUserModelId('de.webstudio-expert.social');
    file = path.join(app.getPath('userData'), 'social.json');
    await fs.mkdir(path.dirname(file), { recursive: true });
    try {
      const raw = await fs.readFile(file, 'utf8');
      state = JSON.parse(raw);
      if (state.schema !== 1 || !Array.isArray(state.posts) || !state.accounts?.instagram || !state.accounts?.linkedin) throw new Error('Datenformat ungültig');
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('Lokale Daten können nicht gelesen werden. Sie wurden nicht überschrieben. Bitte social.json im Anwendungsordner sichern und prüfen.');
      state = { schema: 1, paused: true, posts: [], accounts: { instagram: { accountId: '', version: 'v25.0' }, linkedin: { author: '', version: '202606' } } };
    }
    for (const post of state.posts) if (post.status === 'publishing') { post.status = 'review'; post.error = 'Die Anwendung wurde beim Senden beendet. Bitte zuerst im Profil prüfen. Kein automatischer Neuversand.'; }
    await persist();
    win = new BrowserWindow({ width: 1360, height: 930, minWidth: 880, minHeight: 640, show: false, backgroundColor: '#eef2f8', title: 'Webstudio Social',
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true } });
    win.removeMenu();
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', event => event.preventDefault());
    win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    win.webContents.session.setPermissionCheckHandler(() => false);
    registerHandlers();
    const icon = nativeImage.createFromPath(path.join(__dirname, 'ui', 'icon.png'));
    tray = new Tray(icon);
    tray.setToolTip('Webstudio Social — lokale Beitragsplanung');
    tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Webstudio Social öffnen', click: showWindow }, { label: 'Beenden (Planung stoppt)', click: () => app.quit() }]));
    tray.on('double-click', showWindow);
    win.on('close', event => { if (!quitting) { event.preventDefault(); win.hide(); } });
    await win.loadFile(uiFile);
    if (!process.argv.includes('--background')) showWindow();
    setInterval(() => { if (!quitting) serialize(tick).catch(() => { state.paused = true; }); }, 15000);
  }).catch(error => { dialog.showErrorBox('Webstudio Social konnte nicht starten', error.message); app.quit(); });
  app.on('before-quit', event => {
    // Finish in-flight writes/publications before exiting; no duplicate send on recovery.
    if (!quitting) { event.preventDefault(); quitting = true; queue.finally(() => app.quit()); }
  });
}
