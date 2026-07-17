import { AuthService } from './authService';
import { API_BASE_URL } from './apiConfig';

export interface ProductTypeItem {
  id: number;
  product_type: string;
  status?: number;
}

export interface ProductTypeListPageResponse {
  code: number;
  message: string;
  data: {
    total: number;
    list: ProductTypeItem[];
  };
}

export interface ToggleProductTypeStatusParams {
  id: number;
  status: number;
}

export interface ToggleProductTypeStatusResponse {
  code: number;
  message: string;
  data: null;
}

export interface UpdateProductTypeParams {
  id: number;
  product_type: string;
}

export interface UpdateProductTypeResponse {
  code: number;
  message: string;
  data: null;
}

export interface FetchProductTypesParams {
  department: string;
  page?: number;
  page_size?: number;
}

export async function fetchProductTypes(
  params: FetchProductTypesParams
): Promise<ProductTypeListPageResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/product-type-list-page`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      department: params.department,
      page: params.page || 1,
      page_size: params.page_size || 20
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取产品类型列表失败');
  }

  return data as ProductTypeListPageResponse;
}

export async function toggleProductTypeStatus(
  params: ToggleProductTypeStatusParams
): Promise<ToggleProductTypeStatusResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/product-type-toggle-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(params)
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '切换产品类型状态失败');
  }

  return data as ToggleProductTypeStatusResponse;
}

export async function updateProductType(
  params: UpdateProductTypeParams
): Promise<UpdateProductTypeResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  if (!authData.department) {
    throw new Error('用户部门信息缺失');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/product-type-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      ...params,
      department: authData.department
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '更新产品类型失败');
  }

  return data as UpdateProductTypeResponse;
}

export const ProductTypeService = {
  fetchProductTypes,
  toggleProductTypeStatus,
  updateProductType
};