import React, { useState, useEffect, useMemo } from 'react';
import { MaintenanceOptionService, MaintenanceOptionItem, TemplateMonthItem } from '../../services/maintenanceOptionService';
import { AuthService } from '../../services/authService';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 20;

const MaintenanceOptionManagement: React.FC = () => {
  const [options, setOptions] = useState<MaintenanceOptionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<MaintenanceOptionItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [templateMonthList, setTemplateMonthList] = useState<TemplateMonthItem[]>([]);
  
  const [filters, setFilters] = useState({
    name: '',
    template_month: '',
    status: ''
  });
  
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    template_month: '',
    status: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadData = async (page: number, filters?: { name: string; template_month: string; status: string }) => {
    setIsLoading(true);
    try {
      const currentFilters = filters || searchFilters;
      const response = await MaintenanceOptionService.fetchMaintenanceOptions({
        name: currentFilters.name,
        template_month: currentFilters.template_month,
        status: currentFilters.status ? Number(currentFilters.status) : undefined,
        page,
        page_size: ITEMS_PER_PAGE
      });
      setOptions(response.data.list);
      setTotalRecords(response.data.total);
    } catch (error) {
      console.error('获取保养选项列表失败:', error);
      alert('获取保养选项列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
    loadTemplateMonth();
  }, []);

  const loadTemplateMonth = async () => {
    const authData = AuthService.getStoredAuth();
    if (!authData || !authData.department) return;
    
    try {
      const response = await MaintenanceOptionService.fetchTemplateMonth(authData.department);
      setTemplateMonthList(response.data);
    } catch (error) {
      console.error('获取保养模板月份失败:', error);
    }
  };

  const handleAdd = () => {
    const defaultItem = templateMonthList[0] || { template_month: '1M', template_comment: '月度保养' };
    setEditingOption({
      id: 0,
      name: '',
      template_month: defaultItem.template_month,
      template_comment: defaultItem.template_comment,
      department_id: 0,
      comment: '',
      status: 1,
      created_at: '',
      updated_at: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (option: MaintenanceOptionItem) => {
    setEditingOption({ ...option });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: number, targetStatus: number) => {
    const isEnabling = targetStatus === 1;
    const confirmMsg = isEnabling ? '确定要启用该保养选项吗？' : '确定要禁用该保养选项吗？';
    
    if (!confirm(confirmMsg)) return;
    
    try {
      await MaintenanceOptionService.toggleMaintenanceOptionStatus({ 
        id: String(id), 
        status: targetStatus 
      });
      
      const newStatus = isEnabling ? 1 : 2;
      setOptions(options.map(o => o.id === id ? { ...o, status: newStatus } : o));
      alert(isEnabling ? '启用成功' : '禁用成功');
    } catch (error) {
      console.error('切换保养选项状态失败:', error);
      alert('切换保养选项状态失败');
    }
  };

  const saveOption = async () => {
    if (!editingOption || !editingOption.name) {
      alert('请填写保养选项名称');
      return;
    }
    
    const authData = AuthService.getStoredAuth();
    if (!authData) {
      alert('用户信息缺失');
      return;
    }
    
    try {
      const isNew = editingOption.id === 0;
      
      if (isNew) {
        if (!authData.department) {
          alert('用户部门信息缺失');
          return;
        }
        await MaintenanceOptionService.saveMaintenanceOption({
          name: editingOption.name,
          template_month: editingOption.template_month,
          department: authData.department,
          comment: editingOption.comment,
          status: editingOption.status
        });
      } else {
        await MaintenanceOptionService.updateMaintenanceOption({
          id: String(editingOption.id),
          name: editingOption.name,
          template_month: editingOption.template_month,
          comment: editingOption.comment,
          status: editingOption.status
        });
      }
      
      alert(isNew ? '新增成功' : '更新成功');
      setIsModalOpen(false);
      setCurrentPage(1);
      loadData(1, searchFilters);
    } catch (error) {
      console.error('保存保养选项失败:', error);
      alert('保存保养选项失败');
    }
  };

  const handleSearch = () => {
    const newFilters = { ...filters };
    setSearchFilters(newFilters);
    setCurrentPage(1);
    loadData(1, newFilters);
  };

  const templateMonthOptions = useMemo(() => {
    const options = [{ value: '', label: '全部' }];
    templateMonthList.forEach(item => {
      options.push({ value: item.template_month, label: item.template_comment });
    });
    return options;
  }, [templateMonthList]);

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">保养选项管理</h2>
        <button 
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
        >
          + 新增选项
        </button>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">名称:</label>
          <input 
            type="text" 
            value={filters.name} 
            onChange={(e) => setFilters({...filters, name: e.target.value})} 
            placeholder="输入名称"
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">分类:</label>
          <select 
            value={filters.template_month} 
            onChange={(e) => setFilters({...filters, template_month: e.target.value})} 
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {templateMonthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">状态:</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})} 
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">全部状态</option>
            <option value="1">启用</option>
            <option value="2">禁用</option>
          </select>
        </div>
        <button 
          onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm hover:bg-indigo-700 transition-all"
        >
          查询
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">编号</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">选项名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">分类</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">描述说明</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-slate-500">加载中...</p>
                </td>
              </tr>
            ) : options.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              options.map(option => (
                <tr key={option.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-slate-400">{option.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <i className="fas fa-tools text-xs"></i>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{option.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200 uppercase tracking-wider">
                      {option.template_comment}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                    {option.comment}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${
                      option.status == 1
                        ? 'bg-green-100 text-green-600 border-green-200' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {option.status == 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(option)}
                        className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <i className="fas fa-edit mr-1"></i>编辑
                      </button>
                      {option.status == 1 ? (
                        <button
                          onClick={() => handleToggleStatus(option.id, 0)}
                          className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="禁用"
                        >
                          <i className="fas fa-ban mr-1"></i>禁用
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(option.id, 1)}
                          className="text-green-600 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="启用"
                        >
                          <i className="fas fa-check-circle mr-1"></i>启用
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        totalRecords={totalRecords}
        currentPage={currentPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          loadData(page);
        }}
      />

      {isModalOpen && editingOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
              <h3 className="text-lg font-bold text-slate-800">
                {editingOption.id > 0 ? '编辑保养选项' : '新增保养选项'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">选项名称</label>
                <input 
                  type="text" 
                  value={editingOption.name}
                  onChange={(e) => setEditingOption({...editingOption, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                  placeholder="如：清洁模腔"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">分类</label>
                <select 
                  value={editingOption.template_month}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selectedItem = templateMonthList.find(item => item.template_month === value);
                    setEditingOption({
                      ...editingOption, 
                      template_month: value,
                      template_comment: selectedItem ? selectedItem.template_comment : ''
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all appearance-none"
                >
                  {templateMonthList.map(item => (
                    <option key={item.template_month} value={item.template_month}>
                      {item.template_comment}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">描述说明</label>
                <textarea 
                  rows={3}
                  value={editingOption.comment}
                  onChange={(e) => setEditingOption({...editingOption, comment: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all resize-none"
                  placeholder="请输入该选项的详细作业说明..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">状态</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingOption({...editingOption, status: 1})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      editingOption.status == 1
                        ? 'bg-green-600 text-white shadow-lg shadow-green-100' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    启用
                  </button>
                  <button
                    onClick={() => setEditingOption({...editingOption, status: 0})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      editingOption.status != 1
                        ? 'bg-slate-400 text-white shadow-lg shadow-slate-100' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    禁用
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all"
              >
                取消
              </button>
              <button 
                onClick={saveOption}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceOptionManagement;