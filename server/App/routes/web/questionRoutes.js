const express = require('express');
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
    const problems = response.data.result.problems.slice(50, 100);

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

module.exports = router;
