import React, { useState, useMemo } from 'react';
import { MOCK_MAINTENANCE_OPTIONS } from '../../services/mockData';

interface MaintenanceOption {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
}

const ITEMS_PER_PAGE = 10;

const MaintenanceOptionManagement: React.FC = () => {
  const [options, setOptions] = useState<MaintenanceOption[]>(MOCK_MAINTENANCE_OPTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<MaintenanceOption | null>(null);
  
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    enabled: ''
  });
  
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    category: '',
    enabled: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);

  const handleAdd = () => {
    setEditingOption({
      id: `MO-${Date.now()}`,
      name: '',
      category: '半年保养项目',
      description: '',
      enabled: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (option: MaintenanceOption) => {
    setEditingOption({ ...option });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    const option = options.find(o => o.id === id);
    if (!option) return;
    
    const isEnable = !option.enabled;
    const confirmMsg = isEnable ? '确定要启用该保养选项吗？' : '确定要禁用该保养选项吗？';
    
    if (!confirm(confirmMsg)) return;
    
    setOptions(options.map(o => o.id === id ? { ...o, enabled: isEnable } : o));
    alert(isEnable ? '启用成功' : '禁用成功');
  };

  const saveOption = () => {
    if (!editingOption || !editingOption.name) return;
    const exists = options.find(o => o.id === editingOption.id);
    if (exists) {
      setOptions(options.map(o => o.id === editingOption.id ? editingOption : o));
    } else {
      setOptions([...options, editingOption]);
    }
    setIsModalOpen(false);
  };

  const handleSearch = () => {
    setSearchFilters({ ...filters });
    setCurrentPage(1);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(options.map(o => o.category))];
    return cats;
  }, [options]);

  const filteredOptions = useMemo(() => {
    return options.filter(opt => {
      if (searchFilters.name && !opt.name.includes(searchFilters.name)) return false;
      if (searchFilters.category && opt.category !== searchFilters.category) return false;
      if (searchFilters.enabled === 'true' && !opt.enabled) return false;
      if (searchFilters.enabled === 'false' && opt.enabled) return false;
      return true;
    });
  }, [options, searchFilters]);

  const totalRecords = filteredOptions.length;
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);
  
  const paginatedOptions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredOptions.slice(start, end);
  }, [filteredOptions, currentPage]);

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
            value={filters.category} 
            onChange={(e) => setFilters({...filters, category: e.target.value})} 
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">全部</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">状态:</label>
          <select 
            value={filters.enabled} 
            onChange={(e) => setFilters({...filters, enabled: e.target.value})} 
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">全部状态</option>
            <option value="true">启用</option>
            <option value="false">禁用</option>
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
            {paginatedOptions.map(option => (
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
                    {option.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                  {option.description}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${
                    option.enabled 
                      ? 'bg-green-100 text-green-600 border-green-200' 
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    {option.enabled ? '启用' : '禁用'}
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
                    {option.enabled ? (
                      <button
                        onClick={() => handleToggleStatus(option.id)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="禁用"
                      >
                        <i className="fas fa-ban mr-1"></i>禁用
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(option.id)}
                        className="text-green-600 p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="启用"
                      >
                        <i className="fas fa-check-circle mr-1"></i>启用
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-chevron-left mr-1"></i> 上一页
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页 <i className="fas fa-chevron-right ml-1"></i>
          </button>
          
          <span className="text-sm text-slate-500 ml-4">
            共 {totalRecords} 条记录，第 {currentPage}/{totalPages} 页
          </span>
        </div>
      )}

      {isModalOpen && editingOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
              <h3 className="text-lg font-bold text-slate-800">
                {options.find(o => o.id === editingOption.id) ? '编辑保养选项' : '新增保养选项'}
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
                  value={editingOption.category}
                  onChange={(e) => setEditingOption({...editingOption, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="半年保养项目">半年保养项目</option>
                  <option value="电气保养">电气保养</option>
                  <option value="机械保养">机械保养</option>
                  <option value="液压保养">液压保养</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">描述说明</label>
                <textarea 
                  rows={3}
                  value={editingOption.description}
                  onChange={(e) => setEditingOption({...editingOption, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all resize-none"
                  placeholder="请输入该选项的详细作业说明..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">状态</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingOption({...editingOption, enabled: true})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      editingOption.enabled 
                        ? 'bg-green-600 text-white shadow-lg shadow-green-100' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    启用
                  </button>
                  <button
                    onClick={() => setEditingOption({...editingOption, enabled: false})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      !editingOption.enabled 
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