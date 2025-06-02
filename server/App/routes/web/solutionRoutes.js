const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../../models/User');

// GET /api/solutions/:solutionId?userId=xxx
router.get('/:solutionId', async (req, res) => {
  const { solutionId } = req.params;
  const { userId } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const submission = user.submissions.find(sub => sub.submissionId === solutionId);  // Mongoose subdocument access

    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    res.json(submission);
  } catch (err) {
    console.error('Error fetching solution by ID:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
