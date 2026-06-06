import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, MoreHorizontal, Eye, Edit, Trash2, User, UserPlus, X } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDate, getStatusText, getStatusColor, cn } from '@/utils';
import { COURSE_LIST, CHANNEL_LIST } from '@/types';

export default function Students() {
  const { students, addStudent, deleteStudent } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'male' as 'male' | 'female',
    parentName: '',
    courses: [] as string[],
    channel: '',
    remark: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (searchTerm && !student.name.includes(searchTerm) && !student.phone.includes(searchTerm)) {
        return false;
      }
      if (filterCourse && student.course !== filterCourse) {
        return false;
      }
      if (filterChannel && student.channel !== filterChannel) {
        return false;
      }
      if (filterStatus && student.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [students, searchTerm, filterCourse, filterChannel, filterStatus]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定要删除学员 ${name} 吗？`)) {
      deleteStudent(id);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入学员姓名';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '请输入联系电话';
    } else if (!/^1\d{10}$/.test(formData.phone)) {
      newErrors.phone = '请输入正确的11位手机号码';
    } else if (students.some(s => s.phone === formData.phone)) {
      newErrors.phone = '该手机号已被注册';
    }

    if (!formData.age || parseInt(formData.age) <= 0) {
      newErrors.age = '请输入有效年龄';
    }

    if (formData.courses.length === 0) {
      newErrors.courses = '请至少选择一门课程';
    }

    if (!formData.channel) {
      newErrors.channel = '请选择渠道来源';
    }

    if (!formData.parentName.trim()) {
      newErrors.parentName = '请输入家长姓名';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    addStudent({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      age: parseInt(formData.age),
      gender: formData.gender,
      parentName: formData.parentName.trim(),
      course: formData.courses[0],
      courses: formData.courses,
      channel: formData.channel,
      remark: formData.remark.trim(),
    });

    setShowAddModal(false);
    setFormData({
      name: '',
      phone: '',
      age: '',
      gender: 'male',
      parentName: '',
      courses: [],
      channel: '',
      remark: '',
    });
    setErrors({});
  };

  const toggleCourse = (course: string) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.includes(course)
        ? prev.courses.filter(c => c !== course)
        : [...prev.courses, course]
    }));
    if (errors.courses) {
      setErrors(prev => ({ ...prev, courses: '' }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学员姓名或电话..."
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
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="">全部渠道</option>
              {CHANNEL_LIST.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="">全部状态</option>
              <option value="active">在读</option>
              <option value="paused">停课</option>
              <option value="finished">结业</option>
              <option value="refunded">已退费</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          新增学员
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                学员信息
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                课程
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                报名渠道
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                课时
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                报名日期
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium text-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.parentName} · {student.age}岁</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                      {student.course}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{student.channel}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                        style={{ width: `${((student.totalHours - student.remainingHours) / student.totalHours) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {student.remainingHours}/{student.totalHours}
                    </span>
                  </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(student.enrollmentDate)}</td>
                  <td className="px-6 py-4">
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(student.status))}>
                      {getStatusText(student.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/students/${student.id}`}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id, student.name)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="py-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无学员数据</p>
        </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl">
        <p className="text-sm text-gray-500">
          共 {filteredStudents.length} 名学员
        </p>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">新增学员</h3>
              <button
                onClick={() => { setShowAddModal(false); setErrors({}); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学员姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="请输入学员姓名"
                    className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                      errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年龄 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="请输入年龄"
                    className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                      errors.age ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                  />
                  {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="请输入11位手机号码"
                  maxLength={11}
                  className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                    errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">家长姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => handleInputChange('parentName', e.target.value)}
                    placeholder="请输入家长姓名"
                    className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                      errors.parentName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                  />
                  {errors.parentName && <p className="text-xs text-red-500 mt-1">{errors.parentName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">课程选择 <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_LIST.map((course) => (
                    <button
                      key={course}
                      type="button"
                      onClick={() => toggleCourse(course)}
                      className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                        formData.courses.includes(course)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300')}
                    >
                      {course}
                    </button>
                  ))}
                </div>
                {errors.courses && <p className="text-xs text-red-500 mt-1">{errors.courses}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">渠道来源 <span className="text-red-500">*</span></label>
                <select
                  value={formData.channel}
                  onChange={(e) => handleInputChange('channel', e.target.value)}
                  className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                    errors.channel ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                >
                  <option value="">请选择渠道</option>
                  {CHANNEL_LIST.map((channel) => (
                    <option key={channel} value={channel}>{channel}</option>
                  ))}
                </select>
                {errors.channel && <p className="text-xs text-red-500 mt-1">{errors.channel}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  placeholder="请输入备注信息（选填）"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => { setShowAddModal(false); setErrors({}); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
