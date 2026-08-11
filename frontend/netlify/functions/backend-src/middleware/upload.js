const multer = require('multer');
const path = require('path');

// Allowed source-code extensions only. Never accept executables/scripts that
// the OS itself might run, and we never execute anything we receive anyway.
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs',
  '.go', '.rb', '.php', '.html', '.css', '.json', '.yml', '.yaml',
  '.sql', '.sh', '.txt', '.md', '.kt', '.swift', '.rs',
]);

// In-memory storage: works identically on a normal server AND on read-only
// serverless filesystems (Netlify Functions / Lambda). The file never
// touches disk and is never executed — it's read as a text buffer only.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext || '(none)'} is not allowed`));
  }
  cb(null, true);
}

const maxSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 2);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

module.exports = { upload };
