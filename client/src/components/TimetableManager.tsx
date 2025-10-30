import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Plus, Trash2, BookOpen, MapPin, User } from "lucide-react";

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  classroom: string;
  faculty: string;
}

const TimetableManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for new timetable creation
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  // Fetch existing timetables
  const { data: timetables = [], isLoading: isLoadingTimetables, refetch: refetchTimetables } = useQuery({
    queryKey: ['/api/timetables/department', user?.department],
    queryFn: () => apiRequest('GET', `/api/timetables/department/${user?.department}`).then(res => res.json()),
    enabled: !!user && user.role === 'hod' && !!user.department,
  });

  // Fetch subjects for the dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: () => apiRequest('GET', '/api/subjects').then(res => res.json()),
    enabled: !!user && user.role === 'hod',
  });

  // Fetch classrooms for the dropdown
  const { data: classrooms = [] } = useQuery({
    queryKey: ['/api/classrooms'],
    queryFn: () => apiRequest('GET', '/api/classrooms').then(res => res.json()),
    enabled: !!user && user.role === 'hod',
  });

  // Fetch faculty for the dropdown
  const { data: faculty = [] } = useQuery({
    queryKey: ['/api/users/faculty'],
    queryFn: () => apiRequest('GET', '/api/users/faculty').then(res => res.json()),
    enabled: !!user && user.role === 'hod',
  });

  // Create timetable mutation
  const createTimetableMutation = useMutation({
    mutationFn: (data: { semester: string; schedule: ScheduleItem[] }) =>
      apiRequest('POST', '/api/timetables', data),
    onSuccess: () => {
      toast({ title: 'Timetable created successfully!' });
      setIsCreateDialogOpen(false);
      setSelectedSemester('');
      setScheduleItems([]);
      refetchTimetables();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error creating timetable', 
        description: error.message || 'Something went wrong', 
        variant: 'destructive' 
      });
    },
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const addScheduleItem = () => {
    setScheduleItems([...scheduleItems, {
      day: '',
      startTime: '',
      endTime: '',
      subject: '',
      classroom: '',
      faculty: ''
    }]);
  };

  const removeScheduleItem = (index: number) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index));
  };

  const updateScheduleItem = (index: number, field: keyof ScheduleItem, value: string) => {
    const updated = [...scheduleItems];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleItems(updated);
  };

  const handleCreateTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSemester) {
      toast({ title: 'Please select a semester', variant: 'destructive' });
      return;
    }

    if (scheduleItems.length === 0) {
      toast({ title: 'Please add at least one schedule item', variant: 'destructive' });
      return;
    }

    // Validate all schedule items are complete
    const incompleteItems = scheduleItems.filter(item =>
      !item.day || !item.startTime || !item.endTime || !item.subject || !item.classroom || !item.faculty
    );

    if (incompleteItems.length > 0) {
      toast({ title: 'Please complete all schedule items', variant: 'destructive' });
      return;
    }

    createTimetableMutation.mutate({
      semester: selectedSemester,
      schedule: scheduleItems
    });
  };

  if (isLoadingTimetables) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timetable Management</h2>
          <p className="text-gray-600">Create and manage class schedules for your department</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Timetable
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Timetable</DialogTitle>
              <DialogDescription>
                Create a weekly schedule for a specific semester in your department.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateTimetable} className="space-y-6">
              {/* Semester Selection */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="semester">Semester *</Label>
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Schedule Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Weekly Schedule</Label>
                  <Button type="button" onClick={addScheduleItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                  </Button>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {scheduleItems.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div>
                          <Label>Day</Label>
                          <Select value={item.day} onValueChange={(value) => updateScheduleItem(index, 'day', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {days.map(day => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Start Time</Label>
                          <Select value={item.startTime} onValueChange={(value) => updateScheduleItem(index, 'startTime', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Start" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>End Time</Label>
                          <Select value={item.endTime} onValueChange={(value) => updateScheduleItem(index, 'endTime', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="End" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Subject</Label>
                          <Select value={item.subject} onValueChange={(value) => updateScheduleItem(index, 'subject', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject: any) => (
                                <SelectItem key={subject._id} value={subject._id}>{subject.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Classroom</Label>
                          <Select value={item.classroom} onValueChange={(value) => updateScheduleItem(index, 'classroom', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Room" />
                            </SelectTrigger>
                            <SelectContent>
                              {classrooms.map((classroom: any) => (
                                <SelectItem key={classroom._id} value={classroom._id}>{classroom.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label>Faculty</Label>
                            <Select value={item.faculty} onValueChange={(value) => updateScheduleItem(index, 'faculty', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Faculty" />
                              </SelectTrigger>
                              <SelectContent>
                                {faculty.map((member: any) => (
                                  <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            type="button" 
                            onClick={() => removeScheduleItem(index)} 
                            variant="outline" 
                            size="icon"
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {scheduleItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No classes added yet. Click "Add Class" to start building your timetable.</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTimetableMutation.isPending}>
                  {createTimetableMutation.isPending ? 'Creating...' : 'Create Timetable'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Timetables */}
      <div className="grid gap-6">
        {timetables.length > 0 ? (
          timetables.map((timetable: any) => (
            <Card key={timetable._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Semester {timetable.semester} - {timetable.department?.name || 'Department'}
                </CardTitle>
                <CardDescription>
                  {timetable.schedule?.length || 0} classes scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Classroom</TableHead>
                      <TableHead>Faculty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timetable.schedule?.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.day}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.startTime} - {item.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {item.subject?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.classroom?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.faculty?.name || 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timetables Found</h3>
              <p className="text-gray-600 mb-4">
                Create your first timetable to organize class schedules for your department.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Timetable
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TimetableManager;