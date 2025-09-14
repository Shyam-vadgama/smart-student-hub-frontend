import mongoose from 'mongoose';
import { ProblemModel } from './ProblemModel.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamicmern', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample problems data
const sampleProblems = [
  {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    difficulty: "easy",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    input_format: "The first line contains an integer n, the size of the array. The second line contains n space-separated integers representing the array elements. The third line contains the target sum.",
    output_format: "Print two space-separated integers representing the indices of the two numbers that add up to the target.",
    example_cases: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "3\n3 2 4\n6",
        output: "1 2",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    test_cases: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1"
      },
      {
        input: "3\n3 2 4\n6",
        output: "1 2"
      },
      {
        input: "2\n3 3\n6",
        output: "0 1"
      }
    ],
    solution: {
      c: `#include <stdio.h>
#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    return result;
}`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      python: `def twoSum(nums, target):
    hashmap = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hashmap:
            return [hashmap[complement], i]
        hashmap[num] = i
    return []`
    }
  },
  {
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.",
    difficulty: "easy",
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character."
    ],
    input_format: "The first line contains an integer n, the length of the string. The second line contains the string s.",
    output_format: "Print the reversed string.",
    example_cases: [
      {
        input: "5\nhello",
        output: "olleh",
        explanation: "The string 'hello' reversed is 'olleh'."
      },
      {
        input: "6\nHannah",
        output: "hannaH",
        explanation: "The string 'Hannah' reversed is 'hannaH'."
      }
    ],
    test_cases: [
      {
        input: "5\nhello",
        output: "olleh"
      },
      {
        input: "6\nHannah",
        output: "hannaH"
      },
      {
        input: "1\na",
        output: "a"
      }
    ],
    solution: {
      c: `#include <stdio.h>
#include <string.h>

void reverseString(char* s, int sSize) {
    int left = 0, right = sSize - 1;
    while (left < right) {
        char temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        left++;
        right--;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    void reverseString(vector<char>& s) {
        int left = 0, right = s.size() - 1;
        while (left < right) {
            swap(s[left], s[right]);
            left++;
            right--;
        }
    }
};`,
      java: `class Solution {
    public void reverseString(char[] s) {
        int left = 0, right = s.length - 1;
        while (left < right) {
            char temp = s[left];
            s[left] = s[right];
            s[right] = temp;
            left++;
            right--;
        }
    }
}`,
      python: `def reverseString(s):
    left, right = 0, len(s) - 1
    while left < right:
        s[left], s[right] = s[right], s[left]
        left += 1
        right -= 1`
    }
  },
  {
    title: "Valid Parentheses",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: 1. Open brackets must be closed by the same type of brackets. 2. Open brackets must be closed in the correct order. 3. Every close bracket has a corresponding open bracket of the same type.",
    difficulty: "easy",
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    input_format: "The first line contains a string s consisting of parentheses.",
    output_format: "Print 'true' if the string is valid, 'false' otherwise.",
    example_cases: [
      {
        input: "()",
        output: "true",
        explanation: "The string contains valid parentheses."
      },
      {
        input: "()[]{}",
        output: "true",
        explanation: "All brackets are properly closed."
      },
      {
        input: "(]",
        output: "false",
        explanation: "The closing bracket doesn't match the opening bracket."
      }
    ],
    test_cases: [
      {
        input: "()",
        output: "true"
      },
      {
        input: "()[]{}",
        output: "true"
      },
      {
        input: "(]",
        output: "false"
      },
      {
        input: "([)]",
        output: "false"
      }
    ],
    solution: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool isValid(char* s) {
    int len = strlen(s);
    char* stack = (char*)malloc(len * sizeof(char));
    int top = -1;
    
    for (int i = 0; i < len; i++) {
        if (s[i] == '(' || s[i] == '[' || s[i] == '{') {
            stack[++top] = s[i];
        } else {
            if (top == -1) return false;
            char open = stack[top--];
            if ((s[i] == ')' && open != '(') ||
                (s[i] == ']' && open != '[') ||
                (s[i] == '}' && open != '{')) {
                return false;
            }
        }
    }
    return top == -1;
}`,
      cpp: `#include <stack>
#include <string>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '[' || c == '{') {
                st.push(c);
            } else {
                if (st.empty()) return false;
                char open = st.top();
                st.pop();
                if ((c == ')' && open != '(') ||
                    (c == ']' && open != '[') ||
                    (c == '}' && open != '{')) {
                    return false;
                }
            }
        }
        return st.empty();
    }
};`,
      java: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char open = stack.pop();
                if ((c == ')' && open != '(') ||
                    (c == ']' && open != '[') ||
                    (c == '}' && open != '{')) {
                    return false;
                }
            }
        }
        return stack.isEmpty();
    }
}`,
      python: `def isValid(s):
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    
    for char in s:
        if char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            stack.append(char)
    
    return not stack`
    }
  },
  {
    title: "Maximum Subarray",
    description: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum. A subarray is a contiguous part of an array.",
    difficulty: "medium",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4"
    ],
    input_format: "The first line contains an integer n, the size of the array. The second line contains n space-separated integers representing the array elements.",
    output_format: "Print the maximum sum of any contiguous subarray.",
    example_cases: [
      {
        input: "9\n-2 1 -3 4 -1 2 1 -5 4",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6."
      },
      {
        input: "1\n1",
        output: "1",
        explanation: "The subarray [1] has the largest sum 1."
      }
    ],
    test_cases: [
      {
        input: "9\n-2 1 -3 4 -1 2 1 -5 4",
        output: "6"
      },
      {
        input: "1\n1",
        output: "1"
      },
      {
        input: "5\n5 4 -1 7 8",
        output: "23"
      }
    ],
    solution: {
      c: `#include <stdio.h>
#include <limits.h>

int maxSubArray(int* nums, int numsSize) {
    int maxSum = nums[0];
    int currentSum = nums[0];
    
    for (int i = 1; i < numsSize; i++) {
        currentSum = (currentSum > 0) ? currentSum + nums[i] : nums[i];
        maxSum = (currentSum > maxSum) ? currentSum : maxSum;
    }
    
    return maxSum;
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxSum = nums[0];
        int currentSum = nums[0];
        
        for (int i = 1; i < nums.size(); i++) {
            currentSum = max(nums[i], currentSum + nums[i]);
            maxSum = max(maxSum, currentSum);
        }
        
        return maxSum;
    }
};`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        int maxSum = nums[0];
        int currentSum = nums[0];
        
        for (int i = 1; i < nums.length; i++) {
            currentSum = Math.max(nums[i], currentSum + nums[i]);
            maxSum = Math.max(maxSum, currentSum);
        }
        
        return maxSum;
    }
}`,
      python: `def maxSubArray(nums):
    max_sum = current_sum = nums[0]
    
    for i in range(1, len(nums)):
        current_sum = max(nums[i], current_sum + nums[i])
        max_sum = max(max_sum, current_sum)
    
    return max_sum`
    }
  },
  {
    title: "Binary Tree Inorder Traversal",
    description: "Given the root of a binary tree, return the inorder traversal of its nodes' values. In inorder traversal, we visit the left subtree, then the root, then the right subtree.",
    difficulty: "easy",
    constraints: [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100"
    ],
    input_format: "The first line contains an integer n, the number of nodes. The next n lines contain the node values in level order (use -1 for null nodes).",
    output_format: "Print the inorder traversal of the tree.",
    example_cases: [
      {
        input: "3\n1\n-1\n2",
        output: "1 2",
        explanation: "The tree has root 1, no left child, and right child 2. Inorder: 1, 2."
      },
      {
        input: "1\n1",
        output: "1",
        explanation: "The tree has only root node 1."
      }
    ],
    test_cases: [
      {
        input: "3\n1\n-1\n2",
        output: "1 2"
      },
      {
        input: "1\n1",
        output: "1"
      },
      {
        input: "0",
        output: " "
      }
    ],
    solution: {
      c: `#include <stdio.h>
#include <stdlib.h>

struct TreeNode {
    int val;
    struct TreeNode *left;
    struct TreeNode *right;
};

void inorderHelper(struct TreeNode* root, int* result, int* index) {
    if (root == NULL) return;
    inorderHelper(root->left, result, index);
    result[(*index)++] = root->val;
    inorderHelper(root->right, result, index);
}

int* inorderTraversal(struct TreeNode* root, int* returnSize) {
    *returnSize = 0;
    int* result = (int*)malloc(100 * sizeof(int));
    inorderHelper(root, result, returnSize);
    return result;
}`,
      cpp: `#include <vector>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        vector<int> result;
        inorderHelper(root, result);
        return result;
    }
    
private:
    void inorderHelper(TreeNode* root, vector<int>& result) {
        if (root == nullptr) return;
        inorderHelper(root->left, result);
        result.push_back(root->val);
        inorderHelper(root->right, result);
    }
};`,
      java: `import java.util.*;

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        inorderHelper(root, result);
        return result;
    }
    
    private void inorderHelper(TreeNode root, List<Integer> result) {
        if (root == null) return;
        inorderHelper(root.left, result);
        result.add(root.val);
        inorderHelper(root.right, result);
    }
}`,
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorderTraversal(root):
    result = []
    
    def inorderHelper(node):
        if not node:
            return
        inorderHelper(node.left)
        result.append(node.val)
        inorderHelper(node.right)
    
    inorderHelper(root)
    return result`
    }
  }
];

// Function to seed the database
const seedProblems = async () => {
  try {
    // Clear existing problems
    await ProblemModel.deleteMany({});
    console.log('Cleared existing problems');

    // Insert sample problems
    const insertedProblems = await ProblemModel.insertMany(sampleProblems);
    console.log(`Successfully inserted ${insertedProblems.length} problems`);

    // List the inserted problems
    insertedProblems.forEach((problem, index) => {
      console.log(`${index + 1}. ${problem.title} (${problem.difficulty})`);
    });

  } catch (error) {
    console.error('Error seeding problems:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await seedProblems();
  mongoose.connection.close();
  console.log('Database seeding completed');
};

// Run the script
main().catch(console.error);

export { seedProblems, sampleProblems };
