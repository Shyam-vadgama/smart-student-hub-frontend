import { Request, Response } from 'express';
import { ProblemModel } from '../../models/leetcode/Problem';
import { SubmissionModel } from '../../models/leetcode/Submission';
import { executeCode } from '../../utils/codeExecutor';
import { updateBadge } from './badgeController';

export const submitSolution = async (req: Request, res: Response) => {
  const { problemId } = req.params;
  const { code, language } = req.body;
  const userId = ((req as any).user && ((req as any).user._id || (req as any).user.id))?.toString();

  try {
    const existingSubmission = await SubmissionModel.findOne({ problem: problemId, madeBy: userId });
    if (existingSubmission) {
      return res.status(400).json({ success: false, message: 'You have already submitted a solution for this problem' });
    }

    const problem = await ProblemModel.findById(problemId);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const { test_cases } = problem as any;
    let allTestsPassed = true;
    let results: Array<{ input: string; expectedOutput: string; actualOutput: string; passed: boolean }> = [];

    for (const testCase of test_cases) {
      try {
        const output = await executeCode(language, code, (testCase.input || '').toString());
        const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
        const passed = normalize(output) === normalize((testCase.output || '').toString());
        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: output,
          passed,
        });
        if (!passed) {
          allTestsPassed = false;
        }
      } catch (error) {
        allTestsPassed = false;
        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: (error instanceof Error ? error.message : 'Execution error'),
          passed: false,
        });
      }
    }

    const submission = new SubmissionModel({
      problem: problemId,
      madeBy: userId,
      status: allTestsPassed,
      code,
      language,
    });

    await submission.save();

    if (allTestsPassed) {
      const badge = await updateBadge(userId);
      res.status(200).json({ success: true, message: 'Solution submitted successfully', results, badge });
    } else {
      res.status(200).json({ success: false, message: 'Solution failed one or more test cases', results });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const runSolution = async (req: Request, res: Response) => {
  const { problemId } = req.params;
  const { code, language } = req.body as { code: string; language: string };

  try {
    const problem = await ProblemModel.findById(problemId).select('example_cases');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const exampleCases = (problem as any).example_cases || [];
    const results: Array<{ input: string; expectedOutput: string; actualOutput: string; passed: boolean }> = [];
    const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();

    for (const testCase of exampleCases) {
      try {
        const output = await executeCode(language, code, (testCase.input || '').toString());
        const passed = normalize(output) === normalize((testCase.output || '').toString());
        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: output,
          passed
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Execution error';
        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: message,
          passed: false
        });
      }
    }

    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
