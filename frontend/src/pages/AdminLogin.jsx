import {useState} from 'react';
import {Navigate,useNavigate,Link} from 'react-router-dom';
import {ShieldCheck,BookOpen} from 'lucide-react';
import {useAuth} from '../context/AuthContext';

export default function AdminLogin(){
 const {user,login,logout}=useAuth(); const nav=useNavigate(); const [email,setEmail]=useState('admin@lullpathagar.edu'); const [password,setPassword]=useState('password'); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 if(user?.role==='admin') return <Navigate to="/admin" replace/>;
 const submit=async e=>{e.preventDefault();setError('');setBusy(true);try{const u=await login(email,password);if(u.role!=='admin'){logout();throw new Error('This account does not have administrator access.')}nav('/admin')}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="w-full max-w-md card p-7">
   <div className="flex items-center gap-3 mb-6"><img src="/boi-ghor-logo.png" alt="BOI GHOR" className="w-14 h-14 rounded-xl object-cover shadow-md ring-1 ring-slate-200"/><div><h1 className="font-bold text-gray-800">Admin Login</h1><p className="text-xs text-gray-500">BOI GHOR administration</p></div></div>
   {error&&<div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>}
   <form onSubmit={submit} className="space-y-4"><div><label className="text-xs font-medium text-gray-600">Admin email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="input mt-1"/></div><div><label className="text-xs font-medium text-gray-600">Password</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="input mt-1"/></div><button disabled={busy} className="btn-primary w-full">{busy?'Signing in...':'Sign in as Admin'}</button></form>
   <p className="text-center text-xs text-gray-500 mt-5"><Link className="text-brand-600" to="/login">← Back to student login</Link></p>
 </div></div>
}
