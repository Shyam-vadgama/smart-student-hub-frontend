
import mongoose from 'mongoose';
import { ProblemModel } from './ProblemModel.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dynamicmern', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const dummyProblem = {
  title: "Dummy Sum Problem",
  description: "Given two integers a and b, return their sum.",
  difficulty: "easy",
  constraints: [
    "-1000 <= a, b <= 1000",
  ],
  input_format: "The first line contains two space-separated integers a and b.",
  output_format: "Print the sum of a and b.",
  example_cases: [
    {
      input: "2 3",
      output: "5",
      explanation: "2 + 3 = 5"
    },
    {
      input: "10 -5",
      output: "5",
      explanation: "10 + (-5) = 5"
    }
  ],
  test_cases: [
    {
      input: "2 3",
      output: "5"
    },
    {
      input: "10 -5",
      output: "5"
    },
    {
      input: "100 200",
      output: "300"
    }
  ],
  solution: {
    c: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\n", a + b);
    return 0;
}`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
    java: `import java.util.Scanner;

class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`,
    python: `a, b = map(int, input().split())
print(a + b)`
  }
};

// Function to seed the database
const addDummy = async () => {
  try {
    const problem = await ProblemModel.findOne({ title: dummyProblem.title });
    if (problem) {
        console.log("Dummy problem already exists");
        return;
    }
    // Insert sample problems
    const insertedProblem = await ProblemModel.create(dummyProblem);
    console.log(`Successfully inserted dummy problem: ${insertedProblem.title}`);

  } catch (error) {
    console.error('Error seeding problems:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await addDummy();
  mongoose.connection.close();
  console.log('Database seeding completed');
};

// Run the script
main().catch(console.error);

