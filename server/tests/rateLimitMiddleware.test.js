const assert = require("node:assert/strict");
const test = require("node:test");
const rateLimit = require("../middleware/rateLimitMiddleware");

const createResponse = () => {
  const headers = {};
  return {
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    headers,
  };
};

test("rateLimit allows requests under limit and blocks after limit", () => {
  rateLimit._clear();
  const middleware = rateLimit({ name: "unit", windowMs: 60_000, max: 2 });
  const req = { ip: "127.0.0.1", session: { userId: 1 }, socket: {} };
  let nextCalls = 0;

  middleware(req, createResponse(), () => {
    nextCalls += 1;
  });
  middleware(req, createResponse(), () => {
    nextCalls += 1;
  });

  const blocked = createResponse();
  middleware(req, blocked, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 2);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.message, "Too many requests. Please try again shortly.");
});
