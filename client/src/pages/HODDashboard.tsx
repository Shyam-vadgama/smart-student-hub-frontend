import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Users, Link, Trash2, Calendar, BookOpen, CheckCircle, XCircle, BarChart3, UserCheck, AlertTriangle, Award, Download, FileSpreadsheet, Filter, Search, ChevronDown, TrendingUp, TrendingDown, Activity, Eye, EyeOff, RefreshCw, Settings, MoreHorizontal, PieChart, GraduationCap, UserMinus, Clock, Target } from "lucide-react";
import CreateStudent from '@/components/CreateStudent';
import StudentList from '@/components/StudentList';
import TimetableManager from '@/components/TimetableManager';
import * as XLSX from 'xlsx';

const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
    
  // Enhanced state management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [attendanceSubTab, setAttendanceSubTab] = useState('overview');
    
  // Faculty/Student creation states
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentSemester, setNewStudentSemester] = useState('');
  const [newStudentCourse, setNewStudentCourse] = useState('');
  const [newStudentBatch, setNewStudentBatch] = useState('');
  const [newStudentDepartment, setNewStudentDepartment] = useState('');
    
  // Enhanced filter states
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [lowAttendanceThreshold, setLowAttendanceThreshold] = useState(75);
  const [highAttendanceThreshold, setHighAttendanceThreshold] = useState(90);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
    
  // Dialog states
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [downloadSubjectFilter, setDownloadSubjectFilter] = useState('all');
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
    
  // Dashboard view preferences
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [compactView, setCompactView] = useState(false);

  // Timetable creation states
  const [timetableSemester, setTimetableSemester] = useState('');
  const [timetableSchedule, setTimetableSchedule] = useState<any[]>([]);
  const [isCreateTimetableDialogOpen, setIsCreateTimetableDialogOpen] = useState(false);

  // Fetch all faculty
  const { data: faculty, isLoading: isLoadingFaculty, refetch: refetchFaculty } = useQuery({
    queryKey: ['/api/users/faculty'],
    queryFn: () => apiRequest('GET', '/api/users/faculty').then((res) => res.json()),
    enabled: !!user && user.role === 'hod'
  });

  // Fetch all students
  const { data: students, isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ['/api/users/students'],
    queryFn: () => apiRequest('GET', '/api/users/students').then((res) => res.json()),
    enabled: !!user && user.role === 'hod'
  });

  // Fetch attendance for selected student
  const { data: studentAttendance = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance/student', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [] as any[];
      const res = await apiRequest('GET', `/api/attendance/student/${selectedStudentId}`);
      return res.json();
    },
    enabled: !!user && user.role === 'hod' && !!selectedStudentId,
  });

  // Fetch all attendance records to calculate summaries client-side
  const { data: allAttendance = [], isLoading: isLoadingAllAttendance } = useQuery({
    queryKey: ['/api/attendance/all'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/attendance/all');
      return res.json();
    },
    enabled: !!user && user.role === 'hod' && activeTab === 'attendance',
  });

  // Fetch subjects for filtering
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: () => apiRequest('GET', '/api/subjects').then(res => res.json()),
    enabled: !!user && user.role === 'hod',
  });

  // Fetch classrooms
  const { data: classrooms = [] } = useQuery({
    queryKey: ['/api/classrooms'],
    queryFn: () => apiRequest('GET', '/api/classrooms').then(res => res.json()),
    enabled: !!user && user.role === 'hod',
  });

  // Fetch existing timetables
  const { data: timetables = [], refetch: refetchTimetables } = useQuery({
    queryKey: ['/api/timetables/department', user?.department],
    queryFn: () => apiRequest('GET', `/api/timetables/department/${user?.department}`).then(res => res.json()),
    enabled: !!user && user.role === 'hod' && !!user.department,
  });

  // Enhanced filtering and search functionality
  const filteredStudents = useMemo(() => {
    if (!students) return [];
      
    let filtered = students.filter((student: any) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || 
                                student.department === selectedDepartment;
      
      // Enhanced filtering with profile data
      const profile = student.profile;
      const matchesSemester = selectedSemester === 'all' || 
                             (profile && profile.semester && profile.semester.toString() === selectedSemester);
      const matchesCourse = selectedCourse === 'all' || 
                           (profile && profile.course === selectedCourse);
      const matchesBatch = selectedBatch === 'all' || 
                          (profile && profile.batch === selectedBatch);
      
      return matchesSearch && matchesDepartment && matchesSemester && matchesCourse && matchesBatch;
    });

    // Sort students
    filtered.sort((a: any, b: any) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
        
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
        
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [students, searchTerm, selectedDepartment, sortBy, sortOrder]);

  const filteredFaculty = useMemo(() => {
    if (!faculty) return [];
      
    return faculty.filter((member: any) => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [faculty, searchTerm]);

  // Calculate attendance summaries from all attendance records
  const attendanceSummaries = useMemo(() => {
    if (!allAttendance || allAttendance.length === 0 || !students || students.length === 0) {
      return [];
    }

    // Create a map to store attendance data for each student
    const studentAttendanceMap = new Map();

    // Initialize the map with all students
    students.forEach((student: any) => {
      studentAttendanceMap.set(student._id, {
        studentId: student._id,
        studentName: student.name,
        presentCount: 0,
        totalCount: 0,
        attendancePercentage: 0
      });
    });

    // Process attendance records
    allAttendance.forEach((record: any) => {
      if (record.studentId && studentAttendanceMap.has(record.studentId)) {
        const studentData = studentAttendanceMap.get(record.studentId);
        studentData.totalCount += 1;
        if (record.status === 'present') {
          studentData.presentCount += 1;
        }
      }
    });

    // Calculate attendance percentage for each student
    studentAttendanceMap.forEach(studentData => {
      if (studentData.totalCount > 0) {
        studentData.attendancePercentage = Math.round((studentData.presentCount / studentData.totalCount) * 100);
      }
    });

    // Convert to array and sort by attendance percentage
    return Array.from(studentAttendanceMap.values()).sort((a, b) => a.attendancePercentage - b.attendancePercentage);
  }, [allAttendance, students]);

  // Compute low and high attendance students
  const { lowAttendanceStudents, highAttendanceStudents } = useMemo(() => {
    if (!attendanceSummaries || attendanceSummaries.length === 0) {
      return { lowAttendanceStudents: [], highAttendanceStudents: [] };
    }

    const low = attendanceSummaries.filter(
      summary => summary.attendancePercentage < lowAttendanceThreshold
    );
    const high = attendanceSummaries.filter(
      summary => summary.attendancePercentage >= highAttendanceThreshold
    );

    return { lowAttendanceStudents: low, highAttendanceStudents: high };
  }, [attendanceSummaries, lowAttendanceThreshold, highAttendanceThreshold]);

  // Calculate subject-wise attendance
  const subjectWiseAttendance = useMemo(() => {
    if (!allAttendance || allAttendance.length === 0 || !subjects || subjects.length === 0) {
      return [];
    }

    // Create a map to store attendance data for each subject
    const subjectAttendanceMap = new Map();

    // Initialize the map with all subjects
    subjects.forEach((subject: any) => {
      subjectAttendanceMap.set(subject._id, {
        subjectId: subject._id,
        subjectName: subject.name,
        presentCount: 0,
        absentCount: 0,
        totalCount: 0,
        attendancePercentage: 0
      });
    });

    // Process attendance records
    allAttendance.forEach((record: any) => {
      const subjectId = typeof record.subject === 'object' ? record.subject?._id : record.subject;
      if (subjectId && subjectAttendanceMap.has(subjectId)) {
        const subjectData = subjectAttendanceMap.get(subjectId);
        subjectData.totalCount += 1;
        if (record.status === 'present') {
          subjectData.presentCount += 1;
        } else {
          subjectData.absentCount += 1;
        }
      }
    });

    // Calculate attendance percentage for each subject
    subjectAttendanceMap.forEach(subjectData => {
      if (subjectData.totalCount > 0) {
        subjectData.attendancePercentage = Math.round((subjectData.presentCount / subjectData.totalCount) * 100);
      }
    });

    // Convert to array and sort by subject name
    return Array.from(subjectAttendanceMap.values()).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [allAttendance, subjects]);

  // Get filtered subject-wise attendance based on selected subject
  const filteredSubjectAttendance = useMemo(() => {
    if (selectedSubjectId === 'all') {
      return subjectWiseAttendance;
    }
    return subjectWiseAttendance.filter(subject => subject.subjectId === selectedSubjectId);
  }, [subjectWiseAttendance, selectedSubjectId]);

  // Enhanced statistics calculations
  const dashboardStats = useMemo(() => {
    const totalStudents = students?.length || 0;
    const totalFaculty = faculty?.length || 0;
    const totalSubjects = subjects?.length || 0;
      
    const avgAttendance = attendanceSummaries.length > 0
      ? Math.round(attendanceSummaries.reduce((sum, s) => sum + s.attendancePercentage, 0) / attendanceSummaries.length)
      : 0;

    const criticalStudents = lowAttendanceStudents.length;
    const excellentStudents = highAttendanceStudents.length;

    return {
      totalStudents,
      totalFaculty,
      totalSubjects,
      avgAttendance,
      criticalStudents,
      excellentStudents
    };
  }, [students, faculty, subjects, attendanceSummaries, lowAttendanceStudents, highAttendanceStudents]);

  // Function to generate and download Excel file
  const generateExcelReport = async () => {
    setIsGeneratingExcel(true);
    try {
      // Fetch pre-shaped JSON rows from server with current filter
      const query = new URLSearchParams();
      if (downloadSubjectFilter && downloadSubjectFilter !== 'all') {
        query.set('subjectId', downloadSubjectFilter);
      }

      const res = await apiRequest('GET', `/api/attendance/excel${query.toString() ? `?${query.toString()}` : ''}`);
      const excelData = await res.json();

      // Build workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Data');

      // Name file according to filter
      const subjectMap = new Map(subjects?.map((s: any) => [s._id, s.name]) || []);
      const fileName = downloadSubjectFilter === 'all'
        ? 'All_Students_Attendance_Report.xlsx'
        : `${subjectMap.get(downloadSubjectFilter) || 'Selected_Subject'}_Attendance_Report.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast({ title: 'Excel report generated', description: `${fileName} has been downloaded successfully.` });
      setIsDownloadDialogOpen(false);
    } catch (error) {
      console.error('Error generating Excel report:', error);
      toast({ title: 'Error generating report', description: 'Failed to generate Excel report. Please try again.', variant: 'destructive' });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  // Function to generate subject-wise Excel report
  const generateSubjectWiseExcelReport = async () => {
    setIsGeneratingExcel(true);
    try {
      // Prepare data for Excel
      let reportData = subjectWiseAttendance;

      // Apply subject filter if not 'all'
      if (selectedSubjectId !== 'all') {
        reportData = subjectWiseAttendance.filter(subject => subject.subjectId === selectedSubjectId);
      }

      // Prepare data rows
      const excelData = reportData.map(subject => ({
        'Subject Name': subject.subjectName,
        'Subject ID': subject.subjectId,
        'Total Classes': subject.totalCount,
        'Present Count': subject.presentCount,
        'Absent Count': subject.absentCount,
        'Attendance Percentage': `${subject.attendancePercentage}%`
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Subject-wise Attendance");

      // Generate Excel file and trigger download
      const fileName = selectedSubjectId === 'all'
        ? 'All_Subjects_Attendance_Report.xlsx'
        : `${reportData[0]?.subjectName || 'Selected_Subject'}_Attendance_Report.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast({
        title: "Excel report generated",
        description: `${fileName} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error generating subject-wise Excel report:', error);
      toast({
        title: "Error generating report",
        description: "Failed to generate Excel report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  // Function to get detailed subject attendance data
  const getDetailedSubjectAttendance = (subjectId: any) => {
    if (!allAttendance || !students) return [];

    const subjectAttendance = allAttendance.filter((record: any) => {
      const recordSubjectId = typeof record.subject === 'object' ? record.subject?._id : record.subject;
      return recordSubjectId === subjectId;
    });

    // Create a map for student names
    const studentMap = new Map(students.map((s: any) => [s._id, s.name]));

    return subjectAttendance.map((record: any) => {
      const studentId = record.studentId;
      return {
        ...record,
        studentName: studentMap.get(studentId) || 'Unknown',
        attendancePercentage: record.status === 'present' ? 100 : 0
      };
    });
  };

  // Mutation to create a new faculty member
  const createFacultyMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('POST', '/api/users/create-faculty', data),
    onSuccess: (response: any) => {
      toast({
        title: 'Faculty created successfully',
        description: response.message || 'An email has been sent to the new faculty member to set their password.',
      });
      setNewFacultyName('');
      setNewFacultyEmail('');
      queryClient.invalidateQueries({ queryKey: ['/api/users/faculty'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating faculty',
        description: error.message || 'An error occurred while creating the faculty.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to create a new student
  const createStudentMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('POST', '/api/users/create-student', data),
    onSuccess: (response: any) => {
      toast({
        title: 'Student created successfully',
        description: response.message || 'An email has been sent to the new student to set their password.',
      });
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentSemester('');
      setNewStudentCourse('');
      setNewStudentBatch('');
      setNewStudentDepartment('');
      queryClient.invalidateQueries({ queryKey: ['/api/users/students'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating student',
        description: error.message || 'An error occurred while creating the student.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for resending a password reset link
  const resendPasswordLinkMutation = useMutation({
    mutationFn: (email: string) =>
      apiRequest('POST', '/api/users/resend-password-link', { email }),
    onSuccess: () => {
      toast({
        title: 'Password link sent',
        description: 'A new password reset link has been sent to the user.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error sending link',
        description: error.message || 'Failed to send password reset link.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete a user
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest('DELETE', `/api/users/${userId}`),
    onSuccess: () => {
      toast({
        title: 'User deleted',
        description: 'The user has been removed from the system.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/faculty'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/students'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting user',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateFaculty = (e: any) => {
    e.preventDefault();
    if (!newFacultyName.trim() || !newFacultyEmail.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }
    createFacultyMutation.mutate({ name: newFacultyName, email: newFacultyEmail });
  };

  const handleCreateStudent = (e: any) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and email are required fields',
        variant: 'destructive',
      });
      return;
    }
    
    const studentData = {
      name: newStudentName,
      email: newStudentEmail,
      semester: newStudentSemester ? parseInt(newStudentSemester) : undefined,
      course: newStudentCourse || undefined,
      batch: newStudentBatch || undefined,
      department: newStudentDepartment || undefined
    };
    
    createStudentMutation.mutate(studentData);
  };

  const handleResendLink = (email: string) => {
    resendPasswordLinkMutation.mutate(email);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Function to get user initials
  const getUserInitials = (name: string) => {
    return name.split(' ').map((part: string) => part[0]).join('').toUpperCase().slice(0, 2);
  };

  // Function to get attendance status color
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= highAttendanceThreshold) return 'text-green-600';
    if (percentage < lowAttendanceThreshold) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        "lg:ml-64", // Always offset by sidebar width on large screens
        "flex flex-col min-h-screen"
      )}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm z-30 relative">
          <Header title="HOD Dashboard" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        </div>
          
        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Enhanced Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">HOD Dashboard</h1>
                      <p className="text-gray-600 text-sm lg:text-base">Welcome back, {user?.name}. Here's your department overview.</p>
                    </div>
                  </div>
                </div>
                  
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterDialogOpen(true)}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100">
                    Total Students
                  </CardTitle>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-blue-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{dashboardStats.totalStudents}</div>
                  <p className="text-xs text-blue-200">
                    Active registered students
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-100">
                    Faculty Members
                  </CardTitle>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{dashboardStats.totalFaculty}</div>
                  <p className="text-xs text-green-200">
                    Teaching staff
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-100">
                    Average Attendance
                  </CardTitle>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{dashboardStats.avgAttendance}%</div>
                  <p className="text-xs text-purple-200">
                    Overall department average
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-100">
                    Critical Students
                  </CardTitle>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{dashboardStats.criticalStudents}</div>
                  <p className="text-xs text-orange-200">
                    Below {lowAttendanceThreshold}% attendance
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-6 border-b border-gray-200">
                  <TabsList className="grid w-full lg:w-auto grid-cols-5 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger 
                      value="overview" 
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="faculty" 
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all"
                    >
                      Faculty
                    </TabsTrigger>
                    <TabsTrigger 
                      value="students" 
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all"
                    >
                      Students
                    </TabsTrigger>
                    <TabsTrigger 
                      value="attendance" 
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all"
                    >
                      Attendance
                    </TabsTrigger>
                    <TabsTrigger 
                      value="timetable" 
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all"
                    >
                      Timetable
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="flex items-center gap-2 flex-1 lg:flex-initial"
                    >
                      {viewMode === 'grid' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      {viewMode === 'grid' ? 'List View' : 'Grid View'}
                    </Button>
                      
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompactView(!compactView)}
                      className="flex items-center gap-2 flex-1 lg:flex-initial"
                    >
                      <Settings className="h-4 w-4" />
                      {compactView ? 'Expanded' : 'Compact'}
                    </Button>
                  </div>
                </div>

                {/* Overview Tab */}
                <TabsContent value="overview" className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions Card */}
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        Quick Actions
                      </CardTitle>
                      <CardDescription>
                        Frequently used management tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-20 flex flex-col gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200">
                            <UserPlus className="h-6 w-6" />
                            Add Faculty
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Faculty Member</DialogTitle>
                            <DialogDescription>
                              Create a new faculty account and send login credentials via email.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateFaculty} className="space-y-4">
                            <div>
                              <Label htmlFor="facultyName">Full Name</Label>
                              <Input
                                id="facultyName"
                                value={newFacultyName}
                                onChange={(e) => setNewFacultyName(e.target.value)}
                                placeholder="Enter faculty name"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="facultyEmail">Email</Label>
                              <Input
                                id="facultyEmail"
                                type="email"
                                value={newFacultyEmail}
                                onChange={(e) => setNewFacultyEmail(e.target.value)}
                                placeholder="Enter faculty email"
                                required
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={createFacultyMutation.isPending}>
                                {createFacultyMutation.isPending ? 'Creating...' : 'Create Faculty'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-20 flex flex-col gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200">
                            <GraduationCap className="h-6 w-6" />
                            Add Student
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                            <DialogDescription>
                              Register a new student and send login credentials via email.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div>
                              <Label htmlFor="studentName">Full Name</Label>
                              <Input
                                id="studentName"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="Enter student name"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="studentEmail">Email</Label>
                              <Input
                                id="studentEmail"
                                type="email"
                                value={newStudentEmail}
                                onChange={(e) => setNewStudentEmail(e.target.value)}
                                placeholder="Enter student email"
                                required
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={createStudentMutation.isPending}>
                                {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={() => setIsDownloadDialogOpen(true)}
                        className="h-20 flex flex-col gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200"
                      >
                        <Download className="h-6 w-6" />
                        Export Data
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-20 flex flex-col gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200">
                            <GraduationCap className="h-6 w-6" />
                            Add Student
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                            <DialogDescription>
                              Register a new student with academic details and send login credentials via email.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <Label htmlFor="quickStudentName">Full Name *</Label>
                                <Input
                                  id="quickStudentName"
                                  value={newStudentName}
                                  onChange={(e) => setNewStudentName(e.target.value)}
                                  placeholder="Enter student name"
                                  required
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="quickStudentEmail">Email *</Label>
                                <Input
                                  id="quickStudentEmail"
                                  type="email"
                                  value={newStudentEmail}
                                  onChange={(e) => setNewStudentEmail(e.target.value)}
                                  placeholder="Enter student email"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="quickStudentSemester">Semester</Label>
                                <Select value={newStudentSemester} onValueChange={setNewStudentSemester}>
                                  <SelectTrigger id="quickStudentSemester">
                                    <SelectValue placeholder="Select semester" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1st Semester</SelectItem>
                                    <SelectItem value="2">2nd Semester</SelectItem>
                                    <SelectItem value="3">3rd Semester</SelectItem>
                                    <SelectItem value="4">4th Semester</SelectItem>
                                    <SelectItem value="5">5th Semester</SelectItem>
                                    <SelectItem value="6">6th Semester</SelectItem>
                                    <SelectItem value="7">7th Semester</SelectItem>
                                    <SelectItem value="8">8th Semester</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="quickStudentCourse">Course</Label>
                                <Select value={newStudentCourse} onValueChange={setNewStudentCourse}>
                                  <SelectTrigger id="quickStudentCourse">
                                    <SelectValue placeholder="Select course" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="B.Tech">B.Tech</SelectItem>
                                    <SelectItem value="B.E">B.E</SelectItem>
                                    <SelectItem value="M.Tech">M.Tech</SelectItem>
                                    <SelectItem value="M.E">M.E</SelectItem>
                                    <SelectItem value="PhD">PhD</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="quickStudentBatch">Batch</Label>
                                <Input
                                  id="quickStudentBatch"
                                  value={newStudentBatch}
                                  onChange={(e) => setNewStudentBatch(e.target.value)}
                                  placeholder="e.g., 2021-2025"
                                />
                              </div>
                              <div>
                                <Label htmlFor="quickStudentDepartment">Department</Label>
                                <Select value={newStudentDepartment} onValueChange={setNewStudentDepartment}>
                                  <SelectTrigger id="quickStudentDepartment">
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
                                    <SelectItem value="ECE">Electronics & Communication</SelectItem>
                                    <SelectItem value="EEE">Electrical & Electronics</SelectItem>
                                    <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                                    <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                                    <SelectItem value="IT">Information Technology</SelectItem>
                                    <SelectItem value="CHEM">Chemical Engineering</SelectItem>
                                    <SelectItem value="AERO">Aerospace Engineering</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                  setNewStudentName('');
                                  setNewStudentEmail('');
                                  setNewStudentSemester('');
                                  setNewStudentCourse('');
                                  setNewStudentBatch('');
                                  setNewStudentDepartment('');
                                }}
                              >
                                Clear
                              </Button>
                              <Button type="submit" disabled={createStudentMutation.isPending}>
                                {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>

                  {/* Attendance Insights Card */}
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        Attendance Insights
                      </CardTitle>
                      <CardDescription>
                        Student performance overview
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-700">{dashboardStats.excellentStudents}</div>
                          <div className="text-sm text-green-600">Excellent ({highAttendanceThreshold}%+)</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="text-2xl font-bold text-red-700">{dashboardStats.criticalStudents}</div>
                          <div className="text-sm text-red-600">Critical (&lt;{lowAttendanceThreshold}%)</div>
                        </div>
                      </div>
                        
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Department Average</span>
                          <span className="font-semibold">{dashboardStats.avgAttendance}%</span>
                        </div>
                        <Progress 
                          value={dashboardStats.avgAttendance} 
                          className="h-3"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity Timeline */}
                <Card className="shadow-sm border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest updates and changes in your department
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New student registrations</p>
                          <p className="text-xs text-gray-600">3 new students added today</p>
                        </div>
                        <Badge variant="secondary">Today</Badge>
                      </div>
                      <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Attendance improvement</p>
                          <p className="text-xs text-gray-600">Department average increased by 2.5%</p>
                        </div>
                        <Badge variant="secondary">Yesterday</Badge>
                      </div>
                      <div className="flex items-center space-x-4 p-3 bg-purple-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Faculty meeting scheduled</p>
                          <p className="text-xs text-gray-600">Monthly review meeting planned</p>
                        </div>
                        <Badge variant="secondary">2 days ago</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

                {/* Enhanced Faculty Tab */}
                <TabsContent value="faculty" className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Faculty Management</h2>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {isLoadingFaculty ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFaculty?.map((member: any) => (
                      <Card key={member._id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {getUserInitials(member.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                              <p className="text-sm text-gray-600 truncate">{member.email}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={member.isActive ? "default" : "secondary"} className="text-xs">
                                  {member.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {member.department && (
                                  <Badge variant="outline" className="text-xs">
                                    {member.department}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendLink(member.email)}
                                disabled={resendPasswordLinkMutation.isPending}
                                className="h-8 w-8 p-0"
                              >
                                <Link className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(member._id)}
                                disabled={deleteUserMutation.isPending}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-sm border-0 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFaculty?.map((member: any) => (
                          <TableRow key={member._id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                  {getUserInitials(member.name)}
                                </div>
                                <span className="font-medium">{member.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                              <Badge variant={member.isActive ? "default" : "secondary"}>
                                {member.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {member.department ? (
                                <Badge variant="outline">{member.department}</Badge>
                              ) : (
                                <span className="text-gray-400">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendLink(member.email)}
                                  disabled={resendPasswordLinkMutation.isPending}
                                >
                                  <Link className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(member._id)}
                                  disabled={deleteUserMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}

                {filteredFaculty?.length === 0 && !isLoadingFaculty && (
                  <Card className="p-12 text-center border-dashed border-2">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Faculty Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? 'No faculty members match your search criteria.' : 'No faculty members have been added yet.'}
                    </p>
                    {!searchTerm && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add First Faculty
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Faculty Member</DialogTitle>
                            <DialogDescription>
                              Create a new faculty account and send login credentials via email.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateFaculty} className="space-y-4">
                            <div>
                              <Label htmlFor="facultyName">Full Name</Label>
                              <Input
                                id="facultyName"
                                value={newFacultyName}
                                onChange={(e) => setNewFacultyName(e.target.value)}
                                placeholder="Enter faculty name"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="facultyEmail">Email</Label>
                              <Input
                                id="facultyEmail"
                                type="email"
                                value={newFacultyEmail}
                                onChange={(e) => setNewFacultyEmail(e.target.value)}
                                placeholder="Enter faculty email"
                                required
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={createFacultyMutation.isPending}>
                                {createFacultyMutation.isPending ? 'Creating...' : 'Create Faculty'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </Card>
                )}
              </TabsContent>

                {/* Enhanced Students Tab */}
                <TabsContent value="students" className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Add Student Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                          <UserPlus c
                          lassName="h-4 w-4" />
                          Add Student
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Add New Student</DialogTitle>
                          <DialogDescription>
                            Register a new student with academic details and send login credentials via email.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <Label htmlFor="studentName">Full Name *</Label>
                              <Input
                                id="studentName"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="Enter student name"
                                required
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="studentEmail">Email *</Label>
                              <Input
                                id="studentEmail"
                                type="email"
                                value={newStudentEmail}
                                onChange={(e) => setNewStudentEmail(e.target.value)}
                                placeholder="Enter student email"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="studentSemester">Semester</Label>
                              <Select value={newStudentSemester} onValueChange={setNewStudentSemester}>
                                <SelectTrigger id="studentSemester">
                                  <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1st Semester</SelectItem>
                                  <SelectItem value="2">2nd Semester</SelectItem>
                                  <SelectItem value="3">3rd Semester</SelectItem>
                                  <SelectItem value="4">4th Semester</SelectItem>
                                  <SelectItem value="5">5th Semester</SelectItem>
                                  <SelectItem value="6">6th Semester</SelectItem>
                                  <SelectItem value="7">7th Semester</SelectItem>
                                  <SelectItem value="8">8th Semester</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="studentCourse">Course</Label>
                              <Select value={newStudentCourse} onValueChange={setNewStudentCourse}>
                                <SelectTrigger id="studentCourse">
                                  <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="B.Tech">B.Tech</SelectItem>
                                  <SelectItem value="B.E">B.E</SelectItem>
                                  <SelectItem value="M.Tech">M.Tech</SelectItem>
                                  <SelectItem value="M.E">M.E</SelectItem>
                                  <SelectItem value="PhD">PhD</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="studentBatch">Batch</Label>
                              <Input
                                id="studentBatch"
                                value={newStudentBatch}
                                onChange={(e) => setNewStudentBatch(e.target.value)}
                                placeholder="e.g., 2021-2025"
                              />
                            </div>
                            <div>
                              <Label htmlFor="studentDepartment">Department</Label>
                              <Select value={newStudentDepartment} onValueChange={setNewStudentDepartment}>
                                <SelectTrigger id="studentDepartment">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
                                  <SelectItem value="ECE">Electronics & Communication</SelectItem>
                                  <SelectItem value="EEE">Electrical & Electronics</SelectItem>
                                  <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                                  <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                                  <SelectItem value="IT">Information Technology</SelectItem>
                                  <SelectItem value="CHEM">Chemical Engineering</SelectItem>
                                  <SelectItem value="AERO">Aerospace Engineering</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setNewStudentName('');
                                setNewStudentEmail('');
                                setNewStudentSemester('');
                                setNewStudentCourse('');
                                setNewStudentBatch('');
                                setNewStudentDepartment('');
                              }}
                            >
                              Clear
                            </Button>
                            <Button type="submit" disabled={createStudentMutation.isPending}>
                              {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Existing Filters */}
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="CSE">Computer Science</SelectItem>
                        <SelectItem value="ECE">Electronics</SelectItem>
                        <SelectItem value="MECH">Mechanical</SelectItem>
                        <SelectItem value="CIVIL">Civil</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {isLoadingStudents ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredStudents?.map((student: any) => {
                      const studentAttendanceSummary = attendanceSummaries.find(s => s.studentId === student._id);
                      return (
                        <Card key={student._id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {getUserInitials(student.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
                                <p className="text-sm text-gray-600 truncate">{student.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant={student.isActive ? "default" : "secondary"} className="text-xs">
                                    {student.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  {student.department && (
                                    <Badge variant="outline" className="text-xs">
                                      {student.department}
                                    </Badge>
                                  )}
                                </div>
                                {studentAttendanceSummary && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">Attendance</span>
                                      <span className={cn("font-semibold", getAttendanceColor(studentAttendanceSummary.attendancePercentage))}>
                                        {studentAttendanceSummary.attendancePercentage}%
                                      </span>
                                    </div>
                                    <Progress 
                                      value={studentAttendanceSummary.attendancePercentage} 
                                      className="mt-1 h-1"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendLink(student.email)}
                                  disabled={resendPasswordLinkMutation.isPending}
                                  className="h-8 w-8 p-0"
                                >
                                  <Link className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(student._id)}
                                  disabled={deleteUserMutation.isPending}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="shadow-sm border-0 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents?.map((student: any) => {
                          const studentAttendanceSummary = attendanceSummaries.find(s => s.studentId === student._id);
                          return (
                            <TableRow key={student._id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                                    {getUserInitials(student.name)}
                                  </div>
                                  <span className="font-medium">{student.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{student.email}</TableCell>
                              <TableCell>
                                <Badge variant={student.isActive ? "default" : "secondary"}>
                                  {student.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {student.department ? (
                                  <Badge variant="outline">{student.department}</Badge>
                                ) : (
                                  <span className="text-gray-400">Not assigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {studentAttendanceSummary ? (
                                  <div className="flex items-center gap-2">
                                    <span className={cn("font-medium", getAttendanceColor(studentAttendanceSummary.attendancePercentage))}>
                                      {studentAttendanceSummary.attendancePercentage}%
                                    </span>
                                    <Progress 
                                      value={studentAttendanceSummary.attendancePercentage} 
                                      className="w-16 h-2"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No data</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResendLink(student.email)}
                                    disabled={resendPasswordLinkMutation.isPending}
                                  >
                                    <Link className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(student._id)}
                                    disabled={deleteUserMutation.isPending}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                )}

                {filteredStudents?.length === 0 && !isLoadingStudents && (
                  <Card className="p-12 text-center border-dashed border-2">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || selectedDepartment !== 'all' 
                        ? 'No students match your current filters.' 
                        : 'No students have been registered yet.'}
                    </p>
                    {!searchTerm && selectedDepartment === 'all' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add First Student
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                            <DialogDescription>
                              Register a new student with academic details and send login credentials via email.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <Label htmlFor="studentName">Full Name *</Label>
                                <Input
                                  id="studentName"
                                  value={newStudentName}
                                  onChange={(e) => setNewStudentName(e.target.value)}
                                  placeholder="Enter student name"
                                  required
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="studentEmail">Email *</Label>
                                <Input
                                  id="studentEmail"
                                  type="email"
                                  value={newStudentEmail}
                                  onChange={(e) => setNewStudentEmail(e.target.value)}
                                  placeholder="Enter student email"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="studentSemester">Semester</Label>
                                <Select value={newStudentSemester} onValueChange={setNewStudentSemester}>
                                  <SelectTrigger id="studentSemester">
                                    <SelectValue placeholder="Select semester" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1st Semester</SelectItem>
                                    <SelectItem value="2">2nd Semester</SelectItem>
                                    <SelectItem value="3">3rd Semester</SelectItem>
                                    <SelectItem value="4">4th Semester</SelectItem>
                                    <SelectItem value="5">5th Semester</SelectItem>
                                    <SelectItem value="6">6th Semester</SelectItem>
                                    <SelectItem value="7">7th Semester</SelectItem>
                                    <SelectItem value="8">8th Semester</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="studentCourse">Course</Label>
                                <Select value={newStudentCourse} onValueChange={setNewStudentCourse}>
                                  <SelectTrigger id="studentCourse">
                                    <SelectValue placeholder="Select course" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="B.Tech">B.Tech</SelectItem>
                                    <SelectItem value="B.E">B.E</SelectItem>
                                    <SelectItem value="M.Tech">M.Tech</SelectItem>
                                    <SelectItem value="M.E">M.E</SelectItem>
                                    <SelectItem value="PhD">PhD</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="studentBatch">Batch</Label>
                                <Input
                                  id="studentBatch"
                                  value={newStudentBatch}
                                  onChange={(e) => setNewStudentBatch(e.target.value)}
                                  placeholder="e.g., 2021-2025"
                                />
                              </div>
                              <div>
                                <Label htmlFor="studentDepartment">Department</Label>
                                <Select value={newStudentDepartment} onValueChange={setNewStudentDepartment}>
                                  <SelectTrigger id="studentDepartment">
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
                                    <SelectItem value="ECE">Electronics & Communication</SelectItem>
                                    <SelectItem value="EEE">Electrical & Electronics</SelectItem>
                                    <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                                    <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                                    <SelectItem value="IT">Information Technology</SelectItem>
                                    <SelectItem value="CHEM">Chemical Engineering</SelectItem>
                                    <SelectItem value="AERO">Aerospace Engineering</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                  setNewStudentName('');
                                  setNewStudentEmail('');
                                  setNewStudentSemester('');
                                  setNewStudentCourse('');
                                  setNewStudentBatch('');
                                  setNewStudentDepartment('');
                                }}
                              >
                                Clear
                              </Button>
                              <Button type="submit" disabled={createStudentMutation.isPending}>
                                {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </Card>
                )}
              </TabsContent>

                {/* Enhanced Attendance Tab */}
                <TabsContent value="attendance" className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Attendance Analytics</h2>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map((subject: any) => (
                          <SelectItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setIsDownloadDialogOpen(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                <Tabs value={attendanceSubTab} onValueChange={setAttendanceSubTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="students" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      Students
                    </TabsTrigger>
                    <TabsTrigger value="subjects" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      Subjects
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Attendance Distribution */}
                      <Card className="lg:col-span-2 shadow-sm border border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-blue-500" />
                            Attendance Distribution
                          </CardTitle>
                          <CardDescription>
                            Student performance breakdown
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                                <div className="text-2xl font-bold text-green-700">{dashboardStats.excellentStudents}</div>
                                <div className="text-sm text-green-600">Excellent</div>
                                <div className="text-xs text-green-500 mt-1">≥{highAttendanceThreshold}%</div>
                              </div>
                              <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
                                <div className="text-2xl font-bold text-yellow-700">
                                  {attendanceSummaries.length - dashboardStats.excellentStudents - dashboardStats.criticalStudents}
                                </div>
                                <div className="text-sm text-yellow-600">Average</div>
                                <div className="text-xs text-yellow-500 mt-1">{lowAttendanceThreshold}%-{highAttendanceThreshold}%</div>
                              </div>
                              <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
                                <div className="text-2xl font-bold text-red-700">{dashboardStats.criticalStudents}</div>
                                <div className="text-sm text-red-600">Critical</div>
                                <div className="text-xs text-red-500 mt-1">&lt;{lowAttendanceThreshold}%</div>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Department Average</span>
                                <span className="font-semibold">{dashboardStats.avgAttendance}%</span>
                              </div>
                              <Progress 
                                value={dashboardStats.avgAttendance} 
                                className="h-3"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Threshold Controls */}
                      <Card className="shadow-sm border border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-gray-500" />
                            Thresholds
                          </CardTitle>
                          <CardDescription>
                            Adjust performance criteria
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="lowThreshold">Low Attendance (&lt;{lowAttendanceThreshold}%)</Label>
                            <Input
                              id="lowThreshold"
                              type="number"
                              value={lowAttendanceThreshold}
                              onChange={(e) => setLowAttendanceThreshold(Number(e.target.value))}
                              className="mt-1"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <Label htmlFor="highThreshold">High Attendance (≥{highAttendanceThreshold}%)</Label>
                            <Input
                              id="highThreshold"
                              type="number"
                              value={highAttendanceThreshold}
                              onChange={(e) => setHighAttendanceThreshold(Number(e.target.value))}
                              className="mt-1"
                              min="0"
                              max="100"
                            />
                          </div>
                            
                          <Button 
                            onClick={generateSubjectWiseExcelReport}
                            disabled={isGeneratingExcel}
                            className="w-full mt-4"
                          >
                            {isGeneratingExcel ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Export Report
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="students" className="space-y-4">
                    {/* Student Selection and Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="shadow-sm border border-gray-200">
                        <CardHeader>
                          <CardTitle>Select Student</CardTitle>
                          <CardDescription>
                            Choose a student to view detailed attendance
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                            <SelectContent>
                              {attendanceSummaries.map((summary) => (
                                <SelectItem key={summary.studentId} value={summary.studentId}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{summary.studentName}</span>
                                    <Badge variant="outline" className="ml-2">
                                      {summary.attendancePercentage}%
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>

                      <Card className="lg:col-span-2 shadow-sm border border-gray-200">
                        <CardHeader>
                          <CardTitle>Student Attendance Details</CardTitle>
                          <CardDescription>
                            {selectedStudentId ? "Detailed attendance records" : "Select a student to view details"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {selectedStudentId ? (
                            <div className="space-y-4">
                              {isLoadingAttendance ? (
                                <div className="space-y-2">
                                  {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                  ))}
                                </div>
                              ) : studentAttendance.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {studentAttendance.map((record: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <div>
                                        <span className="font-medium">
                                          {typeof record.subject === 'object' ? record.subject.name : record.subject}
                                        </span>
                                        <span className="text-sm text-gray-600 ml-2">
                                          {new Date(record.date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                                        {record.status === 'present' ? (
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                        ) : (
                                          <XCircle className="h-3 w-3 mr-1" />
                                        )}
                                        {record.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-center py-4">No attendance records found for this student.</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-8">Please select a student to view their attendance details.</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Critical Students Alert */}
                    {dashboardStats.criticalStudents > 0 && (
                      <Card className="border-red-200 bg-red-50 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-red-800 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Students Requiring Attention
                          </CardTitle>
                          <CardDescription className="text-red-600">
                            {dashboardStats.criticalStudents} student{dashboardStats.criticalStudents > 1 ? 's' : ''} with attendance below {lowAttendanceThreshold}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lowAttendanceStudents.slice(0, 6).map((student) => (
                              <div key={student.studentId} className="bg-white p-3 rounded border border-red-200">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">{student.studentName}</span>
                                  <Badge variant="destructive">
                                    {student.attendancePercentage}%
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {student.presentCount}/{student.totalCount} classes attended
                                </div>
                              </div>
                            ))}
                          </div>
                          {lowAttendanceStudents.length > 6 && (
                            <p className="text-sm text-red-600 mt-3">
                              And {lowAttendanceStudents.length - 6} more students...
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="subjects" className="space-y-4">
                    <Card className="shadow-sm border border-gray-200">
                      <CardHeader>
                        <CardTitle>Subject-wise Attendance</CardTitle>
                        <CardDescription>
                          Attendance statistics for each subject
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAllAttendance ? (
                          <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                            ))}
                          </div>
                        ) : filteredSubjectAttendance.length > 0 ? (
                          <div className="space-y-4">
                            {filteredSubjectAttendance.map((subject) => (
                              <div key={subject.subjectId} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h3 className="font-semibold text-gray-900">{subject.subjectName}</h3>
                                  <Badge 
                                    variant="outline"
                                    className={cn(
                                      subject.attendancePercentage >= highAttendanceThreshold ? "border-green-500 text-green-700" :
                                      subject.attendancePercentage < lowAttendanceThreshold ? "border-red-500 text-red-700" :
                                      "border-yellow-500 text-yellow-700"
                                    )}
                                  >
                                    {subject.attendancePercentage}%
                                  </Badge>
                                </div>
                                  
                                <div className="grid grid-cols-3 gap-4 mb-3">
                                  <div className="text-center">
                                    <div className="text-lg font-semibold text-green-600">{subject.presentCount}</div>
                                    <div className="text-xs text-gray-600">Present</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-semibold text-red-600">{subject.absentCount}</div>
                                    <div className="text-xs text-gray-600">Absent</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-semibold text-blue-600">{subject.totalCount}</div>
                                    <div className="text-xs text-gray-600">Total</div>
                                  </div>
                                </div>
                                  
                                <Progress 
                                  value={subject.attendancePercentage} 
                                  className="h-2"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">No attendance data available for the selected criteria.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                </TabsContent>

                {/* Timetable Tab */}
                <TabsContent value="timetable" className="p-6">
                  <TimetableManager />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                © 2024 Smart Student Hub. All rights reserved.
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Last updated: {new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span>Version 1.0.0</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Enhanced Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Refine your view with advanced filtering options
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="departmentFilter">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger id="departmentFilter">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
                  <SelectItem value="ECE">Electronics & Communication</SelectItem>
                  <SelectItem value="EEE">Electrical & Electronics</SelectItem>
                  <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                  <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                  <SelectItem value="IT">Information Technology</SelectItem>
                  <SelectItem value="CHEM">Chemical Engineering</SelectItem>
                  <SelectItem value="AERO">Aerospace Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="semesterFilter">Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger id="semesterFilter">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value="1">1st Semester</SelectItem>
                  <SelectItem value="2">2nd Semester</SelectItem>
                  <SelectItem value="3">3rd Semester</SelectItem>
                  <SelectItem value="4">4th Semester</SelectItem>
                  <SelectItem value="5">5th Semester</SelectItem>
                  <SelectItem value="6">6th Semester</SelectItem>
                  <SelectItem value="7">7th Semester</SelectItem>
                  <SelectItem value="8">8th Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="courseFilter">Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger id="courseFilter">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="B.Tech">B.Tech</SelectItem>
                  <SelectItem value="B.E">B.E</SelectItem>
                  <SelectItem value="M.Tech">M.Tech</SelectItem>
                  <SelectItem value="M.E">M.E</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="batchFilter">Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger id="batchFilter">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  <SelectItem value="2020-2024">2020-2024</SelectItem>
                  <SelectItem value="2021-2025">2021-2025</SelectItem>
                  <SelectItem value="2022-2026">2022-2026</SelectItem>
                  <SelectItem value="2023-2027">2023-2027</SelectItem>
                  <SelectItem value="2024-2028">2024-2028</SelectItem>
                </SelectContent>
              </Select>
            </div>
              
            <div>
              <Label htmlFor="performanceFilter">Performance</Label>
              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger id="performanceFilter">
                  <SelectValue placeholder="Select performance level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="excellent">Excellent (≥90%)</SelectItem>
                  <SelectItem value="good">Good (75-89%)</SelectItem>
                  <SelectItem value="average">Average (60-74%)</SelectItem>
                  <SelectItem value="poor">Poor (&lt;60%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateRangeFilter">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="dateRangeFilter">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="semester">This Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedDepartment('all');
              setSelectedSemester('all');
              setSelectedCourse('all');
              setSelectedBatch('all');
              setPerformanceFilter('all');
              setDateRange('all');
            }}>
              Clear Filters
            </Button>
            <Button onClick={() => setIsFilterDialogOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Download Dialog */}
      <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Attendance Data</DialogTitle>
            <DialogDescription>
              Choose the data you want to export to Excel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exportSubject">Subject Filter</Label>
              <Select value={downloadSubjectFilter} onValueChange={setDownloadSubjectFilter}>
                <SelectTrigger id="exportSubject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownloadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateExcelReport} disabled={isGeneratingExcel}>
              {isGeneratingExcel ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Excel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>   
    </div>
  );
};

export default HODDashboard;