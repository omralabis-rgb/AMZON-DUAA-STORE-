const DEFAULT_NUMBER = "+967777627595";

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function getWhatsAppNumber() {
  return process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER || DEFAULT_NUMBER;
}

export function buildWhatsAppUrl(message: string) {
  const number = normalizeWhatsAppNumber(getWhatsAppNumber());
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
