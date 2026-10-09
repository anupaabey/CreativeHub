'use client';
import {useState,useEffect} from 'react';import {api} from '@/lib/api';
export default function FavoriteButton({creatorId}:{creatorId:string}){useEffect(()=>{void api(`/creators/${creatorId}/view`,{method:'POST'}).catch(()=>{});},[creatorId]);const [message,setMessage]=useState('Save professional');return <button className="btn btn-outline" onClick={async()=>{try{await api(`/workspace/favorites/${creatorId}`,{method:'POST'});setMessage('Saved to favorites');}catch(e){setMessage(e instanceof Error?e.message:'Sign in first');}}}>{message}</button>;}
