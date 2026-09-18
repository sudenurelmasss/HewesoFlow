"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTaskById, TaskItem, updateTaskStatus } from "@/services/taskService";
import {
  addChecklistItem, addTaskComment, AttachmentItem, ChecklistItem, CommentItem,
  deleteAttachment, deleteChecklistItem, downloadAttachment, getAttachments,
  getChecklist, getTaskComments, updateChecklistItem, uploadAttachment,
} from "@/services/taskExtrasService";

const date=(v?:string|null)=>v?new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(v)):"Belirtilmedi";
const status=(v?:string|number)=>typeof v==="string"?v:({0:"Yapılacak",1:"Devam Ediyor",2:"İncelemede",3:"Tamamlandı"} as Record<number,string>)[Number(v)]||"Belirsiz";

export default function TaskDetailPage(){
 const {id}=useParams<{id:string}>(); const router=useRouter();
 const [task,setTask]=useState<TaskItem|null>(null),[comments,setComments]=useState<CommentItem[]>([]),[checklist,setChecklist]=useState<ChecklistItem[]>([]),[attachments,setAttachments]=useState<AttachmentItem[]>([]);
 const [comment,setComment]=useState(""),[checkTitle,setCheckTitle]=useState(""),[fileDescription,setFileDescription]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function load(){try{setError("");const [t,c,ch,a]=await Promise.all([getTaskById(id),getTaskComments(id),getChecklist(id),getAttachments(id)]);setTask(t);setComments(c);setChecklist(ch);setAttachments(a);}catch(e){setError(e instanceof Error?e.message:"Veriler yüklenemedi.");}}
 useEffect(()=>{if(id)load();},[id]);
 async function run(fn:()=>Promise<unknown>){try{setBusy(true);setError("");await fn();await load();}catch(e){setError(e instanceof Error?e.message:"İşlem başarısız.");}finally{setBusy(false);}}
 if(!task)return <main className="mx-auto max-w-5xl p-6">{error||"Görev yükleniyor..."}</main>;
 return <main className="mx-auto max-w-5xl space-y-6 p-6">
  <button onClick={()=>router.back()} className="rounded-xl border px-4 py-2 text-sm">← Geri</button>
  <section className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-gray-500">{task.projectName||"Proje"}</p><h1 className="text-2xl font-semibold">{task.title}</h1><p className="mt-3 whitespace-pre-wrap text-gray-600">{task.description}</p></div><div className="text-right text-sm"><b>{status(task.status)}</b><p className="text-gray-500">Teslim: {date(task.dueDate)}</p></div></div>
   <div className="mt-5 flex flex-wrap gap-2">{[0,1,2,3].map(x=><button key={x} disabled={busy} onClick={()=>run(()=>updateTaskStatus(id,x))} className="rounded-xl border px-3 py-2 text-sm">{status(x)}</button>)}</div>
  </section>
  {error&&<div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  <section className="rounded-3xl border bg-white p-6"><h2 className="text-lg font-semibold">Checklist</h2><div className="mt-4 flex gap-2"><input value={checkTitle} onChange={e=>setCheckTitle(e.target.value)} placeholder="Yeni checklist maddesi" className="flex-1 rounded-xl border px-3 py-2"/><button disabled={busy||!checkTitle.trim()} onClick={()=>run(async()=>{await addChecklistItem(id,checkTitle,checklist.length);setCheckTitle("");})} className="rounded-xl bg-black px-4 py-2 text-white">Ekle</button></div><div className="mt-4 space-y-2">{checklist.map(i=><div key={i.id} className="flex items-center gap-3 rounded-xl border p-3"><input type="checkbox" checked={i.isCompleted} onChange={()=>run(()=>updateChecklistItem(id,i,{isCompleted:!i.isCompleted}))}/><span className={`flex-1 ${i.isCompleted?"line-through text-gray-400":""}`}>{i.title}</span><button onClick={()=>run(()=>deleteChecklistItem(id,i.id))} className="text-sm text-red-600">Sil</button></div>)}</div></section>
  <section className="rounded-3xl border bg-white p-6"><h2 className="text-lg font-semibold">Yorumlar</h2><div className="mt-4 flex gap-2"><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Yorum yaz..." className="flex-1 rounded-xl border px-3 py-2"/><button disabled={busy||!comment.trim()} onClick={()=>run(async()=>{await addTaskComment(id,comment);setComment("");})} className="rounded-xl bg-black px-4 py-2 text-white">Gönder</button></div><div className="mt-4 space-y-3">{comments.map(c=><article key={c.id} className="rounded-xl bg-gray-50 p-3"><div className="text-xs text-gray-500">{c.userFullName} • {date(c.createdAt)}</div><p className="mt-1">{c.content}</p></article>)}</div></section>
  <section className="rounded-3xl border bg-white p-6"><h2 className="text-lg font-semibold">Dosyalar</h2><input value={fileDescription} onChange={e=>setFileDescription(e.target.value)} placeholder="Dosya açıklaması (zorunlu)" className="mt-4 block w-full rounded-xl border p-3"/><input accept="application/pdf,.pdf" className="mt-3 block w-full rounded-xl border p-3" type="file" disabled={busy||!fileDescription.trim()} onChange={e=>{const f=e.target.files?.[0];if(f)run(async()=>{await uploadAttachment(id,f,fileDescription);setFileDescription("");});e.currentTarget.value="";}}/><p className="mt-2 text-xs text-gray-500">Yalnızca PDF, en fazla 10 MB. Açıklama zorunludur.</p><div className="mt-4 space-y-2">{attachments.map(a=><div key={a.id} className="flex items-center gap-3 rounded-xl border p-3"><span className="flex-1 truncate">{a.originalFileName}</span><button onClick={()=>downloadAttachment(id,a)} className="text-sm">İndir</button><button onClick={()=>run(()=>deleteAttachment(id,a.id))} className="text-sm text-red-600">Sil</button></div>)}</div></section>
 </main>;
}