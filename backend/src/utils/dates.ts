const IST_OFFSET = '+05:30';
/** date 'YYYY-MM-DD', time 'HH:mm' | 'HH:mm:ss' -> absolute instant, independent of host timezone */
export const eventStart = (date: string, time: string) => new Date(`${date}T${time.slice(0, 5)}:00${IST_OFFSET}`);
export const hasStarted = (e: { date: string; start_time: string }) => eventStart(e.date, e.start_time).getTime() <= Date.now();
export const hoursUntilStart = (e: { date: string; start_time: string }) => (eventStart(e.date, e.start_time).getTime() - Date.now()) / 3_600_000;
export const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
