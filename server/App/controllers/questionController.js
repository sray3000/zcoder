const { scrapeWithSelenium } = require("../utils/scraper");
const Question = require("../models/Question");

const createQuestion = async (req, res) => {
  try {
    const { contestId, problemIndex, tags, rating } = req.body;

    const scraped = await scrapeWithSelenium(contestId, problemIndex);

    if (!scraped) {
      return res.status(500).json({ message: 'Failed to scrape problem' });
    }

    const newQuestion = new Question({
      contestId,
      problemIndex,
      title: scraped.header,
      description: scraped.description,
      sampleInput: scraped.sampleInput,
      sampleOutput: scraped.sampleOutput,
      timeLimit: scraped.timeLimit,
      memoryLimit: scraped.memoryLimit,
      tags,
      rating
    });

    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating question' });
  }
};

module.exports = {
  createQuestion
};












// const getScrapedProblemDescription = async (req, res) => {
//   const { contestId, problemIndex } = req.params;
//   const description = await scrapeWithSelenium(contestId, problemIndex);

//   if (!description) {
//     return res.status(404).json({ error: 'Problem statement not found' });
//   }

//   res.json({ description });
// }

// module.exports = getScrapedProblemDescription;
