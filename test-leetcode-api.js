// Simple test script to verify LeetCode API endpoints
const testLeetCodeAPI = async () => {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('Testing LeetCode API endpoints...\n');
    
    // Test 1: Get all problems
    console.log('1. Testing GET /api/leetcode/problems');
    const problemsResponse = await fetch(`${baseURL}/api/leetcode/problems`);
    const problemsData = await problemsResponse.json();
    
    if (problemsResponse.ok) {
      console.log('✅ Success:', problemsData.message);
      console.log(`   Found ${problemsData.data.length} problems`);
      problemsData.data.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem.title} (${problem.difficulty})`);
      });
    } else {
      console.log('❌ Error:', problemsData.message);
    }
    
    console.log('\n2. Testing GET /api/leetcode/problems/:id');
    if (problemsData.data && problemsData.data.length > 0) {
      const firstProblemId = problemsData.data[0]._id;
      const problemResponse = await fetch(`${baseURL}/api/leetcode/problems/${firstProblemId}`);
      const problemData = await problemResponse.json();
      
      if (problemResponse.ok) {
        console.log('✅ Success:', problemData.message);
        console.log(`   Problem: ${problemData.data.title}`);
        console.log(`   Difficulty: ${problemData.data.difficulty}`);
      } else {
        console.log('❌ Error:', problemData.message);
      }
    }
    
    console.log('\n3. Testing POST /api/leetcode/problems/create (without auth - should fail)');
    const createResponse = await fetch(`${baseURL}/api/leetcode/problems/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Problem',
        description: 'This is a test problem',
        difficulty: 'easy'
      })
    });
    
    if (createResponse.status === 401) {
      console.log('✅ Success: Authentication required (as expected)');
    } else {
      const createData = await createResponse.json();
      console.log('❌ Unexpected response:', createData);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('Make sure the server is running on http://localhost:5000');
  }
};

// Run the test
testLeetCodeAPI();
