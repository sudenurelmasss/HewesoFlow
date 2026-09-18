import { getStoredToken } from "./authService";

export interface AdminUser { id:string; firstName?:string|null; lastName?:string|null; email:string; department?:string|null; isActive:boolean; roles:string[]; }
export interface SystemRole { id:string; name:string; description?:string|null; isActive:boolean; }
export class AdminForbiddenError extends Error { constructor(){super("FORBIDDEN");this.name="AdminForbiddenError";} }
const API_URL=process.env.NEXT_PUBLIC_API_URL||"http://localhost:5063";
function headers(json=false):HeadersInit{const token=getStoredToken();if(!token)throw new Error("Oturum bulunamadı.");return {Accept:"application/json",Authorization:`Bearer ${token}`,...(json?{"Content-Type":"application/json"}:{})};}
async function request<T>(url:string,init?:RequestInit):Promise<T>{const r=await fetch(url,{...init,headers:{...headers(Boolean(init?.body)),...(init?.headers||{})},cache:"no-store"});if(r.status===403)throw new AdminForbiddenError();if(r.status===401)throw new Error("Oturum süresi dolmuş olabilir.");if(!r.ok){let m=`İşlem başarısız (${r.status}).`;try{const x=await r.json();m=x?.message||m;}catch{}throw new Error(m);}if(r.status===204)return undefined as T;return r.json();}
export const getAdminUsers=()=>request<AdminUser[]>(`${API_URL}/api/Users`);
export const getSystemRoles=()=>request<SystemRole[]>(`${API_URL}/api/Users/roles`);
export const assignUserRole=(userId:string,roleId:string)=>request(`${API_URL}/api/Users/${userId}/roles/${roleId}`,{method:"POST"});
export const removeUserRole=(userId:string,roleId:string)=>request(`${API_URL}/api/Users/${userId}/roles/${roleId}`,{method:"DELETE"});
export const changeUserStatus=(userId:string,isActive:boolean)=>request(`${API_URL}/api/Users/${userId}/status?isActive=${isActive}`,{method:"PATCH"});
