import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

(() => {
  const form = document.getElementById('wish-form');
  if (!form) return;

  const nameInput = document.getElementById('wish-name');
  const messageInput = document.getElementById('wish-message');
  const honeypot = document.getElementById('wish-website');
  const submitButton = document.getElementById('wish-submit');
  const status = document.getElementById('wish-status');
  const count = document.getElementById('wish-count');
  const total = document.getElementById('wish-total');
  const list = document.getElementById('wish-list');
  const COOLDOWN_MS = 30_000;
  const COOLDOWN_KEY = 'zharina-wish-last-submit';
  let supabase = null;

  function setStatus(message, state = 'info') {
    status.textContent = message;
    status.dataset.state = state;
  }

  function setConfiguredMessage() {
    setStatus('Guestbook setup needed: add your Supabase project URL and public anon/publishable key in supabase-config.js, then run the SQL in supabase-setup.sql.', 'error');
    list.replaceChildren();
    const note = document.createElement('p');
    note.className = 'wish-empty';
    note.textContent = 'The guestbook will show submitted wishes after Supabase is configured.';
    list.append(note);
    total.textContent = 'Not connected';
    submitButton.disabled = true;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
  }

  function renderWishes(rows) {
    list.replaceChildren();
    total.textContent = `${rows.length} ${rows.length === 1 ? 'wish' : 'wishes'}`;
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'wish-empty';
      empty.textContent = 'Be the first to leave Ma’am Zharina a birthday wish.';
      list.append(empty);
      return;
    }

    rows.forEach((wish) => {
      const card = document.createElement('article');
      card.className = 'wish-card';
      const head = document.createElement('div');
      head.className = 'wish-card-head';
      const name = document.createElement('span');
      name.className = 'wish-card-name';
      name.textContent = wish.name;
      const date = document.createElement('time');
      date.className = 'wish-card-date';
      date.dateTime = wish.created_at;
      date.textContent = formatDate(wish.created_at);
      const message = document.createElement('p');
      message.className = 'wish-card-message';
      message.textContent = wish.message;
      head.append(name, date);
      card.append(head, message);
      list.append(card);
    });
  }

  async function loadWishes() {
    const { data, error } = await supabase
      .from('birthday_wishes')
      .select('id, name, message, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      setStatus('Could not load wishes. Check the Supabase table and Row Level Security policies.', 'error');
      return;
    }
    renderWishes(data || []);
    setStatus('Anyone can leave a wish. Messages appear publicly after submission.', 'info');
  }

  const configured = SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('PASTE_') &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes('PASTE_');

  if (!configured) {
    setConfiguredMessage();
    return;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  messageInput.addEventListener('input', () => {
    count.textContent = `${messageInput.value.length} / 500`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (honeypot.value.trim()) return; // Quietly discard bot submissions.

    const name = nameInput.value.trim().replace(/\s+/g, ' ');
    const message = messageInput.value.trim();
    if (name.length < 1 || name.length > 60) {
      setStatus('Please enter a name with 1–60 characters.', 'error');
      nameInput.focus();
      return;
    }
    if (message.length < 2 || message.length > 500) {
      setStatus('Your birthday wish must be 2–500 characters.', 'error');
      messageInput.focus();
      return;
    }

    const lastSubmit = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    const remaining = COOLDOWN_MS - (Date.now() - lastSubmit);
    if (remaining > 0) {
      setStatus(`Please wait ${Math.ceil(remaining / 1000)} seconds before sending another wish.`, 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus('Sending your birthday wish…', 'info');
    const { error } = await supabase.from('birthday_wishes').insert({ name, message });
    submitButton.disabled = false;

    if (error) {
      setStatus(error.message.includes('rate limit') ? error.message : 'Your wish could not be sent. Please try again in a moment.', 'error');
      return;
    }

    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    form.reset();
    count.textContent = '0 / 500';
    setStatus('Your wish has been posted. Thank you for making her day special!', 'success');
    await loadWishes();
  });

  loadWishes();

  // Optional realtime updates. If realtime isn't enabled for this table, normal loading/submission still works.
  supabase.channel('public-birthday-wishes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'birthday_wishes' }, () => loadWishes())
    .subscribe();
})();
