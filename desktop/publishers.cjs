// Fixed API hosts only. Tokens never enter renderer state or application logs.
const API_TIMEOUT = 30000;
class ApiError extends Error {
  constructor(message, uncertain = false) { super(message); this.uncertain = uncertain; }
}
async function request(url, token, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options, redirect: 'error', signal: AbortSignal.timeout(API_TIMEOUT),
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
    });
  } catch {
    throw new ApiError('Keine eindeutige Antwort der Plattform. Bitte dein Profil prüfen, bevor du erneut veröffentlichst.', options.method === 'POST');
  }
  if (!response.ok) {
    const messages = {
      400: 'Die Plattform hat die Anfrage abgelehnt. Konto-ID, Berechtigungen und Beitragsformat prüfen.',
      401: 'Zugangstoken ungültig oder abgelaufen. Bitte die Verbindung erneuern.',
      403: 'Die erforderliche Veröffentlichungsberechtigung fehlt. Bitte die App-Freigaben prüfen.',
      404: 'Konto oder API-Version nicht erreichbar. Bitte die Verbindungseinstellungen prüfen.',
      429: 'Das Plattformlimit ist erreicht. Bitte später erneut versuchen.',
    };
    throw new ApiError(messages[response.status] || `Plattformfehler (${response.status}). Bitte später prüfen.`, options.method === 'POST' && response.status >= 500);
  }
  const data = await response.json().catch(() => ({}));
  return { data, response };
}
function validateImage(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Für Instagram eine öffentliche HTTPS-Bildadresse eintragen.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || /^(localhost|.*\.local|.*\.internal|\[.*\]|[\d.]+)$/i.test(url.hostname)) {
    throw new Error('Für Instagram eine öffentliche HTTPS-Bildadresse ohne Zugangsdaten verwenden.');
  }
  return url.href;
}
function linkedInHeaders(settings) {
  return { 'Content-Type': 'application/json', 'LinkedIn-Version': settings.version, 'X-Restli-Protocol-Version': '2.0.0' };
}
async function identify(platform, settings, token) {
  if (!token) throw new Error('Bitte zuerst einen Zugangstoken speichern.');
  if (platform === 'instagram') {
    const { data } = await request(`https://graph.instagram.com/${settings.version}/me?fields=user_id,username`, token);
    if (!data.username || !/^\d+$/.test(String(data.user_id || ''))) throw new Error('Instagram hat kein lesbares Profil zurückgegeben.');
    if (data.username.toLowerCase() !== 'webstudio_expert') throw new Error('Dieser Token gehört nicht zu @webstudio_expert.');
    return { id: String(data.user_id), name: `@${data.username}` };
  }
  const { data } = await request('https://api.linkedin.com/v2/userinfo', token);
  if (!data.sub || !/^[\w-]+$/.test(data.sub)) throw new Error('LinkedIn hat keine gültige Mitglieds-ID zurückgegeben. Benötigt werden openid und profile.');
  return { id: `urn:li:person:${data.sub}`, name: data.name || 'LinkedIn-Profil' };
}
async function check(platform, settings, token) {
  const identity = await identify(platform, settings, token);
  if (identity.id !== (platform === 'instagram' ? settings.accountId : settings.author)) throw new Error('Konto-ID und Zugangstoken gehören nicht zusammen.');
  return `${identity.name} erreichbar. Die Veröffentlichungsberechtigung wird erst beim Senden geprüft.`;
}
async function publish(post, settings, token, checkpoint) {
  if (!token) throw new Error('Für diese Plattform fehlt der Zugangstoken.');
  if (post.platform === 'linkedin') {
    const { data: identity } = await request('https://api.linkedin.com/v2/userinfo', token);
    if (`urn:li:person:${identity.sub}` !== settings.author) throw new Error('LinkedIn-Konto und Mitglieds-ID stimmen nicht überein.');
    const { response } = await request('https://api.linkedin.com/rest/posts', token, {
      method: 'POST', headers: linkedInHeaders(settings),
      body: JSON.stringify({ author: settings.author, commentary: post.text, visibility: 'PUBLIC', lifecycleState: 'PUBLISHED',
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] }, isReshareDisabledByAuthor: false }),
    });
    const id = response.headers.get('x-restli-id');
    if (!id) throw new ApiError('Die Plattform meldet Erfolg ohne Beitrags-ID. Bitte im Profil prüfen.', true);
    return { id, url: `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}/` };
  }
  await check('instagram', settings, token);
  const base = `https://graph.instagram.com/${settings.version}`;
  // Containers are saved before publication. A failed status lookup can safely resume this container.
  let containerId = post.containerId;
  if (!containerId) {
    const { data } = await request(`${base}/${settings.accountId}/media`, token, {
      method: 'POST', body: new URLSearchParams({ image_url: validateImage(post.imageUrl), caption: post.text }),
    });
    if (!/^\d+$/.test(data.id || '')) throw new Error('Instagram hat keinen Bild-Container zurückgegeben.');
    containerId = data.id;
    await checkpoint(containerId);
  }
  let ready = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data } = await request(`${base}/${containerId}?fields=status_code`, token);
    if (data.status_code === 'FINISHED') { ready = true; break; }
    if (data.status_code === 'PUBLISHED') throw new ApiError('Dieser Instagram-Container wurde bereits veröffentlicht. Bitte im Profil prüfen.', true);
    if (['ERROR', 'EXPIRED'].includes(data.status_code)) throw new Error('Instagram kann das Bild nicht verarbeiten. Öffentliche JPEG-Datei, Abmessungen und Dateigröße prüfen; anschließend einen neuen Entwurf erstellen.');
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
  if (!ready) throw new Error('Das Bild wird noch verarbeitet. Du kannst es später erneut versuchen.');
  const { data } = await request(`${base}/${settings.accountId}/media_publish`, token, {
    method: 'POST', body: new URLSearchParams({ creation_id: containerId }),
  });
  if (!data.id) throw new ApiError('Keine veröffentlichte Beitrags-ID erhalten. Bitte im Profil prüfen.', true);
  // Do not turn a failed permalink lookup into a failed publication.
  let url = '';
  try { url = (await request(`${base}/${data.id}?fields=permalink`, token)).data.permalink || ''; } catch {}
  return { id: data.id, url };
}
module.exports = { check, identify, publish, validateImage };
