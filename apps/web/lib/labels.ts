export const DELIVERY_STATUS_TH: Record<string, string> = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  picked_up: 'รับพัสดุแล้ว',
  on_the_way: 'กำลังจัดส่ง',
  delivered: 'จัดส่งสำเร็จ',
  cancelled: 'ยกเลิก',
};

export const PAYMENT_STATUS_TH: Record<string, string> = {
  unpaid: 'ยังไม่ชำระเงิน',
  paid: 'ชำระเงินแล้ว',
  refunded: 'คืนเงินแล้ว',
  partially_refunded: 'คืนเงินบางส่วน',
};

export const PAYMENT_TYPE_TH: Record<string, string> = {
  cod: 'เก็บเงินปลายทาง',
  promptpay: 'พร้อมเพย์ (QR Code)',
  bank_transfer: 'โอนผ่านบัญชีธนาคาร',
  card: 'บัตรเครดิต/เดบิต',
  truemoney: 'TrueMoney Wallet',
  mobile_banking: 'Mobile Banking',
};

export const deliveryLabel = (s: string): string => DELIVERY_STATUS_TH[s] ?? s.replace('_', ' ');
export const paymentLabel = (s: string): string => PAYMENT_STATUS_TH[s] ?? s.replace('_', ' ');
export const paymentTypeLabel = (s: string): string => PAYMENT_TYPE_TH[s] ?? s.replace('_', ' ');
