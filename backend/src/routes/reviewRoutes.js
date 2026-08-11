const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');
const {
  uploadReview,
  pastedCodeReview,
  getHistory,
  getReviewById,
  deleteReview,
} = require('../controllers/reviewController');

const router = express.Router();

router.use(protect); // every review route requires auth

router.post('/upload', upload.single('codeFile'), uploadReview);
router.post('/code', pastedCodeReview);
router.get('/', getHistory);
router.get('/:id', getReviewById);
router.delete('/:id', deleteReview);

module.exports = router;
