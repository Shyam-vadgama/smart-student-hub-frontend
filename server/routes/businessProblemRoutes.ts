import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { checkRole, checkDepartment } from '../middleware/role';
import BusinessProblem from '../models/BusinessProblem';
import BusinessProblemSubmission from '../models/BusinessProblemSubmission';
import ExcelJS from 'exceljs'; // Assuming exceljs is installed

const router = express.Router();

// Faculty/HOD: create business problem (BBA only)
router.post('/create', authMiddleware, checkRole(['hod','faculty']), checkDepartment(['bba']), async (req: any, res) => {
  try {
    const { title, description, options } = req.body || {};
    if (!title || !description) return res.status(400).json({ message: 'Title and description are required' });
    const department = String((req.user as any).department || 'bba').toLowerCase();
    if (department !== 'bba') return res.status(403).json({ message: 'Only BBA department is allowed' });
    const problem = await BusinessProblem.create({ title, description, department, options: Array.isArray(options) ? options : [], createdBy: req.user._id });
    res.status(201).json({ _id: problem._id, title: problem.title, description: problem.description, department: problem.department, options: problem.options, createdAt: problem.createdAt });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create problem' });
  }
});

// List problems for BBA (students, faculty, hod)
router.get('/', authMiddleware, checkDepartment(['bba']), async (req: any, res) => {
  try {
    const problems = await BusinessProblem.find({ department: 'bba' }).sort({ createdAt: -1 });
    res.json(problems.map(p => ({ _id: p._id, title: p.title, description: p.description, department: p.department, options: p.options, createdAt: p.createdAt })));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch problems' });
  }
});

// Get single problem (BBA)
router.get('/:id', authMiddleware, checkDepartment(['bba']), async (req: any, res) => {
  try {
    const p = await BusinessProblem.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Problem not found' });
    if (p.department !== 'bba') return res.status(403).json({ message: 'Not allowed' });
    res.json({ _id: p._id, title: p.title, description: p.description, department: p.department, options: p.options, createdAt: p.createdAt });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch problem' });
  }
});

// Update problem (creator + faculty/hod, BBA)
router.put('/:id', authMiddleware, checkRole(['hod','faculty']), checkDepartment(['bba']), async (req: any, res) => {
  try {
    const p = await BusinessProblem.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Problem not found' });
    // Allow HODs to update any BBA problem, otherwise only creator can update
    if (req.user.role !== 'hod' && String(p.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'Only creator or HOD can update' });
    if (p.department !== 'bba') return res.status(403).json({ message: 'Not allowed' });
    const { title, description, options } = req.body || {};
    if (title !== undefined) (p as any).title = title;
    if (description !== undefined) (p as any).description = description;
    if (options !== undefined) (p as any).options = Array.isArray(options) ? options : [];
    await p.save();
    res.json({ _id: p._id, title: p.title, description: p.description, department: p.department, options: p.options, updatedAt: p.updatedAt });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update problem' });
  }
});

// Delete problem (creator + faculty/hod, BBA)
router.delete('/:id', authMiddleware, checkRole(['hod','faculty']), checkDepartment(['bba']), async (req: any, res) => {
  try {
    const p = await BusinessProblem.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Problem not found' });
    // Allow HODs to delete any BBA problem, otherwise only creator can delete
    if (req.user.role !== 'hod' && String(p.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'Only creator or HOD can delete' });
    if (p.department !== 'bba') return res.status(403).json({ message: 'Not allowed' });
    await p.deleteOne();
    res.json({ message: 'Problem deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete problem' });
  }
});

// Creator: my problems
router.get('/me/mine', authMiddleware, checkRole(['hod','faculty']), checkDepartment(['bba']), async (req: any, res) => {
  try {
    const problems = await BusinessProblem.find({ createdBy: req.user._id, department: 'bba' }).sort({ createdAt: -1 });
    res.json(problems.map(p => ({ _id: p._id, title: p.title, createdAt: p.createdAt })));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch my problems' });
  }
});

// Student: submit answer (selectedOption string; can be from options or free-form)
router.post('/:id/submit', authMiddleware, checkRole(['student']), checkDepartment(['bba']), async (req: any, res) => {
  try {
    const problem = await BusinessProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (problem.department !== 'bba') return res.status(403).json({ message: 'Not allowed' });
    const { selectedOption } = req.body || {};
    if (!selectedOption || typeof selectedOption !== 'string') {
      return res.status(400).json({ message: 'selectedOption is required' });
    }
    // prevent duplicate submission; allow update by resubmission
    const existing = await BusinessProblemSubmission.findOne({ problem: problem._id, student: req.user._id });
    if (existing) {
      (existing as any).selectedOption = selectedOption;
      await existing.save();
      return res.json({ _id: existing._id, updatedAt: existing.updatedAt });
    }
    const sub = await BusinessProblemSubmission.create({ problem: problem._id, student: req.user._id, selectedOption });
    res.status(201).json({ _id: sub._id, createdAt: sub.createdAt });
  } catch (e) {
    res.status(500).json({ message: 'Failed to submit' });
  }
});

// Faculty/HOD: list submissions for a problem (BBA)
router.get('/:id/submissions', authMiddleware, checkRole(['hod','faculty']), checkDepartment(['bba']), async (req: any, res) => {
  try {
    const problem = await BusinessProblem.findById(req.params.id).populate('createdBy','_id');
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (problem.department !== 'bba') return res.status(403).json({ message: 'Not allowed' });
    if (String((problem as any).createdBy?._id || problem.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only creator can view submissions' });
    }
    const subs = await BusinessProblemSubmission.find({ problem: problem._id }).populate('student','_id name email').sort({ createdAt: -1 });
    res.json(subs.map(s => ({ _id: s._id, student: s.student, selectedOption: s.selectedOption, createdAt: s.createdAt })));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// Student: my submission for a problem (BBA)
router.get('/:id/my-submission', authMiddleware, checkRole(['student']), checkDepartment(['bba']), async (req: any, res) => {
  try {
    const problem = await BusinessProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (problem.department !== 'bba') return res.status(403).json({ message: 'Not allowed' });
    const sub = await BusinessProblemSubmission.findOne({ problem: problem._id, student: req.user._id });
    if (!sub) return res.status(404).json({ message: 'No submission found' });
    res.json({ _id: sub._id, selectedOption: sub.selectedOption, createdAt: sub.createdAt, updatedAt: sub.updatedAt });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch submission' });
  }
});

// Student: list my submissions (BBA)
router.get('/me/my-submissions', authMiddleware, checkRole(['student']), checkDepartment(['bba']), async (req: any, res) => {
  try {
    const subs = await BusinessProblemSubmission.find({ student: req.user._id }).populate('problem','_id title');
    res.json(subs.map(s => ({ _id: s._id, problem: s.problem, selectedOption: s.selectedOption, createdAt: s.createdAt })));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch my submissions' });
  }
});

// Faculty/HOD: Export submissions for a problem to Excel
router.get('/:id/submissions/export', authMiddleware, checkRole(['hod', 'faculty']), checkDepartment(['bba']), async (req: any, res) => {
  try {
    const problem = await BusinessProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (problem.department !== 'bba') return res.status(403).json({ message: 'Not allowed' });

    const submissions = await BusinessProblemSubmission.find({ problem: problem._id })
      .populate('student', 'name email')
      .sort({ createdAt: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Submissions for ${problem.title}`);

    worksheet.columns = [
      { header: 'Student Name', key: 'studentName', width: 30 },
      { header: 'Student Email', key: 'studentEmail', width: 30 },
      { header: 'Submitted Answer', key: 'selectedOption', width: 50 },
      { header: 'Submission Date', key: 'createdAt', width: 20 },
    ];

    submissions.forEach((sub: any) => {
      worksheet.addRow({
        studentName: sub.student.name,
        studentEmail: sub.student.email,
        selectedOption: sub.selectedOption,
        createdAt: new Date(sub.createdAt).toLocaleDateString(),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=submissions-${problem._id}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (e) {
    console.error('Excel export failed:', e);
    res.status(500).json({ message: 'Failed to export submissions' });
  }
});

export default router;
