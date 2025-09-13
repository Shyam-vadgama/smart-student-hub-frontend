// Shared types for the Smart Student Hub application
export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'faculty' | 'hod';
  profile?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  _id: string;
  user: string;
  semester?: number;
  course?: string;
  batch?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  _id: string;
  student: string;
  title: string;
  description: string;
  certificatePath?: string;
  status: 'pending' | 'approved' | 'rejected';
  qrCodePath?: string;
  comments: Array<{
    user: string;
    text: string;
    createdAt: Date;
  }>;
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DynamicForm {
  _id: string;
  createdBy: string;
  title: string;
  description?: string;
  fields: Array<{
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
  }>;
  status: 'active' | 'inactive';
  submissions: Array<{
    student: string;
    data: Record<string, any>;
    submittedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertUser {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'faculty' | 'hod';
}

export interface InsertProfile {
  user: string;
  semester?: number;
  course?: string;
  batch?: string;
  department?: string;
}

export interface InsertAchievement {
  student: string;
  title: string;
  description: string;
  certificatePath?: string;
}

export interface InsertDynamicForm {
  createdBy: string;
  title: string;
  description?: string;
  fields: Array<{
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
  }>;
}
