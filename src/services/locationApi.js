const API_BASE = 'https://provinces.open-api.vn/api';

let provinceCache = null;
let districtCache = {};
let wardCache = {};

export async function getProvinces() {
  if (provinceCache) return provinceCache;
  const res = await fetch(`${API_BASE}/p/`);
  if (!res.ok) throw new Error('Không thể tải danh sách tỉnh/thành phố');
  provinceCache = await res.json();
  return provinceCache;
}

export async function getDistricts(provinceCode) {
  if (districtCache[provinceCode]) return districtCache[provinceCode];
  const res = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`);
  if (!res.ok) throw new Error('Không thể tải danh sách quận/huyện');
  const data = await res.json();
  districtCache[provinceCode] = data.districts || [];
  return districtCache[provinceCode];
}

export async function getWards(districtCode) {
  if (wardCache[districtCode]) return wardCache[districtCode];
  const res = await fetch(`${API_BASE}/d/${districtCode}?depth=2`);
  if (!res.ok) throw new Error('Không thể tải danh sách phường/xã');
  const data = await res.json();
  wardCache[districtCode] = data.wards || [];
  return wardCache[districtCode];
}

export function clearLocationCache() {
  provinceCache = null;
  districtCache = {};
  wardCache = {};
}
