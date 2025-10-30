import { User, Profile, Achievement, DynamicForm, InsertUser, InsertProfile, InsertAchievement, InsertDynamicForm, Follow, InsertFollow, College, InsertCollege } from "@shared/schema";
import bcrypt from 'bcryptjs';
import { MongoStorage } from './mongoStorage';

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  getUsers(): Promise<User[]>;

  // Profile methods
  getProfile(userId: string): Promise<Profile | null>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null>;

  // Achievement methods
  getAchievement(id: string): Promise<Achievement | null>;
  getAchievements(filters?: any): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | null>;
  deleteAchievement(id: string): Promise<boolean>;
  getAchievementsByStudent(studentId: string): Promise<Achievement[]>;
  getPendingAchievements(): Promise<Achievement[]>;

  // Dynamic Form methods
  getDynamicForm(id: string): Promise<DynamicForm | null>;
  getDynamicForms(filters?: any): Promise<DynamicForm[]>;
  createDynamicForm(form: InsertDynamicForm): Promise<DynamicForm>;
  updateDynamicForm(id: string, updates: Partial<DynamicForm>): Promise<DynamicForm | null>;
  deleteDynamicForm(id: string): Promise<boolean>;
  // Add form submission methods
  submitForm(formId: string, studentId: string, data: Record<string, any>): Promise<DynamicForm | null>;
  getFormSubmissions(formId: string): Promise<DynamicForm | null>;

  // Analytics methods
  getAnalytics(): Promise<any>;

  // Follow methods
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  // College methods
  createCollege(college: InsertCollege): Promise<College>;
  getColleges(): Promise<College[]>;
  getCollege(id: string): Promise<College | null>;
}

// Export the MongoDB storage instance instead of the in-memory storage
export const storage = new MongoStorage();