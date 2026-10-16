/* Birthday Wishes Wall: reads wishes from Supabase and refreshes live. */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const wall = document.getElementById('birthday-wishes-wall');
const counter = document.getElementById('wall-wish-count');

function say(text) {
  wall.replaceChildren();
  const p = document.createElement('p');
  p.className = 'wish-empty';
  p.textContent = text;
  wall.append(p);
}

async function start() {
  const configured =
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('PASTE_') &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes('PASTE_');

  if (!configured) {
    say('Wishes from friends and colleagues will appear here.');
    counter.textContent = '';
    console.warn('Supabase is not configured yet. See README.md.');
    return;
  }

  let createClient;
  try {
    ({ createClient } = await import('https://esm.sh/@supabase/supabase-js@2'));
  } catch (err) {
    say('Birthday wishes are temporarily unavailable.');
    counter.textContent = '';
    console.error('Could not load Supabase:', err);
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
  const nodes = new Map();      // wish id -> its note element (kept, never rebuilt)
  let firstLoad = true;
  let loading = false;
  let again = false;
  let timer = null;

  function buildNote(wish, isNew) {
    const note = document.createElement('article');
    // Style variant comes from the wish id, so a note never changes look when others arrive.
    note.className = `wish-note wish-note-${(Number(wish.id) % 4) + 1}`;
    if (isNew) note.classList.add('wish-new');

    const tape = document.createElement('span');
    tape.className = 'wish-note-tape';
    tape.setAttribute('aria-hidden', 'true');

    const name = document.createElement('h4');
    name.className = 'wish-card-name';
    name.textContent = wish.name;

    const message = document.createElement('p');
    message.className = 'wish-card-message';
    message.textContent = wish.message;

    const date = document.createElement('time');
    date.className = 'wish-card-date';
    date.dateTime = wish.created_at;
    const parsed = new Date(wish.created_at);
    date.textContent = Number.isNaN(parsed.getTime()) ? '' : dateFormatter.format(parsed);

    note.append(tape, name, message, date);
    return note;
  }

  function render(wishes) {
    counter.textContent =
      `${wishes.length}${wishes.length === 50 ? '+' : ''} ${wishes.length === 1 ? 'wish' : 'wishes'}`;

    if (wishes.length === 0) {
      say('Be the first to leave Ma’am Zharina a birthday wish!');
      nodes.clear();
      return;
    }

    // Drop the "loading / empty" placeholder, and any notes no longer in the list.
    wall.querySelectorAll('.wish-empty').forEach((el) => el.remove());
    const ids = new Set(wishes.map((w) => String(w.id)));
    for (const [id, el] of nodes) {
      if (!ids.has(id)) { el.remove(); nodes.delete(id); }
    }

    // Add only the new notes; existing ones stay exactly where they are.
    wishes.forEach((wish, i) => {
      const id = String(wish.id);
      let el = nodes.get(id);
      if (!el) {
        el = buildNote(wish, !firstLoad);
        nodes.set(id, el);
      }
      if (wall.children[i] !== el) wall.insertBefore(el, wall.children[i] || null);
    });
  }

  async function loadWallWishes() {
    if (loading) { again = true; return; }
    loading = true;
    try {
      const { data, error } = await supabase
        .from('birthday_wishes')
        .select('id, name, message, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (firstLoad) say('Birthday wishes are temporarily unavailable.');
        console.error('Could not load birthday wishes:', error.message);
        return;
      }
      render(data || []);
      firstLoad = false;
    } finally {
      loading = false;
      if (again) { again = false; scheduleLoad(); }
    }
  }

  // Many people may post at once: wait a moment and refresh once instead of once per message.
  function scheduleLoad() {
    clearTimeout(timer);
    timer = setTimeout(loadWallWishes, 600);
  }

  loadWallWishes();

  // Live updates (needs Realtime enabled for the table; see supabase-setup.sql).
  supabase
    .channel('birthday-wall-updates')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'birthday_wishes' }, () => scheduleLoad())
    .subscribe();

  // Safety net: also refresh every 30 seconds while the page is open and visible.
  setInterval(() => { if (!document.hidden) loadWallWishes(); }, 30000);
}

if (wall && counter) start();
