/* eslint-disable no-undef */
// Runs before every test file (jest `setupFiles`), before any app module is required.
//
// Every variable the backend reads is assigned explicitly here, so even if something
// called dotenv it could not inject values from backend/.env (dotenv never overrides
// variables that are already set). Tests must never touch the production database.

const BASE_URI = process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017";
const dbName = `placementconnect_test_${process.pid}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const testUri = `${BASE_URI.replace(/\/+$/, "")}/${dbName}`;

// ---- Hard guard: local MongoDB and a database name containing "test" only ----
const assertTestDatabase = (uri) => {
  const match = /^mongodb:\/\/(?:[^@/]*@)?([^/?]+)\/([^?]+)/.exec(uri);
  const hosts = match ? match[1].split(",").map((h) => h.replace(/:\d+$/, "").toLowerCase()) : [];
  const name = match ? decodeURIComponent(match[2]) : "";
  const local = hosts.length > 0 && hosts.every((h) => ["127.0.0.1", "localhost", "::1", "[::1]"].includes(h));
  if (!local || !name.toLowerCase().includes("test")) {
    throw new Error(
      "Refusing to run tests: the Mongo URI must point at localhost/127.0.0.1 and the database name must contain 'test'.",
    );
  }
};
assertTestDatabase(testUri);

Object.assign(process.env, {
  NODE_ENV: "test",
  MONGO_URI: testUri,
  mongoURI: testUri,
  JWT_SECRET: "test-jwt-secret-not-for-production",
  JWT_EXPIRE: "1h",
  PORT: "0",
  TRUST_PROXY: "0",
  CLIENT_URL: "http://localhost:5173,https://app.example.test",
  FRONTEND_URL: "",
  // Cloudinary (module is mocked below; values are dummies)
  cloud_name: "test",
  api_key: "test",
  api_secret: "test",
  CLOUDINARY_CLOUD_NAME: "test",
  CLOUDINARY_API_KEY: "test",
  CLOUDINARY_API_SECRET: "test",
  // SMTP (nodemailer is mocked below; nothing is ever sent)
  SMTP_HOST: "smtp.test.invalid",
  SMTP_PORT: "587",
  SMTP_USER: "mailer@test.invalid",
  SMTP_PASS: "test",
  SMTP_SECURE: "false",
  MAIL_FROM: '"PlacementConnect Test" <mailer@test.invalid>',
  GEMINI_API_KEY: "",
  RATE_LIMIT_IN_TESTS: "false",
});

global.__assertTestDatabase = assertTestDatabase;

// ---- Never send real email ----
const mockSendMail = jest.fn().mockResolvedValue({ messageId: "test-message-id" });
global.__mockSendMail = mockSendMail;
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: (...args) => global.__mockSendMail(...args) })),
}));

// ---- Never call Cloudinary ----
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload: jest.fn(), destroy: jest.fn() },
  },
}));

jest.mock("multer-storage-cloudinary", () => ({
  CloudinaryStorage: class {
    constructor(opts) {
      this.opts = opts;
    }

    _handleFile(req, file, cb) {
      let size = 0;
      file.stream.on("data", (chunk) => {
        size += chunk.length;
      });
      file.stream.on("error", cb);
      file.stream.on("end", () =>
        cb(null, { path: `https://res.cloudinary.test/placementconnect/${file.originalname}`, size }),
      );
    }

    _removeFile(req, file, cb) {
      cb(null);
    }
  },
}));
