import fs from 'fs';

function generateLeetcodeData(problem) {
  const jsonData = JSON.stringify(problem, null, 2);
  fs.writeFileSync('leetcode_problem.txt', jsonData);
  console.log('leetcode_problem.txt file generated successfully!');
}

// Sample LeetCode problem data
const sampleProblem = {
  id: 1,
  title: 'Two Sum',
  difficulty: 'Easy',
  description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  constraints: [
    '2 <= nums.length <= 104',
    '-109 <= nums[i] <= 109',
    '-109 <= target <= 109',
    'Only one valid answer exists.'
  ],
  example: `Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`,
  code: `function twoSum(nums, target) {
    // your code here
  }`,
  tags: ['array', 'hash table'],
  inputFormat: 'An array of integers `nums` and an integer `target`.',
  outputFormat: 'An array containing the indices of the two numbers in `nums` that add up to `target`.',
  exampleCases: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0, 1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
    }
  ],
  testCases: [
    {
      input: 'nums = [3,2,4], target = 6',
      output: '[1, 2]'
    },
    {
      input: 'nums = [3,3], target = 6',
      output: '[0, 1]'
    }
  ],
  cSolution: '// C solution here',
  cppSolution: '// C++ solution here',
  javaSolution: '// Java solution here',
  pythonSolution: 'def twoSum(nums, target):\n    # Python solution here'
};

generateLeetcodeData(sampleProblem);