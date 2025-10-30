import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
// Cloudinary removed for local testing uploads
import { storage } from './storage';
import { authMiddleware, optionalAuth } from './middleware/auth';
import { checkRole, checkOwnership, checkDepartment } from './middleware/role';
import { upload, formUpload, uploadAchievementFiles } from './middleware/upload';
import multer from 'multer';
import { generateQRCode, generateVerificationURL } from './utils/qrCode';
import path from 'path';
import archiver from 'archiver';
import DynamicFormModel from './models/DynamicForm';
import UserModel from './models/User';
import ProfileModel from './models/Profile';
import problemRoutes from './routes/leetcode/problemRoutes';
import submissionRoutes from './routes/leetcode/submissionRoutes';
import badgeRoutes from './routes/leetcode/badgeRoutes';
import stockRoutes from './routes/stockRoutes';
import businessProblemRoutes from './routes/businessProblemRoutes';
import ResumeModel from './models/Resume';
import CircuitProblem from './models/CircuitProblem';
import CircuitSubmission from './models/CircuitSubmission';
import PDFDocument from 'pdfkit';
import Quiz from './models/Quiz';
import QuizSubmission from './models/QuizSubmission';
import College from './models/College';
import Department from './models/Department';
import Classroom from './models/Classroom';
import Subject from './models/Subject';
import Marks from './models/Marks';
import Attendance from './models/Attendance';
import Timetable from './models/Timetable';
import crypto from 'crypto';
import mongoose from "mongoose";
// use global fetch available in Node 18+

interface AuthRequest extends Request {
  user?: any;
  studentFilter?: any;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Using in-memory storage for compatibility
  app.get('/api/users/faculty', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department || !hod.college) {
        return res.status(403).json({ message: 'Access denied. HOD must be associated with a department and college.' });
      }
  
      const faculty = await UserModel.find({
        role: 'faculty',
        department: hod.department,
        college: hod.college,
      }).select('-password'); // Exclude passwords from the result
  
      res.status(200).json(faculty);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      res.status(500).json({ message: 'Error fetching faculty' });
    }
  });
  
  // Route to get all students for the HOD's department and college
  app.get('/api/users/students', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department || !hod.college) {
        return res.status(403).json({ message: 'Access denied. HOD must be associated with a department and college.' });
      }
  
      const students = await UserModel.find({
        role: 'student',
        department: hod.department,
        college: hod.college,
      }).select('-password'); // Exclude passwords from the result
  
      res.status(200).json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Error fetching students' });
    }
  });
  
  // Route to create a new faculty member (provided as context)
  app.post('/api/users/create-faculty', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const { name, email } = req.body;
  
      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }
  
      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department || !hod.college) {
        return res.status(403).json({ message: 'Access denied. Only HODs associated with a department and college can create faculty.' });
      }
  
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
  
      const password = crypto.randomBytes(10).toString('hex');
      const hashedPassword = await bcrypt.hash(password, 12);
  
      const newUser = new UserModel({
        name,
        email,
        password: hashedPassword,
        role: 'faculty',
        department: hod.department,
        college: hod.college,
      });
  
      await newUser.save();
  
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordExpires = Date.now() + 3600000;
  
      await UserModel.findByIdAndUpdate(newUser._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      });
  
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      console.log(`Password reset URL for faculty ${email}: ${resetUrl}`);
  
      res.status(201).json({
        message: 'Faculty created successfully. Password reset link sent.',
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          college: newUser.college,
        },
      });
    } catch (error) {
      console.error('Error creating faculty:', error);
      res.status(500).json({ message: 'Error creating faculty' });
    }
  });
  
  // Removed duplicate create-student endpoint - using enhanced version at line 1290
  app.get('/api/users/students-all', authMiddleware, checkRole(['faculty']), async (req: AuthRequest, res) => {
    try {
      // Correctly fetch users with the 'student' role using the UserModel
      const students = await UserModel.find({ role: 'student' })
      console.log('Students:', students);
      res.status(200).json(students);
    } catch (error: any) {
      console.error('Error fetching all students:', error);
      res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});
  // Authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const { name, email, password, role = 'student', department } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      if (role === 'student' && !department) {
        return res.status(400).json({ message: 'Department is required for students' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create user
      const user = await storage.createUser({ name, email, password, role, department });

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
        role: user.role,
        department: (user as any).department
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
        role: user.role,
        department: (user as any).department
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
        department: (fullUser as any)?.department || (req.user as any).department,
        profile: fullUser?.profile || req.user.profile
      });
    }).catch(() => {
      // Fallback to request user if storage fetch fails
      res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: (req.user as any).department,
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

  app.post('/api/achievements', authMiddleware, checkRole(['student']), uploadAchievementFiles, async (req: AuthRequest, res) => {
    console.log('--- Before file processing ---');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('req.body (before multer):', req.body);
    console.log('req.files (before multer):', req.files);
    try {
      const { title, description, category, type } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
      }

      let certificatePath: string | undefined;
      let media: Array<{ 
        url: string;
        publicId: string;
        type: 'image' | 'video';
        caption: string;
      }> = [];

      // Ensure req.files is treated as a Record<string, Express.Multer.File[]>
      const files = req.files as Record<string, Express.Multer.File[]>;

      console.log('--- After file processing (by multer) ---');
      console.log('req.body (after multer):', req.body);
      console.log('req.files (after multer):', req.files);

      // Handle certificate upload (local file path)
      if (files && files.certificate && files.certificate.length > 0) {
        const certificateFile = files.certificate[0];
        // Store a URL that maps to our static /uploads serving
        certificatePath = `/uploads/${path.basename(certificateFile.path)}`;
      }

      // Handle media files upload (local file paths)
      if (files && files.media && files.media.length > 0) {
        for (const file of files.media) {
          const filename = path.basename(file.path);
          media.push({
            url: `/uploads/${filename}`,
            publicId: filename,
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            caption: '' // Caption can be added if needed in the future
          });
        }
      }

      const achievementData = {
        student: req.user._id,
        title,
        description,
        certificatePath,
        category,
        type,
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

  // backend code (e.g., in your server.ts or a studentRoutes file)

app.get('/api/students/classroom/:classroomId', authMiddleware, checkRole(['faculty']), async (req: AuthRequest, res) => {
  try {
    const students = await storage.getStudentsByClassroom(req.params.classroomId);
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students by classroom:', error);
    res.status(500).json({ message: 'Error fetching students' });
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

  // Admin: MongoDB Compass helper (HOD only)
  app.get('/api/admin/compass', authMiddleware, checkRole(['hod']), async (_req: AuthRequest, res) => {
    try {
      const uri = process.env.MONGO_URI || '';
      if (!uri) {
        return res.status(500).json({ message: 'MONGO_URI is not configured on server' });
      }
      // Redact password section if present
      let redacted = uri;
      try {
        const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
        const username = decodeURIComponent(url.username || '');
        const hasPassword = url.password && url.password.length > 0;
        if (username) {
          const proto = uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
          const hostAndPath = uri.split('@')[1] || '';
          redacted = `${proto}${encodeURIComponent(username)}:${hasPassword ? '*****' : ''}@${hostAndPath}`;
        }
      } catch {
        // Fallback keep original but try to mask between : and @
        redacted = uri.replace(/:(.*?)@/, ':*****@');
      }

      res.json({
        uriRedacted: redacted,
        note: 'For security, the password is masked. Get the full MONGO_URI from server/.env.',
        docs: 'https://www.mongodb.com/docs/compass/current/connect/',
        download: 'https://www.mongodb.com/try/download/compass'
      });
    } catch (e) {
      res.status(500).json({ message: 'Failed to prepare Compass info' });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;

      const user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
      }

      user.password = await bcrypt.hash(password, 12);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ message: 'Password has been reset.' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Error resetting password' });
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
        department: user.department,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      res.json(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  app.post(
    '/api/users/create-principal',
    authMiddleware,
    checkRole(['shiksan_mantri']),
    async (req: AuthRequest, res) => {
      try {
        const { name, email, collegeId } = req.body;

        if (!name || !email) {
          return res.status(400).json({ message: 'Name and email are required' });
        }

        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }

        const password = crypto.randomBytes(10).toString('hex'); // Generate random password
        const user = await storage.createUser({
          name,
          email,
          password,
          role: 'principal',
          // College can be assigned later when the college is created
          college: collegeId || undefined,
        });

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await UserModel.findByIdAndUpdate(user._id, {
          resetPasswordToken: resetToken,
          resetPasswordExpires,
        });

        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        console.log(`Password reset URL for ${email}: ${resetUrl}`);

        res
          .status(201)
          .json({ message: 'Principal created. Password reset link sent.', user });
      } catch (error) {
        console.error('Error creating principal:', error);
        res.status(500).json({ message: 'Error creating principal' });
      }
    }
  );
  
  app.post('/api/users/create-hod', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
    try {
      const { name, email, departmentId } = req.body;

      if (!name || !email || !departmentId) {
        return res.status(400).json({ message: 'Name, email, and department ID are required' });
      }

      const principalUser = await UserModel.findById(req.user._id);
      if (!principalUser || principalUser.role !== 'principal' || !principalUser.college) {
        return res.status(403).json({ message: 'Access denied. Only principals associated with a college can create HODs.' });
      }

      // Verify that the department belongs to the principal's college
      const department = await Department.findById(departmentId);
      if (!department || department.college?.toString() !== principalUser.college.toString()) {
        return res.status(403).json({ message: 'Access denied. Department not found or does not belong to your college.' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const password = crypto.randomBytes(10).toString('hex'); // Generate a random password
      
      // Create user directly using UserModel like principal creation
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new UserModel({
        name,
        email,
        password: hashedPassword,
        role: 'hod',
        department: departmentId,
        college: principalUser.college
      });
      
      await newUser.save();
      console.log('HOD user saved to database:', newUser._id);

      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordExpires = Date.now() + 3600000; // 1 hour

      await UserModel.findByIdAndUpdate(newUser._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      });
      console.log('Reset token updated for HOD:', newUser._id);

      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      console.log(`Password reset URL for HOD ${email}: ${resetUrl}`);

      // Verify the user was actually created by fetching from database
      const savedUser = await UserModel.findById(newUser._id);
      console.log('Verification - HOD exists in database:', !!savedUser);

      res.status(201).json({ 
        message: 'HOD created successfully and saved to database. Password reset link sent.', 
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          college: newUser.college
        }
      });
    } catch (error) {
      console.error('Detailed error creating HOD:', error);
      console.error('Error stack:', (error as Error).stack);
      res.status(500).json({ message: 'Error creating HOD', error: (error as Error).message });
    }
  });

  app.get('/api/users/students/classroom/:classroomId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { classroomId } = req.params;

        // Log the classroomId received from the frontend
        console.log(`[DEBUG] Received classroomId from frontend: ${classroomId}`);

        if (!mongoose.Types.ObjectId.isValid(classroomId)) {
            console.log(`[DEBUG] Invalid ObjectId format for classroom ID: ${classroomId}`);
            return res.status(400).json({ message: 'Invalid classroom ID format.' });
        }

        const objectIdClassroomId = new mongoose.Types.ObjectId(classroomId);

        // Find all students in that specific classroom
        const students = await UserModel.find({ 
            role: 'student', 
            classroom: objectIdClassroomId
        });
        
        console.log(`[DEBUG] Found ${students.length} students for classroom ID ${classroomId}`);
        
        if (!students || students.length === 0) {
            return res.status(200).json([]);
        }
        
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students by classroom:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
  app.post('/api/users/create-faculty', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }

      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department || !hod.college) {
        return res.status(403).json({ message: 'Access denied. Only HODs associated with a department and college can create faculty.' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const password = crypto.randomBytes(10).toString('hex'); // Generate a random password
      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new UserModel({
        name,
        email,
        password: hashedPassword,
        role: 'faculty',
        department: hod.department,
        college: hod.college,
      });

      await newUser.save();

      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordExpires = Date.now() + 3600000; // 1 hour

      await UserModel.findByIdAndUpdate(newUser._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      });

      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      console.log(`Password reset URL for faculty ${email}: ${resetUrl}`);

      res.status(201).json({ 
        message: 'Faculty created successfully. Password reset link sent.', 
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          college: newUser.college
        }
      });
    } catch (error) {
      console.error('Error creating faculty:', error);
      res.status(500).json({ message: 'Error creating faculty' });
    }
  });

  app.post('/api/users/create-student', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const { name, email, semester, course, batch, department } = req.body;

      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }

      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department || !hod.college) {
        return res.status(403).json({ message: 'Access denied. Only HODs associated with a department and college can create students.' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const password = crypto.randomBytes(10).toString('hex'); // Generate a random password
      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new UserModel({
        name,
        email,
        password: hashedPassword,
        role: 'student',
        department: department || hod.department,
        college: hod.college,
      });

      await newUser.save();

      // Create profile with batch information
      const newProfile = new ProfileModel({
        user: newUser._id,
        semester: semester || undefined,
        course: course || undefined,
        batch: batch || undefined,
        department: department || hod.department,
      });

      await newProfile.save();

      // Update user with profile reference
      await UserModel.findByIdAndUpdate(newUser._id, {
        profile: newProfile._id
      });

      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordExpires = Date.now() + 3600000; // 1 hour

      await UserModel.findByIdAndUpdate(newUser._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      });

      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      console.log(`Password reset URL for student ${email}: ${resetUrl}`);

      res.status(201).json({ 
        message: 'Student created successfully. Password reset link sent.', 
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          college: newUser.college,
          profile: {
            _id: newProfile._id,
            semester: newProfile.semester,
            course: newProfile.course,
            batch: newProfile.batch,
            department: newProfile.department
          }
        }
      });
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ message: 'Error creating student' });
    }
  });

  // Create department endpoint for principal dashboard
  app.post('/api/departments/create', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Department name is required' });
      }

      const principalUser = await UserModel.findById(req.user._id);
      if (!principalUser || principalUser.role !== 'principal' || !principalUser.college) {
        return res.status(403).json({ message: 'Access denied. Only principals associated with a college can create departments.' });
      }

      // Check if department with same name already exists in this college
      const existingDepartment = await Department.findOne({ 
        name: name, 
        college: principalUser.college 
      });
      
      if (existingDepartment) {
        return res.status(400).json({ message: 'Department with this name already exists in your college' });
      }

      // Create the department
      const department = new Department({ 
        name: name, 
        college: principalUser.college 
      });
      
      await department.save();
      console.log('Department created:', department._id);

      res.status(201).json({ 
        message: 'Department created successfully', 
        department: {
          _id: department._id,
          name: department.name,
          college: department.college
        }
      });
    } catch (error) {
      console.error('Error creating department:', error);
      res.status(500).json({ message: 'Error creating department', error: (error as Error).message });
    }
  });

  // Get departments for principal dashboard
  app.get('/api/departments/principal', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
    try {
      const principalUser = await UserModel.findById(req.user._id);
      if (!principalUser || principalUser.role !== 'principal' || !principalUser.college) {
        return res.status(403).json({ message: 'Access denied. Only principals associated with a college can view departments.' });
      }

      const departments = await Department.find({ college: principalUser.college })
        .populate('hod', 'name email')
        .sort({ name: 1 });

      res.status(200).json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: 'Error fetching departments', error: (error as Error).message });
    }
  });

  // Get HODs for principal dashboard
    app.get('/api/hods/principal', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
      try {
        const principalUser = await UserModel.findById(req.user._id);
        if (!principalUser || !principalUser.role !== 'principal' || !principalUser.college) {
          return res.status(403).json({ message: 'Access denied. Only principals associated with a college can view HODs.' });
        }
  
        const hods = await UserModel.find({
          role: 'hod',
          college: principalUser.college
        })
        .populate('department', 'name')
        .sort({ name: 1 });
  
        res.status(200).json(hods);
      } catch (error) {
        console.error('Error fetching HODs:', error);
        res.status(500).json({ message: 'Error fetching HODs', error: (error as Error).message });
      }
    });
  
    
  // Create department with HOD in one go (comprehensive endpoint)
  app.post('/api/departments/create-with-hod', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
    try {
      const { departmentName, hodName, hodEmail } = req.body;

      if (!departmentName || !hodName || !hodEmail) {
        return res.status(400).json({ message: 'Department name, HOD name, and HOD email are required' });
      }

      const principalUser = await UserModel.findById(req.user._id);
      if (!principalUser || principalUser.role !== 'principal' || !principalUser.college) {
        return res.status(403).json({ message: 'Access denied. Only principals associated with a college can create departments.' });
      }

      // Check if HOD email already exists
      const existingUser = await UserModel.findOne({ email: hodEmail });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Check if department with same name already exists in this college
      const existingDepartment = await Department.findOne({ 
        name: departmentName, 
        college: principalUser.college 
      });
      
      if (existingDepartment) {
        return res.status(400).json({ message: 'Department with this name already exists in your college' });
      }

      // Create the department first
      const department = new Department({ 
        name: departmentName, 
        college: principalUser.college 
      });
      
      await department.save();
      console.log('Department created:', department._id);

      // Generate random password for HOD
      const password = crypto.randomBytes(10).toString('hex');
      
      // Create HOD user directly using UserModel
      const hashedPassword = await bcrypt.hash(password, 12);
      const hodUser = new UserModel({
        name: hodName,
        email: hodEmail,
        password: hashedPassword,
        role: 'hod',
        department: (department._id as any).toString(),
        college: principalUser.college
      });
      
      await hodUser.save();
      console.log('HOD user created:', hodUser._id);

      // Update department with HOD reference
      await Department.findByIdAndUpdate(department._id, {
        hod: hodUser._id
      });

      // Generate reset token and update user
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordExpires = Date.now() + 3600000; // 1 hour

      await UserModel.findByIdAndUpdate(hodUser._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      });

      // Generate password reset URL and log to console
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      console.log(`Password reset URL for HOD ${hodEmail}: ${resetUrl}`);

      // Verify both were created
      const savedDepartment = await Department.findById(department._id);
      const savedHOD = await UserModel.findById(hodUser._id);
      console.log('Verification - Department exists:', !!savedDepartment);
      console.log('Verification - HOD exists:', !!savedHOD);

      res.status(201).json({ 
        message: 'Department and HOD created successfully. Password reset link sent.', 
        department: {
          _id: department._id,
          name: department.name,
          college: department.college,
          hod: hodUser._id
        },
        hod: {
          _id: hodUser._id,
          name: hodUser.name,
          email: hodUser.email,
          role: hodUser.role,
          department: hodUser.department
        }
      });
    } catch (error) {
      console.error('Error creating department with HOD:', error);
      console.error('Error stack:', (error as Error).stack);
      res.status(500).json({ message: 'Error creating department with HOD', error: (error as Error).message });
    }
  });

  app.post('/api/colleges', authMiddleware, checkRole(['shiksan_mantri']), async (req: AuthRequest, res) => {
    try {
      const { name, address, principal } = req.body;
      const college = new College({ name, address, principal });
      await college.save();
      // also update the user with the college id
      await UserModel.findByIdAndUpdate(principal, { college: college._id });
      res.status(201).json(college);
    } catch (error) {
      res.status(500).json({ message: 'Error creating college' });
    }
  });

  app.post('/api/departments', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
    try {
      const { name, hod, collegeId } = req.body;
      const principalUser = await UserModel.findById(req.user._id);

      if (!principalUser || principalUser.role !== 'principal') {
        return res.status(403).json({ message: 'Access denied. Only principals can create departments.' });
      }

      // Verify that the principal is associated with the college they are trying to create a department for
      if (principalUser.college?.toString() !== collegeId) {
        return res.status(403).json({ message: 'Access denied. Principal not associated with this college.' });
      }

      const department = new Department({ name, hod, college: collegeId });
      await department.save();
      res.status(201).json(department);
    } catch (error) {
      res.status(500).json({ message: 'Error creating department' });
    }
  });

  // Create department with HOD creation and email functionality
  app.post('/api/create-department', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
    try {
      const { departmentName, hodName, hodEmail } = req.body;

      if (!departmentName || !hodName || !hodEmail) {
        return res.status(400).json({ message: 'Department name, HOD name, and HOD email are required' });
      }

      const principalUser = await UserModel.findById(req.user._id);
      if (!principalUser || principalUser.role !== 'principal' || !principalUser.college) {
        return res.status(403).json({ message: 'Access denied. Only principals associated with a college can create departments.' });
      }

      // Check if HOD email already exists
      const existingUser = await storage.getUserByEmail(hodEmail);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Create the department first
      const department = new Department({ 
        name: departmentName, 
        college: principalUser.college 
      });
      await department.save();

      // Generate random password for HOD
      const password = crypto.randomBytes(10).toString('hex');
      
      // Create HOD user directly using UserModel
      const hashedPassword = await bcrypt.hash(password, 12);
      const hodUser = new UserModel({
        name: hodName,
        email: hodEmail,
        password: hashedPassword,
        role: 'hod',
        department: (department._id as any).toString(),
        college: principalUser.college
      });
      
      await hodUser.save();

      // Generate reset token and update user
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordExpires = Date.now() + 3600000; // 1 hour

      await UserModel.findByIdAndUpdate(hodUser._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      });

      // Update department with HOD reference
      await Department.findByIdAndUpdate(department._id, {
        hod: hodUser._id
      });

      // Generate password reset URL and log to console
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      console.log(`Password reset URL for HOD ${hodEmail}: ${resetUrl}`);

      res.status(201).json({ 
        message: 'Department created successfully with HOD. Password reset link sent.', 
        department: {
          _id: department._id,
          name: department.name,
          college: department.college,
          hod: hodUser._id
        },
        hod: {
          _id: hodUser._id,
          name: hodUser.name,
          email: hodUser.email,
          role: hodUser.role
        }
      });
    } catch (error) {
      console.error('Error creating department with HOD:', error);
      res.status(500).json({ message: 'Error creating department with HOD' });
    }
  });

  app.post('/api/classrooms', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const { name, subjects } = req.body;
      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department) {
        return res.status(400).json({ message: 'HOD not associated with a department' });
      }
      const classroom = new Classroom({ name, subjects, department: hod.department });
      await classroom.save();
      res.status(201).json(classroom);
    } catch (error) {
      res.status(500).json({ message: 'Error creating classroom' });
    }
  });

  app.post('/api/classrooms/:id/assign-subjects', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const { subjects } = req.body;
      const classroom = await Classroom.findById(req.params.id);

      if (!classroom) {
        return res.status(404).json({ message: 'Classroom not found' });
      }

      const hod = await UserModel.findById(req.user._id);
      if (classroom.department.toString() !== hod.department.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only assign subjects to classrooms in your own department.' });
      }

      classroom.subjects = subjects;
      await classroom.save();
      res.status(200).json(classroom);
    } catch (error) {
      res.status(500).json({ message: 'Error assigning subjects to classroom' });
    }
  });

  app.post('/api/subjects', authMiddleware, checkRole(['hod', 'faculty']), async (req: AuthRequest, res) => {
    try {
      const { name, classroom } = req.body;
      const user = await UserModel.findById(req.user._id);

      if (!user || (!user.department && user.role !== 'shiksan_mantri')) {
        return res.status(400).json({ message: 'User not associated with a department' });
      }

      const department = user.department; // Get department from the HOD/Faculty creating the subject

      const subject = new Subject({ name, faculty: req.user._id, classroom, department, createdBy: req.user._id });
      await subject.save();
      res.status(201).json(subject);
    } catch (error) {
      res.status(500).json({ message: 'Error creating subject' });
    }
  });

  app.get('/api/subjects', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await UserModel.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let subjects;
      if (user.role === 'hod') {
        subjects = await Subject.find({ createdBy: user._id });
      } else if (user.role === 'faculty' || user.role === 'student') {
        if (!user.department) {
          return res.status(400).json({ message: 'User not associated with a department' });
        }
        subjects = await Subject.find({ department: user.department });
      } else {
        subjects = await Subject.find({});
      }

      res.status(200).json(subjects);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching subjects' });
    }
  });
  app.get('api/faculty/:facultyId', authMiddleware, checkRole(['faculty', 'hod']), async (req, res) => {
    try {
      const { facultyId } = req.params;
  
      // Log the ID received from the frontend
      console.log(`[DEBUG] Received facultyId: ${facultyId}`);
      
      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
        console.log(`[DEBUG] Invalid ObjectId format for ID: ${facultyId}`);
        return res.status(400).json({ message: 'Invalid faculty ID format.' });
      }
  
      const objectIdFacultyId = new mongoose.Types.ObjectId(facultyId);
  
      // --- CRUCIAL DEBUGGING STEP ---
      // Log ALL subjects in the database to verify their faculty IDs
      const allSubjects = await Subject.find({});
      console.log(`[DEBUG] All subjects in database:`, allSubjects);
      // ---
  
      // Now, run the specific query to see if it finds a match
      const subjects = await Subject.find({ faculty: objectIdFacultyId });
      console.log(`[DEBUG] Specific query result for facultyId ${facultyId}:`, subjects);
      
      if (!subjects || subjects.length === 0) {
        return res.status(200).json([]);
      }
      
      res.status(200).json(subjects);
    } catch (error) {
      console.error('Error fetching subjects for faculty:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
  app.get('/api/subjects/faculty/:facultyId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { facultyId } = req.params;
        
        console.log(`[DEBUG] Received facultyId from frontend: ${facultyId}`);
        
        if (!mongoose.Types.ObjectId.isValid(facultyId)) {
            console.log(`[DEBUG] Invalid ObjectId format for ID: ${facultyId}`);
            return res.status(400).json({ message: 'Invalid faculty ID format.' });
        }

        const objectIdFacultyId = new mongoose.Types.ObjectId(facultyId);

        const allSubjects = await Subject.find({});
        console.log(`[DEBUG] All subjects in database:`, allSubjects);

        const subjects = await Subject.find({ faculty: objectIdFacultyId });
        console.log(`[DEBUG] Specific query result for facultyId ${facultyId}:`, subjects);
        
        if (!subjects || subjects.length === 0) {
            return res.status(200).json([]);
        }
        
        res.status(200).json(subjects);
    } catch (error) {
        console.error('Error fetching subjects for faculty:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Add or update this route in your routes.ts file
// Update this route in your routes.ts file


// Update this route in your routes.ts file

// Update this route in your routes.ts file

// Removed duplicate create-student endpoint - using enhanced version only


  app.get('/api/colleges', authMiddleware, checkRole(['shiksan_mantri', 'principal']), async (req: AuthRequest, res) => {
    try {
      const colleges = await storage.getColleges();
      res.status(200).json(colleges);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching colleges' });
    }
  });

  app.get('/api/colleges/:id', authMiddleware, checkRole(['shiksan_mantri', 'principal']), async (req: AuthRequest, res) => {
    try {
      const college = await College.findById(req.params.id)
        .populate('principal', 'name email');

      if (!college) {
        return res.status(404).json({ message: 'College not found' });
      }

      // Fetch departments for this college
      const departments = await Department.find({ college: college._id })
        .populate('hod', 'name email');

      // Fetch users (HODs, faculty, students) associated with this college's departments
      const departmentIds = departments.map(dept => dept._id);
      const usersInCollege = await UserModel.find({
        $or: [
          { college: college._id }, // Principal directly associated with college
          { department: { $in: departmentIds } } // HODs, faculty, students in departments
        ]
      }).select('name email role department');

      // Organize users by role and department
      const organizedUsers: any = {
        principals: [],
        hods: [],
        faculty: [],
        students: []
      };

      usersInCollege.forEach(user => {
        if (user.role === 'principal') organizedUsers.principals.push(user);
        else if (user.role === 'hod') organizedUsers.hods.push(user);
        else if (user.role === 'faculty') organizedUsers.faculty.push(user);
        else if (user.role === 'student') organizedUsers.students.push(user);
      });

      res.status(200).json({
        ...college.toObject(),
        departments: departments.map(dept => ({
          ...dept.toObject(),
          hod: dept.hod ? { _id: (dept.hod as any)._id, name: (dept.hod as any).name, email: (dept.hod as any).email } : null
        })),
        users: organizedUsers
      });

    } catch (error) {
      console.error('Error fetching college details:', error);
      res.status(500).json({ message: 'Error fetching college details' });
    }
  });

  app.get('/api/principal/college', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
    try {
      const principalUser = await UserModel.findById(req.user._id);
      if (!principalUser || !principalUser.college) {
        return res.status(404).json({ message: 'Principal not associated with a college' });
      }

      const college = await College.findById(principalUser.college)
        .populate('principal', 'name email');

      if (!college) {
        return res.status(404).json({ message: 'College not found' });
      }

      res.status(200).json(college);
    } catch (error) {
      console.error(`Error fetching principal's college:`, error);
      res.status(500).json({ message: `Error fetching principal's college` });
    }
  });

  // Principal: Get departments within their own college
  // Principal: Get departments within their own college
   // The code you provided, with the added closing characters
app.get('/api/principal/departments', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
  try {
    const principalUser = await UserModel.findById(req.user._id);
    if (!principalUser || !principalUser.college) {
      return res.status(404).json({ message: 'Principal not associated with a college' });
    }

    const departments = await Department.find({ college: principalUser.college })
      .populate('hod', 'name email');

    res.status(200).json(departments);
  } catch (error) {
    console.error('Error fetching principals departments:', error);
    res.status(500).json({ message: "Error fetching principal's departments" });
  }
}); // <-- Make sure this closing parenthesis and semicolon are present at the very end of the file.

  // Principal: Get HODs within their own college
  app.get('/api/principal/hods', authMiddleware, checkRole(['principal']), async (req: AuthRequest, res) => {
    try {
      const principalUser = await UserModel.findById(req.user._id);
      if (!principalUser || !principalUser.college) {
        return res.status(404).json({ message: 'Principal not associated with a college' });
      }

      const hods = await UserModel.find({ role: 'hod', college: principalUser.college })
        .select('_id name email'); // Select relevant fields

      res.status(200).json(hods);
    } catch (error) {
      console.error('Error fetching principal\'s HODs:', error);
      res.status(500).json({ message: 'Error fetching principal\'s HODs' });
    }
  });

  app.get('/api/classrooms', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user._id);
      if (!user || !user.department) {
        return res.status(400).json({ message: 'User not associated with a department' });
      }
      const classrooms = await Classroom.find({ department: user.department });
      res.status(200).json(classrooms);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching classrooms' });
    }
  });

  // Marks Routes
  app.post('/api/marks', authMiddleware, checkRole(['faculty']), async (req: AuthRequest, res) => {
    try {
      const { student, subject, marks, examType } = req.body;
      const newMarks = new Marks({ student, subject, marks, examType });
      await newMarks.save();
      res.status(201).json(newMarks);
    } catch (error) {
      res.status(500).json({ message: 'Error creating marks' });
    }
  });

  app.get('/api/marks/subject/:subjectId', authMiddleware, checkRole(['faculty']), async (req: AuthRequest, res) => {
    try {
      const marks = await Marks.find({ subject: req.params.subjectId }).populate('student', 'name email');
      res.status(200).json(marks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching marks for subject' });
    }
  });

  app.get('/api/marks/student/:studentId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      // Faculty can view any student's marks, student can only view their own
      if (req.user.role === 'student' && req.user._id !== req.params.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const marks = await Marks.find({ student: req.params.studentId }).populate('subject', 'name');
      res.status(200).json(marks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching marks for student' });
    }
  });

  // Attendance Routes
 // backend code for your attendance route (e.g., in attendanceRoutes.ts)

 app.post('/api/attendance', authMiddleware, checkRole(['faculty']), async (req: AuthRequest, res) => {
  try {
    const { studentIds, subject, date, status } = req.body;
    
    // Validate that the required fields are present
    if (!Array.isArray(studentIds) || studentIds.length === 0 || !subject || !date || !status) {
      return res.status(400).json({ message: 'Missing or invalid required fields: studentIds, subject, date, or status' });
    }

    // Prepare attendance records for all students at once
    const attendanceRecords = studentIds.map(studentId => ({
      student: studentId,
      subject: subject,
      date: date,
      status: status,
    }));

    // Insert all attendance records into the database in one go
    const result = await Attendance.insertMany(attendanceRecords);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ message: 'Error recording attendance' });
  }
});

  app.get('/api/attendance/subject/:subjectId', authMiddleware, checkRole(['faculty']), async (req: AuthRequest, res) => {
    try {
      const attendance = await Attendance.find({ subject: req.params.subjectId }).populate('student', 'name email');
      res.status(200).json(attendance);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching attendance for subject' });
    }
  });

  app.get('/api/attendance/student/:studentId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      // Faculty can view any student's attendance, student can only view their own
      if (req.user.role === 'student' && req.user._id !== req.params.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const attendance = await Attendance.find({ student: req.params.studentId }).populate('subject', 'name');
      res.status(200).json(attendance);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching attendance for student' });
    }
  });

  // HOD: Get all attendance for their department/college (optional subject filter)
  app.get('/api/attendance/all', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department || !hod.college) {
        return res.status(403).json({ message: 'Access denied. HOD must be associated with a department and college.' });
      }

      const { subjectId } = req.query as { subjectId?: string };

      // Find students within HOD's department/college
      const students = await UserModel.find({
        role: 'student',
        department: hod.department,
        college: hod.college,
      }).select('_id');
      const studentIds = students.map(s => s._id);

      const query: any = { student: { $in: studentIds } };
      if (subjectId && subjectId !== 'all') {
        query.subject = subjectId;
      }

      const records = await Attendance
        .find(query)
        .populate('student', 'name department college')
        .populate('subject', 'name');

      // Normalize records for front-end summaries
      const normalized = records.map(rec => ({
        _id: rec._id,
        studentId: typeof rec.student === 'object' ? (rec.student as any)._id.toString() : String(rec.student),
        subject: typeof rec.subject === 'object' ? { _id: (rec.subject as any)._id.toString(), name: (rec.subject as any).name } : rec.subject,
        date: rec.date,
        status: rec.status,
      }));

      res.status(200).json(normalized);
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      res.status(500).json({ message: 'Error fetching attendance' });
    }
  });

  // HOD: Excel export of attendance with optional subject filter
  app.get('/api/attendance/excel', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department || !hod.college) {
        return res.status(403).json({ message: 'Access denied. HOD must be associated with a department and college.' });
      }

      const { subjectId } = req.query as { subjectId?: string };

      // Scope students to HOD's department/college
      const students = await UserModel.find({
        role: 'student',
        department: hod.department,
        college: hod.college,
      }).select('_id name');
      const studentIds = students.map(s => s._id.toString());
      const studentMap = new Map(students.map(s => [s._id.toString(), s.name]));

      // Subjects map
      const subjects = await Subject.find({}).select('_id name');
      const subjectMap = new Map(subjects.map(s => [s._id.toString(), s.name]));

      const query: any = { student: { $in: studentIds } };
      if (subjectId && subjectId !== 'all') {
        query.subject = subjectId;
      }

      const records = await Attendance.find(query).populate('subject', 'name').lean();

      const excelData = records.map(rec => {
        const sid = (rec.student as any).toString();
        const subId = typeof rec.subject === 'object' && rec.subject ? (rec.subject as any)._id.toString() : String(rec.subject);
        return {
          'Student Name': studentMap.get(sid) || 'Unknown',
          'Student ID': sid,
          'Subject': subjectMap.get(subId) || (typeof rec.subject === 'object' ? (rec.subject as any).name : 'Unknown'),
          'Subject ID': subId,
          'Date': new Date(rec.date as any).toLocaleDateString(),
          'Status': rec.status === 'present' ? 'Present' : 'Absent',
          'Attendance Percentage': rec.status === 'present' ? '100%' : '0%'
        };
      });

      res.json(excelData);
    } catch (error) {
      console.error('Error preparing attendance Excel:', error);
      res.status(500).json({ message: 'Error preparing attendance Excel' });
    }
  });
  app.get('/api/users/department/:departmentId', authMiddleware, checkRole(['faculty', 'hod']), async (req: AuthRequest, res) => {
    try {
      const users = await UserModel.find({ department: req.params.departmentId, role: 'student' });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching students by department' });
    }
  });

  // Timetable Routes
  app.post('/api/timetables', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const { semester, schedule } = req.body;
      
      // Get HOD's department and college automatically
      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department || !hod.college) {
        return res.status(403).json({ message: 'Access denied. HOD not associated with a department and college.' });
      }

      // Check if timetable already exists for this department and semester
      const existingTimetable = await Timetable.findOne({ 
        department: hod.department, 
        semester: parseInt(semester) 
      });
      
      if (existingTimetable) {
        return res.status(400).json({ message: `Timetable for semester ${semester} already exists. Please update the existing timetable instead.` });
      }

      // Validate schedule structure
      if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
        return res.status(400).json({ message: 'Schedule is required and must be a non-empty array.' });
      }

      // Validate each schedule item
      for (const item of schedule) {
        if (!item.day || !item.startTime || !item.endTime || !item.subject || !item.classroom || !item.faculty) {
          return res.status(400).json({ message: 'Each schedule item must have day, startTime, endTime, subject, classroom, and faculty.' });
        }
      }

      const newTimetable = new Timetable({ 
        college: hod.college, 
        department: hod.department, 
        semester: parseInt(semester), 
        schedule 
      });
      
      await newTimetable.save();
      
      // Populate the response for better frontend display
      const populatedTimetable = await Timetable.findById(newTimetable._id)
        .populate('college', 'name')
        .populate('department', 'name')
        .populate('schedule.subject', 'name')
        .populate('schedule.classroom', 'name')
        .populate('schedule.faculty', 'name');
      
      res.status(201).json(populatedTimetable);
    } catch (error) {
      console.error('Error creating timetable:', error);
      res.status(500).json({ message: 'Error creating timetable', error: error.message });
    }
  });

  app.get('/api/timetables/department/:departmentId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const timetable = await Timetable.find({ department: req.params.departmentId })
        .populate('college', 'name')
        .populate('department', 'name')
        .populate('schedule.subject', 'name')
        .populate('schedule.classroom', 'name')
        .populate('schedule.faculty', 'name');
      res.status(200).json(timetable);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching timetable' });
    }
  });

  // Student-specific timetable endpoint - filters by department and semester
  app.get('/api/timetables/student', authMiddleware, checkRole(['student']), async (req: AuthRequest, res) => {
    try {
      // Get student with profile information
      const student = await UserModel.findById(req.user._id).populate('profile');
      if (!student || !student.department) {
        return res.status(404).json({ message: 'Student not found or not associated with a department' });
      }

      // Get student's semester from profile
      const profile = student.profile as any;
      const semester = profile?.semester;

      // Build query - always filter by department, optionally by semester
      const query: any = { department: student.department };
      if (semester) {
        query.semester = semester;
      }

      const timetables = await Timetable.find(query)
        .populate('college', 'name')
        .populate('department', 'name')
        .populate('schedule.subject', 'name')
        .populate('schedule.classroom', 'name')
        .populate('schedule.faculty', 'name')
        .sort({ semester: 1 });

      res.status(200).json(timetables);
    } catch (error) {
      console.error('Error fetching student timetable:', error);
      res.status(500).json({ message: 'Error fetching student timetable' });
    }
  });

app.get('/api/users/students', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const hod = await UserModel.findById(req.user._id);
      if (!hod || !hod.department) {
        return res.status(403).json({ message: 'Access denied. Only HODs can view students.' });
      }

      const students = await UserModel.find({ role: 'student', department: hod.department });
      res.status(200).json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Error fetching students' });
    }
  });

  app.delete('/api/users/:id', authMiddleware, checkRole(['hod']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // HOD can only delete users in their own department
      const hod = await UserModel.findById(req.user._id);
      if (user.department.toString() !== hod.department.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only delete users in your own department.' });
      }

      await UserModel.findByIdAndDelete(id);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error deleting user' });
    }
  });

  // LeetCode routes
  app.use('/api/leetcode/problems', problemRoutes);
  app.use('/api/leetcode/submissions', submissionRoutes);
  app.use('/api/leetcode', badgeRoutes);

  // Stock Trading routes
  app.use('/api/stock', stockRoutes);

  // Business Problem routes
  app.use('/api/business/problems', businessProblemRoutes);

  // Circuit routes
  // Create circuit problem (faculty/hod only)
  app.post('/api/circuit/problems', authMiddleware, checkRole(['faculty','hod']), checkDepartment(['ee','ec','ece','electrical','electronics','electronics & communication']), async (req: AuthRequest, res) => {
    try {
      const { title, description } = req.body || {};
      if (!title || !description) return res.status(400).json({ message: 'Missing fields' });
      const creator = await storage.getUser(req.user._id);
      const dept = (creator as any)?.department ? String((creator as any).department).toLowerCase() : '';
      const allowed = ['ee','ec','ece','electrical','electronics','electronics & communication'];
      if (!allowed.includes(dept)) {
        return res.status(403).json({ message: 'Only EC/EE departments can create circuit problems' });
      }
      const doc = await CircuitProblem.create({ title, description, department: dept, createdBy: req.user._id });
      res.status(201).json({ _id: doc._id, title: doc.title, description: doc.description, department: doc.department, createdAt: doc.createdAt, updatedAt: doc.updatedAt });
    } catch (e) {
      res.status(500).json({ message: 'Failed to create circuit problem' });
    }
  });

  // List circuit problems for current user's department
  app.get('/api/circuit/problems', authMiddleware, checkDepartment(['ee','ec','ece','electrical','electronics','electronics & communication']), async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      const allowed = ['ee','ec','ece','electrical','electronics','electronics & communication'];
      if (!dept || !allowed.includes(dept)) {
        return res.json([]);
      }
      const problems = await CircuitProblem.find({ department: dept }).sort({ createdAt: -1 });
      res.json(problems.map(p => ({ _id: p._id, title: p.title, description: p.description, department: p.department, createdAt: p.createdAt })));
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch circuit problems' });
    }
  });

  // Get a single circuit problem
  app.get('/api/circuit/problems/:id', authMiddleware, checkDepartment(['ee','ec','ece','electrical','electronics','electronics & communication']), async (req: AuthRequest, res) => {
    try {
      const p = await CircuitProblem.findById(req.params.id);
      if (!p) return res.status(404).json({ message: 'Not found' });
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      if (p.department !== dept) return res.status(403).json({ message: 'Not allowed' });
      res.json({ _id: p._id, title: p.title, description: p.description, department: p.department, createdAt: p.createdAt });
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch circuit problem' });
    }
  });

  // Submit circuit design (students)
  app.post('/api/circuit/problems/:id/submit', authMiddleware, checkRole(['student']), checkDepartment(['ee','ec','ece','electrical','electronics','electronics & communication']), async (req: AuthRequest, res) => {
    try {
      const problem = await CircuitProblem.findById(req.params.id);
      if (!problem) return res.status(404).json({ message: 'Problem not found' });
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      if (problem.department !== dept) return res.status(403).json({ message: 'Not allowed' });
      const { design, notes } = req.body || {};
      if (!design) return res.status(400).json({ message: 'Design is required' });
      const submission = await CircuitSubmission.create({ problem: problem._id, student: req.user._id, department: dept, design, notes });
      res.status(201).json({ _id: submission._id, createdAt: submission.createdAt });
    } catch (e) {
      res.status(500).json({ message: 'Failed to submit design' });
    }
  });

  // Faculty/HOD: list submissions for a problem in their department
  app.get('/api/circuit/problems/:id/submissions', authMiddleware, checkRole(['faculty','hod']), checkDepartment(['ee','ec','ece','electrical','electronics','electronics & communication']), async (req: AuthRequest, res) => {
    try {
      const problem = await CircuitProblem.findById(req.params.id).populate('createdBy','_id');
      if (!problem) return res.status(404).json({ message: 'Problem not found' });
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      if (problem.department !== dept) return res.status(403).json({ message: 'Not allowed' });
      const submissions = await CircuitSubmission.find({ problem: problem._id }).populate('student','_id name email');
      res.json(submissions.map(s => ({ _id: s._id, student: s.student, notes: s.notes, design: s.design, createdAt: s.createdAt })));
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  // Download submission as PDF (faculty/hod)
  app.get('/api/circuit/submissions/:submissionId/pdf', authMiddleware, checkRole(['faculty','hod']), checkDepartment(['ee','ec','ece','electrical','electronics','electronics & communication']), async (req: AuthRequest, res) => {
    try {
      const submission = await CircuitSubmission.findById(req.params.submissionId).populate('student','_id name email');
      if (!submission) return res.status(404).json({ message: 'Submission not found' });
      const problem = await CircuitProblem.findById(submission.problem);
      if (!problem) return res.status(404).json({ message: 'Problem not found' });
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      if (problem.department !== dept) return res.status(403).json({ message: 'Not allowed' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="submission_${submission._id}.pdf"`);

      const doc = new PDFDocument({ margin: 48 });
      doc.pipe(res);

      doc.fontSize(18).text('Circuit Submission', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Problem: ${problem.title}`);
      doc.text(`Department: ${problem.department.toUpperCase()}`);
      doc.text(`Student: ${(submission as any).student?.name || 'Unknown'} (${(submission as any).student?.email || ''})`);
      doc.text(`Submitted: ${new Date(submission.createdAt).toLocaleString()}`);
      doc.moveDown();
      doc.text('Notes:');
      doc.text(submission.notes || '-', { indent: 12 });
      doc.moveDown();
      doc.text('Design (components):');
      const components = Array.isArray((submission as any).design?.components) ? (submission as any).design.components : [];
      components.forEach((c: any, idx: number) => {
        doc.text(`${idx + 1}. ${String(c)}`, { indent: 12 });
      });
      if (components.length === 0) {
        doc.text('- none -', { indent: 12 });
      }
      doc.end();
    } catch (e) {
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  });

  // Resume routes
  app.get('/api/resumes', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const resumes = await ResumeModel.find({ user: req.user._id }).sort({ updatedAt: -1 });
      res.json(resumes.map(r => ({
        _id: r._id,
        template: r.template,
        data: r.data,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      })));
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch resumes' });
    }
  });

  app.post('/api/resumes', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { template, data } = req.body || {};
      if (![1,2,3].includes(template)) return res.status(400).json({ message: 'Invalid template' });
      if (!data) return res.status(400).json({ message: 'Missing data' });
      const resume = await ResumeModel.create({ user: req.user._id, template, data });
      res.status(201).json({ _id: resume._id, template: resume.template, data: resume.data, createdAt: resume.createdAt, updatedAt: resume.updatedAt });
    } catch (e) {
      res.status(500).json({ message: 'Failed to save resume' });
    }
  });

  // Quiz routes (Mechanical department)
  app.post('/api/quiz', authMiddleware, checkRole(['faculty','hod']), checkDepartment(['me','mechanical']), async (req: AuthRequest, res) => {
    try {
      const creator = await storage.getUser(req.user._id);
      const dept = (creator as any)?.department?.toLowerCase();
      const allowed = ['me','mechanical'];
      if (!allowed.includes(dept)) return res.status(403).json({ message: 'Only Mechanical can create quizzes' });
      const { title, description, questions } = req.body || {};
      if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Missing quiz fields' });
      }
      const quiz = await Quiz.create({ title, description, department: dept, createdBy: req.user._id, questions });
      res.status(201).json({ _id: quiz._id, title: quiz.title, department: quiz.department });
    } catch (e) {
      res.status(500).json({ message: 'Failed to create quiz' });
    }
  });

  app.get('/api/quiz', authMiddleware, checkDepartment(['me','mechanical']), async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      const allowed = ['me','mechanical'];
      if (!dept || !allowed.includes(dept)) return res.json([]);
      const quizzes = await Quiz.find({ department: dept }).sort({ createdAt: -1 });
      res.json(quizzes.map(q => ({ _id: q._id, title: q.title, description: q.description, createdAt: q.createdAt })));
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch quizzes' });
    }
  });

  app.get('/api/quiz/:id', authMiddleware, checkDepartment(['me','mechanical']), async (req: AuthRequest, res) => {
    try {
      const q = await Quiz.findById(req.params.id);
      if (!q) return res.status(404).json({ message: 'Not found' });
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      if (q.department !== dept) return res.status(403).json({ message: 'Not allowed' });
      const isFaculty = ['faculty','hod'].includes(user!.role as any);
      res.json({ _id: q._id, title: q.title, description: q.description, questions: isFaculty ? q.questions : q.questions.map((qq: any) => ({ text: qq.text, options: qq.options })) });
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch quiz' });
    }
  });

  app.post('/api/quiz/:id/submit', authMiddleware, checkRole(['student']), checkDepartment(['me','mechanical']), async (req: AuthRequest, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      if (quiz.department !== dept) return res.status(403).json({ message: 'Not allowed' });
      const { answers } = req.body || {};
      if (!Array.isArray(answers) || answers.length !== quiz.questions.length) return res.status(400).json({ message: 'Invalid answers' });
      // Check if already submitted
      const existing = await QuizSubmission.findOne({ quiz: quiz._id, student: req.user._id });
      if (existing) {
        return res.status(400).json({ message: 'You have already submitted this quiz', score: existing.score, _id: existing._id });
      }
      const score = quiz.questions.reduce((acc: number, q: any, i: number) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
      try {
        const sub = await QuizSubmission.create({ quiz: quiz._id, student: req.user._id, department: dept, answers, score });
        return res.status(201).json({ _id: sub._id, score });
      } catch (err: any) {
        // In case of race conditions with unique index
        if (err && err.code === 11000) {
          const dup = await QuizSubmission.findOne({ quiz: quiz._id, student: req.user._id });
          return res.status(400).json({ message: 'You have already submitted this quiz', score: dup?.score, _id: dup?._id });
        }
        throw err;
      }
    } catch (e) {
      res.status(500).json({ message: 'Failed to submit quiz' });
    }
  });

  app.get('/api/quiz/:id/submissions', authMiddleware, checkRole(['faculty','hod']), checkDepartment(['me','mechanical']), async (req: AuthRequest, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      if (quiz.department !== dept) return res.status(403).json({ message: 'Not allowed' });
      const subs = await QuizSubmission.find({ quiz: quiz._id }).populate('student','_id name email').sort({ createdAt: -1 });
      res.json(subs.map(s => ({ _id: s._id, student: s.student, score: s.score, createdAt: s.createdAt })));
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  // Student: get own submission for a quiz
  app.get('/api/quiz/:id/my-submission', authMiddleware, checkRole(['student']), checkDepartment(['me','mechanical']), async (req: AuthRequest, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      const user = await storage.getUser(req.user._id);
      const dept = (user as any)?.department?.toLowerCase();
      if (quiz.department !== dept) return res.status(403).json({ message: 'Not allowed' });
      const sub = await QuizSubmission.findOne({ quiz: quiz._id, student: req.user._id });
      if (!sub) return res.status(404).json({ message: 'No submission found' });
      res.json({ _id: sub._id, score: sub.score, createdAt: sub.createdAt, answers: sub.answers });
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch submission' });
    }
  });
  // Gemini suggestions
  app.post('/api/resumes/suggest', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { summary, skills, experience, education } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) return res.status(500).json({ message: 'Missing GEMINI_API_KEY in environment' });

      const prompt = `You are a career coach. Given the candidate summary, skills, experience, and education, suggest concrete, actionable improvements to their resume and a learning roadmap. If candidate lists a skill (e.g., Python), recommend adjacent tools (e.g., FastAPI for web). Return JSON with fields: suggestions (array of strings), learningRoadmap (array of {topic, why, resources}), missingSkills (array of strings). Input: ${JSON.stringify({ summary, skills, experience, education })}`;

      const resp = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + encodeURIComponent(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return res.status(500).json({ message: 'Gemini API error', details: txt });
      }
      const dataOut = await resp.json();
      // Attempt to extract text
      const text = dataOut?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { parsed = { suggestions: [text] }; }
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ message: 'Failed to get suggestions' });
    }
  });


  app.get('/api/attendance/excel', authMiddleware, checkOwnership, async (req, res) => {
  try {
    const { subjectId } = req.query;
    
    // Build the query based on filters
    const query: any = {};
    
    if (subjectId && subjectId !== 'all') {
      query.subject = subjectId;
    }
    
    // Fetch attendance records with filters
    const attendance = await storage.getAttendance(query);
    
    // If no attendance records found, return empty array
    if (!attendance || attendance.length === 0) {
      return res.json([]);
    }
    
    // Fetch students and subjects to populate names
    const students = await storage.getUsers({ role: 'student' });
    const subjects = await storage.getSubjects();
    
    // Create maps for quick lookup
    const studentMap = new Map(students.map(s => [s._id, s.name]));
    const subjectMap = new Map(subjects.map(s => [s._id, s.name]));
    
    // Transform the data for Excel export
    const excelData = attendance.map(record => {
      const studentId = record.studentId;
      const subjectId = typeof record.subject === 'object' ? record.subject?._id : record.subject;
      
      return {
        'Student Name': studentMap.get(studentId) || 'Unknown',
        'Student ID': studentId,
        'Subject': subjectMap.get(subjectId) || 'Unknown',
        'Subject ID': subjectId,
        'Date': new Date(record.date).toLocaleDateString(),
        'Status': record.status === 'present' ? 'Present' : 'Absent',
        'Attendance Percentage': record.status === 'present' ? '100%' : '0%'
      };
    });

    res.json(excelData);
  } catch (error) {
    console.error('Error fetching attendance data for Excel:', error);
    res.status(500).json({ message: 'Error fetching attendance data' });
  }
});

  app.post('/api/contact-authority', authMiddleware, checkRole(['student']), async (req: AuthRequest, res) => {
    try {
      const { recipientRole, message } = req.body;
      const student = await UserModel.findById(req.user._id);

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      let recipientEmail = '';
      let recipientName = '';

      if (recipientRole === 'hod') {
        if (!student.department) {
          return res.status(400).json({ message: 'Student not associated with a department' });
        }
        const department = await Department.findOne({ _id: student.department }).populate('hod', 'name email');
        if (!department || !department.hod) {
          return res.status(404).json({ message: 'HOD not found for this department' });
        }
        recipientEmail = (department.hod as any).email;
        recipientName = (department.hod as any).name;
      } else if (recipientRole === 'principal') {
        if (!student.college) {
          return res.status(400).json({ message: 'Student not associated with a college' });
        }
        const college = await College.findOne({ _id: student.college }).populate('principal', 'name email');
        if (!college || !college.principal) {
          return res.status(404).json({ message: 'Principal not found for this college' });
        }
        recipientEmail = (college.principal as any).email;
        recipientName = (college.principal as any).name;
      } else if (recipientRole === 'shiksan_mantri') {
        const shiksanMantri = await UserModel.findOne({ role: 'shiksan_mantri' });
        if (!shiksanMantri) {
          return res.status(404).json({ message: 'Shiksan Mantri not found' });
        }
        recipientEmail = shiksanMantri.email;
        recipientName = shiksanMantri.name;
      } else {
        return res.status(400).json({ message: 'Invalid recipient role' });
      }

      console.log(`
        --- Contact Authority Message ---
        From: ${student.name} (${student.email})
        To: ${recipientName} (${recipientEmail})
        Role: ${recipientRole}
        Message: ${message}
        ---------------------------------
      `);

      res.status(200).json({ message: 'Message sent successfully (printed to console for development).' });
    } catch (error) {
      console.error('Error sending message to authority:', error);
      res.status(500).json({ message: 'Error sending message to authority' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
