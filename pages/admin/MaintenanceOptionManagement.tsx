
import React, { useState } from 'react';
import { MOCK_MAINTENANCE_OPTIONS } from '../../services/mockData';

interface MaintenanceOption {
  id: string;
  name: string;
  category: string;
  description: string;
}

const MaintenanceOptionManagement: React.FC = () => {
  const [options, setOptions] = useState<MaintenanceOption[]>(MOCK_MAINTENANCE_OPTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<MaintenanceOption | null>(null);

  const handleAdd = () => {
    setEditingOption({
      id: `MO-${Date.now()}`,
      name: '',
      category: '常规保养',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (option: MaintenanceOption) => {
    setEditingOption({ ...option });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该保养选项吗？')) {
      setOptions(options.filter(o => o.id !== id));
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">保养选项管理</h2>
          <p className="text-slate-500 text-sm">维护模具保养时可供选择的标准作业内容</p>
        </div>
        <button 
          onClick={handleAdd}
          className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <i className="fas fa-plus"></i>
          新增选项
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
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {options.map(option => (
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
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(option)}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(option.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  <option value="常规保养">常规保养</option>
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
