import { useState, useMemo } from 'react';
import { Search, Plus, Filter, Clock, Calendar, User, X, CheckSquare, Square, Users, Layers } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDate, cn } from '@/utils';
import { COURSE_LIST } from '@/types';
import StatCard from '@/components/StatCard';

export default function Lessons() {
  const { lessons, teachers, students, addLesson, batchAddLessons } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [formData, setFormData] = useState({
    studentId: '',
    course: '',
    date: formatDate(new Date()),
    hours: '',
    teacher: '',
    content: '',
    startTime: '09:00',
  });
  const [batchFormData, setBatchFormData] = useState({
    course: '',
    date: formatDate(new Date()),
    hours: '1',
    teacher: '',
    content: '',
    startTime: '09:00',
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (searchTerm && !lesson.studentName.includes(searchTerm) && !lesson.content.includes(searchTerm)) {
        return false;
      }
      if (filterCourse && lesson.course !== filterCourse) {
        return false;
      }
      if (filterTeacher && lesson.teacher !== filterTeacher) {
        return false;
      }
      if (filterDate && !lesson.date.startsWith(filterDate)) {
        return false;
      }
      return true;
    });
  }, [lessons, searchTerm, filterCourse, filterTeacher, filterDate]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLessons = lessons.filter(l => l.date === today);
    const todayHours = todayLessons.reduce((sum, l) => sum + l.hours, 0);
    const totalHours = lessons.reduce((sum, l) => sum + l.hours, 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthHours = lessons.filter(l => l.date.startsWith(thisMonth)).reduce((sum, l) => sum + l.hours, 0);

    return { totalHours, monthHours, todayHours, todayCount: todayLessons.length };
  }, [lessons]);

  const activeTeachers = teachers.filter(t => t.status === 'active');

  const studentsWithHours = useMemo(() => {
    return students.filter(s => s.remainingHours > 0 && s.status === 'active');
  }, [students]);

  const selectedStudent = useMemo(() => {
    if (!formData.studentId) return null;
    return students.find(s => s.id === formData.studentId);
  }, [students, formData.studentId]);

  const studentCourses = useMemo(() => {
    if (!selectedStudent?.courseHours) return [];
    return Object.keys(selectedStudent.courseHours).filter(
      (course) => selectedStudent.courseHours![course].remaining > 0
    );
  }, [selectedStudent]);

  const remainingHoursForCourse = useMemo(() => {
    if (!selectedStudent?.courseHours?.[formData.course]) return 0;
    return selectedStudent.courseHours[formData.course].remaining;
  }, [selectedStudent, formData.course]);

  const courseTeachers = useMemo(() => {
    const course = mode === 'batch' ? batchFormData.course : formData.course;
    if (!course) return activeTeachers;
    return activeTeachers.filter(t => t.course === course);
  }, [activeTeachers, mode, formData.course, batchFormData.course]);

  const batchStudents = useMemo(() => {
    if (!batchFormData.course) return [];
    return students.filter(s => 
      s.status === 'active' && 
      s.courseHours?.[batchFormData.course]?.remaining > 0
    ).sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  }, [students, batchFormData.course]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudentIds.length === batchStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(batchStudents.map(s => s.id));
    }
  };

  const validateSingleForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) {
      newErrors.studentId = '请选择学员';
    }
    if (!formData.course) {
      newErrors.course = '请选择课程';
    }
    if (!formData.date) {
      newErrors.date = '请选择上课日期';
    }
    if (!formData.hours || parseInt(formData.hours) <= 0) {
      newErrors.hours = '请输入有效课时数';
    } else if (selectedStudent && formData.course) {
      const remaining = selectedStudent.courseHours?.[formData.course]?.remaining || 0;
      if (parseInt(formData.hours) > remaining) {
        newErrors.hours = '剩余课时不足';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBatchForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!batchFormData.course) {
      newErrors.course = '请选择课程';
    }
    if (!batchFormData.date) {
      newErrors.date = '请选择上课日期';
    }
    if (!batchFormData.hours || parseInt(batchFormData.hours) <= 0) {
      newErrors.hours = '请输入有效课时数';
    }
    if (selectedStudentIds.length === 0) {
      newErrors.students = '请至少选择一名学员';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (mode === 'single') {
      if (!validateSingleForm() || !selectedStudent) return;

      const hoursNum = parseInt(formData.hours);
      const startHour = parseInt(formData.startTime.split(':')[0]);
      const endHour = startHour + hoursNum;

      const selectedTeacher = courseTeachers.find(t => t.name === formData.teacher) || courseTeachers[0];

      addLesson({
        studentId: formData.studentId,
        studentName: selectedStudent.name,
        course: formData.course,
        teacher: selectedTeacher?.name || '李老师',
        teacherId: selectedTeacher?.id || 't1',
        hours: hoursNum,
        content: formData.content || '常规课程',
        date: formData.date,
        startTime: formData.startTime,
        endTime: `${endHour}:00`,
      });

      setShowAddModal(false);
      resetForm();
    } else {
      if (!validateBatchForm()) return;

      const hoursNum = parseInt(batchFormData.hours);
      const startHour = parseInt(batchFormData.startTime.split(':')[0]);
      const endHour = startHour + hoursNum;

      const selectedTeacher = courseTeachers.find(t => t.name === batchFormData.teacher) || courseTeachers[0];

      const lessonData = selectedStudentIds.map(studentId => {
        const student = students.find(s => s.id === studentId)!;
        return {
          studentId,
          studentName: student.name,
          course: batchFormData.course,
          teacher: selectedTeacher?.name || '李老师',
          teacherId: selectedTeacher?.id || 't1',
          hours: hoursNum,
          content: batchFormData.content || '常规课程',
          date: batchFormData.date,
          startTime: batchFormData.startTime,
          endTime: `${endHour}:00`,
        };
      });

      batchAddLessons(lessonData);

      setShowAddModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      course: '',
      date: formatDate(new Date()),
      hours: '',
      teacher: '',
      content: '',
      startTime: '09:00',
    });
    setBatchFormData({
      course: '',
      date: formatDate(new Date()),
      hours: '1',
      teacher: '',
      content: '',
      startTime: '09:00',
    });
    setSelectedStudentIds([]);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    if (mode === 'single') {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
      if (field === 'studentId') {
        setFormData(prev => ({ ...prev, course: '', teacher: '' }));
      }
      if (field === 'course') {
        setFormData(prev => ({ ...prev, teacher: '' }));
      }
    } else {
      setBatchFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
      if (field === 'course') {
        setBatchFormData(prev => ({ ...prev, teacher: '' }));
        const studentsInCourse = students.filter(s => 
          s.status === 'active' && 
          s.courseHours?.[value]?.remaining > 0
        );
        setSelectedStudentIds(studentsInCourse.map(s => s.id));
      }
    }
  };

  const handleOpenModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="累计课时" value={`${stats.totalHours} 课时`} icon={Clock} color="#4299E1" />
        <StatCard title="本月课时" value={`${stats.monthHours} 课时`} icon={Calendar} color="#FF7A45" />
        <StatCard title="今日课时" value={`${stats.todayHours} 课时`} icon={Clock} color="#48BB78" />
        <StatCard title="今日课次" value={`${stats.todayCount} 次`} icon={User} color="#9F7AEA" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学员或课程内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="">全部课程</option>
              {COURSE_LIST.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="">全部老师</option>
              {activeTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.name}>
                  {teacher.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            />
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          记录课时
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  学员
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  课程
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  授课老师
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  时段
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  课时
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  课程内容
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{formatDate(lesson.date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium">
                        {lesson.studentName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{lesson.studentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {lesson.course}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs">
                        {lesson.teacher.charAt(0)}
                      </div>
                      <span className="text-gray-700">{lesson.teacher}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {lesson.startTime} - {lesson.endTime}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      {lesson.hours} 课时
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">
                    {lesson.content}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLessons.length === 0 && (
          <div className="py-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无课时记录</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl">
        <p className="text-sm text-gray-500">
          共 {filteredLessons.length} 条课时记录
        </p>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">记录课时</h3>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex border-b border-gray-100">
              <button
                onClick={() => { setMode('single'); setErrors({}); }}
                className={cn(
                  'flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                  mode === 'single'
                    ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <User className="w-4 h-4" />
                单个记录
              </button>
              <button
                onClick={() => { setMode('batch'); setErrors({}); }}
                className={cn(
                  'flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                  mode === 'batch'
                    ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Users className="w-4 h-4" />
                批量记录
              </button>
            </div>

            {mode === 'single' ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择学员 <span className="text-red-500">*</span></label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                      errors.studentId ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                  >
                    <option value="">请选择学员（仅显示有剩余课时的）</option>
                    {studentsWithHours.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - 剩余{student.remainingHours}课时
                      </option>
                    ))}
                  </select>
                  {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
                </div>

                {selectedStudent && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-sm text-gray-600">
                      已选学员：<span className="font-medium text-gray-800">{selectedStudent.name}</span>
                      <span className="text-gray-400 mx-2">|</span>
                      总剩余：<span className="font-medium text-orange-600">{selectedStudent.remainingHours} 课时</span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择课程 <span className="text-red-500">*</span></label>
                  <select
                    value={formData.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    disabled={!formData.studentId}
                    className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed',
                      errors.course ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                  >
                    <option value="">请选择课程</option>
                    {studentCourses.map((course) => (
                      <option key={course} value={course}>
                        {course}（剩余{selectedStudent?.courseHours?.[course]?.remaining || 0}课时）
                      </option>
                    ))}
                  </select>
                  {errors.course && <p className="text-xs text-red-500 mt-1">{errors.course}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">上课日期 <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                        errors.date ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                    />
                    {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                    <select
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">消耗课时数 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.hours}
                    onChange={(e) => handleInputChange('hours', e.target.value)}
                    placeholder="请输入消耗课时数"
                    className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                      errors.hours ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-200')}
                  />
                  {errors.hours && <p className="text-xs text-red-500 mt-1">{errors.hours}</p>}
                  {formData.course && selectedStudent && !errors.hours && (
                    <p className="text-xs text-gray-500 mt-1">
                      该课程剩余课时：<span className="font-medium text-orange-600">{remainingHoursForCourse}</span> 课时
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">授课老师</label>
                  <select
                    value={formData.teacher}
                    onChange={(e) => handleInputChange('teacher', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">请选择老师（可选）</option>
                    {courseTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程内容</label>
                  <input
                    type="text"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="请输入课程内容（选填）"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择课程 <span className="text-red-500">*</span></label>
                    <select
                      value={batchFormData.course}
                      onChange={(e) => handleInputChange('course', e.target.value)}
                      className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                        errors.course ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                    >
                      <option value="">请选择课程</option>
                      {COURSE_LIST.map((course) => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                    {errors.course && <p className="text-xs text-red-500 mt-1">{errors.course}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">上课日期 <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={batchFormData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                        errors.date ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                    />
                    {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">消耗课时 <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={batchFormData.hours}
                      onChange={(e) => handleInputChange('hours', e.target.value)}
                      className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                        errors.hours ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                    />
                    {errors.hours && <p className="text-xs text-red-500 mt-1">{errors.hours}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                    <select
                      value={batchFormData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">授课老师</label>
                    <select
                      value={batchFormData.teacher}
                      onChange={(e) => handleInputChange('teacher', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">请选择老师</option>
                      {courseTeachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程内容</label>
                  <input
                    type="text"
                    value={batchFormData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="请输入课程内容（选填）"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">
                        选择学员 <span className="text-red-500">*</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        （共 {batchStudents.length} 名学员有剩余课时）
                      </span>
                    </div>
                    <button
                      onClick={selectAllStudents}
                      disabled={!batchFormData.course}
                      className="text-xs text-orange-600 hover:text-orange-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {selectedStudentIds.length === batchStudents.length && batchStudents.length > 0 ? '取消全选' : '全选'}
                    </button>
                  </div>
                  {errors.students && <p className="text-xs text-red-500 mb-2">{errors.students}</p>}
                  
                  {batchFormData.course ? (
                    <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                      {batchStudents.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {batchStudents.map((student) => (
                            <div
                              key={student.id}
                              onClick={() => toggleStudent(student.id)}
                              className={cn(
                                'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
                                selectedStudentIds.includes(student.id)
                                  ? 'bg-orange-50 hover:bg-orange-100/50'
                                  : 'hover:bg-gray-50'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {selectedStudentIds.includes(student.id) ? (
                                  <CheckSquare className="w-5 h-5 text-orange-500" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-300" />
                                )}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium">
                                  {student.name.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-800">{student.name}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                剩余 <span className="font-medium text-orange-600">{student.courseHours?.[batchFormData.course]?.remaining || 0}</span> 课时
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-gray-400 text-sm">
                          该课程暂无有剩余课时的学员
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center text-gray-400 text-sm">
                      请先选择课程
                    </div>
                  )}
                  
                  {batchFormData.course && batchStudents.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      已选择 <span className="font-medium text-orange-600">{selectedStudentIds.length}</span> 名学员，
                      预计消耗 <span className="font-medium text-orange-600">{selectedStudentIds.length * parseInt(batchFormData.hours || '0')}</span> 课时
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
              >
                {mode === 'single' ? '确认提交' : `批量提交 (${selectedStudentIds.length}人)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
