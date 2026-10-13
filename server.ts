import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLOT_ITEMS: string[] = [
  '2',
  '3A', '3B',
  '4A', '4B',
  '5A', '5B',
  '6A', '6B',
  '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25',
  '26A', '26B',
  '27', '28', '29',
  '30A', '30B',
  '31A', '31B',
  '32A', '32B',
  '33A', '33B',
  '34',
  '35A', '35B',
  '36A', '36B',
  '37A', '37B',
  '38A', '38B',
  '39A', '39B',
  '40A', '40B',
  '41',
  '42',
  '43',
  'Herbs',
  'Apple Tree Area',
  'Flowers'
];

interface ItemState {
  id: string;
  checked: boolean;
  checkedAt?: string | null;
  checkedBy?: string | null;
  watered: boolean;
  wateredAt?: string | null;
  wateredBy?: string | null;
}

interface AppState {
  available: boolean;
  activeVolunteerPlot?: string | null;
  items: Record<string, ItemState>;
  leaderPin: string;
  title: string;
  lastUpdated: string;
  lastNightlyReset?: string | null;
  lastNightlyResetDateKey?: string | null;
  notice?: string;
}

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');

function getDefaultState(): AppState {
  const items: Record<string, ItemState> = {};
  for (const id of PLOT_ITEMS) {
    items[id] = {
      id,
      checked: false,
      checkedAt: null,
      checkedBy: null,
      watered: false,
      wateredAt: null,
      wateredBy: null,
    };
  }
  return {
    available: false, // Default setting for AVAILABLE is OFF
    activeVolunteerPlot: null,
    items,
    leaderPin: '1234',
    title: 'Plot & Plant Watering Checklist',
    lastUpdated: new Date().toISOString(),
    lastNightlyReset: null,
    lastNightlyResetDateKey: null,
    notice: 'Welcome! Request plots to water or check watered status.',
  };
}

let state: AppState = getDefaultState();

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const existingItems = parsed.items || {};

    // Map old names to new names if present in previous save
    const migrations: Record<string, string> = {
      'A-A': '39A',
      'A-B': '39B',
      'B-A': '40A',
      'B-B': '40B',
      'E': '41',
      'C': '42',
      'D': '43',
      'Public Herb Plot': 'Herbs',
    };
    for (const [oldKey, newKey] of Object.entries(migrations)) {
      if (existingItems[oldKey] && !existingItems[newKey]) {
        existingItems[newKey] = { ...existingItems[oldKey], id: newKey };
      }
    }

    const mergedItems: Record<string, ItemState> = {};
    for (const id of PLOT_ITEMS) {
      mergedItems[id] = existingItems[id] || {
        id,
        checked: false,
        checkedAt: null,
        checkedBy: null,
        watered: false,
        wateredAt: null,
        wateredBy: null,
      };
    }
    state = {
      ...getDefaultState(),
      ...parsed,
      items: mergedItems,
    };
    // Cleanly persist sanitized state to disk without obsolete keys
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Failed to load state from disk, using default state:', err);
}

function saveState() {
  state.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save state to disk:', err);
  }
  broadcastState();
}

// SSE Clients for live real-time sync
type SSEResponse = express.Response;
const sseClients = new Set<SSEResponse>();

function broadcastState() {
  const publicState = getPublicState();
  const payload = `data: ${JSON.stringify(publicState)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function getPublicState() {
  const { leaderPin: _, ...publicData } = state;
  return publicData;
}

// Pacific Time (PST/PDT) utilities
function getPacificTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
    dateKey: `${map.year}-${map.month}-${map.day}`,
    isoPst: `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}`,
  };
}

function resetAllWateredPlots(reason: string = 'Nightly 10 PM PST reset') {
  const now = new Date().toISOString();
  let count = 0;
  for (const id of PLOT_ITEMS) {
    if (!state.items[id]) continue;
    if (state.items[id].watered) {
      count++;
    }
    state.items[id].watered = false;
    state.items[id].wateredAt = null;
    state.items[id].wateredBy = null;
    // Reset user check-offs as well so plots can be selected fresh the next day
    state.items[id].checked = false;
    state.items[id].checkedAt = null;
    state.items[id].checkedBy = null;
  }
  const pac = getPacificTime();
  state.lastNightlyReset = now;
  state.lastNightlyResetDateKey = pac.dateKey;
  saveState();
  console.log(`[Nightly Reset] Successfully reset ${count} watered plots at ${now} (${reason})`);
  return count;
}

function checkNightlyReset() {
  const pac = getPacificTime();
  // 10 PM in 24-hr format is hour 22
  if (pac.hour === 22 && pac.minute === 0) {
    if (state.lastNightlyResetDateKey !== pac.dateKey) {
      console.log(`[Nightly Reset] Auto-running scheduled 10 PM PST reset for date ${pac.dateKey}`);
      resetAllWateredPlots(`Scheduled 10 PM PST nightly reset (${pac.dateKey})`);
    }
  }
}

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/state', (_req, res) => {
    res.json(getPublicState());
  });

  // SSE Stream
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial state
    res.write(`data: ${JSON.stringify(getPublicState())}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Keep-alive heartbeat every 20 seconds
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': heartbeat\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 20000);

  // Nightly 10 PM PST reset checker (runs every 30 seconds)
  setInterval(() => {
    checkNightlyReset();
  }, 30000);

  // Leader verification
  app.post('/api/verify-leader', (req, res) => {
    const { pin } = req.body;
    if (pin === state.leaderPin || pin === 'garden' || pin === 'leader') {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid leader passcode' });
    }
  });

  // Toggle AVAILABLE (Water Volunteer only, requires choosing their plot before turning ON)
  app.post('/api/toggle-available', (req, res) => {
    const { available, volunteerPlot } = req.body;
    const targetVal = typeof available === 'boolean' ? available : !state.available;

    if (targetVal) {
      const chosenPlot = volunteerPlot || state.activeVolunteerPlot;
      if (!chosenPlot || !PLOT_ITEMS.includes(chosenPlot)) {
        res.status(400).json({
          success: false,
          error: 'Water Volunteer must choose their plot from the dropdown list before turning AVAILABLE on.',
        });
        return;
      }
      state.activeVolunteerPlot = chosenPlot;
      state.available = true;
    } else {
      state.available = false;
      state.activeVolunteerPlot = null;
    }

    saveState();
    res.json({
      success: true,
      available: state.available,
      activeVolunteerPlot: state.activeVolunteerPlot,
    });
  });

  // Check / Uncheck Item (Users & Volunteers when AVAILABLE is on, or Leader anytime)
  app.post('/api/items/check', (req, res) => {
    const { id, checked, checkedBy, isLeader } = req.body;

    // If available is OFF and not leader, reject check
    if (!state.available && !isLeader) {
      res.status(403).json({
        success: false,
        error: 'Plot sign-up is currently unavailable. The leader has set AVAILABLE to OFF.',
      });
      return;
    }

    if (!PLOT_ITEMS.includes(id) || !state.items[id]) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    state.items[id].checked = Boolean(checked);
    state.items[id].checkedAt = checked ? new Date().toISOString() : null;
    state.items[id].checkedBy = checked ? (checkedBy || 'Volunteer') : null;

    saveState();
    res.json({ success: true, item: state.items[id] });
  });

  // Bulk Check Items
  app.post('/api/items/bulk-check', (req, res) => {
    const { items, isLeader, checkedBy } = req.body;
    if (!state.available && !isLeader) {
      res.status(403).json({
        success: false,
        error: 'Plot sign-up is currently unavailable. The leader has set AVAILABLE to OFF.',
      });
      return;
    }

    if (Array.isArray(items)) {
      const now = new Date().toISOString();
      for (const item of items) {
        if (PLOT_ITEMS.includes(item?.id) && state.items[item.id]) {
          state.items[item.id].checked = Boolean(item.checked);
          state.items[item.id].checkedAt = item.checked ? now : null;
          state.items[item.id].checkedBy = item.checked ? (checkedBy || 'Volunteer') : null;
        }
      }
      saveState();
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Invalid items array' });
    }
  });

  // Water Volunteer: Mark Item Watered / Unwatered
  app.post('/api/items/water', (req, res) => {
    const { id, watered, wateredBy, volunteerPlot } = req.body;
    if (!PLOT_ITEMS.includes(id) || !state.items[id]) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    const plotNum = volunteerPlot || state.activeVolunteerPlot;
    const defaultWateredBy = plotNum ? `Plot ${plotNum}` : 'Water Volunteer';
    const finalWateredBy = wateredBy || defaultWateredBy;

    state.items[id].watered = Boolean(watered);
    state.items[id].wateredAt = watered ? new Date().toISOString() : null;
    state.items[id].wateredBy = watered ? finalWateredBy : null;

    saveState();
    res.json({ success: true, item: state.items[id] });
  });

  // Water Volunteer: Mark All Checked Items Watered
  app.post('/api/items/water-all-checked', (req, res) => {
    const { wateredBy, volunteerPlot } = req.body || {};
    const plotNum = volunteerPlot || state.activeVolunteerPlot;
    const defaultWateredBy = plotNum ? `Plot ${plotNum}` : 'Water Volunteer';
    const finalWateredBy = wateredBy || defaultWateredBy;

    const now = new Date().toISOString();
    let count = 0;
    for (const id of PLOT_ITEMS) {
      if (state.items[id]?.checked && !state.items[id]?.watered) {
        state.items[id].watered = true;
        state.items[id].wateredAt = now;
        state.items[id].wateredBy = finalWateredBy;
        count++;
      }
    }
    saveState();
    res.json({ success: true, updatedCount: count, wateredBy: finalWateredBy });
  });

  // Leader: Reset Actions
  app.post('/api/reset', (req, res) => {
    const { type } = req.body; // 'checked', 'watered', 'all'
    for (const id of PLOT_ITEMS) {
      if (!state.items[id]) continue;
      if (type === 'checked' || type === 'all') {
        state.items[id].checked = false;
        state.items[id].checkedAt = null;
        state.items[id].checkedBy = null;
      }
      if (type === 'watered' || type === 'all') {
        state.items[id].watered = false;
        state.items[id].wateredAt = null;
        state.items[id].wateredBy = null;
      }
    }
    saveState();
    res.json({ success: true, message: `Reset completed: ${type}` });
  });

  // Leader / System: Trigger 10 PM PST Nightly Reset
  app.post('/api/trigger-nightly-reset', (_req, res) => {
    const count = resetAllWateredPlots('Manual/Leader trigger for 10 PM PST reset');
    res.json({ success: true, resetCount: count, lastNightlyReset: state.lastNightlyReset });
  });

  // Leader: Update Notice / Announcement
  app.post('/api/notice', (req, res) => {
    const { notice } = req.body;
    state.notice = notice || '';
    saveState();
    res.json({ success: true, notice: state.notice });
  });

  // Vite middleware in dev or static serve in prod
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(__dirname, 'dist');

  if (isProd && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
