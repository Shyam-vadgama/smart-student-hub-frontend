import mongoose, { Document, Schema } from 'mongoose';

interface IExampleCase {
  input: string;
  output: string;
  explanation?: string;
}

interface ISolution {   
  c?: string;
  cpp?: string;
  java?: string;
  python?: string;
}

interface ITestCase {
  input: string;
  output: string;
}

interface IProblem extends Document {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  constraints: string[];
  example_cases: IExampleCase[];
  test_cases: ITestCase[];
  solution: ISolution;
  input_format: string;
  output_format: string;
}

const exampleCaseSchema = new Schema<IExampleCase>({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    default: ""
  }
});

const solutionSchema = new Schema<ISolution>({
  c: {
    type: String,
    default: ""
  },
  cpp: {
    type: String,
    default: ""
  },
  java: {
    type: String,
    default: ""
  },
  python: {
    type: String,
    default: ""
  }
});

const testCaseSchema = new Schema<ITestCase>({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  }
});

const problemSchema = new Schema<IProblem>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true
  },
  category: {
    type: String,
    enum: [
      'problem solving',
      'brainstorming',
      'programming',
      'dsa',
      'web development',
      'interview prep',
      'other'
    ],
    default: 'programming',
    required: true
  },
  constraints: {
    type: [String],
    required: true
  },
  example_cases: {
    type: [exampleCaseSchema],
    required: true
  },
  test_cases: {
    type: [testCaseSchema],
    required: true
  },
  solution: {
    type: solutionSchema,
    required: true
  },
  input_format: {
    type: String,
    required: true
  },
  output_format: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const ProblemModel = mongoose.model<IProblem>('Problem', problemSchema);
export { IProblem, IExampleCase, ISolution, ITestCase };
