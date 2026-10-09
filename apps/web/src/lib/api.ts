export const API_SERVER=process.env.API_INTERNAL_URL??process.env.NEXT_PUBLIC_API_URL??'http://localhost:4000';
export const API=process.env.NEXT_PUBLIC_API_URL??'';
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const response=await fetch(`${API}/api/v1${path}`,{...options,credentials:'include',headers:{'Content-Type':'application/json',...options.headers}});
 const data=await response.json();if(!response.ok)throw new Error(data.message instanceof Array?data.message.join(', '):(data.message??'Request failed'));return data as T;
}
export type Creator={id:string;username:string;headline:string;bio:string;city:string|null;user:{name:string;avatarUrl:string|null};district:{name:string}|null;portfolio:{coverUrl:string|null}[]};
export type CreatorResult={items:Creator[];total:number;page:number;pageSize:number};
