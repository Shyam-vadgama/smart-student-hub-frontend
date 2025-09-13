import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { authMiddleware, optionalAuth } from './middleware/auth';
import { checkRole, checkOwnership } from './middleware/role';
import { upload } from './middleware/upload';
import { generateQRCode, generateVerificationURL } from './utils/qrCode';
import path from 'path';

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

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  });

  app.get('/api/user', optionalAuth, (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profile: req.user.profile
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
      if (req.user.role === 'student' && achievement.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(achievement);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching achievement' });
    }
  });

  app.post('/api/achievements', authMiddleware, checkRole(['student']), upload.single('certificate'), async (req: AuthRequest, res) => {
    try {
      const { title, description } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
      }

      const achievementData = {
        student: req.user._id,
        title,
        description,
        certificatePath: req.file ? req.file.path : undefined
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

  const httpServer = createServer(app);
  return httpServer;
}
