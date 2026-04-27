const assert = require("node:assert/strict");
const test = require("node:test");
const { csrfProtection, getCsrfToken } = require("../middleware/csrfMiddleware");

const createResponse = () => ({
  statusCode: 200,
  body: null,
  json(payload) {
    this.body = payload;
    return this;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
});

test("csrfProtection creates token for safe requests", () => {
  const req = { method: "GET", session: {} };
  let nextCalled = false;

  csrfProtection(req, createResponse(), () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(typeof req.session.csrfToken, "string");
});

test("csrfProtection blocks unsafe requests without matching token", () => {
  const req = {
    method: "POST",
    session: { csrfToken: "expected" },
    get() {
      return "wrong";
    },
  };
  const res = createResponse();
  let nextCalled = false;

  csrfProtection(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("getCsrfToken returns session token", () => {
  const req = { session: {} };
  const res = createResponse();

  getCsrfToken(req, res);

  assert.equal(res.body.csrfToken, req.session.csrfToken);
});
