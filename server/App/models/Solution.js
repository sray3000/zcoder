const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['c', 'cpp', 'python', 'java', 'js'], // add more as needed
    required: true
  },
  verdict: {
    type: String,
    enum: ['Accepted', 'Wrong Answer'],
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Solution = mongoose.model('Solution', solutionSchema);
module.exports = Solution;
