const Review = require('../models/Review');
const { performReview } = require('../services/reviewService');

// POST /api/review/upload  (multipart/form-data, field name: codeFile)
async function uploadReview(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded (expected field "codeFile")' });
    }

    // File lives only in memory (req.file.buffer) — never written to disk,
    // so this works on serverless (read-only filesystem) too.
    const code = req.file.buffer.toString('utf8');

    const review = await performReview({
      userId: req.user._id,
      fileName: req.file.originalname,
      language: req.body.language, // optional override; auto-detected otherwise
      code,
    });

    res.status(200).json({ success: true, review: formatReview(review) });
  } catch (err) {
    next(err);
  }
}

// POST /api/review/code
async function pastedCodeReview(req, res, next) {
  try {
    const { language, fileName, code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'No code provided' });
    }

    const review = await performReview({
      userId: req.user._id,
      fileName: fileName || 'pasted-code.txt',
      language,
      code,
    });

    res.status(200).json({ success: true, review: formatReview(review) });
  } catch (err) {
    next(err);
  }
}

// GET /api/review
async function getHistory(req, res, next) {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-sourceCode'); // history list doesn't need full source

    res.status(200).json({
      success: true,
      reviews: reviews.map((r) => ({
        id: r._id,
        fileName: r.fileName,
        language: r.language,
        securityScore: r.securityScore,
        qualityScore: r.qualityScore,
        riskLevel: r.riskLevel,
        aiStatus: r.aiStatus,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/review/:id
async function getReviewById(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.status(200).json({ success: true, review: formatReview(review) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/review/:id
async function deleteReview(req, res, next) {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
}

function formatReview(r) {
  return {
    id: r._id,
    fileName: r.fileName,
    language: r.language,
    sourceCode: r.sourceCode,
    securityScore: r.securityScore,
    qualityScore: r.qualityScore,
    riskLevel: r.riskLevel,
    summary: r.summary,
    findings: r.findings,
    positivePoints: r.positivePoints,
    nextSteps: r.nextSteps,
    aiStatus: r.aiStatus,
    createdAt: r.createdAt,
  };
}

module.exports = { uploadReview, pastedCodeReview, getHistory, getReviewById, deleteReview };
