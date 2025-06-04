const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs').promises;

class CodeforcesSeleniumScraper {
    constructor(headless = true) {
        this.headless = headless;
        this.driver = null;
    }

    async startDriver() {
        try {
            const options = new chrome.Options();
            
            if (this.headless) {
                options.addArguments('--headless');
            }
            
            // Anti-detection options
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            options.addArguments('--disable-blink-features=AutomationControlled');
            options.excludeSwitches(['enable-automation']);
            options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            
            // Execute script to remove webdriver property
            await this.driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
            
            return true;
        } catch (error) {
            console.error('Failed to start driver:', error.message);
            console.error('Make sure ChromeDriver is installed and in PATH');
            return false;
        }
    }

    async scrapeProblem(url) {
        if (!this.driver) {
            const started = await this.startDriver();
            if (!started) {
                return {
                    url,
                    error: 'Failed to start WebDriver',
                    success: false
                };
            }
        }

        try {
            // Add random delay
            await this.sleep(Math.random() * 2000 + 1000);
            
            console.log('Loading page...');
            await this.driver.get(url);
            
            // Wait for the page to load
            await this.driver.wait(
                until.elementLocated(By.className('problem-statement')), 
                10000
            );
            
            // Extract problem data
            const title = await this.extractTitle();
            const problemStatement = await this.extractProblemStatement();
            const samples = await this.extractSamples();
            const limits = await this.extractLimits();
            
            return {
                url,
                title,
                problemStatement,
                samples,
                timeLimit: limits.timeLimit || '',
                memoryLimit: limits.memoryLimit || '',
                success: true
            };
            
        } catch (error) {
            if (error.name === 'TimeoutError') {
                return {
                    url,
                    error: 'Page load timeout - problem page not found or blocked',
                    success: false
                };
            }
            return {
                url,
                error: error.message,
                success: false
            };
        }
    }

    async extractTitle() {
        try {
            const titleElement = await this.driver.findElement(By.className('title'));
            return await titleElement.getText();
        } catch (error) {
            return '';
        }
    }

    async extractProblemStatement() {
        try {
            const statementDiv = await this.driver.findElement(By.className('problem-statement'));
            
            // First, try to find all <p> tags which usually contain the main problem description
            const paragraphElements = await statementDiv.findElements(By.tagName('p'));
            
            const descriptionParts = [];
            for (const pElem of paragraphElements) {
                try {
                    // Check if paragraph is part of input/output sections
                    const parent = await pElem.findElement(By.xpath('./..'));
                    const parentClass = await parent.getAttribute('class') || '';
                    
                    if (['input', 'output', 'sample-test'].some(cls => parentClass.includes(cls))) {
                        continue;
                    }
                } catch (e) {
                    // Parent check failed, continue anyway
                }
                
                const text = (await pElem.getText()).trim();
                if (text && text.length > 10) {
                    descriptionParts.push(text);
                }
            }
            
            if (descriptionParts.length > 0) {
                return this.cleanText(descriptionParts.join('\n\n'));
            }
            
            // Fallback 1: Look for divs with substantial content
            const divElements = await statementDiv.findElements(By.tagName('div'));
            
            for (const elem of divElements) {
                const classAttr = await elem.getAttribute('class') || '';
                
                // Skip known section types
                if (['input', 'output', 'sample-test', 'header', 'time-limit', 'memory-limit']
                    .some(cls => classAttr.includes(cls))) {
                    continue;
                }
                
                const text = (await elem.getText()).trim();
                if (text.length > 50 && 
                    !['Input', 'Output', 'Sample', 'Note', 'time limit', 'memory limit']
                    .some(prefix => text.startsWith(prefix))) {
                    return text;
                }
            }
            
            // Fallback 2: Get all text from statement div and clean it up
            const fullText = (await statementDiv.getText()).trim();
            const lines = fullText.split('\\n');
            const descriptionLines = [];
            let skipSection = false;
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;
                
                // Skip lines that indicate start of other sections
                const sectionStarters = ['input', 'output', 'sample input', 'sample output', 'note', 'time limit', 'memory limit'];
                if (sectionStarters.some(section => trimmedLine.toLowerCase().startsWith(section))) {
                    skipSection = true;
                    continue;
                }
                
                if (!skipSection) {
                    descriptionLines.push(trimmedLine);
                } else {
                    // Reset skip_section if we encounter what looks like problem description again
                    const keywords = ['input', 'output', 'sample', 'limit'];
                    if (trimmedLine.length > 50 && 
                        !keywords.some(keyword => trimmedLine.toLowerCase().includes(keyword))) {
                        skipSection = false;
                        descriptionLines.push(trimmedLine);
                    }
                }
            }
            
            return this.cleanText(descriptionLines.join('\n'));
            
        } catch (error) {
            return '';
        }
    }

    async extractSamples() {
        const samples = [];
        
        try {
            // Find all sample test sections
            const sampleTests = await this.driver.findElements(By.className('sample-test'));
            
            for (const sampleTest of sampleTests) {
                try {
                    // Find input and output divs
                    const inputDiv = await sampleTest.findElement(By.className('input'));
                    const outputDiv = await sampleTest.findElement(By.className('output'));
                    
                    // Extract input
                    const inputPre = await inputDiv.findElement(By.tagName('pre'));
                    const sampleInput = (await inputPre.getText()).trim();
                    
                    // Extract output
                    const outputPre = await outputDiv.findElement(By.tagName('pre'));
                    const sampleOutput = (await outputPre.getText()).trim();
                    
                    samples.push({
                        input: sampleInput,
                        output: sampleOutput
                    });
                } catch (error) {
                    // Skip this sample if extraction fails
                    continue;
                }
            }
        } catch (error) {
            // No samples found
        }
        
        return samples;
    }

    async extractLimits() {
        const limits = {};
        
        try {
            // Time limit
            const timeLimitElem = await this.driver.findElement(By.className('time-limit'));
            limits.timeLimit = (await timeLimitElem.getText()).trim();
        } catch (error) {
            // Time limit not found
        }
        
        try {
            // Memory limit
            const memoryLimitElem = await this.driver.findElement(By.className('memory-limit'));
            limits.memoryLimit = (await memoryLimitElem.getText()).trim();
        } catch (error) {
            // Memory limit not found
        }
        
        return limits;
    }

    async saveToFile(problemData, filename = null) {
        if (!filename) {
            const url = problemData.url || '';
            const problemId = url.split('/').pop() || 'problem';
            filename = `codeforces_${problemId}_selenium.json`;
        }
        
        try {
            await fs.writeFile(filename, JSON.stringify(problemData, null, 2), 'utf8');
            console.log(`Problem data saved to ${filename}`);
        } catch (error) {
            console.error(`Failed to save file: ${error.message}`);
        }
    }

    async close() {
        if (this.driver) {
            await this.driver.quit();
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    cleanText(text) {
    return text
        .replace(/\r\n/g, '\n')         // Normalize newlines
        .replace(/\\n/g, '\n')          // Convert escaped newlines
        .replace(/\n{3,}/g, '\n\n')     // Reduce too many blank lines
        .replace(/[ \t]+/g, ' ')        // Collapse multiple spaces/tabs
        .replace(/ +\n/g, '\n')         // Trim space before newline
        .replace(/\n +/g, '\n')         // Trim space after newline
        .trim();
    }
}

// Express.js server integration
async function createCodeforcesAPI() {
    const express = require('express');
    const cors = require('cors');
    const app = express();
    
    app.use(cors());
    app.use(express.json());
    
    // Endpoint to scrape a problem
    app.post('/api/scrape-problem', async (req, res) => {
        const { url, contestId, problemIndex } = req.body;
        
        let scrapeUrl;
        if (url) {
            scrapeUrl = url;
        } else if (contestId && problemIndex) {
            scrapeUrl = `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`;
        } else {
            return res.status(400).json({
                success: false,
                error: 'Please provide either a URL or contestId and problemIndex'
            });
        }
        
        const scraper = new CodeforcesSeleniumScraper(true); // headless mode
        
        try {
            console.log(`🧭 Scraping: ${scrapeUrl}`);
            const result = await scraper.scrapeProblem(scrapeUrl);
            
            if (result.success) {
                console.log('✅ Scrape successful');
                res.json(result);
            } else {
                console.log('❌ Scrape failed:', result.error);
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('❌ Unexpected error:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        } finally {
            await scraper.close();
        }
    });
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({ status: 'OK', message: 'Codeforces scraper API is running' });
    });
    
    return app;
}

// Standalone function (similar to your original)
async function scrapeWithSelenium(contestId, problemIndex) {
    const url = `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`;
    console.log(`🧭 Visiting: ${url}`);
    
    const scraper = new CodeforcesSeleniumScraper(true);
    
    try {
        const result = await scraper.scrapeProblem(url);
        
        if (result.success) {
            console.log('✅ Scrape success');
            return {
                header: result.title,
                description: result.problemStatement,
                sampleInput: result.samples.length > 0 ? result.samples[0].input : '',
                sampleOutput: result.samples.length > 0 ? result.samples[0].output : '',
                timeLimit: result.timeLimit,
                memoryLimit: result.memoryLimit,
                allSamples: result.samples
            };
        } else {
            console.error('❌ Scraping failed:', result.error);
            return null;
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        return null;
    } finally {
        await scraper.close();
    }
}

// Main function for testing
async function main() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('Enter Codeforces problem URL: ', async (url) => {
        if (!url.trim()) {
            url = 'https://codeforces.com/problemset/problem/1/A';
            console.log(`Using default URL: ${url}`);
        }
        
        console.log(`Scraping problem from: ${url}`);
        console.log('Starting browser...');
        
        const scraper = new CodeforcesSeleniumScraper(true);
        
        try {
            const problemData = await scraper.scrapeProblem(url);
            
            if (problemData.success) {
                console.log('\\n✅ Successfully scraped problem!');
                console.log(`Title: ${problemData.title}`);
                console.log(`Time Limit: ${problemData.timeLimit}`);
                console.log(`Memory Limit: ${problemData.memoryLimit}`);
                console.log(`\\nProblem Statement:\\n${problemData.problemStatement}`);
                console.log(`\\nNumber of sample test cases: ${problemData.samples.length}`);
                
                problemData.samples.forEach((sample, i) => {
                    console.log(`\\n--- Sample ${i + 1} ---`);
                    console.log('Input:');
                    console.log(sample.input);
                    console.log('Output:');
                    console.log(sample.output);
                });
                
                await scraper.saveToFile(problemData);
                console.log('\\n✅ Data saved successfully!');
            } else {
                console.log(`❌ Error scraping problem: ${problemData.error}`);
                console.log('\\nTroubleshooting tips:');
                console.log('1. Install ChromeDriver and add to PATH');
                console.log('2. Make sure Chrome browser is installed');
                console.log('3. Try with headless=false to see what\'s happening');
            }
        } finally {
            await scraper.close();
            rl.close();
        }
    });
}

module.exports = {
    scrapeWithSelenium,
    createCodeforcesAPI
};

// Run main if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}