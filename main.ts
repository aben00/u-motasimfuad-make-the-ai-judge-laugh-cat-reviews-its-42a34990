// Make the AI Judge Laugh: Cat Reviews Its Human — make.fun entry
// Writes one funny single-line one-star review, written by a house cat
// about its human, under 200 characters. Deterministic: same bytes on
// every run.

const fs = require("node:fs");
const path = require("node:path");

const ENTRY =
  "One star. He closes the bedroom door at night, then acts shocked when I scream through it at 3 a.m. The door is my enemy. He is its accomplice.";

const OUTPUT_PATH = process.env.OUTPUT_PATH || "/output/entry.txt";
const MAX_CHARS = 200;

// The review keeps the deadpan shape of a real one-star review: it opens
// with the rating, then the complaint.
const REVIEW_PREFIX = "One star.";

// Find the first control character in the text, if any, so the gate can
// name the exact offender instead of failing on the whole line at once.
function findControlChar(text) {
  for (const ch of Array.from(text)) {
    const code = ch.codePointAt(0);
    if (code < 0x20 || code === 0x7f) {
      return { ch, code };
    }
  }
  return null;
}

// Prove the line survives a UTF-8 encode/decode round-trip unchanged.
function isStableUtf8(text) {
  const roundTrip = new TextDecoder("utf-8", { fatal: true }).decode(
    new TextEncoder().encode(text),
  );
  return roundTrip === text;
}

// The gate, as a validator that collects every violation instead of
// failing on the first one, so a bad line reports all of its problems.
// Counts code points, not UTF-16 units, so the 200-character gate holds
// for any Unicode the line might carry.
function checkGate(text) {
  const violations = [];
  if (typeof text !== "string") {
    return ["entry is not a string"];
  }
  const chars = Array.from(text);
  if (chars.length < 1 || chars.length > MAX_CHARS) {
    violations.push(
      `entry is ${chars.length} characters, must be 1-${MAX_CHARS}`,
    );
  }
  if (text.trim().length === 0) {
    violations.push("entry is only whitespace");
  }
  if (text !== text.trim()) {
    violations.push("entry must not start or end with whitespace");
  }
  if (!text.startsWith(REVIEW_PREFIX)) {
    violations.push(
      `entry must open with the one-star review shape (${JSON.stringify(REVIEW_PREFIX)})`,
    );
  }
  const bad = findControlChar(text);
  if (bad !== null) {
    violations.push(
      `entry must not contain control characters (U+${bad.code.toString(16).padStart(4, "0")})`,
    );
  }
  if (text.includes("\n") || text.includes("\r")) {
    violations.push("entry must be a single line");
  }
  if (!isStableUtf8(text)) {
    violations.push("entry is not stable UTF-8 text");
  }
  return violations;
}

function selfCheck(text) {
  const violations = checkGate(text);
  if (violations.length > 0) {
    throw new Error(`gate failed: ${violations.join("; ")}`);
  }
  return true;
}

function main() {
  selfCheck(ENTRY);
  const dir = path.dirname(OUTPUT_PATH);
  fs.mkdirSync(dir, { recursive: true });
  // Write exactly the line, no trailing newline, so the file holds
  // byte-for-byte the single review and nothing else.
  fs.writeFileSync(OUTPUT_PATH, ENTRY, "utf8");
  const back = fs.readFileSync(OUTPUT_PATH, "utf8");
  if (back !== ENTRY) {
    throw new Error("read-back mismatch: file does not equal entry");
  }
  if (Buffer.byteLength(back, "utf8") !== Buffer.byteLength(ENTRY, "utf8")) {
    throw new Error("read-back byte length mismatch");
  }
  selfCheck(back);
  console.log(`Wrote ${OUTPUT_PATH} (${Array.from(ENTRY).length} chars):`);
  console.log(back);
}

main();
