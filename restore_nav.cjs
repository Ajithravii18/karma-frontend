const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'Nav.jsx');
let content = fs.readFileSync(file, 'utf8');

// The replacement logic targets the main navigation render block
// from `<nav className="fixed top-0` down to `{/* Mobile Menu Toggle */}`

const navBlockRegex = /<nav className="fixed top-0 w-full left-0 z-\[100\] transition-all duration-500 bg-white shadow-sm border-b border-slate-200 py-3 font-sans">[\s\S]*?(?=\{\/\* Mobile Menu Toggle \*\/)/;

const newNavBlock = `<nav className={\`fixed top-0 w-full left-0 z-[100] transition-all duration-500 font-sans \${
      location.pathname === "/" && !isScrolled
        ? "bg-transparent py-5"
        : "bg-white shadow-sm border-b border-slate-200 py-3"
    }\`}>

      <div className="w-full px-6 flex justify-between items-center relative z-10">

        {/* Logo */}
        <div onClick={handleHome} className="cursor-pointer">
          {location.pathname === "/" && !isScrolled ? (
            <div className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 border bg-white/10 shadow-lg border-white/20">
              <img src={logo} className="w-7" alt="E-Karma Logo" />
              <span className="text-base font-black tracking-tighter uppercase text-white">E-Karma</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95">
              <img src={logo} className="w-8" alt="E-Karma Logo" />
              <span className="text-base font-black tracking-tighter uppercase text-slate-800">E-Karma</span>
            </div>
          )}
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center space-x-6">
          {menuItems.filter(i => !i.isAccordion).map((item, idx) => (
            <button key={idx} onClick={item.onClick}
              className={\`font-semibold transition-all duration-200 py-2 text-sm relative group \${
                location.pathname === "/" && !isScrolled 
                  ? "text-white/90 hover:text-white"
                  : "text-slate-600 hover:text-green-600"
              }\`}>
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
            </button>
          ))}

          {/* Services Dropdown */}
          <div className="relative group">
            <button className={\`font-semibold transition-all duration-200 py-2 text-sm flex items-center gap-1 \${
              location.pathname === "/" && !isScrolled 
                ? "text-white/90 hover:text-white"
                : "text-slate-600 hover:text-green-600"
            }\`}>
              Services <FaChevronDown className="text-[10px]" />
            </button>
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-4 z-50 overflow-hidden">
              {services.map((service, index) => (
                <button key={index}
                  onClick={() => {
                    if (!isLoggedIn) {
                      toast.error("Please login to access services");
                      nav("/login");
                      return;
                    }
                    nav(service.path);
                  }}
                  className="flex items-start gap-3 w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="mt-0.5 text-green-500">{service.icon}</div>
                  <div>
                    <p className="font-bold text-sm text-slate-700">{service.label}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-tight">{service.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={\`relative p-2.5 rounded-xl transition-all cursor-pointer \${
                    location.pathname === "/" && !isScrolled
                      ? "bg-white/10 text-white/90 hover:bg-white/20"
                      : "bg-slate-100 text-slate-500 hover:text-green-600 hover:bg-green-50 border border-slate-200"
                  }\`}
                >
                  <FaBell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed inset-x-4 top-20 mx-auto w-auto max-w-[calc(100vw-2rem)] md:absolute md:inset-auto md:right-0 md:mt-4 md:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-[200] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Alerts Hub</h3>
                      <button onClick={() => setShowNotifications(false)} className="md:hidden text-slate-400 p-1 hover:text-slate-600"><FaTimes size={14} /></button>
                    </div>
                    <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? notifications.map(n => {
                        let Icon = FaInfoCircle, iconBg = "bg-blue-100 text-blue-600";
                        if (n.type === 'VOLUNTEER_ARRIVED') { Icon = FaTruck; iconBg = "bg-orange-100 text-orange-600"; }
                        else if (n.type === 'PAYMENT_SUCCESS') { Icon = FaCreditCard; iconBg = "bg-emerald-100 text-emerald-600"; }
                        return (
                          <div key={n._id} onClick={() => { markAsRead(n._id); setShowNotifications(false); }} className={\`p-5 border-b border-slate-50 flex gap-4 items-start hover:bg-slate-50 transition-colors cursor-pointer \${!n.isRead ? 'bg-green-50/50' : ''}\`}>
                            <div className={\`\${iconBg} p-2 rounded-xl text-sm shrink-0\`\}>><Icon /></div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-bold text-slate-700 leading-relaxed">{n.message}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        );
                      }) : <div className="p-12 text-center text-[10px] font-black text-slate-400 uppercase">No Alerts Yet</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown Pill */}
              <div className="relative group/profile" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={\`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 border \${
                    location.pathname === "/" && !isScrolled
                      ? "bg-white/10 shadow-lg border-white/20"
                      : "bg-white border-slate-200 shadow-sm hover:border-slate-300"
                  }\`}
                >
                  <div className={\`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs \${userRole === 'admin' ? 'bg-purple-600' : userRole === 'volunteer' ? 'bg-blue-600' : 'bg-green-500'}\`}>
                    {userRole === 'admin' ? <FaUserShield /> : (userName?.charAt(0).toUpperCase() || "U")}
                  </div>
                  <span className={\`font-bold text-sm hidden lg:inline \${location.pathname === "/" && !isScrolled ? "text-white" : "text-slate-700"}\`}>{userName}</span>
                  <FaChevronDown className={\`text-[10px] \${location.pathname === "/" && !isScrolled ? "text-white/60" : "text-slate-400"} transition-transform \${showDropdown ? 'rotate-180' : ''}\`} />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button onClick={goToDashboard} className="flex items-center gap-3 w-full text-left px-5 py-3.5 hover:bg-slate-50 text-slate-700 font-bold text-sm transition border-b border-slate-100">
                      <FaColumns className={userRole === 'admin' ? "text-purple-600" : "text-green-600"} />
                      {userRole === 'admin' ? "Admin Console" : "Dashboard"}
                    </button>
                    <button onClick={() => handleLogout(true)} className="flex items-center gap-3 w-full text-left px-5 py-3.5 hover:bg-red-50 text-red-600 font-bold text-sm transition">
                      <FaSignOutAlt /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Sign In Button */
            <button
              onClick={() => nav("/login")}
              className={\`px-5 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 \${
                location.pathname === "/" && !isScrolled
                ? "bg-white text-green-900 shadow-lg hover:bg-green-50"
                : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
              }\`}
            >
              Sign In
            </button>
          )}

          `;

content = content.replace(navBlockRegex, newNavBlock);
fs.writeFileSync(file, content);
console.log('Restored transparent home logic to Nav.jsx');
