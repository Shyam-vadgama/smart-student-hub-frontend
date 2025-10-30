import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Marks, Attendance, Timetable } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  GraduationCap, 
  User, 
  BarChart3,
  Target,
  Award,
  Users,
  MapPin,
  Bell
} from "lucide-react";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Check URL parameters to auto-switch to attendance tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'attendance') {
      setActiveTab('attendance');
    }
  }, [location]);

  const [contactRecipient, setContactRecipient] = useState<'hod' | 'principal' | 'shiksan_mantri' | ''>('');
  const [contactMessage, setContactMessage] = useState('');

  // Fetch student's marks
  const { data: marks, isLoading: marksLoading, error: marksError } = useQuery<Marks[]>({
    queryKey: ['/api/marks/student', user?._id],
    queryFn: () => apiRequest('GET', `/api/marks/student/${user?._id}`).then((res) => res.json()),
    enabled: !!user?._id
  });

  // Fetch student's attendance
  const { data: attendance, isLoading: attendanceLoading, error: attendanceError } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance/student', user?._id],
    queryFn: () => apiRequest('GET', `/api/attendance/student/${user?._id}`).then((res) => res.json()),
    enabled: !!user?._id
  });

  // Fetch student-specific timetable (filtered by department and semester)
  const { data: timetables, isLoading: timetableLoading, error: timetableError } = useQuery<Timetable[]>({
    queryKey: ['/api/timetables/student'],
    queryFn: () => apiRequest('GET', '/api/timetables/student').then((res) => res.json()),
    enabled: !!user
  });

  const contactAuthorityMutation = useMutation({
    mutationFn: (data: { recipientRole: 'hod' | 'principal' | 'shiksan_mantri'; message: string }) =>
      apiRequest('POST', '/api/contact-authority', data),
    onSuccess: () => {
      toast({ title: 'Message sent successfully!' });
      setContactRecipient('');
      setContactMessage('');
    },
    onError: (error: any) => {
      toast({ title: 'Error sending message', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate comprehensive attendance statistics
  const attendanceStats = useMemo(() => {
    if (!attendance || attendance.length === 0) return null;

    const subjectAttendance: { [key: string]: { present: number; total: number; percentage: number; lowAttendance: boolean; criticalAttendance: boolean } } = {};
    let totalPresent = 0;
    let totalClasses = 0;

    attendance.forEach(att => {
      const subjectName = (att.subject as any)?.name || 'Unknown Subject';
      if (!subjectAttendance[subjectName]) {
        subjectAttendance[subjectName] = { present: 0, total: 0, percentage: 0, lowAttendance: false, criticalAttendance: false };
      }
      subjectAttendance[subjectName].total++;
      totalClasses++;
      if (att.status === 'present') {
        subjectAttendance[subjectName].present++;
        totalPresent++;
      }
    });

    // Calculate percentages and attendance status
    for (const subjectName in subjectAttendance) {
      const data = subjectAttendance[subjectName];
      data.percentage = Math.round((data.present / data.total) * 100);
      data.lowAttendance = data.percentage < 75; // Warning threshold
      data.criticalAttendance = data.percentage < 60; // Critical threshold
    }

    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
    const lowAttendanceSubjects = Object.entries(subjectAttendance).filter(([_, data]) => data.lowAttendance);
    const criticalAttendanceSubjects = Object.entries(subjectAttendance).filter(([_, data]) => data.criticalAttendance);

    return {
      subjectAttendance,
      overallPercentage,
      totalPresent,
      totalClasses,
      lowAttendanceSubjects,
      criticalAttendanceSubjects,
      averageAttendance: overallPercentage
    };
  }, [attendance]);

  // Calculate academic performance stats
  const academicStats = useMemo(() => {
    if (!marks || marks.length === 0) return null;

    const subjectMarks: { [key: string]: number[] } = {};
    let totalMarks = 0;
    let totalTests = 0;

    marks.forEach(mark => {
      const subjectName = (mark.subject as any)?.name || 'Unknown Subject';
      if (!subjectMarks[subjectName]) {
        subjectMarks[subjectName] = [];
      }
      subjectMarks[subjectName].push(mark.marks);
      totalMarks += mark.marks;
      totalTests++;
    });

    const subjectAverages = Object.entries(subjectMarks).map(([subject, marks]) => ({
      subject,
      average: Math.round(marks.reduce((sum, mark) => sum + mark, 0) / marks.length),
      count: marks.length
    })).sort((a, b) => b.average - a.average);

    const overallAverage = totalTests > 0 ? Math.round(totalMarks / totalTests) : 0;

    return {
      subjectAverages,
      overallAverage,
      totalTests,
      bestSubject: subjectAverages[0],
      needsImprovement: subjectAverages.filter(s => s.average < 60)
    };
  }, [marks]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactRecipient || !contactMessage) {
      toast({ title: 'Please select a recipient and type a message', variant: 'destructive' });
      return;
    }
    contactAuthorityMutation.mutate({ recipientRole: contactRecipient, message: contactMessage });
  };

  // Get current day's schedule
  const todaySchedule = useMemo(() => {
    if (!timetables || timetables.length === 0) return [];
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentTimetable = timetables[0]; // Assuming first timetable is current semester
    
    if (!currentTimetable) return [];
    
    return currentTimetable.schedule.filter(item => 
      item.day.toLowerCase() === today.toLowerCase()
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetables]);

  if (marksLoading || attendanceLoading || timetableLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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
        "lg:ml-64",
        "flex flex-col min-h-screen"
      )}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm z-30 relative">
          <Header title="Student Dashboard" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        </div>
          
        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                  <p className="text-gray-600 mt-1">Here's your academic overview and today's schedule</p>
                </div>
                {attendanceStats && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{attendanceStats.overallPercentage}%</div>
                    <div className="text-sm text-gray-600">Overall Attendance</div>
                  </div>
                )}
              </div>
            </div>

            {/* Critical Alerts */}
            {attendanceStats && attendanceStats.criticalAttendanceSubjects.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Critical Attendance Warning!</AlertTitle>
                <AlertDescription className="text-red-700">
                  Your attendance is critically low in {attendanceStats.criticalAttendanceSubjects.length} subject(s): {' '}
                  {attendanceStats.criticalAttendanceSubjects.map(([subject, data]) => 
                    `${subject} (${data.percentage}%)`
                  ).join(', ')}. 
                  <strong> Please attend classes immediately to avoid academic issues.</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Low Attendance Warnings */}
            {attendanceStats && attendanceStats.lowAttendanceSubjects.length > 0 && attendanceStats.criticalAttendanceSubjects.length === 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Low Attendance Warning</AlertTitle>
                <AlertDescription className="text-orange-700">
                  Your attendance is below 75% in {attendanceStats.lowAttendanceSubjects.length} subject(s): {' '}
                  {attendanceStats.lowAttendanceSubjects.map(([subject, data]) => 
                    `${subject} (${data.percentage}%)`
                  ).join(', ')}. 
                  Please improve your attendance to meet academic requirements.
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100">Overall Attendance</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceStats?.overallPercentage || 0}%</div>
                  <p className="text-xs text-blue-200">Across all subjects</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-100">Academic Average</CardTitle>
                  <Award className="h-4 w-4 text-green-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{academicStats?.overallAverage || 0}%</div>
                  <p className="text-xs text-green-200">{academicStats?.totalTests || 0} tests</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-100">Today's Classes</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todaySchedule?.length || 0}</div>
                  <p className="text-xs text-purple-200">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-100">Subjects</CardTitle>
                  <BookOpen className="h-4 w-4 text-orange-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(attendanceStats?.subjectAttendance || {}).length}</div>
                  <p className="text-xs text-orange-200">This semester</p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="p-6 border-b border-gray-200">
                  <TabsList className="grid w-full lg:w-auto grid-cols-4 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="marks">Marks</TabsTrigger>
                    <TabsTrigger value="timetable">Timetable</TabsTrigger>
                  </TabsList>
                </div>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="p-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {attendanceStats && Object.keys(attendanceStats.subjectAttendance).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(attendanceStats.subjectAttendance).map(([subjectName, data]) => (
                            <div key={subjectName} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{subjectName}</span>
                                <span className={cn(
                                  "font-semibold",
                                  data.criticalAttendance ? "text-red-600" : 
                                  data.lowAttendance ? "text-orange-600" : "text-green-600"
                                )}>
                                  {data.percentage}%
                                </span>
                              </div>
                              <Progress value={data.percentage} className="h-2" />
                              <div className="text-xs text-gray-600">
                                {data.present} present / {data.total} total
                                {data.criticalAttendance && <span className="text-red-600 ml-2">⚠ Critical</span>}
                                {data.lowAttendance && !data.criticalAttendance && <span className="text-orange-600 ml-2">⚠ Low</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No attendance data available.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Marks Tab */}
                <TabsContent value="marks" className="p-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Academic Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {marks && marks.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Exam Type</TableHead>
                              <TableHead>Marks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {marks.map((mark) => (
                              <TableRow key={mark._id}>
                                <TableCell>{(mark.subject as any)?.name || 'N/A'}</TableCell>
                                <TableCell>{mark.examType}</TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "font-semibold",
                                    mark.marks >= 80 ? "text-green-600" :
                                    mark.marks >= 60 ? "text-orange-600" : "text-red-600"
                                  )}>
                                    {mark.marks}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p>No marks recorded yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Timetable Tab */}
                <TabsContent value="timetable" className="p-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Timetable</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {timetables && timetables.length > 0 ? (
                        <div className="space-y-6">
                          {timetables.map(tt => (
                            <div key={tt._id}>
                              <h3 className="font-semibold mb-4">Semester {tt.semester}</h3>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Room</TableHead>
                                    <TableHead>Faculty</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {tt.schedule.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{item.day}</TableCell>
                                      <TableCell>{item.startTime} - {item.endTime}</TableCell>
                                      <TableCell>{(item.subject as any)?.name || 'N/A'}</TableCell>
                                      <TableCell>{(item.classroom as any)?.name || 'N/A'}</TableCell>
                                      <TableCell>{(item.faculty as any)?.name || 'N/A'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No timetable available.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Overview Tab */}
                <TabsContent value="overview" className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span>Overall Attendance:</span>
                            <span className="font-semibold">{attendanceStats?.overallPercentage || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Academic Average:</span>
                            <span className="font-semibold">{academicStats?.overallAverage || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Subjects:</span>
                            <span className="font-semibold">{Object.keys(attendanceStats?.subjectAttendance || {}).length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Today's Schedule</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {todaySchedule && todaySchedule.length > 0 ? (
                          <div className="space-y-2">
                            {todaySchedule.map((item, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium">{(item.subject as any)?.name}</div>
                                  <div className="text-sm text-gray-600">{item.startTime} - {item.endTime}</div>
                                </div>
                                <Badge>{(item.classroom as any)?.name || 'TBA'}</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No classes today.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
