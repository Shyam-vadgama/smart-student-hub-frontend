import { Request, Response } from 'express';
import { ProblemModel } from '../../models/leetcode/Problem';
import { SubmissionModel } from '../../models/leetcode/Submission';

export const createProblem = async (req: Request, res: Response) => {
  try {
    console.log('Create problem request received:', req.body);
    const { title, description, difficulty, constraints, example_cases, test_cases, solution, input_format, output_format } = req.body;
    
    if (!title || !description || !difficulty) {
      return res.status(400).json({ success: false, message: "Title, description, and difficulty are required" });
    }
    
    const problem = new ProblemModel({
      title,
      description,
      difficulty,
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
          difficulty: 1
        }
      }
    ]);

    console.log(`Found ${problems.length} problems`);
    res.status(200).json({ success: true, data: problems, message: "Problems retrieved successfully" });
  } catch (error) {
    console.error('Error getting problems:', error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
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
