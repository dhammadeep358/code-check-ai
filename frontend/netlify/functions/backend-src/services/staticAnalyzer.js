/**
 * Deterministic, text-based static security/quality scanner.
 * IMPORTANT: This module NEVER executes the source code it scans.
 * It only reads it as plain text using regular expressions.
 */

function lineOf(text, index) {
  if (index < 0) return null;
  return text.slice(0, index).split('\n').length;
}

function findAllMatches(code, regex, build) {
  const results = [];
  let match;
  const re = new RegExp(regex, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((match = re.exec(code)) !== null) {
    results.push(build(match, lineOf(code, match.index)));
    if (re.lastIndex === match.index) re.lastIndex++; // avoid infinite loop on zero-length matches
  }
  return results;
}

const RULES = [
  {
    id: 'hardcoded-secret',
    title: 'Hardcoded secret / credential',
    severity: 'HIGH',
    category: 'Security',
    regex: /(password|passwd|pwd|api[_-]?key|secret|token)\s*[:=]\s*["'][^"'\s]{4,}["']/gi,
    explanation: 'A credential or secret value appears to be hardcoded directly in source code.',
    recommendation: 'Move secrets to environment variables or a secrets manager and remove them from source control.',
    suggestedFix: 'Replace with process.env.SECRET_NAME (or equivalent) and load it from a .env file that is git-ignored.',
  },
  {
    id: 'dangerous-eval',
    title: 'Use of eval()',
    severity: 'HIGH',
    category: 'Security',
    regex: /\beval\s*\(/g,
    explanation: 'eval() executes arbitrary strings as code, which can lead to remote code execution if input is attacker-controlled.',
    recommendation: 'Avoid eval(). Use safer alternatives such as JSON.parse for data or explicit function dispatch.',
    suggestedFix: 'Replace eval(userInput) with a validated, whitelisted operation instead of dynamic code execution.',
  },
  {
    id: 'command-execution',
    title: 'Potential OS command execution',
    severity: 'HIGH',
    category: 'Security',
    regex: /\b(child_process|exec|execSync|spawn|os\.system|subprocess\.(call|run|Popen))\s*\(/g,
    explanation: 'Executing shell commands, especially with unsanitized input, can lead to command injection.',
    recommendation: 'Avoid shell execution where possible; if required, use parameterized APIs and strict allow-lists, never string-concatenated user input.',
    suggestedFix: 'Use execFile()/spawn() with an argument array instead of a concatenated shell string, and validate all inputs.',
  },
  {
    id: 'sql-injection',
    title: 'Possible SQL injection (string-built query)',
    severity: 'HIGH',
    category: 'Security',
    regex: /(SELECT|INSERT|UPDATE|DELETE)\s+.{0,80}?["'`]\s*\+\s*\w+/gi,
    explanation: 'A SQL statement appears to be built by concatenating strings with variables, which can allow SQL injection.',
    recommendation: 'Use parameterized queries or prepared statements / an ORM instead of string concatenation.',
    suggestedFix: 'Replace string concatenation with placeholders, e.g. db.query("SELECT * FROM users WHERE id = ?", [id]).',
  },
  {
    id: 'weak-randomness',
    title: 'Weak randomness used for security purposes',
    severity: 'MEDIUM',
    category: 'Security',
    regex: /Math\.random\s*\(\s*\)/g,
    explanation: 'Math.random() is not cryptographically secure and should not be used for tokens, passwords, or session IDs.',
    recommendation: 'Use a cryptographically secure random generator for any security-sensitive value.',
    suggestedFix: "Use crypto.randomBytes(32).toString('hex') (Node) instead of Math.random() for secrets/tokens.",
  },
  {
    id: 'sensitive-logging',
    title: 'Sensitive data may be logged',
    severity: 'MEDIUM',
    category: 'Security',
    regex: /console\.log\s*\([^)]*\b(password|token|secret|apikey|api_key)\b[^)]*\)/gi,
    explanation: 'Logging credentials or tokens can leak sensitive data into log files or terminals.',
    recommendation: 'Never log passwords, tokens, or API keys, even for debugging.',
    suggestedFix: 'Remove the sensitive value from the log statement, or log a redacted placeholder instead.',
  },
  {
    id: 'unsafe-html',
    title: 'Unsafe HTML injection (XSS risk)',
    severity: 'MEDIUM',
    category: 'Security',
    regex: /dangerouslySetInnerHTML|\.innerHTML\s*=/g,
    explanation: 'Directly injecting HTML/markup from variables can allow cross-site scripting (XSS) if the content is not sanitized.',
    recommendation: 'Sanitize any HTML before rendering it, or avoid raw HTML injection and use safe text rendering instead.',
    suggestedFix: 'Use a sanitizer (e.g. DOMPurify) before setting HTML, or render as plain text via normal JSX/text nodes.',
  },
  {
    id: 'missing-validation',
    title: 'Raw request input used without visible validation',
    severity: 'MEDIUM',
    category: 'Security',
    regex: /req\.(body|query|params)\.\w+/g,
    explanation: 'Request input is used without an obvious validation or sanitization step nearby.',
    recommendation: 'Validate and sanitize all request input (type, length, format) before using it in logic, queries, or file paths.',
    suggestedFix: 'Add schema validation (e.g. Joi, express-validator, zod) at the start of the route handler.',
  },
  {
    id: 'todo-marker',
    title: 'Unfinished code marker (TODO/FIXME)',
    severity: 'LOW',
    category: 'Maintainability',
    regex: /\b(TODO|FIXME|HACK)\b/g,
    explanation: 'The code contains a marker indicating incomplete or temporary work.',
    recommendation: 'Track this in an issue tracker and resolve before production release.',
    suggestedFix: 'Complete the pending work or file a ticket referencing this location.',
  },
];

/**
 * Detects very large functions as a simple maintainability signal.
 * Works heuristically across languages by counting lines between
 * matching-ish braces/indentation blocks starting at a function-like keyword.
 */
function detectLongFunctions(code) {
  const findings = [];
  const lines = code.split('\n');
  const funcStartRegex = /\b(function\s+\w*\s*\(|def\s+\w+\s*\(|\w+\s*\([^)]*\)\s*\{|public\s+\w+.*\(.*\)\s*\{)/;

  let currentStart = null;
  let braceDepth = 0;
  let inFunction = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inFunction && funcStartRegex.test(line)) {
      inFunction = true;
      currentStart = i;
      braceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      continue;
    }
    if (inFunction) {
      braceDepth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (braceDepth <= 0) {
        const length = i - currentStart;
        if (length > 60) {
          findings.push({
            title: 'Very large function',
            severity: 'LOW',
            category: 'Maintainability',
            line: currentStart + 1,
            explanation: `A function spans roughly ${length} lines, which can hurt readability and testability.`,
            recommendation: 'Break the function into smaller, single-purpose functions.',
            suggestedFix: 'Extract cohesive blocks into helper functions with descriptive names.',
            source: 'static',
          });
        }
        inFunction = false;
        currentStart = null;
      }
    }
  }
  return findings;
}

function runStaticAnalysis(code) {
  const findings = [];

  for (const rule of RULES) {
    const matches = findAllMatches(code, rule.regex, (match, line) => ({
      title: rule.title,
      severity: rule.severity,
      category: rule.category,
      line,
      explanation: rule.explanation,
      recommendation: rule.recommendation,
      suggestedFix: rule.suggestedFix,
      source: 'static',
    }));
    findings.push(...matches);
  }

  findings.push(...detectLongFunctions(code));

  // De-duplicate identical (title, line) pairs
  const seen = new Set();
  const deduped = findings.filter((f) => {
    const key = `${f.title}-${f.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped;
}

module.exports = { runStaticAnalysis };
