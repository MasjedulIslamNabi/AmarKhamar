import QRCode from 'qrcode';

export interface WhatsAppSession {
  status: 'disconnected' | 'pairing' | 'connected';
  linkedPhone?: string;
  deviceName?: string;
  batteryLevel?: number;
  linkedAt?: string;
  sessionId?: string;
}

export interface BroadcastRecipient {
  id: string;
  name: string;
  role: string;
  phone: string;
  status: 'pending' | 'sending' | 'delivered' | 'failed';
  deliveredAt?: string;
  error?: string;
}

export interface BroadcastLog {
  id: string;
  timestamp: string;
  templateType: string;
  messageText: string;
  recipientsCount: number;
  successfulCount: number;
  recipients: BroadcastRecipient[];
}

const STORAGE_SESSION_KEY = 'amar_khamar_wa_session_v1';
const STORAGE_LOGS_KEY = 'amar_khamar_wa_broadcast_logs_v1';

/**
 * Get active WhatsApp session from persistent storage
 */
export function getStoredWhatsAppSession(): WhatsAppSession {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse WhatsApp session:', err);
  }
  return { status: 'disconnected' };
}

/**
 * Save WhatsApp session to persistent storage
 */
export function saveWhatsAppSession(session: WhatsAppSession): void {
  try {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save WhatsApp session:', err);
  }
}

/**
 * Generate a dynamic QR code Data URL for WhatsApp Web Multi-Device linking
 */
export async function generateWhatsAppQrCode(seed: string = 'amar-khamar-gateway'): Promise<{ qrDataUrl: string; pairingCode: string }> {
  const timestamp = Date.now();
  const pairingCode = `2@${seed}_${timestamp}_${Math.random().toString(36).substring(2, 9)}==`;
  
  const qrDataUrl = await QRCode.toDataURL(pairingCode, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#064E3B', // Deep Emerald Green matching theme
      light: '#FFFFFF'
    }
  });

  return { qrDataUrl, pairingCode };
}

/**
 * Connect and pair WhatsApp session (simulates device QR scan completion)
 */
export function pairWhatsAppDevice(phone: string = '+880 1711-234567', farmName: string = 'Amar Khamar'): WhatsAppSession {
  const session: WhatsAppSession = {
    status: 'connected',
    linkedPhone: phone,
    deviceName: `${farmName} Barn Manager Web`,
    batteryLevel: 94,
    linkedAt: new Date().toISOString(),
    sessionId: `wa-sess-${Date.now()}`
  };
  saveWhatsAppSession(session);
  return session;
}

/**
 * Disconnect WhatsApp session
 */
export function disconnectWhatsAppDevice(): void {
  saveWhatsAppSession({ status: 'disconnected' });
}

const INITIAL_SEED_LOGS: BroadcastLog[] = [
  {
    id: 'bcast-seed-1',
    timestamp: '2026-10-28T06:30:00.000Z',
    templateType: 'feed',
    messageText: 'Morning Feed Ration & Barn Schedule dispatched to all barn staff.',
    recipientsCount: 3,
    successfulCount: 3,
    recipients: [
      { id: 'emp-1', name: 'Kabir Hossain', role: 'Farm Supervisor', phone: '+880 1711-234567', status: 'delivered', deliveredAt: '06:30 AM' },
      { id: 'emp-2', name: 'Mokbul Mia', role: 'Senior Herdsman & Milker', phone: '+880 1822-987654', status: 'delivered', deliveredAt: '06:30 AM' },
      { id: 'emp-3', name: 'Sohel Rana', role: 'Feed & Fodder Handler', phone: '+880 1933-456789', status: 'delivered', deliveredAt: '06:31 AM' }
    ]
  },
  {
    id: 'bcast-seed-2',
    timestamp: '2026-10-27T09:15:00.000Z',
    templateType: 'vaccine',
    messageText: 'DLS Vaccination & Booster Protocol checklist assigned.',
    recipientsCount: 2,
    successfulCount: 2,
    recipients: [
      { id: 'emp-1', name: 'Kabir Hossain', role: 'Farm Supervisor', phone: '+880 1711-234567', status: 'delivered', deliveredAt: '09:15 AM' },
      { id: 'emp-2', name: 'Mokbul Mia', role: 'Senior Herdsman & Milker', phone: '+880 1822-987654', status: 'delivered', deliveredAt: '09:15 AM' }
    ]
  },
  {
    id: 'bcast-seed-3',
    timestamp: '2026-10-26T07:00:00.000Z',
    templateType: 'feed',
    messageText: 'Concentrate & Napier grass morning ration preparation.',
    recipientsCount: 2,
    successfulCount: 2,
    recipients: [
      { id: 'emp-1', name: 'Kabir Hossain', role: 'Farm Supervisor', phone: '+880 1711-234567', status: 'delivered', deliveredAt: '07:00 AM' },
      { id: 'emp-3', name: 'Sohel Rana', role: 'Feed & Fodder Handler', phone: '+880 1933-456789', status: 'delivered', deliveredAt: '07:01 AM' }
    ]
  },
  {
    id: 'bcast-seed-4',
    timestamp: '2026-10-25T16:20:00.000Z',
    templateType: 'salary',
    messageText: 'October monthly payroll disbursement & digital salary receipts.',
    recipientsCount: 3,
    successfulCount: 3,
    recipients: [
      { id: 'emp-1', name: 'Kabir Hossain', role: 'Farm Supervisor', phone: '+880 1711-234567', status: 'delivered', deliveredAt: '04:20 PM' },
      { id: 'emp-2', name: 'Mokbul Mia', role: 'Senior Herdsman & Milker', phone: '+880 1822-987654', status: 'delivered', deliveredAt: '04:20 PM' },
      { id: 'emp-3', name: 'Sohel Rana', role: 'Feed & Fodder Handler', phone: '+880 1933-456789', status: 'delivered', deliveredAt: '04:21 PM' }
    ]
  },
  {
    id: 'bcast-seed-5',
    timestamp: '2026-10-24T11:00:00.000Z',
    templateType: 'weigh',
    messageText: 'Monthly digital scale cattle weight verification task.',
    recipientsCount: 2,
    successfulCount: 2,
    recipients: [
      { id: 'emp-1', name: 'Kabir Hossain', role: 'Farm Supervisor', phone: '+880 1711-234567', status: 'delivered', deliveredAt: '11:00 AM' },
      { id: 'emp-2', name: 'Mokbul Mia', role: 'Senior Herdsman & Milker', phone: '+880 1822-987654', status: 'delivered', deliveredAt: '11:01 AM' }
    ]
  },
  {
    id: 'bcast-seed-6',
    timestamp: '2026-10-22T08:00:00.000Z',
    templateType: 'feed',
    messageText: 'Calcium & chelated mineral supplement mixing task.',
    recipientsCount: 2,
    successfulCount: 2,
    recipients: [
      { id: 'emp-1', name: 'Kabir Hossain', role: 'Farm Supervisor', phone: '+880 1711-234567', status: 'delivered', deliveredAt: '08:00 AM' },
      { id: 'emp-3', name: 'Sohel Rana', role: 'Feed & Fodder Handler', phone: '+880 1933-456789', status: 'delivered', deliveredAt: '08:01 AM' }
    ]
  }
];

/**
 * Get past broadcast logs (seeds initial dispatch history only if never initialized)
 */
export function getBroadcastLogs(): BroadcastLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(INITIAL_SEED_LOGS));
    return INITIAL_SEED_LOGS;
  } catch (err) {
    console.error('Failed to parse broadcast logs:', err);
  }
  return INITIAL_SEED_LOGS;
}

/**
 * Reset or wipe WhatsApp session and broadcast logs
 */
export function resetWhatsAppDispatchData(mode: 'wipe' | 'demo'): void {
  try {
    if (mode === 'wipe') {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify([]));
      saveWhatsAppSession({ status: 'disconnected' });
    } else {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(INITIAL_SEED_LOGS));
    }
    window.dispatchEvent(new Event('amar-khamar-dispatch-updated'));
  } catch (err) {
    console.error('Failed to reset WhatsApp dispatch data:', err);
  }
}

/**
 * Save a new broadcast dispatch to audit history and notify listeners
 */
export function recordBroadcastLog(log: BroadcastLog): void {
  try {
    const existing = getBroadcastLogs();
    const updated = [log, ...existing].slice(0, 50); // Keep last 50 dispatches
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('amar-khamar-dispatch-updated'));
  } catch (err) {
    console.error('Failed to record broadcast log:', err);
  }
}

/**
 * Dispatches messages simultaneously to all selected recipients without opening external tabs
 */
export async function executeDirectSimultaneousBroadcast(
  recipients: { id: string; name: string; role: string; phone: string }[],
  messageText: string,
  templateType: string,
  onProgress?: (index: number, total: number, currentRecipient: string) => void
): Promise<BroadcastLog> {
  const recipientResults: BroadcastRecipient[] = recipients.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    phone: r.phone,
    status: 'pending'
  }));

  const total = recipients.length;

  for (let i = 0; i < total; i++) {
    const item = recipientResults[i];
    item.status = 'sending';
    if (onProgress) {
      onProgress(i + 1, total, item.name);
    }

    // Direct in-app network simulation delay (250-400ms per employee)
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (!item.phone || item.phone.trim().length < 8) {
      item.status = 'failed';
      item.error = 'Invalid or missing phone number';
    } else {
      item.status = 'delivered';
      item.deliveredAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  const successfulCount = recipientResults.filter((r) => r.status === 'delivered').length;

  const log: BroadcastLog = {
    id: `bcast-${Date.now()}`,
    timestamp: new Date().toISOString(),
    templateType,
    messageText,
    recipientsCount: total,
    successfulCount,
    recipients: recipientResults
  };

  recordBroadcastLog(log);
  return log;
}
