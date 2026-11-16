// Email OTP gagal terkirim (mis. API key/SMTP bermasalah): BE membalas 503 + code 'email_send_failed'.
// Ini bukan server rusak, jadi ditampilkan sebagai peringatan (kuning), bukan galat (merah).
export const isMailFailed = (err) => err?.response?.data?.code === 'email_send_failed';
