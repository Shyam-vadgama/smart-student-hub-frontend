// Shared types for the Smart Student Hub application
export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'faculty' | 'hod' | 'principal' | 'shiksan_mantri';
  department?: string;
  profile?: string;
  college?: string;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
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
  role: 'student' | 'faculty' | 'hod' | 'principal' | 'shiksan_mantri';
  department?: string;
  college?: string;
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

export interface College {
  _id: string;
  name: string;
  address: string;
  principal: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertCollege {
  name: string;
  address: string;
  principal?: string;
}

export interface Subject {
  _id: string;
  name: string;
  faculty: string;
  classroom: string;
  department: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertSubject {
  name: string;
  faculty: string;
  classroom: string;
  department: string;
}

export interface Marks {
  _id: string;
  student: string;
  subject: string;
  marks: number;
  examType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertMarks {
  student: string;
  subject: string;
  marks: number;
  examType: string;
}

export interface Attendance {
  _id: string;
  student: string;
  subject: string;
  date: Date;
  status: 'present' | 'absent';
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertAttendance {
  student: string;
  subject: string;
  date: Date;
  status: 'present' | 'absent';
}

export interface Timetable {
  _id: string;
  college: string;
  department: string;
  semester: number;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    classroom: string;
    faculty: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertTimetable {
  college: string;
  department: string;
  semester: number;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    classroom: string;
    faculty: string;
  }>;
}
