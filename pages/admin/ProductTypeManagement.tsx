import React, { useState, useEffect, useRef } from 'react';
import { fetchProductTypes, toggleProductTypeStatus, updateProductType, ProductTypeItem } from '../../services/productTypeService';
import { saveProductType } from '../../services/dashboardService';
import { AuthService } from '../../services/authService';

interface ProductType {
  id: number;
  name: string;
  status: number;
}

const ITEMS_PER_PAGE = 20;

const ProductTypeManagement: React.FC = () => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductType | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const isLoadingRef = useRef(false);

  const loadProductTypes = async (page: number = 1) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const authData = AuthService.getStoredAuth();
      const department = authData?.department || '大材料';
      const response = await fetchProductTypes({
        department,
        page,
        page_size: ITEMS_PER_PAGE
      });
      const mappedTypes: ProductType[] = response.data.list.map((item) => ({
        id: item.id,
        name: item.product_type || item.name || '',
        status: item.status ?? 1
      }));
      setProductTypes(mappedTypes);
      setTotalRecords(response.data.total);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
      setProductTypes([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    loadProductTypes(currentPage);
  }, [currentPage]);

  const handleEditClick = (item: ProductType) => {
    setEditingItem(item);
    setEditName(item.name);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (item: ProductType) => {
    const isActivate = item.status == 0;
    const confirmMsg = isActivate ? `确定要启用产品类型 "${item.name}" 吗？` : `确定要禁用产品类型 "${item.name}" 吗？`;

    if (!confirm(confirmMsg)) return;

    try {
      const response = await toggleProductTypeStatus({
        id: item.id,
        status: isActivate ? 1 : 0
      });
      if (response.code === 200) {
        alert(response?.message || (isActivate ? '启用成功' : '禁用成功'));
        setProductTypes(productTypes.map(t => t.id === item.id ? { ...t, status: isActivate ? 1 : 0 } : t));
      } else {
        alert(response?.message || (isActivate ? '启用失败' : '禁用失败'));
      }
    } catch (err) {
      console.error(isActivate ? '启用产品类型失败:' : '禁用产品类型失败:', err);
      alert(err instanceof Error ? err.message : (isActivate ? '启用失败' : '禁用失败'));
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      alert('请输入产品类型名称');
      return;
    }

    setSaving(true);

    try {
      if (editingItem) {
        await updateProductType({
          id: editingItem.id,
          product_type: editName.trim()
        });
        alert('更新成功');
      } else {
        await saveProductType(editName.trim());
        alert('保存成功');
      }
      setShowEditModal(false);
      setEditingItem(null);
      setEditName('');
      loadProductTypes(currentPage);
    } catch (error) {
      alert(error instanceof Error ? error.message : (editingItem ? '更新失败' : '保存失败'));
    } finally {
      setSaving(false);
    }
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
                <th className="px-4 py-4 font-bold text-center">状态</th>
                <th className="px-4 py-4 font-bold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productTypes.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {item.status == 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        <i className="fas fa-times-circle"></i> 已禁用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        <i className="fas fa-check-circle"></i> 启用中
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-6">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="编辑"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {item.status != 0 ? (
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors text-sm font-medium"
                          title="禁用"
                        >
                          <i className="fas fa-ban mr-1"></i>
                          禁用
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1.5 rounded-lg transition-colors text-sm font-medium"
                          title="启用"
                        >
                          <i className="fas fa-check-circle mr-1"></i>
                          启用
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalRecords > ITEMS_PER_PAGE && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-chevron-left mr-1"></i> 上一页
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.ceil(totalRecords / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
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
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalRecords / ITEMS_PER_PAGE), p + 1))}
            disabled={currentPage === Math.ceil(totalRecords / ITEMS_PER_PAGE)}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页 <i className="fas fa-chevron-right ml-1"></i>
          </button>
          
          <span className="text-sm text-slate-500 ml-4">
            共 {totalRecords} 条记录，第 {currentPage}/{Math.ceil(totalRecords / ITEMS_PER_PAGE)} 页
          </span>
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
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {saving ? '保存中...' : '保存'}
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