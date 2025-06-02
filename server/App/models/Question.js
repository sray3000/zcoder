const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  contestId: Number,
  problemIndex: String,
  title: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true                      // Required since used in Dashboard color
  },
  tags: [String],
  description: {
    type: String,
    required: true
  },
  timeLimit: {
    type: String,
    default: "1s"
  },
  memoryLimit: {
    type: String,
    default: "256MB"
  },
  sampleInput: {
    type: String,
    required: true
  },
  sampleOutput: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;