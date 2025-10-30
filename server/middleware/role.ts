import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: any;
}

export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
};

export const checkOwnership = (req: AuthRequest, res: Response, next: NextFunction) => {
  // For students, they can only access their own resources
  if (req.user.role === 'student') {
    req.studentFilter = { student: req.user._id };
  }
  next();
};

// Guard features by allowed departments. Accepts array of normalized dept slugs.
export const checkDepartment = (allowedDepartments: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const department = (req.user as any)?.department;
    const normalized = typeof department === 'string' ? department.toLowerCase() : '';
    if (!normalized || !allowedDepartments.includes(normalized)) {
      return res.status(403).json({ message: 'Access denied: department not allowed' });
    }

    next();
  };
};
