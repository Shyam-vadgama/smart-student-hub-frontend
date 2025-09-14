import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { authMiddleware, optionalAuth } from './middleware/auth';
import { checkRole, checkOwnership } from './middleware/role';
import { upload, formUpload } from './middleware/upload';
import { cloudinaryUpload } from './middleware/cloudinaryUpload';
import { generateQRCode, generateVerificationURL } from './utils/qrCode';
import path from 'path';
import archiver from 'archiver';
import DynamicFormModel from './models/DynamicForm';
import UserModel from './models/User';
import problemRoutes from './routes/leetcode/problemRoutes';

interface AuthRequest extends Request {
  user?: any;
  studentFilter?: any;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Using in-memory storage for compatibility

  // Authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const { name, email, password, role = 'student' } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create user
      const user = await storage.createUser({ name, email, password, role });

      // Create profile for students
      if (role === 'student') {
        await storage.createProfile({ user: user._id });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      // Set cookie with proper settings for development
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      // Set cookie with proper settings for development
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ message: 'Logged out successfully' });
  });

  app.get('/api/user', optionalAuth, (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Fetch the full user object with profile
    storage.getUser(req.user._id).then(fullUser => {
      res.json({
        _id: fullUser?._id || req.user._id,
        name: fullUser?.name || req.user.name,
        email: fullUser?.email || req.user.email,
        role: fullUser?.role || req.user.role,
        profile: fullUser?.profile || req.user.profile
      });
    }).catch(() => {
      // Fallback to request user if storage fetch fails
      res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profile: req.user.profile
      });
    });
  });

  // Profile routes
  app.get('/api/profile', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const profile = await storage.getProfile(req.user._id);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching profile' });
    }
  });

  app.put('/api/profile', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const profile = await storage.updateProfile(req.user._id, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile' });
    }
  });

  // Achievement routes
  app.get('/api/achievements', authMiddleware, checkOwnership, async (req: AuthRequest, res) => {
    try {
      const filters = req.studentFilter || {};
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.category) {
        filters.category = req.query.category;
      }
      if (req.query.type) {
        filters.type = req.query.type;
      }
      
      const achievements = await storage.getAchievements(filters);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching achievements' });
    }
  });

  app.get('/api/achievements/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const achievement = await storage.getAchievement(req.params.id);
      if (!achievement) {
        return res.status(404).json({ message: 'Achievement not found' });
      }

      // Check if user can access this achievement
      if (req.user.role === 'student') {
        const studentId = typeof achievement.student === 'string' ? achievement.student : (achievement.student as any)._id;
        if (studentId !== req.user._id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      res.json(achievement);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching achievement' });
    }
  });

  app.post('/api/achievements', authMiddleware, checkRole(['student']), upload.single('certificate'), cloudinaryUpload.array('media', 5), async (req: AuthRequest, res) => {
    try {
      const { title, description, category, type } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
      }

      // Process media files if any
      let media: Array<{
        url: string;
        publicId: string;
        type: 'image' | 'video';
        caption: string;
      }> = [];
      if (req.files && Array.isArray(req.files)) {
        media = req.files.map((file: any) => ({
          url: file.path,
          publicId: file.filename,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          caption: ''
        }));
      }

      const achievementData = {
        student: req.user._id,
        title,
        description,
        certificatePath: req.file ? req.file.path : undefined,
        // Add category and type fields
        category,
        type,
        // Add media attachments
        media
      };

      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      console.error('Error creating achievement:', error);
      res.status(500).json({ message: 'Error creating achievement' });
    }
  });

  app.put('/api/achievements/:id/status', authMiddleware, checkRole(['faculty', 'hod']), async (req: AuthRequest, res) => {
    try {
      const { status, comment } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const updates: any = { status };

      // Add comment if provided
      if (comment) {
        const achievement = await storage.getAchievement(req.params.id);
        if (!achievement) {
          return res.status(404).json({ message: 'Achievement not found' });
        }

        updates.comments = [
          ...achievement.comments,
          {
            user: req.user._id,
            text: comment,
            createdAt: new Date()
          }
        ];
      }

      // Generate QR code if approved
      if (status === 'approved') {
        try {
          const verificationURL = generateVerificationURL(req.params.id);
          const qrCodePath = await generateQRCode(verificationURL, `achievement-${req.params.id}`);
          updates.qrCodePath = qrCodePath;
        } catch (qrError) {
          console.error('QR code generation failed:', qrError);
          // Continue without QR code if generation fails
        }
      }

      const achievement = await storage.updateAchievement(req.params.id, updates);
      res.json(achievement);
    } catch (error) {
      console.error('Error updating achievement status:', error);
      res.status(500).json({ message: 'Error updating achievement status' });
    }
  });

  app.post('/api/achievements/:id/comments', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: 'Comment text is required' });
      }

      const achievement = await storage.getAchievement(req.params.id);
      if (!achievement) {
        return res.status(404).json({ message: 'Achievement not found' });
      }

      const updatedComments = [
        ...achievement.comments,
        {
          user: req.user._id,
          text,
          createdAt: new Date()
        }
      ];

      const updatedAchievement = await storage.updateAchievement(req.params.id, {
        comments: updatedComments
      });

      res.json(updatedAchievement);
    } catch (error) {
      res.status(500).json({ message: 'Error adding comment' });
    }
  });

  app.post('/api/achievements/:id/like', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const achievement = await storage.getAchievement(req.params.id);
      if (!achievement) {
        return res.status(404).json({ message: 'Achievement not found' });
      }

      const likes = achievement.likes || [];
      const userLiked = likes.includes(req.user._id);
      
      let updatedLikes;
      if (userLiked) {
        updatedLikes = likes.filter(id => id !== req.user._id);
      } else {
        updatedLikes = [...likes, req.user._id];
      }

      const updatedAchievement = await storage.updateAchievement(req.params.id, {
        likes: updatedLikes
      });

      res.json(updatedAchievement);
    } catch (error) {
      res.status(500).json({ message: 'Error updating like' });
    }
  });

  // Dynamic Forms routes
  app.get('/api/forms', authMiddleware, checkRole(['faculty', 'hod']), async (req: AuthRequest, res) => {
    try {
      const forms = await storage.getDynamicForms();
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching forms' });
    }
  });

  // Student forms endpoint - only returns visible forms
  app.get('/api/student/forms', authMiddleware, checkRole(['student']), async (req: AuthRequest, res) => {
    try {
      const forms = await storage.getDynamicForms({ forStudent: true });
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching forms' });
    }
  });

  app.get('/api/forms/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const form = await storage.getDynamicForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: 'Form not found' });
      }
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching form' });
    }
  });

  // Form submission endpoint for students
  app.post('/api/forms/:id/submit', authMiddleware, checkRole(['student']), formUpload, async (req: AuthRequest, res) => {
    try {
      const data = { ...req.body };

      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any) => {
          data[file.fieldname] = file.path;
        });
      }
      
      if (!data) {
        return res.status(400).json({ message: 'Form data is required' });
      }

      const updatedForm = await storage.submitForm(req.params.id, req.user._id, data);
      if (!updatedForm) {
        return res.status(404).json({ message: 'Form not found' });
      }
      
      res.status(201).json({ message: 'Form submitted successfully' });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Handle validation errors with specific messages
      if (error.message && (
        error.message.includes('not yet available') || 
        error.message.includes('expired') || 
        error.message.includes('not currently active') ||
        error.message.includes('already submitted')
      )) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error submitting form' });
    }
  });

  // Form submissions endpoint for faculty to view responses
  app.get('/api/forms/:id/submissions', authMiddleware, checkRole(['faculty', 'hod']), async (req: AuthRequest, res) => {
    try {
      const form = await storage.getFormSubmissions(req.params.id);
      if (!form) {
        return res.status(404).json({ message: 'Form not found' });
      }
      
      // Check if the requesting user is the form creator
      const formCreatorId = typeof form.createdBy === 'string' ? form.createdBy : (form.createdBy as any)._id;
      if (formCreatorId !== req.user._id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(form);
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      res.status(500).json({ message: 'Error fetching form submissions' });
    }
  });

  // Form submissions download endpoint for faculty
  app.get('/api/forms/:id/submissions/download', authMiddleware, checkRole(['faculty', 'hod']), async (req: AuthRequest, res) => {
  try {
    const form = await DynamicFormModel.findById(req.params.id)
      .populate('createdBy', '_id name email')
      .populate('submissions.student', '_id name email');

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Ensure the requesting user is the form creator
    const formCreatorId = typeof form.createdBy === 'string' ? form.createdBy : (form.createdBy as any)._id;
    if (String(formCreatorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Set headers to indicate a zip file download
    const filename = `${form.title.replace(/\s+/g, '_')}_submissions.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = archiver('zip', {
      zlib: { level: 5 } // Faster compression for better streaming
    });

    archive.on('error', (err) => {
      console.error('[ZIP ERROR]', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to create zip file.' });
      } else {
        res.end();
      }
    });

    archive.on('end', () => {
      console.log('[ZIP STREAM COMPLETED] Total bytes:', archive.pointer());
    });

    // Pipe archive to response
    archive.pipe(res);

    // JSON file inside ZIP
    const formData = {
      formTitle: form.title,
      formDescription: form.description,
      createdAt: form.createdAt,
      fields: form.fields,
      submissions: form.submissions.map((submission: any) => ({
        student: typeof submission.student === 'object' ?
          {
            _id: (submission.student as any)._id.toString(),
            name: (submission.student as any).name,
            email: (submission.student as any).email
          } : submission.student,
        data: submission.data,
        submittedAt: submission.submittedAt
      }))
    };

    archive.append(JSON.stringify(formData, null, 2), { name: 'form_data.json' });

    // CSV generation
    let csvContent = 'Student Name,Student Email,Submitted At';
    form.fields.forEach((field: any) => {
      csvContent += `,"${field.label}"`;
    });
    csvContent += '\n';

    form.submissions.forEach((submission: any) => {
      const student = typeof submission.student === 'object'
        ? { name: submission.student.name, email: submission.student.email }
        : { name: 'Unknown', email: 'Unknown' };

      csvContent += `"${student.name}","${student.email}","${new Date(submission.submittedAt).toLocaleString()}"`;

      form.fields.forEach((field: any) => {
        const value = (submission.data && submission.data[field.id]) || '';
        const escapedValue = String(value).replace(/"/g, '""');
        csvContent += `,"${escapedValue}"`;
      });

      csvContent += '\n';
    });

    archive.append(csvContent, { name: 'submissions.csv' });

    // Add uploaded files to the zip
    const fileFields = form.fields.filter((field: any) => field.type === 'file');
    if (fileFields.length > 0) {
      form.submissions.forEach((submission: any) => {
        const student = typeof submission.student === 'object' ? submission.student : null;
        if (submission.data && student) {
          fileFields.forEach((field: any) => {
            const filePath = submission.data[field.id];
            if (filePath && typeof filePath === 'string') {
              // Using path.resolve to be safe against path traversal
              const fullPath = path.resolve(process.cwd(), filePath);
              // Basic check to ensure file is within uploads directory
              if (fullPath.startsWith(path.resolve(process.cwd(), 'uploads'))) {
                const studentName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
                const originalFilename = path.basename(filePath);
                const zipPath = `files/${studentName}_${student._id}/${field.label.replace(/[^a-zA-Z0-9]/g, '_')}/${originalFilename}`;
                archive.file(fullPath, { name: zipPath });
              }
            }
          });
        }
      });
    }

    // Finalize and send
    await archive.finalize();

  } catch (error) {
    console.error('[DOWNLOAD ERROR]', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error downloading form submissions' });
    }
  }
});


  app.post('/api/forms', authMiddleware, checkRole(['faculty', 'hod']), async (req: AuthRequest, res) => {
    try {
      const formData = {
        ...req.body,
        createdBy: req.user._id
      };

      const form = await storage.createDynamicForm(formData);
      res.status(201).json(form);
    } catch (error) {
      res.status(500).json({ message: 'Error creating form' });
    }
  });

  app.put('/api/forms/:id', authMiddleware, checkRole(['faculty', 'hod']), async (req: AuthRequest, res) => {
    try {
      const form = await storage.updateDynamicForm(req.params.id, req.body);
      if (!form) {
        return res.status(404).json({ message: 'Form not found' });
      }
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: 'Error updating form' });
    }
  });

  app.delete('/api/forms/:id', authMiddleware, checkRole(['faculty', 'hod']), async (req: AuthRequest, res) => {
    try {
      const deleted = await storage.deleteDynamicForm(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Form not found' });
      }
      res.json({ message: 'Form deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting form' });
    }
  });

  // Analytics routes
  app.get('/api/analytics', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching analytics' });
    }
  });

  // File serving
  app.use('/uploads', authMiddleware, (req, res, next) => {
    const filePath = path.join(process.cwd(), 'uploads', req.path);
    res.sendFile(filePath);
  });

  // Verification route (public)
  app.get('/verify/:id', async (req, res) => {
    try {
      const achievement = await storage.getAchievement(req.params.id);
      if (!achievement || achievement.status !== 'approved') {
        return res.status(404).json({ message: 'Achievement not found or not verified' });
      }

      res.json({
        title: achievement.title,
        description: achievement.description,
        student: achievement.student,
        verifiedAt: achievement.updatedAt,
        status: achievement.status
      });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying achievement' });
    }
  });

  // Follow routes
  app.post('/api/follow/:userId', authMiddleware, checkRole(['student']), async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user is trying to follow themselves
      if (req.user._id === userId) {
        return res.status(400).json({ message: 'You cannot follow yourself' });
      }
      
      // Check if user exists
      const userToFollow = await storage.getUser(userId);
      if (!userToFollow) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create follow relationship
      const follow = await storage.followUser(req.user._id, userId);
      res.status(201).json(follow);
    } catch (error: any) {
      if (error.message === 'Already following this user') {
        return res.status(400).json({ message: error.message });
      }
      console.error('Error following user:', error);
      res.status(500).json({ message: 'Error following user' });
    }
  });

  app.delete('/api/follow/:userId', authMiddleware, checkRole(['student']), async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const userToUnfollow = await storage.getUser(userId);
      if (!userToUnfollow) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove follow relationship
      const unfollowed = await storage.unfollowUser(req.user._id, userId);
      if (!unfollowed) {
        return res.status(400).json({ message: 'You are not following this user' });
      }
      
      res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ message: 'Error unfollowing user' });
    }
  });

  app.get('/api/followers/:userId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get followers
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error('Error getting followers:', error);
      res.status(500).json({ message: 'Error getting followers' });
    }
  });

  app.get('/api/following/:userId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get following
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error('Error getting following:', error);
      res.status(500).json({ message: 'Error getting following' });
    }
  });

  app.get('/api/feed', authMiddleware, checkRole(['student']), async (req: AuthRequest, res) => {
    try {
      // Get users that the current user is following
      const following = await storage.getFollowing(req.user._id);
      const followingIds = following.map(user => user._id);
      
      // Get achievements from followed users
      const achievements = await storage.getAchievements({ 
        student: { $in: followingIds } 
      });
      
      res.json(achievements);
    } catch (error) {
      console.error('Error getting feed:', error);
      res.status(500).json({ message: 'Error getting feed' });
    }
  });

  // User management routes
  app.get('/api/users', authMiddleware, async (req: AuthRequest, res) => {
    try {
      // Get all users except the current user
      const users = await UserModel.find({ _id: { $ne: req.user._id } });
      const formattedUsers = users.map((user: any) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      res.json(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  // LeetCode routes
  app.use('/api/leetcode/problems', problemRoutes);

  const httpServer = createServer(app);
  return httpServer;
}