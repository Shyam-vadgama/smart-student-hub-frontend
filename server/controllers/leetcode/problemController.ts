import { Request, Response } from 'express';
import { ProblemModel } from '../../models/leetcode/Problem';
import { SubmissionModel } from '../../models/leetcode/Submission';
import { GoogleGenerativeAI } from '@google/generative-ai';

const generateProblemWithAI = async (difficulty: string, category: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Gemini API key is not configured. Please set it in the .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Generate a LeetCode-style problem with the following specifications:
    - Difficulty: ${difficulty}
    - Category: ${category}

    The output must be a single, minified JSON object with no extra text before or after.
    The JSON object should have the following structure:
    {
      "title": "Problem Title",
      "description": "A detailed description of the problem.",
      "input_format": "Description of the input format.",
      "output_format": "Description of the output format.",
      "constraints": ["constraint 1", "constraint 2"],
      "example_cases": [
        {
          "input": "example input",
          "output": "example output",
          "explanation": "explanation of the example"
        }
      ],
      "test_cases": [
        {
          "input": "test case 1 input",
          "output": "test case 1 output"
        },
        {
          "input": "test case 2 input",
          "output": "test case 2 output"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error generating problem with Gemini:', error);
    throw new Error('Failed to generate problem with AI. Please check the API key and model configuration.');
  }
};

export const createProblem = async (req: Request, res: Response) => {
  try {
    console.log('Create problem request received:', req.body);
    const { title, description, difficulty, category, constraints, example_cases, test_cases, solution, input_format, output_format } = req.body;
    
    if (!title || !description || !difficulty) {
      return res.status(400).json({ success: false, message: "Title, description, and difficulty are required" });
    }
    
    const problem = new ProblemModel({
      title,
      description,
      difficulty,
      category: (category || 'programming').toLowerCase(),
      constraints: constraints || [],
      example_cases: example_cases || [],
      test_cases: test_cases || [],
      solution: solution || {},
      input_format: input_format || "",
      output_format: output_format || ""
    });
    
    const savedProblem = await problem.save();
    console.log('Problem saved successfully:', savedProblem._id);
    
    return res.status(200).json({ success: true, data: savedProblem, message: "Problem created successfully" });
  } catch (error) {
    console.error('Error creating problem:', error);
    const message = error instanceof Error ? error.message : 'Server Error';
    return res.status(500).json({ success: false, message });
  }
};

export const generateProblem = async (req: Request, res: Response) => {
  try {
    const { difficulty, category } = req.body;
    const generatedProblem = await generateProblemWithAI(difficulty, category);
    res.status(200).json({ ...generatedProblem, difficulty });
  } catch (error: any) {
    console.error('Error in generateProblem controller:', error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

export const getAllProblems = async (req: Request, res: Response) => {
  try {
    console.log('Getting all problems...');
    const problems = await ProblemModel.aggregate([
      {
        $addFields: {
          sortOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$difficulty", "easy"] }, then: 1 },
                { case: { $eq: ["$difficulty", "medium"] }, then: 2 },
                { case: { $eq: ["$difficulty", "hard"] }, then: 3 }
              ],
              default: 4
            }
          }
        }
      },
      {
        $sort: {
          sortOrder: 1
        }
      },
      {
        $project: {
          title: 1,
          difficulty: 1,
          category: 1
        }
      }
    ]);

    console.log(`Found ${problems.length} problems`);
    res.status(200).json({ success: true, data: problems, message: "Problems retrieved successfully" });
  } catch (error) {
    console.error('Error getting problems:', error);
    const message = error instanceof Error ? error.message : 'Server Error';
    return res.status(500).json({ success: false, message });
  }
};

export const getProblemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const problem = await ProblemModel.findById(id).select('-test_cases');
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }
    return res.status(200).json({ success: true, data: problem, message: "Problem retrieved successfully" });
  } catch (error) {
    console.error('Error getting problem:', error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteProblemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const problem = await ProblemModel.findByIdAndDelete(id);
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }
    return res.status(200).json({ success: true, data: problem, message: "Problem deleted successfully" });
  } catch (error) {
    console.error('Error deleting problem:', error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSolvedProblems = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const solvedSubmissions = await SubmissionModel.find({ 
      madeBy: userId, 
      status: true 
    }).select('problem');
    
    const solvedProblemIds = solvedSubmissions.map(submission => submission.problem.toString());
    
    res.status(200).json({ success: true, data: solvedProblemIds, message: "Solved problems retrieved successfully" });
  } catch (error) {
    console.error('Error getting solved problems:', error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Removed duplicated, malformed block

// Removed duplicate exported handlers

// Removed duplicate list handler

// Removed duplicate get by id

// Removed duplicate delete

// Removed duplicate solved problems
