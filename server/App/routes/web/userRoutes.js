const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require("uuid");

// Load models
const User = require('../../models/User');
const Question = require('../../models/Question');

// Route 1: Get user stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const submissions = user.submissions.length;
    const solved = user.submissions.filter(sub => sub.status === 'Accepted').length;
    const successRate = submissions > 0 ? ((solved / submissions) * 100).toFixed(2) : 0;

    res.json({ submissions, solved, successRate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Route 2: Get bookmarked problems
router.get('/:userId/bookmarks', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('bookmarkedProblems');
    res.json(user.bookmarkedProblems);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// Route 3: Get user submissions
router.get('/:userId/solutions', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('submissions.problemId', 'title contestId problemIndex');

    const recent = user.submissions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20)
      .map(sub => ({
        id: sub.submissionId,
        cfId: sub.problemId.contestId + sub.problemId.problemIndex,
        problemTitle: sub.problemId.title,
        submittedAt: sub.timestamp
      }));

    res.json(recent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recent submissions' });
  }
});

// Route 4: Get user activity for calendar
router.get('/:userId/activity', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const activityMap = {};

    user.submissions.forEach(sub => {
      const date = new Date(sub.timestamp).toISOString().split('T')[0];
      activityMap[date] = (activityMap[date] || 0) + 1;
    });

    const today = new Date();
    const activityData = [];

    for (let i = 0; i < 100; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const key = date.toISOString().split('T')[0];
      activityData.unshift({ date: key, submissions: activityMap[key] || 0 });
    }

    res.json(activityData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
});

// ✅ Toggle bookmarked problem
router.post('/:userId/bookmarks', async (req, res) => {
  const userId = req.params.userId;
  const { problemId } = req.body;

  if (!problemId) return res.status(400).json({ error: 'Problem ID is required' });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const index = user.bookmarkedProblems.findIndex(
      pid => pid.toString() === problemId
    );

    if (index === -1) {
      user.bookmarkedProblems.push(problemId);
      await user.save();
      return res.status(200).json({ message: 'Problem bookmarked successfully', bookmarked: true });
    } else {
      user.bookmarkedProblems.splice(index, 1);
      await user.save();
      return res.status(200).json({ message: 'Problem unbookmarked successfully', bookmarked: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error toggling bookmark' });
  }
});

// Route 5: Submit a solution and save to user record
router.post('/:userId/submit', async (req, res) => {
  const { problemId, solutionCode, isCorrect } = req.body;

  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.submissions.push({
      submissionId: uuidv4(),
      problemId,
      solutionCode,
      status: isCorrect ? 'Accepted' : 'Wrong Answer',
      timestamp: new Date()
    });

    await user.save();
    res.status(200).json({ message: 'Submission saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving submission' });
  }
});

module.exports = router;
