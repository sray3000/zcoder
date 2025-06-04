const express = require('express');
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const auth = require('../../middleware/auth');
const { createQuestion } = require('../../controllers/questionController');
const { scrapeWithSelenium } = require("../../utils/scraper");
const axios = require('axios');

const router = express.Router();

router.get('/', async (req, res) => {
  const questions = await Question.find();
  res.json(questions);
});

router.get('/fetch/codeforces', async (req, res) => {
  try {
    const response = await axios.get('https://codeforces.com/api/problemset.problems');
    const problems = response.data.result.problems.slice(50, 70);

    const insertedQuestions = [];

    for (const p of problems) {
      try {
        const contestId = p.contestId;
        const problemIndex = p.index;
        const tags = p.tags;
        const rating = p.rating || 800;

        const scraped = await scrapeWithSelenium(contestId, problemIndex);

        if (!scraped) {
          console.warn(`Skipping ${contestId}${problemIndex} due to scrape failure`);
          continue;
        }

        const question = {
          contestId,
          problemIndex,
          title: scraped.header,
          description: scraped.description,
          sampleInput: scraped.sampleInput,
          sampleOutput: scraped.sampleOutput,
          timeLimit: scraped.timeLimit,
          memoryLimit: scraped.memoryLimit,
          allSamples: scraped.allSamples,
          tags,
          rating
        };

        insertedQuestions.push(question);
      } catch (err) {
        console.error(`Error processing problem ${p.contestId}${p.index}:`, err.message);
      }
    }

    // Insert all at once
    await Question.insertMany(insertedQuestions, { ordered: false });
    res.json({ message: `Inserted ${insertedQuestions.length} questions successfully` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch and process Codeforces problems' });
  }
});

router.get('/:contestId/:problemIndex', async (req, res) => {
  const { contestId, problemIndex } = req.params;
  try {
    const question = await Question.findOne({ contestId: Number(contestId), problemIndex });
    if (!question) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// // GET /api/questions/id/:problemId
// router.get('/id/:problemId', async (req, res) => {
//   try {
//     const problem = await Question.findById(req.params.problemId);
//     if (!problem) return res.status(404).json({ message: 'Problem not found' });
//     res.json(problem);
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching problem by ID' });
//   }
// });

router.get('/:problemId', async (req, res) => {
  console.log(1);
  const { problemId } = req.params;
  console.log('🔍 Incoming request for problemId:', problemId);

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    console.warn('❌ Invalid ObjectId format');
    return res.status(400).json({ message: 'Invalid problem ID format' });
  }

  try {
    console.log('Looking up problem with ID:', req.params.problemId);
    const problem = await Question.findOne({_id: problemId});
    console.log('Found:', problem);  // Is this null? or an object?
    if (!problem) {
      console.warn('⚠️ Problem not found in DB');
      return res.status(404).json({ message: 'Problem not found' });
    }

    console.log('✅ Problem found:', problem.title);
    res.json(problem);
  } catch (err) {
    console.error('🔥 Error in route:', err);
    res.status(500).json({ message: 'Error fetching problem by ID', error: err.message });
  }
});

module.exports = router;
