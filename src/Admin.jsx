import React, { useState } from 'react';
import { ShieldCheck, User, Plus, LogOut, Lock, Database, Settings, Trash2, X, CheckCircle, XCircle, Download } from 'lucide-react';

// 🔥 CORRECT PDF IMPORTS FOR VITE
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Admin = ({ validCodes, onAddCode, usedCodes, allSubmissions, questionsBank, onUpdateQuestions, adminSettings, setAdminSettings }) => {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTime, setSelectedTime] = useState(10);
  const [newQ, setNewQ] = useState({ q: '', opt0: '', opt1: '', opt2: '', opt3: '', ans: 0 });
  
  // State for Detailed Modal
  const [detailedUser, setDetailedUser] = useState(null);

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F5F7] to-[#E5E5EA]">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-12 rounded-[2.5rem] shadow-xl text-center border border-white">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={36} /></div>
          <h2 className="text-3xl font-black mb-8 text-[#1d1d1f] tracking-tight">ADMIN PORTAL</h2>
          <input 
            type="password" 
            placeholder="Enter Password" 
            onChange={(e) => setPass(e.target.value)} 
            className="w-full p-4 bg-[#F5F5F7] rounded-2xl mb-6 outline-none text-center font-mono tracking-widest focus:ring-2 ring-blue-500" 
          />
          <button 
            onClick={() => { if(pass === 'admin123') setAuth(true); else alert("Access Denied"); }} 
            className="w-full py-4 bg-[#1d1d1f] text-white rounded-2xl font-bold hover:bg-black transition"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  const handleAddQuestion = () => {
    if (!newQ.q || !newQ.opt0 || !newQ.opt1 || !newQ.opt2 || !newQ.opt3) return alert("Please fill all fields!");
    const formatted = { id: Date.now(), q: newQ.q, opts: [newQ.opt0, newQ.opt1, newQ.opt2, newQ.opt3], ans: parseInt(newQ.ans) };
    onUpdateQuestions(selectedTime, [...(questionsBank[selectedTime] || []), formatted]);
    setNewQ({ q: '', opt0: '', opt1: '', opt2: '', opt3: '', ans: 0 });
  };

  // 🔥 BULK PDF EXPORT LOGIC
  const downloadAllSubmissionsPDF = () => {
    if (!allSubmissions || allSubmissions.length === 0) {
      return alert("No submissions available to download!");
    }

    try {
      const doc = new jsPDF();
      
      // Header Text
      doc.setFontSize(18);
      doc.setTextColor(29, 29, 31);
      doc.text("Candidate Submissions Report", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      // Table Generation for ALL users
      autoTable(doc, {
        startY: 35,
        head: [['Name', 'Email', 'Score', 'Duration', 'Access Code']],
        body: allSubmissions.map(s => [
          s.name, 
          s.email, 
          `${s.score} / ${s.total}`, 
          `${s.duration} Mins`,
          s.code
        ]),
        headStyles: { fillColor: [0, 113, 227], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 247] },
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
      });

      doc.save("Admin_All_Submissions_Report.pdf");
    } catch (error) {
      console.error("PDF Error: ", error);
      alert("Error generating PDF. Please check the console.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans relative">
      <div className="max-w-7xl mx-auto p-8">
        
        <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-[2rem] shadow-sm">
          <h1 className="text-3xl font-black tracking-tight text-[#1d1d1f]">ADMIN PORTAL</h1>
          <div className="flex gap-2 bg-[#F5F5F7] p-2 rounded-2xl overflow-x-auto">
            <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('questions')} className={`px-5 py-3 rounded-xl font-bold transition-all ${activeTab === 'questions' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Questions</button>
            <button onClick={() => setActiveTab('settings')} className={`px-5 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Settings</button>
            <button onClick={() => window.location.href = '/'} className="px-5 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition"><LogOut size={18}/></button>
          </div>
        </header>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Access Codes Panel */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold flex items-center gap-3"><ShieldCheck className="text-blue-500" size={28}/> Access Codes</h3>
                <button onClick={onAddCode} className="bg-[#1d1d1f] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition"><Plus size={18}/> Generate</button>
              </div>
              <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {validCodes.map(c => (
                  <div key={c} className={`p-4 rounded-2xl border-2 text-center font-mono font-bold ${usedCodes.includes(c) ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{c}</div>
                ))}
              </div>
            </div>

            {/* Submissions Panel */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold flex items-center gap-3"><User className="text-green-500" size={28}/> Submissions</h3>
                {/* 🔥 PDF EXPORT BUTTON */}
                <button onClick={downloadAllSubmissionsPDF} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
                  <Download size={18}/> Export All (PDF)
                </button>
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {allSubmissions.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-medium">No candidate submissions yet.</div>
                ) : (
                  allSubmissions.map((s, i) => (
                    <div key={i} onClick={() => setDetailedUser(s)} className="p-6 bg-[#F5F5F7] rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                      <div>
                        <p className="font-bold text-lg text-[#1d1d1f]">{s.name}</p>
                        <p className="text-sm text-gray-500">{s.duration} mins • Click for details</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-2xl text-blue-600">{s.score}<span className="text-sm text-gray-400">/{s.total}</span></p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUESTIONS */}
        {activeTab === 'questions' && (
           <div className="bg-white p-10 rounded-[2.5rem] shadow-sm">
             <div className="flex justify-between items-end mb-10">
              <h3 className="text-2xl font-bold flex items-center gap-3"><Database className="text-purple-500"/> Question Bank Manager</h3>
              <select className="p-4 bg-[#F5F5F7] rounded-2xl font-bold cursor-pointer outline-none" value={selectedTime} onChange={(e) => setSelectedTime(parseInt(e.target.value))}>
                {[10, 15, 20, 25, 30].map(time => <option key={time} value={time}>{time} Minutes Test</option>)}
              </select>
             </div>
             
             <div className="grid md:grid-cols-2 gap-12">
               {/* Current Questions List */}
               <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4">
                 {(questionsBank[selectedTime] || []).map((q, idx) => (
                   <div key={idx} className="p-6 bg-[#F5F5F7] rounded-[2rem] relative group">
                     <button onClick={() => onUpdateQuestions(selectedTime, questionsBank[selectedTime].filter(x => x.id !== q.id))} className="absolute top-6 right-6 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={20}/></button>
                     <h5 className="font-bold text-lg mb-4 pr-8">{idx+1}. {q.q}</h5>
                     <div className="grid grid-cols-2 gap-2">
                       {q.opts.map((opt, oIdx) => (
                         <div key={oIdx} className={`p-3 rounded-xl text-sm font-medium ${q.ans === oIdx ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600'}`}>{opt} {q.ans === oIdx && '✓'}</div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
               
               {/* Add New Question Form */}
               <div className="bg-[#F5F5F7] p-8 rounded-[2.5rem]">
                 <h4 className="font-bold mb-6 text-[#1d1d1f]">Add New Question</h4>
                 <div className="space-y-4">
                   <textarea placeholder="Type question text..." className="w-full p-4 rounded-2xl outline-none" onChange={(e) => setNewQ({...newQ, q: e.target.value})} value={newQ.q} />
                   <div className="grid grid-cols-2 gap-4">
                     {[0,1,2,3].map(i => <input key={i} placeholder={`Option ${i+1}`} className="p-4 rounded-2xl outline-none" value={newQ[`opt${i}`]} onChange={(e) => setNewQ({...newQ, [`opt${i}`]: e.target.value})} />)}
                   </div>
                   <select className="w-full p-4 rounded-2xl outline-none cursor-pointer" value={newQ.ans} onChange={(e) => setNewQ({...newQ, ans: e.target.value})}>
                     {[0,1,2,3].map(i => <option key={i} value={i}>Option {i+1} is Correct</option>)}
                   </select>
                   <button onClick={handleAddQuestion} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition">Add Question</button>
                 </div>
               </div>
             </div>
           </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm max-w-2xl">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3"><Settings className="text-orange-500"/> System Settings</h3>
            <div className="bg-[#F5F5F7] p-8 rounded-[2rem]">
              <h4 className="font-bold text-lg mb-2 text-[#1d1d1f]">Auto-Submit Warning Alert</h4>
              <p className="text-gray-500 text-sm mb-6">Set how many minutes before the test ends the warning should appear.</p>
              
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  value={adminSettings.warningMinutes} 
                  onChange={(e) => setAdminSettings({ warningMinutes: parseInt(e.target.value) || 1 })}
                  className="w-24 p-4 rounded-2xl outline-none text-center font-bold text-xl"
                  min="1"
                  max="10"
                />
                <span className="font-bold text-gray-600">Minutes</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED USER MODAL */}
      {detailedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F5F5F7]">
              <div>
                <h2 className="text-2xl font-black text-[#1d1d1f]">{detailedUser.name}'s Report</h2>
                <p className="text-gray-500 font-medium">{detailedUser.email} • {detailedUser.phone}</p>
              </div>
              <button onClick={() => setDetailedUser(null)} className="p-3 bg-white text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 transition"><X size={24}/></button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-8 bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <div>
                  <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-1">Final Score</p>
                  <p className="text-5xl font-black text-blue-700">{detailedUser.score}<span className="text-2xl text-blue-300">/{detailedUser.total}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 font-bold mb-1">Duration: {detailedUser.duration} Mins</p>
                  <p className="text-gray-500 font-bold">Code: <span className="font-mono bg-white px-3 py-1 rounded-md border text-gray-800">{detailedUser.code}</span></p>
                </div>
              </div>

              <h3 className="font-bold text-gray-400 uppercase tracking-widest text-sm mb-4">Question Breakdown</h3>
              <div className="space-y-4">
                {detailedUser.details ? detailedUser.details.map((ans, idx) => (
                  <div key={idx} className={`p-6 rounded-[2rem] border-2 ${ans.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <h4 className="font-bold text-lg mb-4 text-[#1d1d1f]">{idx+1}. {ans.question}</h4>
                    <div className="flex flex-col gap-2 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {ans.isCorrect ? <CheckCircle size={18} className="text-green-500"/> : <XCircle size={18} className="text-red-500"/>}
                        <span className="text-gray-600">User Answer: </span>
                        <span className={`font-bold ${ans.isCorrect ? 'text-green-700' : 'text-red-700'}`}>{ans.userAns}</span>
                      </div>
                      {!ans.isCorrect && (
                        <div className="flex items-center gap-2 mt-1 pl-6 border-l-2 border-green-200 ml-[9px]">
                          <span className="text-gray-500">Correct Answer: </span>
                          <span className="font-bold text-green-600">{ans.correctAns}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )) : <p className="text-gray-400 text-center py-4">No detailed data available for this submission.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;