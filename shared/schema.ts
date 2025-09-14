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
  // Add category and type fields
  category?: string;
  type?: string;
  // Add media attachments
  media?: Array<{
    url: string;
    publicId: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
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
  // Add visibility dates (as strings since they come from the frontend as ISO strings)
  visibleFrom?: string;
  visibleUntil?: string;
  // Add saved date field
  savedDate?: string;
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
  // Add category and type fields
  category?: string;
  type?: string;
  // Add media attachments
  media?: Array<{
    url: string;
    publicId: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
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
  // Add visibility dates (as strings since they come from the frontend as ISO strings)
  visibleFrom?: string;
  visibleUntil?: string;
  // Add saved date field
  savedDate?: string;
}

// Add Follow interface
export interface Follow {
  _id: string;
  follower: string; // The user who is following
  following: string; // The user being followed
  createdAt: Date;
}

export interface InsertFollow {
  follower: string;
  following: string;
}
