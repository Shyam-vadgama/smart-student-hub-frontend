import { IStorage } from './storage';
import { User, Profile, Achievement, DynamicForm, InsertUser, InsertProfile, InsertAchievement, InsertDynamicForm, Follow, InsertFollow } from '@shared/schema';
import bcrypt from 'bcryptjs';
import UserModel from './models/User';
import ProfileModel from './models/Profile';
import AchievementModel from './models/Achievement';
import DynamicFormModel from './models/DynamicForm';
import mongoose from 'mongoose';
import FollowModel from './models/Follow';

export class MongoStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(id).populate('profile');
      if (!user) return null;
      
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role as 'student' | 'faculty' | 'hod',
        profile: user.profile ? user.profile.toString() : undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await UserModel.findOne({ email }).populate('profile');
      if (!user) return null;
      
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role as 'student' | 'faculty' | 'hod',
        profile: user.profile ? user.profile.toString() : undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      const newUser = new UserModel({
        ...user,
        password: hashedPassword
      });
      
      await newUser.save();
      
      return {
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role as 'student' | 'faculty' | 'hod',
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).populate('profile');
      
      if (!user) return null;
      
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role as 'student' | 'faculty' | 'hod',
        profile: user.profile ? user.profile.toString() : undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const users = await UserModel.find({});
      return users.map(user => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role as 'student' | 'faculty' | 'hod',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Profile methods
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const profile = await ProfileModel.findOne({ user: userId });
      if (!profile) return null;
      
      return {
        _id: profile._id.toString(),
        user: profile.user.toString(),
        semester: profile.semester,
        course: profile.course,
        batch: profile.batch,
        department: profile.department,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    try {
      const newProfile = new ProfileModel(profile);
      await newProfile.save();
      
      // Update user with profile reference
      await UserModel.findByIdAndUpdate(profile.user, { profile: newProfile._id });
      
      return {
        _id: newProfile._id.toString(),
        user: newProfile.user.toString(),
        semester: newProfile.semester,
        course: newProfile.course,
        batch: newProfile.batch,
        department: newProfile.department,
        createdAt: newProfile.createdAt,
        updatedAt: newProfile.updatedAt
      };
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const profile = await ProfileModel.findOneAndUpdate(
        { user: userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
      
      if (!profile) {
        // If profile doesn't exist, create it
        return this.createProfile({ user: userId, ...updates } as InsertProfile);
      }
      
      return {
        _id: profile._id.toString(),
        user: profile.user.toString(),
        semester: profile.semester,
        course: profile.course,
        batch: profile.batch,
        department: profile.department,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  // Achievement methods
  async getAchievement(id: string): Promise<Achievement | null> {
    try {
      const achievement = await AchievementModel.findById(id).populate('student', '_id name email');
      if (!achievement) return null;
      
      return {
        _id: achievement._id.toString(),
        student: typeof achievement.student === 'object' && achievement.student !== null ? 
          (achievement.student as any)._id.toString() : achievement.student,
        title: achievement.title,
        description: achievement.description,
        certificatePath: achievement.certificatePath,
        status: achievement.status as 'pending' | 'approved' | 'rejected',
        qrCodePath: achievement.qrCodePath,
        comments: achievement.comments.map(comment => ({
          user: typeof comment.user === 'object' && comment.user !== null ? 
            (comment.user as any)._id.toString() : comment.user,
          text: comment.text,
          createdAt: comment.createdAt
        })),
        likes: achievement.likes.map(like => like.toString()),
        // Add category and type fields
        category: achievement.category,
        type: achievement.type,
        // Add media attachments
        media: achievement.media || [],
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt
      };
    } catch (error) {
      console.error('Error getting achievement:', error);
      return null;
    }
  }

  async getAchievements(filters: any = {}): Promise<Achievement[]> {
    try {
      let query: any = {};
      
      // Apply filters
      if (filters.student) {
        query.student = filters.student;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      // Add category and type filters
      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.type) {
        query.type = filters.type;
      }
      
      const achievements = await AchievementModel.find(query)
        .populate('student', '_id name email')
        .sort({ createdAt: -1 });
      
      return achievements.map(achievement => ({
        _id: achievement._id.toString(),
        student: typeof achievement.student === 'object' && achievement.student !== null ? 
          (achievement.student as any)._id.toString() : achievement.student,
        title: achievement.title,
        description: achievement.description,
        certificatePath: achievement.certificatePath,
        status: achievement.status as 'pending' | 'approved' | 'rejected',
        qrCodePath: achievement.qrCodePath,
        comments: achievement.comments.map(comment => ({
          user: typeof comment.user === 'object' && comment.user !== null ? 
            (comment.user as any)._id.toString() : comment.user,
          text: comment.text,
          createdAt: comment.createdAt
        })),
        likes: achievement.likes.map(like => like.toString()),
        // Add category and type fields
        category: achievement.category,
        type: achievement.type,
        // Add media attachments
        media: achievement.media || [],
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt
      }));
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    try {
      const newAchievement = new AchievementModel(achievement);
      await newAchievement.save();
      
      // Populate student info
      await newAchievement.populate('student', '_id name email');
      
      return {
        _id: newAchievement._id.toString(),
        student: typeof newAchievement.student === 'object' && newAchievement.student !== null ? 
          (newAchievement.student as any)._id.toString() : newAchievement.student,
        title: newAchievement.title,
        description: newAchievement.description,
        certificatePath: newAchievement.certificatePath,
        status: newAchievement.status as 'pending' | 'approved' | 'rejected',
        qrCodePath: newAchievement.qrCodePath,
        comments: newAchievement.comments.map(comment => ({
          user: typeof comment.user === 'object' && comment.user !== null ? 
            (comment.user as any)._id.toString() : comment.user,
          text: comment.text,
          createdAt: comment.createdAt
        })),
        likes: newAchievement.likes.map(like => like.toString()),
        // Add category and type fields
        category: newAchievement.category,
        type: newAchievement.type,
        // Add media attachments
        media: newAchievement.media || [],
        createdAt: newAchievement.createdAt,
        updatedAt: newAchievement.updatedAt
      };
    } catch (error) {
      console.error('Error creating achievement:', error);
      throw error;
    }
  }

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | null> {
    try {
      const achievement = await AchievementModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).populate('student', '_id name email');
      
      if (!achievement) return null;
      
      return {
        _id: achievement._id.toString(),
        student: typeof achievement.student === 'object' && achievement.student !== null ? 
          (achievement.student as any)._id.toString() : achievement.student,
        title: achievement.title,
        description: achievement.description,
        certificatePath: achievement.certificatePath,
        status: achievement.status as 'pending' | 'approved' | 'rejected',
        qrCodePath: achievement.qrCodePath,
        comments: achievement.comments.map(comment => ({
          user: typeof comment.user === 'object' && comment.user !== null ? 
            (comment.user as any)._id.toString() : comment.user,
          text: comment.text,
          createdAt: comment.createdAt
        })),
        likes: achievement.likes.map(like => like.toString()),
        // Add category and type fields
        category: achievement.category,
        type: achievement.type,
        // Add media attachments
        media: achievement.media || [],
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt
      };
    } catch (error) {
      console.error('Error updating achievement:', error);
      return null;
    }
  }

  async deleteAchievement(id: string): Promise<boolean> {
    try {
      const result = await AchievementModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting achievement:', error);
      return false;
    }
  }

  async getAchievementsByStudent(studentId: string): Promise<Achievement[]> {
    return this.getAchievements({ student: studentId });
  }

  async getPendingAchievements(): Promise<Achievement[]> {
    return this.getAchievements({ status: 'pending' });
  }

  // Dynamic Form methods
  async getDynamicForm(id: string): Promise<DynamicForm | null> {
    try {
      const form = await DynamicFormModel.findById(id).populate('createdBy', '_id name email');
      if (!form) return null;
      
      return {
        _id: form._id.toString(),
        createdBy: typeof form.createdBy === 'object' && form.createdBy !== null ? 
          (form.createdBy as any)._id.toString() : form.createdBy,
        title: form.title,
        description: form.description,
        fields: form.fields,
        status: form.status as 'active' | 'inactive',
        submissions: form.submissions.map(submission => ({
          student: typeof submission.student === 'object' && submission.student !== null ? 
            (submission.student as any)._id.toString() : submission.student,
          data: submission.data,
          submittedAt: submission.submittedAt
        })),
        visibleFrom: form.visibleFrom,
        visibleUntil: form.visibleUntil,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      };
    } catch (error) {
      console.error('Error getting dynamic form:', error);
      return null;
    }
  }

  async getDynamicForms(filters: any = {}): Promise<DynamicForm[]> {
    try {
      let query: any = {};
      
      // Apply visibility filters for students
      if (filters.forStudent) {
        query.status = 'active';
        
        // Add date-based filtering for student visibility
        const now = new Date();
        
        // Forms that are currently visible (visibleFrom <= now <= visibleUntil)
        const dateQuery: any = {};
        
        // Build date query for forms that are currently visible
        const dateConditions: any[] = [];
        
        // visibleFrom conditions: either not set or in the past/now
        const visibleFromConditions = [
          { visibleFrom: { $exists: false } }, // No visibleFrom restriction
          { visibleFrom: { $lte: now } } // visibleFrom is in the past or now
        ];
        
        // visibleUntil conditions: either not set or in the future/now
        const visibleUntilConditions = [
          { visibleUntil: { $exists: false } }, // No visibleUntil restriction
          { visibleUntil: { $gte: now } } // visibleUntil is in the future or now
        ];
        
        // Combine conditions with $and
        dateQuery.$and = [
          { $or: visibleFromConditions },
          { $or: visibleUntilConditions }
        ];
        
        query = { ...query, ...dateQuery };
      }
      
      const forms = await DynamicFormModel.find(query)
        .populate('createdBy', '_id name email')
        .sort({ createdAt: -1 });
      
      let result = forms.map(form => ({
        _id: form._id.toString(),
        createdBy: typeof form.createdBy === 'object' && form.createdBy !== null ? 
          (form.createdBy as any)._id.toString() : form.createdBy,
        title: form.title,
        description: form.description,
        fields: form.fields,
        status: form.status as 'active' | 'inactive',
        submissions: form.submissions.map(submission => ({
          student: typeof submission.student === 'object' && submission.student !== null ? 
            (submission.student as any)._id.toString() : submission.student,
          data: submission.data,
          submittedAt: submission.submittedAt
        })),
        visibleFrom: form.visibleFrom,
        visibleUntil: form.visibleUntil,
        savedDate: form.savedDate,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      }));
      
      // Apply visibility date filtering for students
      if (filters.forStudent) {
        const now = new Date();
        result = result.filter(form => {
          // Check visibility dates
          let visibleFrom: Date | null = null;
          let visibleUntil: Date | null = null;
          
          try {
            visibleFrom = form.visibleFrom ? new Date(form.visibleFrom) : null;
            visibleUntil = form.visibleUntil ? new Date(form.visibleUntil) : null;
          } catch (e) {
            // If date parsing fails, treat as no date set
            visibleFrom = null;
            visibleUntil = null;
          }
          
          // If no visibility dates set, form is always visible
          if (!visibleFrom && !visibleUntil) return true;
          
          // Check if current date is within visibility range
          if (visibleFrom && now < visibleFrom) return false;
          if (visibleUntil && now > visibleUntil) return false;
          
          return true;
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error getting dynamic forms:', error);
      return [];
    }
  }

  async createDynamicForm(form: InsertDynamicForm): Promise<DynamicForm> {
    try {
      // Set savedDate to current time if not provided
      const formData = {
        ...form,
        savedDate: form.savedDate ? new Date(form.savedDate) : new Date()
      };
      
      const newForm = new DynamicFormModel(formData);
      await newForm.save();
      
      // Populate creator info
      await newForm.populate('createdBy', '_id name email');
      
      return {
        _id: newForm._id.toString(),
        createdBy: typeof newForm.createdBy === 'object' && newForm.createdBy !== null ? 
          (newForm.createdBy as any)._id.toString() : newForm.createdBy,
        title: newForm.title,
        description: newForm.description,
        fields: newForm.fields,
        status: newForm.status as 'active' | 'inactive',
        submissions: newForm.submissions.map(submission => ({
          student: typeof submission.student === 'object' && submission.student !== null ? 
            (submission.student as any)._id.toString() : submission.student,
          data: submission.data,
          submittedAt: submission.submittedAt
        })),
        visibleFrom: newForm.visibleFrom,
        visibleUntil: newForm.visibleUntil,
        savedDate: newForm.savedDate,
        createdAt: newForm.createdAt,
        updatedAt: newForm.updatedAt
      };
    } catch (error) {
      console.error('Error creating dynamic form:', error);
      throw error;
    }
  }

  async updateDynamicForm(id: string, updates: Partial<DynamicForm>): Promise<DynamicForm | null> {
    try {
      // Handle savedDate conversion if provided
      const updateData: any = { ...updates, updatedAt: new Date() };
      if (updates.savedDate) {
        updateData.savedDate = new Date(updates.savedDate);
      }
      
      const form = await DynamicFormModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('createdBy', '_id name email');
      
      if (!form) return null;
      
      return {
        _id: form._id.toString(),
        createdBy: typeof form.createdBy === 'object' && form.createdBy !== null ? 
          (form.createdBy as any)._id.toString() : form.createdBy,
        title: form.title,
        description: form.description,
        fields: form.fields,
        status: form.status as 'active' | 'inactive',
        submissions: form.submissions.map(submission => ({
          student: typeof submission.student === 'object' && submission.student !== null ? 
            (submission.student as any)._id.toString() : submission.student,
          data: submission.data,
          submittedAt: submission.submittedAt
        })),
        visibleFrom: form.visibleFrom,
        visibleUntil: form.visibleUntil,
        savedDate: form.savedDate,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      };
    } catch (error) {
      console.error('Error updating dynamic form:', error);
      return null;
    }
  }

  async deleteDynamicForm(id: string): Promise<boolean> {
    try {
      const result = await DynamicFormModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting dynamic form:', error);
      return false;
    }
  }

  // Form submission methods
  async submitForm(formId: string, studentId: string, data: Record<string, any>): Promise<DynamicForm | null> {
    try {
      const form = await DynamicFormModel.findById(formId);
      if (!form) return null;

      // Check if form is currently available for submission
      const now = new Date();
      
      // Check if form has visibleFrom date and if it's in the future
      if (form.visibleFrom && now < new Date(form.visibleFrom)) {
        throw new Error(`Form is not yet available. It will be available starting ${new Date(form.visibleFrom).toLocaleDateString()}.`);
      }
      
      // Check if form has visibleUntil date and if it's in the past
      if (form.visibleUntil && now > new Date(form.visibleUntil)) {
        throw new Error(`Form has expired. The submission deadline was ${new Date(form.visibleUntil).toLocaleDateString()}.`);
      }

      // Check if form is active
      if (form.status !== 'active') {
        throw new Error('Form is not currently active.');
      }

      // Check if student has already submitted this form
      const existingSubmission = form.submissions.find((submission: any) => {
        const submissionStudentId = typeof submission.student === 'object' 
          ? submission.student._id.toString() 
          : submission.student.toString();
        return submissionStudentId === studentId;
      });

      if (existingSubmission) {
        throw new Error('You have already submitted this form.');
      }

      // Add the submission
      form.submissions.push({
        student: studentId,
        data,
        submittedAt: new Date()
      });

      await form.save();

      // Return the updated form with populated data
      await form.populate('createdBy', '_id name email');
      return {
        _id: form._id.toString(),
        createdBy: typeof form.createdBy === 'object' && form.createdBy !== null ? 
          (form.createdBy as any)._id.toString() : form.createdBy,
        title: form.title,
        description: form.description,
        fields: form.fields,
        status: form.status as 'active' | 'inactive',
        submissions: form.submissions.map(submission => ({
          student: typeof submission.student === 'object' && submission.student !== null ? 
            (submission.student as any)._id.toString() : submission.student,
          data: submission.data,
          submittedAt: submission.submittedAt
        })),
        visibleFrom: form.visibleFrom,
        visibleUntil: form.visibleUntil,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      };
    } catch (error) {
      console.error('Error submitting form:', error);
      return null;
    }
  }

  async getFormSubmissions(formId: string): Promise<DynamicForm | null> {
    try {
      const form = await DynamicFormModel.findById(formId).populate('createdBy', '_id name email').populate('submissions.student', '_id name email');
      if (!form) return null;

      return {
        _id: form._id.toString(),
        createdBy: typeof form.createdBy === 'object' && form.createdBy !== null ? 
          (form.createdBy as any)._id.toString() : form.createdBy,
        title: form.title,
        description: form.description,
        fields: form.fields,
        status: form.status as 'active' | 'inactive',
        submissions: form.submissions.map(submission => ({
          student: typeof submission.student === 'object' && submission.student !== null ? 
            (submission.student as any)._id.toString() : submission.student,
          data: submission.data,
          submittedAt: submission.submittedAt
        })),
        visibleFrom: form.visibleFrom,
        visibleUntil: form.visibleUntil,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      };
    } catch (error) {
      console.error('Error getting form submissions:', error);
      return null;
    }
  }

  // Analytics methods
  async getAnalytics(): Promise<any> {
    try {
      const totalStudents = await UserModel.countDocuments({ role: 'student' });
      const totalAchievements = await AchievementModel.countDocuments();
      const pendingReviews = await AchievementModel.countDocuments({ status: 'pending' });
      const approvedAchievements = await AchievementModel.countDocuments({ status: 'approved' });
      
      const approvalRate = totalAchievements > 0 ? (approvedAchievements / totalAchievements) * 100 : 0;

      // Department breakdown
      const profiles = await ProfileModel.find({}).populate('user', 'role');
      const departmentBreakdown = profiles
        .filter(profile => (profile.user as any).role === 'student')
        .reduce((acc: any[], profile) => {
          const department = profile.department || 'Unknown';
          
          const existing = acc.find(d => d._id === department);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ _id: department, count: 1 });
          }
          
          return acc;
        }, [])
        .sort((a, b) => b.count - a.count);

      return {
        totalStudents,
        totalAchievements,
        pendingReviews,
        approvalRate: Math.round(approvalRate * 10) / 10,
        departmentBreakdown
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  // Follow methods
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    try {
      // Check if already following
      const existingFollow = await FollowModel.findOne({ 
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });
      
      if (existingFollow) {
        throw new Error('Already following this user');
      }
      
      // Create follow relationship
      const follow = new FollowModel({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });
      
      await follow.save();
      
      return {
        _id: (follow._id as mongoose.Types.ObjectId).toString(),
        follower: follow.follower.toString(),
        following: follow.following.toString(),
        createdAt: follow.createdAt
      };
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const result = await FollowModel.deleteOne({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  async getFollowers(userId: string): Promise<User[]> {
    try {
      const follows = await FollowModel.find({
        following: new mongoose.Types.ObjectId(userId)
      }).populate('follower', '_id name email role');
      
      return follows.map(follow => {
        const follower = follow.follower as any;
        return {
          _id: follower._id.toString(),
          name: follower.name,
          email: follower.email,
          password: '', // Don't expose password
          role: follower.role,
          createdAt: follower.createdAt,
          updatedAt: follower.updatedAt
        };
      });
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  async getFollowing(userId: string): Promise<User[]> {
    try {
      const follows = await FollowModel.find({
        follower: new mongoose.Types.ObjectId(userId)
      }).populate('following', '_id name email role');
      
      return follows.map(follow => {
        const following = follow.following as any;
        return {
          _id: following._id.toString(),
          name: following.name,
          email: following.email,
          password: '', // Don't expose password
          role: following.role,
          createdAt: following.createdAt,
          updatedAt: following.updatedAt
        };
      });
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const follow = await FollowModel.findOne({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });
      
      return !!follow;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }
}