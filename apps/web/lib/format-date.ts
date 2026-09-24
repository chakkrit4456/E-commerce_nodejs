/** จัดรูปแบบวันที่/เวลาเป็นภาษาไทย (พ.ศ.) ตามเขตเวลาไทยเสมอ ไม่ว่าจะรันบนเซิร์ฟเวอร์โซนเวลาไหน */
export function formatThaiDateTime(input: string | number | Date): string {
  const d = new Date(input);
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function formatThaiDate(input: string | number | Date): string {
  const d = new Date(input);
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    dateStyle: 'medium',
  }).format(d);
}
