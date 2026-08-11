const mongoose = require('mongoose');

const FindingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'],
      required: true,
    },
    category: {
      type: String,
      enum: ['Security', 'Quality', 'Performance', 'Maintainability'],
      default: 'Security',
    },
    line: { type: Number, default: null },
    explanation: { type: String, default: '' },
    recommendation: { type: String, default: '' },
    suggestedFix: { type: String, default: '' },
    source: {
      type: String,
      enum: ['static', 'ai'],
      default: 'static',
    },
  },
  { _id: false }
);

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    language: { type: String, required: true },
    sourceCode: { type: String, required: true },
    securityScore: { type: Number, min: 0, max: 100, default: 0 },
    qualityScore: { type: Number, min: 0, max: 100, default: 0 },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    summary: { type: String, default: '' },
    findings: { type: [FindingSchema], default: [] },
    positivePoints: { type: [String], default: [] },
    nextSteps: { type: [String], default: [] },
    aiStatus: {
      type: String,
      enum: ['ok', 'unavailable', 'error'],
      default: 'ok',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', ReviewSchema);
