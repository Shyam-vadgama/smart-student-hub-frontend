import { Request, Response } from 'express';
import BusinessProblem from '../../models/BusinessProblem';
import BusinessProblemSubmission from '../../models/BusinessProblemSubmission';

export const createBusinessProblem = async (req: Request, res: Response) => {
  try {
    const { title, description, department, options } = req.body;
    const createdBy = (req as any).user.id;

    const newProblem = new BusinessProblem({
      title,
      description,
      department,
      options,
      createdBy,
    });

    await newProblem.save();

    res.status(201).json({ success: true, data: newProblem });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getAllBusinessProblems = async (req: Request, res: Response) => {
  try {
    const problems = await BusinessProblem.find().populate('createdBy', 'name');
    res.status(200).json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getBusinessProblem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const problem = await BusinessProblem.findById(id).populate('createdBy', 'name');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateBusinessProblem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, options } = req.body;
    const updatedBy = (req as any).user.id;

    const problem = await BusinessProblem.findById(id);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    if (problem.createdBy.toString() !== updatedBy) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this problem' });
    }

    problem.title = title || problem.title;
    problem.description = description || problem.description;
    problem.options = options || problem.options;

    await problem.save();

    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteBusinessProblem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedBy = (req as any).user.id;

    const problem = await BusinessProblem.findById(id);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    if (problem.createdBy.toString() !== deletedBy) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this problem' });
    }

    await problem.remove();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const submitBusinessProblem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { selectedOption } = req.body;
    const student = (req as any).user.id;

    const newSubmission = new BusinessProblemSubmission({
      problem: id,
      student,
      selectedOption,
    });

    await newSubmission.save();

    res.status(201).json({ success: true, data: newSubmission });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getBusinessProblemSubmissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const submissions = await BusinessProblemSubmission.find({ problem: id }).populate('student', 'name');
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getMyBusinessProblemSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = (req as any).user.id;
    const submission = await BusinessProblemSubmission.findOne({ problem: id, student });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'No submission found' });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getBusinessProblemsByDepartment = async (req: Request, res: Response) => {
  try {
    const { department } = req.params;
    const problems = await BusinessProblem.find({ department }).populate('createdBy', 'name');
    res.status(200).json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getBusinessProblemsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const problems = await BusinessProblem.find({ createdBy: userId }).populate('createdBy', 'name');
    res.status(200).json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getMyBusinessProblems = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const problems = await BusinessProblem.find({ createdBy: userId }).populate('createdBy', 'name');
    res.status(200).json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getUserSubmissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const submissions = await BusinessProblemSubmission.find({ student: userId }).populate('problem', 'title');
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const submissions = await BusinessProblemSubmission.find({ student: userId }).populate('problem', 'title');
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getUserSubmissionForProblem = async (req: Request, res: Response) => {
  try {
    const { problemId, userId } = req.params;
    const submission = await BusinessProblemSubmission.findOne({ problem: problemId, student: userId });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'No submission found' });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getMySubmissionForProblem = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    const userId = (req as any).user.id;
    const submission = await BusinessProblemSubmission.findOne({ problem: problemId, student: userId });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'No submission found' });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getUserSubmissionsForProblem = async (req: Request, res: Response) => {
  try {
    const { problemId, userId } = req.params;
    const submissions = await BusinessProblemSubmission.find({ problem: problemId, student: userId });
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getMySubmissionsForProblem = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    const userId = (req as any).user.id;
    const submissions = await BusinessProblemSubmission.find({ problem: problemId, student: userId });
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};