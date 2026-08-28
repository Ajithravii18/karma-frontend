import re

with open('src/Pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update TabButton
tab_button_start = content.find('const TabButton =')
tab_button_end = content.find('const renderMobileCard =', tab_button_start)

new_tab_button = '''const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={lex items-center gap-4 px-6 py-4 transition-all duration-300 w-full text-left font-bold text-sm }
    >
      <Icon size={16} />
      {label}
    </button>
  );

  '''
content = content[:tab_button_start] + new_tab_button + content[tab_button_end:]

# 2. Update return layout
return_pattern = re.compile(r'return \(\s*<div className="min-h-screen(.*?)<div id="recaptcha-container"></div>', re.DOTALL)

new_layout = '''return (
    <div className="min-h-screen bg-[#F9F9F9] font-sans text-slate-900 flex flex-col relative overflow-hidden">
      <Nav />
      <div className="flex flex-1 pt-[72px] min-h-[100vh]">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex w-[260px] bg-[#F4F4F4] flex-col pt-6 px-4 h-[calc(100vh-72px)] sticky top-[72px] border-r border-gray-200 shadow-sm z-10">
          <div className="mb-6 px-4">
            <div className="flex items-center gap-2 mb-1">
              <img src={logo} alt="Logo" className="w-6 h-6 grayscale" />
              <span className="text-xs font-black tracking-widest uppercase text-slate-800">Sustainability</span>
            </div>
            <p className="text-[9px] text-gray-500 font-bold ml-8 tracking-widest uppercase">Impact Dashboard</p>
          </div>
          
          <nav className="flex flex-col gap-2">
            <TabButton id="profile" icon={FaUser} label="Profile" />
            <TabButton id="pickups" icon={FaRecycle} label="Waste" />
            <TabButton id="pollution" icon={FaExclamationTriangle} label="Pollution" />
            <TabButton id="food" icon={FaUtensils} label="Food" />
          </nav>
          
          <div className="mt-auto pb-8 pt-4">
            <button onClick={() => window.location.href="/donations"} className="w-full bg-[#0B7A30] text-white py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition shadow-[0_4px_15px_rgb(11,122,48,0.4)]">
              <FaHeart size={12} /> Donate Now
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
          {activeTab === "profile" ? (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
              <div className="mb-10">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Main Workspace</h3>
                <p className="text-gray-500 font-medium text-sm mt-1">Managing your environmental contribution</p>
              </div>

              {/* Cards Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-start">
                {/* Profile Avatar Card */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center min-h-[220px]">
                  <div className="w-20 h-20 bg-white border border-gray-100 shadow-sm rounded-full flex items-center justify-center text-3xl text-[#09B948] font-black mb-4">
                    {currentName.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{currentName}</h2>
                  <div className="mt-3 inline-flex px-4 py-1.5 bg-white text-[#09B948] text-[9px] font-black uppercase rounded-full border border-gray-100 shadow-sm">
                    Citizen ID: <span className="ml-1 opacity-70">#{(user._id || user.id || '840A32').toString().slice(-6).toUpperCase()}</span>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col justify-center min-h-[140px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-[#E9F5EC] text-[#0B7A30] rounded-full">
                        <FaUser size={12} />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Name</p>
                    </div>
                    {isEditing ? (
                      <div className="flex gap-2 mt-2">
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full font-bold text-slate-700 outline-none text-sm" />
                        <button onClick={handleUpdateName} className="bg-slate-900 text-white px-4 rounded-xl hover:bg-slate-800 transition font-black text-[10px]">SAVE</button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-2xl font-black text-slate-900">{currentName}</p>
                        <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-100 border border-gray-200 flex items-center gap-1"><FaEdit /> Edit</button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col justify-center min-h-[140px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-[#E9F5EC] text-[#0B7A30] rounded-full">
                        <FaClock size={12} />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Contact</p>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-1">{user.phone || 'No phone set'}</p>
                  </div>
                </div>
              </div>

              {/* Contribution Excellence Block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0B7A30] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -mr-20 -mt-20 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div>
                    <h4 className="text-white/80 font-black text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <FaLeaf /> Contribution Excellence
                    </h4>
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-7xl md:text-8xl font-black tracking-tighter text-white drop-shadow-md">
                        <Counter end={stats.totalImpact} />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[#09B948] font-black text-xl tracking-tight">CREDITS</span>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Total Life Impact</span>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm max-w-sm leading-relaxed font-medium">
                      Your cumulative eco-actions have generated significant positive impact. Keep contributing to earn more credits.
                    </p>
                  </div>

                  <div className="mt-10 flex gap-4">
                    <button className="bg-white text-[#0B7A30] px-6 py-3 rounded-full text-xs font-black uppercase shadow-lg hover:shadow-xl transition-all">
                      View Details
                    </button>
                    <button className="bg-transparent border border-white/40 text-white px-6 py-3 rounded-full text-xs font-black uppercase hover:bg-white/10 transition-all">
                      Redeem
                    </button>
                  </div>
                </div>

                {/* Vertical Stats Column */}
                <div className="space-y-4">
                  {[
                    { icon: FaRecycle, color: "text-[#09B948]", bg: "bg-[#E9F5EC]", label: "Waste Managed", val: stats.breakdown?.pickups, suffix: "+" },
                    { icon: FaExclamationTriangle, color: "text-rose-500", bg: "bg-rose-50", label: "Pollution Cases", val: stats.breakdown?.pollution, suffix: "!" },
                    { icon: FaUtensils, color: "text-rose-500", bg: "bg-rose-50", label: "Food Donations", val: stats.breakdown?.food, suffix: "" }
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-5 group cursor-default hover:border-gray-300 transition-colors">
                      <div className={p-3 rounded-2xl   group-hover:scale-110 transition-transform}>
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                          <Counter end={item.val || 0} />
                          {item.suffix && <span className="text-lg opacity-40 text-slate-400 font-bold">{item.suffix}</span>}
                          {i === 2 && <FaHeart className="text-xs text-rose-500 ml-1" />}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto p-2 md:p-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight capitalize">{activeTab} Activity Log</h3>
                  <p className="text-gray-400 font-bold text-sm tracking-tight mt-1">Monitoring your environmental mission history</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    {["all", "pending", "active", "completed"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all }
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 items-center">
                    <input
                      type="month"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="bg-transparent text-[11px] font-black uppercase text-gray-600 outline-none px-3 py-1 border-none w-[120px] cursor-pointer"
                    />
                    {monthFilter && (
                      <button onClick={() => setMonthFilter("")} className="px-2 text-rose-500 hover:text-rose-700 transition-all">
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                {renderTable(getFilteredData(), ["Service Period", "Description"], activeTab)}
              </div>
            </div>
          )}
        </main>
      </div>
      <div id="recaptcha-container"></div>
'''

content = return_pattern.sub(new_layout, content)

with open('src/Pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
