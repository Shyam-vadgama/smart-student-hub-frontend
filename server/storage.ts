import { User, Profile, Achievement, DynamicForm, InsertUser, InsertProfile, InsertAchievement, InsertDynamicForm } from "@shared/schema";
import bcrypt from 'bcryptjs';

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;

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

  // Analytics methods
  getAnalytics(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private profiles: Map<string, Profile> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private dynamicForms: Map<string, DynamicForm> = new Map();
  private nextId = 1;

  private generateId(): string {
    return (this.nextId++).toString();
  }

  // User methods
  async getUser(id: string): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    // Add profile if exists
    const profile = Array.from(this.profiles.values()).find(p => p.user === id);
    return { ...user, profile: profile?._id };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) return null;
    
    const profile = Array.from(this.profiles.values()).find(p => p.user === user._id);
    return { ...user, profile: profile?._id };
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const id = this.generateId();
    const now = new Date();
    
    const newUser: User = {
      _id: id,
      ...user,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    };
    
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Profile methods
  async getProfile(userId: string): Promise<Profile | null> {
    return Array.from(this.profiles.values()).find(p => p.user === userId) || null;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const id = this.generateId();
    const now = new Date();
    
    const newProfile: Profile = {
      _id: id,
      ...profile,
      createdAt: now,
      updatedAt: now
    };
    
    this.profiles.set(id, newProfile);
    
    // Update user with profile reference
    const user = this.users.get(profile.user);
    if (user) {
      this.users.set(profile.user, { ...user, profile: id });
    }
    
    return newProfile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    let profile = Array.from(this.profiles.values()).find(p => p.user === userId);
    
    if (!profile) {
      // Create if doesn't exist
      return this.createProfile({ user: userId, ...updates });
    }
    
    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date()
    };
    
    this.profiles.set(profile._id, updatedProfile);
    return updatedProfile;
  }

  // Achievement methods
  async getAchievement(id: string): Promise<Achievement | null> {
    const achievement = this.achievements.get(id);
    if (!achievement) return null;
    
    // Populate student info
    const student = this.users.get(achievement.student);
    if (student) {
      return {
        ...achievement,
        student: { _id: student._id, name: student.name, email: student.email } as any
      };
    }
    
    return achievement;
  }

  async getAchievements(filters: any = {}): Promise<Achievement[]> {
    let achievements = Array.from(this.achievements.values());
    
    // Apply filters
    if (filters.student) {
      achievements = achievements.filter(a => a.student === filters.student);
    }
    if (filters.status) {
      achievements = achievements.filter(a => a.status === filters.status);
    }
    
    // Populate student info and sort by creation date
    return achievements
      .map(achievement => {
        const student = this.users.get(achievement.student);
        return {
          ...achievement,
          student: student ? { _id: student._id, name: student.name, email: student.email } as any : achievement.student
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.generateId();
    const now = new Date();
    
    const newAchievement: Achievement = {
      _id: id,
      ...achievement,
      status: 'pending',
      comments: [],
      likes: [],
      createdAt: now,
      updatedAt: now
    };
    
    this.achievements.set(id, newAchievement);
    
    // Return with populated student info
    const student = this.users.get(achievement.student);
    return {
      ...newAchievement,
      student: student ? { _id: student._id, name: student.name, email: student.email } as any : achievement.student
    };
  }

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | null> {
    const achievement = this.achievements.get(id);
    if (!achievement) return null;
    
    const updatedAchievement = {
      ...achievement,
      ...updates,
      updatedAt: new Date()
    };
    
    this.achievements.set(id, updatedAchievement);
    
    // Return with populated student info
    const student = this.users.get(updatedAchievement.student);
    return {
      ...updatedAchievement,
      student: student ? { _id: student._id, name: student.name, email: student.email } as any : updatedAchievement.student
    };
  }

  async deleteAchievement(id: string): Promise<boolean> {
    return this.achievements.delete(id);
  }

  async getAchievementsByStudent(studentId: string): Promise<Achievement[]> {
    return this.getAchievements({ student: studentId });
  }

  async getPendingAchievements(): Promise<Achievement[]> {
    return this.getAchievements({ status: 'pending' });
  }

  // Dynamic Form methods
  async getDynamicForm(id: string): Promise<DynamicForm | null> {
    const form = this.dynamicForms.get(id);
    if (!form) return null;
    
    // Populate creator info
    const creator = this.users.get(form.createdBy);
    if (creator) {
      return {
        ...form,
        createdBy: { _id: creator._id, name: creator.name, email: creator.email } as any
      };
    }
    
    return form;
  }

  async getDynamicForms(filters: any = {}): Promise<DynamicForm[]> {
    const forms = Array.from(this.dynamicForms.values());
    
    // Populate creator info and sort by creation date
    return forms
      .map(form => {
        const creator = this.users.get(form.createdBy);
        return {
          ...form,
          createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } as any : form.createdBy
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createDynamicForm(form: InsertDynamicForm): Promise<DynamicForm> {
    const id = this.generateId();
    const now = new Date();
    
    const newForm: DynamicForm = {
      _id: id,
      ...form,
      status: 'active',
      submissions: [],
      createdAt: now,
      updatedAt: now
    };
    
    this.dynamicForms.set(id, newForm);
    
    // Return with populated creator info
    const creator = this.users.get(form.createdBy);
    return {
      ...newForm,
      createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } as any : form.createdBy
    };
  }

  async updateDynamicForm(id: string, updates: Partial<DynamicForm>): Promise<DynamicForm | null> {
    const form = this.dynamicForms.get(id);
    if (!form) return null;
    
    const updatedForm = {
      ...form,
      ...updates,
      updatedAt: new Date()
    };
    
    this.dynamicForms.set(id, updatedForm);
    
    // Return with populated creator info
    const creator = this.users.get(updatedForm.createdBy);
    return {
      ...updatedForm,
      createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } as any : updatedForm.createdBy
    };
  }

  async deleteDynamicForm(id: string): Promise<boolean> {
    return this.dynamicForms.delete(id);
  }

  // Analytics methods
  async getAnalytics(): Promise<any> {
    const users = Array.from(this.users.values());
    const achievements = Array.from(this.achievements.values());
    
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalAchievements = achievements.length;
    const pendingReviews = achievements.filter(a => a.status === 'pending').length;
    const approvedAchievements = achievements.filter(a => a.status === 'approved').length;
    
    const approvalRate = totalAchievements > 0 ? (approvedAchievements / totalAchievements) * 100 : 0;

    // Department breakdown
    const students = users.filter(u => u.role === 'student');
    const departmentBreakdown = students.reduce((acc: any[], student) => {
      const profile = Array.from(this.profiles.values()).find(p => p.user === student._id);
      const department = profile?.department || 'Unknown';
      
      const existing = acc.find(d => d._id === department);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ _id: department, count: 1 });
      }
      
      return acc;
    }, []).sort((a, b) => b.count - a.count);

    return {
      totalStudents,
      totalAchievements,
      pendingReviews,
      approvalRate: Math.round(approvalRate * 10) / 10,
      departmentBreakdown
    };
  }
}

export const storage = new MemStorage();
