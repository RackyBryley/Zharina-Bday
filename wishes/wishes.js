import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

/* Send a birthday wish. It shows up on the Birthday Wishes Wall (index.html, last slide). */
(async () => {
  const form = document.getElementById('wish-form');
  if (!form) return;

  const nameInput = document.getElementById('wish-name');
  const messageInput = document.getElementById('wish-message');
  const honeypot = document.getElementById('wish-website');
  const submitButton = document.getElementById('wish-submit');
  const status = document.getElementById('wish-status');
  const count = document.getElementById('wish-count');
  const COOLDOWN_MS = 30_000;
  const COOLDOWN_KEY = 'zharina-wish-last-submit';

  function setStatus(message, state = 'info') {
    status.textContent = message;
    status.dataset.state = state;
  }

  messageInput.addEventListener('input', () => {
    count.textContent = `${messageInput.value.length} / 500`;
  });

  const configured = SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('PASTE_') &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes('PASTE_');

  if (!configured) {
    setStatus('Setup needed: add your Supabase project URL and public key in supabase-config.js, then run supabase-setup.sql.', 'error');
    submitButton.disabled = true;
    return;
  }

  let supabase = null;
  async function connect() {
    if (supabase) return supabase;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return supabase;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (honeypot.value.trim()) return; // quietly discard bot submissions

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
    try {
      const client = await connect();
      const { error } = await client.from('birthday_wishes').insert({ name, message });
      if (error) throw error;
    } catch (err) {
      console.error('Could not send wish:', err);
      submitButton.disabled = false;
      setStatus('Your wish could not be sent. Please check your connection and try again.', 'error');
      return;
    }

    submitButton.disabled = false;
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    form.reset();
    count.textContent = '0 / 500';
    setStatus('Your wish has been sent. Thank you for making her day special! You can close this page now.', 'success');
  });
})();
