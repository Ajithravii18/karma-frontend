const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'Pages', 'Dashboard.jsx');
let lines = fs.readFileSync(file, 'utf8').split('\n');

// 664 is index 663. 877 is index 876.
// We want to replace everything from index 663 to 876 inclusive.
const before = lines.slice(0, 663);
const after = lines.slice(877);

const newContent = `            <div className="p-6 md:p-8 xl:p-10 max-w-[1200px] mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* ── LEFT COLUMN ── */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                  
                  {/* Hero Card */}
                  <div className="bg-gradient-to-b from-green-50 to-white border border-green-100 shadow-sm rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-green-500/30 mb-4 shrink-0">
                      {currentName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-slate-800 font-black text-xl leading-tight">{currentName}</p>
                    <p className="text-slate-500 text-xs font-medium mt-1">Eco Citizen · ID #{(user._id || user.id || 'XXXXXX').toString().slice(-6)}</p>
                    
                    <div className="flex items-center justify-center gap-1.5 mt-3 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-600 text-[10px] font-bold uppercase tracking-widest">Active Member</span>
                    </div>

                    <button onClick={() => setIsEditing(!isEditing)}
                      className={\`mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all \${
                        isEditing ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
                      }\`}>
                      {isEditing ? <><FaTimes size={12} /> Cancel Edit</> : <><FaEdit size={12} /> Edit Profile</>}
                    </button>
                  </div>

                  {/* Account Details */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Account Details</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      <div className="px-6 py-4 flex flex-col gap-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Full Name</p>
                        {isEditing ? (
                          <div className="flex gap-2 mt-1">
                            <input value={newName} onChange={(e) => setNewName(e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 outline-none focus:border-green-500 transition-all text-sm w-full" />
                            <button onClick={handleUpdateName} className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-black text-xs hover:bg-green-700 transition-all">Save</button>
                          </div>
                        ) : <p className="text-slate-800 font-bold text-sm mt-0.5">{currentName}</p>}
                      </div>
                      <div className="px-6 py-4 flex flex-col gap-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Phone Number</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-slate-800 font-bold text-sm">{user.phone || 'Not set'}</p>
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-full border border-green-100">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  {isEditing && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex flex-col gap-3">
                        <button onClick={() => setPhoneState({ ...phoneState, show: !phoneState.show, step: 1 })}
                          className={\`w-full px-5 py-3 border rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 \${phoneState.show ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}\`}>
                          <FaEdit size={13} className="text-green-500" /> Update Phone
                        </button>
                        <button onClick={() => setDeleteState({ ...deleteState, show: !deleteState.show })}
                          className={\`w-full px-5 py-3 border rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 \${deleteState.show ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'}\`}>
                          <FaTimes size={13} /> Account Termination
                        </button>
                      </div>

                      {phoneState.show && (
                        <div className="p-5 bg-green-50 border border-green-100 rounded-xl animate-in slide-in-from-top-4 duration-300">
                          {phoneState.step === 1 ? (
                            <div className="flex flex-col gap-3">
                              <div>
                                <label className="text-[10px] font-black text-green-700 uppercase mb-2 block tracking-widest">New Mobile Number</label>
                                <input type="tel" placeholder="+91..." value={phoneState.newPhone} onChange={(e) => setPhoneState({ ...phoneState, newPhone: e.target.value })}
                                  className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-green-600 transition-all" />
                              </div>
                              <button onClick={handleSendPhoneOtp} disabled={phoneState.loading} className="w-full bg-green-600 text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase hover:bg-green-700 transition-all">
                                {phoneState.loading ? "Sending..." : "Send Code"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <div>
                                <label className="text-[10px] font-black text-green-700 uppercase mb-2 block tracking-widest text-center">Code sent to {phoneState.newPhone}</label>
                                <div className="flex justify-center gap-1.5">
                                  {[0,1,2,3,4,5].map((i) => (
                                    <input key={i} type="text" maxLength="1" value={phoneState.otp[i] || ""}
                                      onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g,""); let o = phoneState.otp.split(""); o[i]=val; setPhoneState({...phoneState,otp:o.join("")}); if(val&&e.target.nextSibling)e.target.nextSibling.focus(); }}
                                      className="w-8 h-10 bg-white border border-green-200 rounded-lg font-black text-slate-700 text-center outline-none focus:border-green-600 transition-all text-base" />
                                  ))}
                                </div>
                              </div>
                              <button onClick={handleVerifyPhone} disabled={phoneState.loading} className="w-full bg-slate-800 text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase hover:bg-slate-900 transition-all">
                                {phoneState.loading ? "Verifying..." : "Confirm"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {deleteState.show && (
                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-xl animate-in slide-in-from-top-4 duration-300">
                          <div className="flex flex-col items-center text-center mb-4">
                            <div className="w-10 h-10 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center text-lg animate-pulse mb-2">⚠</div>
                            <h4 className="text-base font-black text-rose-900 leading-tight">Termination Protocol</h4>
                            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-1">This permanently deletes your account.</p>
                          </div>
                          {deleteState.step !== 2 ? (
                            <div className="space-y-3">
                              <textarea placeholder="Reason for leaving..." value={deleteState.reason} onChange={(e) => setDeleteState({ ...deleteState, reason: e.target.value })}
                                className="w-full bg-white border-2 border-rose-200 rounded-xl p-3 font-medium text-gray-700 outline-none focus:border-rose-500 transition-all min-h-[80px] text-sm" />
                              <button onClick={handleDeleteRequest} disabled={deleteState.loading} className="w-full bg-rose-600 text-white py-3 rounded-xl text-[11px] font-black uppercase hover:bg-rose-700 transition-all active:scale-95">
                                {deleteState.loading ? "Processing..." : "Initiate Verification"}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex justify-center gap-1.5">
                                {[0,1,2,3,4,5].map((i) => (
                                  <input key={i} type="text" maxLength="1" value={deleteState.otp[i] || ""}
                                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g,""); let o = deleteState.otp.split(""); o[i]=val; setDeleteState({...deleteState,otp:o.join("")}); if(val&&e.target.nextSibling)e.target.nextSibling.focus(); }}
                                    className="w-8 h-10 bg-white border-2 border-rose-200 rounded-lg font-black text-slate-800 text-center outline-none focus:border-rose-900 transition-all text-base" />
                                ))}
                              </div>
                              <button onClick={handleFinalDelete} disabled={deleteState.loading} className="w-full bg-slate-900 text-white py-3 rounded-xl text-[11px] font-black uppercase hover:bg-rose-900 transition-all active:scale-95">
                                {deleteState.loading ? "Purging..." : "Finalize Deletion"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                  
                  {/* Stats Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: FaRecycle, label: "Waste Pickups", val: stats.breakdown?.pickups, accent: "border-l-emerald-500 text-emerald-600" },
                      { icon: FaExclamationTriangle, label: "Pollution Reports", val: stats.breakdown?.pollution, accent: "border-l-rose-500 text-rose-600" },
                      { icon: FaUtensils, label: "Food Shared", val: stats.breakdown?.food, accent: "border-l-amber-500 text-amber-600" },
                    ].map((s, i) => (
                      <div key={i} className={\`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 border-l-4 \${s.accent.split(' ')[0]}\`}>
                        <s.icon size={16} className="text-slate-400 mb-3" />
                        <p className={\`text-3xl font-black \${s.accent.split(' ')[1]}\`}><Counter end={s.val || 0} /></p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Impact Banner */}
                  <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-green-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10 flex flex-col xl:flex-row gap-8 xl:items-center justify-between">
                      <div className="flex-1">
                        <p className="text-green-100 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                          <FaLeaf /> Contribution Excellence
                        </p>
                        <div className="flex items-baseline gap-3 mt-4">
                          <span className="text-7xl font-black text-white"><Counter end={stats.totalImpact} /></span>
                          <span className="text-2xl font-black text-green-200">CREDITS</span>
                        </div>
                        <p className="text-green-50/80 text-sm font-medium mt-3 max-w-sm">
                          Your total environmental impact score. Keep completing missions to earn more credits and unlock exclusive eco-rewards.
                        </p>
                        <div className="w-full max-w-sm h-3 bg-black/20 rounded-full mt-6 overflow-hidden">
                          <div className="h-full bg-white w-3/4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 w-full xl:w-64 shrink-0">
                        {[
                          { icon: FaRecycle, label: "Waste Managed", val: stats.breakdown?.pickups, color: "text-emerald-300" },
                          { icon: FaExclamationTriangle, label: "Pollution Cases", val: stats.breakdown?.pollution, color: "text-rose-300" },
                          { icon: FaUtensils, label: "Food Donations", val: stats.breakdown?.food, color: "text-amber-300" },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center gap-4 bg-black/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/5 hover:bg-black/20 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                              <s.icon size={14} className={s.color} />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-green-100/70 uppercase tracking-widest">{s.label}</p>
                              <p className="text-lg font-black text-white"><Counter end={s.val || 0} /></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>`;

fs.writeFileSync(file, [...before, newContent, ...after].join('\n'), 'utf8');
console.log('Grid applied cleanly.');
