// Browser notification helper for loan reminders
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

export function notify(title: string, body: string, tag?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag, icon: "/icon-192.png", badge: "/icon-192.png" });
  } catch {
    // ignore
  }
}

const SHOWN_KEY = "mmp_notif_shown";
const getShown = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(SHOWN_KEY) || "{}"); } catch { return {}; }
};
const setShown = (v: Record<string, string>) => localStorage.setItem(SHOWN_KEY, JSON.stringify(v));

export function checkLoanReminders(loans: any[]) {
  if (Notification.permission !== "granted") return;
  const today = new Date();
  const shown = getShown();
  const todayKey = today.toISOString().slice(0, 10);

  loans.forEach((loan) => {
    if (!loan.active) return;
    const dueDay: number = loan.due_day || 1;
    const reminderDays: number[] = loan.reminder_days || [3, 1, 0];
    const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
    const daysUntil = Math.round((dueThisMonth.getTime() - today.getTime()) / 86400000);

    if (reminderDays.includes(daysUntil)) {
      const notifKey = `${loan.id}-${todayKey}-${daysUntil}`;
      if (!shown[notifKey]) {
        const when = daysUntil === 0 ? "today" : daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;
        notify(`Loan due ${when}`, `${loan.name}: ${loan.monthly_amount}`, notifKey);
        shown[notifKey] = todayKey;
      }
    }
  });
  // Cleanup old entries
  Object.keys(shown).forEach((k) => { if (!k.includes(todayKey)) delete shown[k]; });
  setShown(shown);
}
