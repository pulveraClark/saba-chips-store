const MIN_FREE_DELIVERY_QUANTITY = 4;

const DELIVERY_FEE_BY_AREA = {
  Liloan: 20,
  Compostela: 30,
  Consolacion: 30,
  Mandaue: 50,
  "Cebu City": 60,
  Talisay: 80,
  Minglanilla: 100,
  Naga: 120,
  Danao: 50,
  Carmen: 80,
  Catmon: 120,
};

const FREE_DELIVERY_AREAS = [
  "Liloan",
  "Compostela",
  "Consolacion",
  "Mandaue",
];

const AREA_ALIASES = {
  "cebu city": "Cebu City",
  "mandaue city": "Mandaue",
  "talisay city": "Talisay",
  "city of naga": "Naga",
  "naga city": "Naga",
  "danao city": "Danao",
};

const normalizeDeliveryArea = (area) => {
  const value = String(area || "").trim();
  if (!value) return "";

  const exactMatch = Object.keys(DELIVERY_FEE_BY_AREA).find(
    (option) => option.toLowerCase() === value.toLowerCase()
  );

  return exactMatch || AREA_ALIASES[value.toLowerCase()] || value;
};

const getDeliveryFee = (area, quantity) => {
  const normalizedArea = normalizeDeliveryArea(area);
  const orderQuantity = Number(quantity) || 0;
  const baseFee = DELIVERY_FEE_BY_AREA[normalizedArea];

  if (baseFee === undefined) {
    return {
      available: false,
      area: normalizedArea,
      fee: null,
      message: "Delivery fee not available for this area yet",
    };
  }

  const isFree =
    FREE_DELIVERY_AREAS.includes(normalizedArea) &&
    orderQuantity >= MIN_FREE_DELIVERY_QUANTITY;

  return {
    available: true,
    area: normalizedArea,
    fee: isFree ? 0 : baseFee,
    message: isFree ? "Free Delivery" : "",
  };
};

module.exports = {
  DELIVERY_FEE_BY_AREA,
  FREE_DELIVERY_AREAS,
  MIN_FREE_DELIVERY_QUANTITY,
  getDeliveryFee,
  normalizeDeliveryArea,
};
