import React, { useState, useEffect, useRef } from 'react';
import { fetchProductTypes } from '../../services/dashboardService';
import { AuthService } from '../../services/authService';

interface ProductType {
  id: number;
  name: string;
}

const ProductTypeManagement: React.FC = () => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductType | null>(null);
  const [editName, setEditName] = useState('');

  const isFirstRender = useRef(true);
  const isLoadingRef = useRef(false);

  const loadProductTypes = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const authData = AuthService.getStoredAuth();
      const department = authData?.department || '大材料';
      const data = await fetchProductTypes(department);
      const mappedTypes = data.map((name, index) => ({
        id: index + 1,
        name: name
      }));
      setProductTypes(mappedTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
      setProductTypes([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadProductTypes();
    }
  }, []);

  const handleEditClick = (item: ProductType) => {
    setEditingItem(item);
    setEditName(item.name);
    setShowEditModal(true);
  };

  const handleDeleteClick = (item: ProductType) => {
    if (window.confirm(`确定要删除产品类型 "${item.name}" 吗？`)) {
      alert('删除功能暂未实现');
    }
  };

  const handleSave = () => {
    if (!editName.trim()) {
      alert('请输入产品类型名称');
      return;
    }
    alert(`保存成功：${editName}`);
    setShowEditModal(false);
    setEditingItem(null);
    setEditName('');
  };

  const handleCancel = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setEditName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          产品类型管理
        </h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setEditName('');
            setShowEditModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
        >
          <i className="fas fa-plus mr-2"></i>
          添加类型
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-500">加载中...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {!loading && !error && productTypes.length === 0 && (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="text-center">
            <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
            <p className="text-slate-500">暂无产品类型数据</p>
          </div>
        </div>
      )}

      {!loading && productTypes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-4 py-4 font-bold">产品类型名称</th>
                <th className="px-4 py-4 font-bold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productTypes.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-6">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
              {editingItem ? '编辑产品类型' : '添加产品类型'}
            </h3>
              <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    产品类型名称
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700"
                    placeholder="请输入产品类型名称"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTypeManagement;