// Gemini resume screening: score derivation, clamping and model fallback, with the
// Gemini SDK mocked (no network calls).
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({ generateContent: mockGenerateContent }));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(() => ({ getGenerativeModel: mockGetGenerativeModel })),
  SchemaType: { OBJECT: "object", ARRAY: "array", STRING: "string", INTEGER: "integer" },
}));

const { analyzeWithGemini, isGeminiConfigured } = require("../services/geminiScreening");
const { analyzeResume } = require("../services/aiService");

const job = {
  title: "MERN Developer",
  description: "React and Node",
  requiredSkills: ["React", "Node.js"],
  eligibility: { cgpa: 6, branches: ["CSE"] },
  atsThreshold: 60,
};
const student = { name: "Asha", email: "asha@example.com", branch: "CSE", year: 4, cgpa: 8, skills: ["React"] };

const modelReply = (obj) => ({ response: { text: () => JSON.stringify(obj) } });
const fullReply = (overrides = {}) => ({
  skillScore: 30,
  projectScore: 15,
  experienceScore: 5,
  educationScore: 8,
  certificationScore: 2,
  resumeQualityScore: 7,
  matchedSkills: ["React"],
  missingSkills: ["Node.js"],
  strengths: ["Frontend"],
  weaknesses: ["No backend"],
  recommendedLearning: ["Node.js"],
  candidateFeedback: "Good frontend base; learn Node.js.",
  recruiterSummary: "Solid React, no backend.",
  experienceMatch: "Some projects.",
  educationMatch: "CGPA above minimum.",
  reason: "Evidence of React projects.",
  ...overrides,
});

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_MODEL;
  delete process.env.GEMINI_FALLBACK_MODEL;
  delete process.env.OLLAMA_URL;
  mockGenerateContent.mockReset();
  mockGetGenerativeModel.mockClear();
});

afterAll(() => {
  process.env.GEMINI_API_KEY = "";
});

test("total score is computed on the server from the component scores", async () => {
  mockGenerateContent.mockResolvedValueOnce(modelReply(fullReply()));
  const r = await analyzeWithGemini(student, job, "");
  expect(r.atsScore).toBe(67);
  expect(r.recommendation).toBe("Consider");
  expect(r.status).toBe("Borderline");
  expect(r.aiProvider).toBe("gemini:gemini-flash-latest");
});

test("out-of-range component scores are clamped (a resume cannot buy a perfect score)", async () => {
  mockGenerateContent.mockResolvedValueOnce(
    modelReply(fullReply({ skillScore: 999, projectScore: -5, experienceScore: "abc", atsScore: 100 })),
  );
  const r = await analyzeWithGemini(student, job, "");
  expect(r.skillScore).toBe(40);
  expect(r.projectScore).toBe(0);
  expect(r.experienceScore).toBe(0);
  expect(r.atsScore).toBe(40 + 0 + 0 + 8 + 2 + 7);
});

test("falls back to the lighter model when the main model fails", async () => {
  mockGenerateContent
    .mockRejectedValueOnce(new Error("503 high demand"))
    .mockResolvedValueOnce(modelReply(fullReply()));
  const r = await analyzeWithGemini(student, job, "");
  expect(r.aiProvider).toBe("gemini:gemini-flash-lite-latest");
  expect(mockGetGenerativeModel.mock.calls.map((c) => c[0].model)).toEqual(["gemini-flash-latest", "gemini-flash-lite-latest"]);
});

test("the student's name and email are not sent to the model", async () => {
  mockGenerateContent.mockResolvedValueOnce(modelReply(fullReply()));
  await analyzeWithGemini(student, job, "");
  const prompt = mockGenerateContent.mock.calls[0][0];
  expect(prompt).not.toContain("Asha");
  expect(prompt).not.toContain("asha@example.com");
});

test("analyzeResume uses the rules engine when every AI engine fails", async () => {
  mockGenerateContent.mockRejectedValue(new Error("network down"));
  const r = await analyzeResume(student, job);
  expect(r.aiProvider).toBe("rules");
  expect(typeof r.atsScore).toBe("number");
});

test("Gemini is skipped entirely when no API key is configured", async () => {
  process.env.GEMINI_API_KEY = "";
  expect(isGeminiConfigured()).toBe(false);
  const r = await analyzeResume(student, job);
  expect(r.aiProvider).toBe("rules");
  expect(mockGenerateContent).not.toHaveBeenCalled();
});
