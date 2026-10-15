const $ = selector => document.querySelector(selector);
let state, editing = '', busy = false;
const labels = { draft: 'Entwurf', scheduled: 'Geplant', publishing: 'Wird veröffentlicht', published: 'Veröffentlicht', failed: 'Aktion erforderlich', review: 'Eingang unklar · Profil prüfen' };
const templates = {
  intro: ['Webstudio Expert vorstellen', 'Dein Unternehmen verdient eine Website, die zu dir passt.\n\nIch bin Enrico Gross von Webstudio Expert aus Dortmund. Ich entwickle individuelle Websites und Weblösungen für Selbstständige und Unternehmen – mit klarer Gestaltung, verständlichen Inhalten und einer Darstellung, die auch auf dem Smartphone funktioniert.\n\nDu planst eine neue Website oder möchtest deinen bestehenden Auftritt verbessern? Lass uns über dein Vorhaben sprechen.\n\nhttps://www.webstudio-expert.de\nkontakt@webstudio-expert.de\n\n#Webdesign #Dortmund #WebstudioExpert'],
  mobile: ['Tipp: Websites auf dem Smartphone', 'Ein kurzer Website-Check für dein Unternehmen:\n\nÖffne deine Website auf dem Smartphone. Findest du innerhalb weniger Sekunden dein Angebot, deine Kontaktdaten und den nächsten sinnvollen Schritt?\n\nKleine Schrift, unübersichtliche Menüs und schwer erreichbare Buttons machen eine Anfrage unnötig kompliziert. Eine gute mobile Website hilft Besuchern, sich schnell zurechtzufinden.\n\nDu möchtest deinen Auftritt überarbeiten?\nhttps://www.webstudio-expert.de\n\n#Webdesign #MobileWebsite #Dortmund'],
  local: ['Websites für lokale Unternehmen', 'Deine Kunden sollen online verstehen, was du anbietest – und wie sie dich erreichen.\n\nFür lokale Unternehmen zählen klare Leistungen, gut auffindbare Kontaktdaten und eine Website, die auf jedem Bildschirm funktioniert.\n\nMit Webstudio Expert entwickle ich individuelle Weblösungen aus Dortmund. Gemeinsam schauen wir, welche Inhalte und Funktionen dein Unternehmen wirklich braucht.\n\nErzähl mir von deinem Vorhaben:\nkontakt@webstudio-expert.de\nhttps://www.webstudio-expert.de\n\n#Dortmund #LokaleUnternehmen #Webdesign'],
  process: ['So beginnt ein Website-Projekt', 'Wie beginnt eine neue Website? Mit den richtigen Fragen.\n\nWen möchtest du erreichen? Was sollen Besucher über dein Angebot erfahren? Und was sollen sie danach tun – anrufen, eine Anfrage senden oder einen Termin anfragen?\n\nDiese Ziele bilden die Grundlage für Struktur, Gestaltung und Umsetzung. Bei Webstudio Expert besprechen wir dein Vorhaben persönlich und legen den passenden Umfang fest.\n\nKontakt: kontakt@webstudio-expert.de\nhttps://www.webstudio-expert.de\n\n#WebsiteErstellen #Webdesign #WebstudioExpert'],
};
function notice(message, failure = false) { $('#notice').hidden = false; $('#notice').textContent = message; $('#notice').className = failure ? 'failure' : ''; }
async function api(method, value) {
  const result = await window.social[method](value);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
async function action(work) {
  if (busy) return;
  busy = true;
  const buttons = [...document.querySelectorAll('button')]; buttons.forEach(b => b.disabled = true);
  try { await work(); } catch (error) { notice(error.message, true); }
  finally { busy = false; buttons.forEach(b => b.disabled = false); }
}
function view(id) {
  document.querySelectorAll('.view').forEach(section => section.hidden = section.id !== id);
  document.querySelectorAll('.nav').forEach(button => button.classList.toggle('active', button.dataset.view === id));
}
function preview() {
  const ig = $('#platform').value === 'instagram';
  $('#image-label').hidden = !ig;
  $('#preview-platform').textContent = ig ? 'Instagram' : 'LinkedIn';
  $('#preview-name').textContent = ig ? 'webstudio_expert' : 'Enrico Gross';
  $('#post-text').maxLength = ig ? 2200 : 3000;
  $('#character-count').textContent = `${$('#post-text').value.length} / ${ig ? 2200 : 3000}`;
  $('#preview-text').textContent = $('#post-text').value || 'Dein Beitrag erscheint hier.';
  const account = state?.accounts[$('#platform').value];
  $('#connection-hint').textContent = account?.hasToken ? 'Zugang gespeichert. Bitte vor der ersten Veröffentlichung unter „Konten“ prüfen.' : 'Noch nicht verbunden. Du kannst bereits Entwürfe und Grafiken vorbereiten.';
}
function wrap(ctx, content, x, y, maxWidth, lineHeight) {
  let line = '';
  for (const word of content.split(/\s+/)) {
    if (ctx.measureText(line + word).width > maxWidth && line) { ctx.fillText(line.trim(), x, y); y += lineHeight; line = ''; }
    line += `${word} `;
  }
  ctx.fillText(line.trim(), x, y);
  return y;
}
function artwork() {
  const canvas = $('#artwork'), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#101d37'; ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = '#3161d6'; ctx.fillRect(0, 0, 20, 1080);
  ctx.fillStyle = '#a8beee'; ctx.font = '600 20px Segoe UI'; ctx.fillText('WEBSTUDIO EXPERT / DORTMUND', 85, 100);
  const title = $('#art-title').value || 'Deine nächste Website.';
  ctx.fillStyle = '#ffffff'; ctx.font = `600 ${title.length > 65 ? 64 : title.length > 40 ? 78 : 94}px Segoe UI`;
  wrap(ctx, title, 85, 350, 870, 112);
  ctx.fillStyle = '#c2cde0'; ctx.font = '400 28px Segoe UI'; wrap(ctx, $('#art-subtitle').value, 85, 815, 870, 42);
  ctx.fillStyle = '#ffffff'; ctx.font = '600 23px Segoe UI'; ctx.fillText('webstudio-expert.de', 85, 1000);
  ctx.fillStyle = '#8daeff'; ctx.font = '700 50px Segoe UI'; ctx.fillText('W.', 900, 1000);
}
const esc = value => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function render() {
  $('#planned-count').textContent = state.posts.filter(p => p.status === 'scheduled').length;
  $('#scheduler-label').textContent = state.paused ? 'Zeitplan pausiert' : 'Zeitplan aktiv · PC online lassen';
  $('#pause').textContent = state.paused ? 'Aktivieren' : 'Pausieren';
  const filter = $('#filter').value;
  const posts = [...state.posts].filter(p => filter === 'all' || (filter === 'attention' ? ['review','failed'].includes(p.status) : p.status === filter))
    .sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  $('#posts').innerHTML = posts.length ? posts.map(post => `<article class="post-card"><div class="post-card-header"><div><span class="tag">${post.platform === 'instagram' ? 'INSTAGRAM' : 'LINKEDIN'}</span><h2>${esc(post.title)}</h2></div><span class="badge ${esc(post.status)}">${esc(labels[post.status])}</span></div><p class="body">${esc(post.text)}</p>${post.scheduledAt ? `<p>Geplant: ${esc(new Date(post.scheduledAt).toLocaleString('de-DE'))}</p>` : ''}${post.publishedAt ? `<p>Veröffentlicht: ${esc(new Date(post.publishedAt).toLocaleString('de-DE'))} · ID: ${esc(post.remoteId)}</p>` : ''}${post.error ? `<p class="error">${esc(post.error)}</p>` : ''}<div class="actions">${['draft','failed','scheduled'].includes(post.status) ? `<button class="secondary" data-edit="${esc(post.id)}">Bearbeiten</button><button class="primary" data-publish="${esc(post.id)}">Jetzt veröffentlichen</button>` : ''}<button class="secondary" data-profile="${esc(post.platform)}">Profil prüfen</button>${post.status !== 'publishing' ? `<button class="text-link danger" data-delete="${esc(post.id)}">Lokal löschen</button>` : ''}</div></article>`).join('') : '<div class="empty">Hier ist Platz für deinen nächsten Beitrag.<br>Erstelle links unter „Beitrag erstellen“ deinen ersten Entwurf.</div>';
  for (const post of posts.filter(p => p.status === 'review')) {
    const row = [...document.querySelectorAll('[data-delete]')].find(button => button.dataset.delete === post.id)?.parentElement;
    if (row) { const button = document.createElement('button'); button.className = 'secondary'; button.dataset.resolve = post.id; button.textContent = 'Eingang klären'; row.prepend(button); }
  }
  for (const [key, prefix] of [['instagram','ig'],['linkedin','li']]) {
    const account = state.accounts[key];
    $(`#${prefix}-status`).textContent = account.checkMessage || (account.hasToken ? 'Token gespeichert. Verbindung bitte prüfen.' : 'Noch kein Zugangstoken gespeichert.');
  }
  preview();
}
function fillSettings() {
  $('#ig-id').value = state.accounts.instagram.accountId;
  $('#ig-version').value = state.accounts.instagram.version;
  $('#li-author').value = state.accounts.linkedin.author;
  $('#li-version').value = state.accounts.linkedin.version;
  $('#startup').checked = state.startup;
  $('#data-path').textContent = `Lokaler Datenordner: ${state.dataDirectory}`;
}
async function save(status) {
  if (!$('#post-form').reportValidity()) return;
  const scheduledAt = $('#scheduled-at').value;
  state = await api('savePost', { id: editing || undefined, platform: $('#platform').value, title: $('#post-title').value, text: $('#post-text').value,
    imageUrl: $('#image-url').value, status, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : '' });
  reset(); render(); view('planner'); notice(status === 'scheduled' ? (state.paused ? 'Beitrag eingeplant. Aktiviere den Zeitplan, damit er automatisch veröffentlicht wird.' : 'Beitrag eingeplant. Lass die Anwendung und deinen PC zum Termin eingeschaltet.') : 'Entwurf lokal gespeichert.');
}
function reset() { editing = ''; $('#post-form').reset(); $('#editor-title').textContent = 'Neuer Beitrag'; preview(); }
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => view(button.dataset.view)));
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => action(() => api('open', button.dataset.open))));
$('#platform').addEventListener('change', preview);
$('#post-text').addEventListener('input', preview);
$('#template').addEventListener('change', () => {
  const template = templates[$('#template').value];
  if (template && (!$('#post-text').value || confirm('Aktuellen Beitragstext durch die Vorlage ersetzen?'))) { $('#post-title').value = template[0]; $('#post-text').value = template[1]; preview(); }
});
$('#post-form').addEventListener('submit', event => { event.preventDefault(); action(() => save('draft')); });
$('#schedule').addEventListener('click', () => action(() => save('scheduled')));
$('#reset').addEventListener('click', () => { if (!$('#post-text').value || confirm('Ungespeicherte Änderungen verwerfen?')) reset(); });
$('#art-title').addEventListener('input', artwork); $('#art-subtitle').addEventListener('input', artwork);
$('#export-image').addEventListener('click', () => action(async () => { if (await api('saveImage', $('#artwork').toDataURL('image/jpeg', .92))) notice('JPEG-Grafik gespeichert.'); }));
$('#export-posts').addEventListener('click', () => action(async () => { if (await api('export')) notice('Beiträge exportiert. Der Export enthält keine Zugangstokens.'); }));
$('#pause').addEventListener('click', () => action(async () => { state = await api('pause', !state.paused); render(); }));
$('#filter').addEventListener('change', render);
$('#posts').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  action(async () => {
    if (button.dataset.profile) return api('open', button.dataset.profile);
    if (button.dataset.delete) {
      if (!confirm('Diesen Beitrag lokal löschen? Ein bereits veröffentlichter Beitrag bleibt auf der Plattform bestehen.')) return;
      state = await api('removePost', button.dataset.delete); render();
    }
    if (button.dataset.publish) { notice('Veröffentlichung wird vorbereitet. Bitte die Bestätigung beachten und das Ergebnis abwarten.'); state = await api('publish', button.dataset.publish); render(); notice('Vorgang abgeschlossen. Der Status steht beim Beitrag im Veröffentlichungsplan.'); }
    if (button.dataset.resolve) { state = await api('resolve', button.dataset.resolve); render(); }
    if (button.dataset.edit) {
      if ($('#post-text').value && !confirm('Ungespeicherte Änderungen im Editor verwerfen?')) return;
      const post = state.posts.find(p => p.id === button.dataset.edit);
      editing = post.id; $('#platform').value = post.platform; $('#post-title').value = post.title; $('#post-text').value = post.text; $('#image-url').value = post.imageUrl || '';
      if (post.scheduledAt) { const date = new Date(post.scheduledAt); $('#scheduled-at').value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16); } else $('#scheduled-at').value = '';
      $('#editor-title').textContent = 'Beitrag bearbeiten'; preview(); view('compose');
    }
  });
});
for (const key of ['instagram','linkedin']) {
  $(`#${key}-form`).addEventListener('submit', event => {
    event.preventDefault(); action(async () => {
      const ig = key === 'instagram';
      state = await api('settings', { platform: key, accountId: $('#ig-id').value, author: $('#li-author').value,
        version: $(ig ? '#ig-version' : '#li-version').value, token: $(ig ? '#ig-token' : '#li-token').value, startup: $('#startup').checked });
      $('#ig-token').value = ''; $('#li-token').value = ''; fillSettings(); render(); notice('Verbindung lokal gespeichert. Prüfe sie jetzt mit „Verbindung prüfen“.');
    });
  });
}
document.querySelectorAll('[data-check]').forEach(button => button.addEventListener('click', () => action(async () => { state = await api('check', button.dataset.check); render(); notice('Profil erfolgreich gelesen. Es wurde nichts veröffentlicht.'); })));
document.querySelectorAll('[data-disconnect]').forEach(button => button.addEventListener('click', () => action(async () => {
  if (!confirm('Gespeicherten Token entfernen und Zeitplan pausieren?')) return;
  state = await api('disconnect', button.dataset.disconnect); render(); notice('Verbindung entfernt. Zeitplan pausiert.');
})));
$('#timezone').textContent = `Zeitzone dieses PCs: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Der gewählte Zeitpunkt wird als fester Zeitpunkt gespeichert.`;
action(async () => { state = await api('state'); fillSettings(); render(); artwork(); });
setInterval(async () => {
  if (busy || !state) return;
  try { state = await api('state'); render(); } catch (error) { notice(error.message, true); }
}, 20000);
