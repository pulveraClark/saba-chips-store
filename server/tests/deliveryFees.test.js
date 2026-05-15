const test = require("node:test");
const assert = require("node:assert/strict");
const { getDeliveryFee } = require("../utils/deliveryFees");

test("free delivery applies to qualified nearby areas with at least four packs", () => {
  assert.equal(getDeliveryFee("Liloan", 4).fee, 0);
  assert.equal(getDeliveryFee("Compostela", 5).fee, 0);
  assert.equal(getDeliveryFee("Consolacion", 4).fee, 0);
  assert.equal(getDeliveryFee("Mandaue", 10).fee, 0);
});

test("nearby areas use base fees below four packs", () => {
  assert.equal(getDeliveryFee("Liloan", 3).fee, 20);
  assert.equal(getDeliveryFee("Compostela", 1).fee, 30);
  assert.equal(getDeliveryFee("Consolacion", 2).fee, 30);
  assert.equal(getDeliveryFee("Mandaue", 3).fee, 50);
});

test("listed Cebu areas always use their delivery fee", () => {
  assert.equal(getDeliveryFee("Cebu City", 4).fee, 60);
  assert.equal(getDeliveryFee("Talisay", 10).fee, 80);
  assert.equal(getDeliveryFee("Minglanilla", 1).fee, 100);
  assert.equal(getDeliveryFee("Naga", 4).fee, 120);
  assert.equal(getDeliveryFee("Danao", 4).fee, 50);
  assert.equal(getDeliveryFee("Carmen", 4).fee, 80);
  assert.equal(getDeliveryFee("Catmon", 4).fee, 120);
});

test("unlisted delivery areas are unavailable", () => {
  const quote = getDeliveryFee("Other Cebu area", 4);

  assert.equal(quote.available, false);
  assert.equal(quote.fee, null);
  assert.equal(quote.message, "Delivery fee not available for this area yet");
});
