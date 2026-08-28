const fs = require('fs');
let content = fs.readFileSync('src/Pages/ReportFood.jsx', 'utf8');

const startIdx = content.indexOf('return (');
const endIdx = content.indexOf('export default ReportLeftoverFood;');

const newLayout = eturn (
    <div className="min-h-screen bg-[#F2F5F4] font-sans text-slate-900 pb-10 relative">
      <Nav />
      <section className="pt-24 pb-10 px-4 md:px-8 flex items-center justify-center relative z-10">
        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT PANE */}
          <div className="flex flex-col justify-between bg-white p-8 md:p-12 lg:p-16 rounded-[3rem] shadow-sm border border-gray-100 min-h-[680px]">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E9F5EC] rounded-full text-[#0B7A30] text-[10px] font-black tracking-widest uppercase mb-10">
                <span className="w-2 h-2 rounded-full bg-[#09B948]"></span>
                Zero Hunger Initiative
              </div>
              
              <h1 className="text-5xl md:text-[4rem] font-black text-[#1A2530] leading-[1.05] tracking-tight mb-6">
                Turn Surplus <br />
                into <br />
                <span className="text-[#09B948] italic tracking-tighter">Sustainability.</span>
              </h1>
              
              <p className="text-gray-500 text-lg md:text-xl font-medium max-w-md leading-relaxed">
                Your contribution prevents food waste and helps local communities. 
                Fill in the specifics so our volunteers can act fast.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center min-h-[160px]">
                <div className="w-10 h-10 rounded-full bg-[#E9F5EC] text-[#0B7A30] flex items-center justify-center mb-4">
                  <FaUtensils size={16} />
                </div>
                <h4 className="font-black text-[#1A2530] text-lg mb-1">Direct Impact</h4>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">Meals go directly to those in need.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center min-h-[160px]">
                <div className="w-10 h-10 rounded-full bg-[#FFF4ED] text-[#EA580C] flex items-center justify-center mb-4">
                  <FaClock size={16} />
                </div>
                <h4 className="font-black text-[#1A2530] text-lg mb-1">Fast Pickup</h4>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">Expiry tracking ensures food safety.</p>
              </div>
            </div>
          </div>

          {/* RIGHT PANE (FORM) */}
          <div className="bg-white p-8 md:p-12 lg:p-16 rounded-[3rem] shadow-sm border border-gray-100 min-h-[680px] flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                    <FaMapMarkerAlt /> Pickup Location
                  </label>
                  <input 
                    type="text" placeholder="Restaurant / Event Name" 
                    value={placeName} onChange={(e) => setPlaceName(e.target.value)} 
                    className="w-full bg-[#F1F3F2] border-transparent rounded-2xl px-5 py-4 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                    <FaUtensils /> Servings (Count)
                  </label>
                  <input 
                    type="number" placeholder="How many people?" 
                    value={quantity} onChange={(e) => setQuantity(e.target.value)} 
                    className="w-full bg-[#F1F3F2] border-transparent rounded-2xl px-5 py-4 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none" 
                    required 
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                    <FaLayerGroup /> Food Category
                  </label>
                  <select 
                    value={foodType} onChange={(e) => setFoodType(e.target.value)}
                    className="w-full bg-[#F1F3F2] border-transparent rounded-2xl px-5 py-4 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none cursor-pointer appearance-none"
                  >
                    <option value="Veg">?? Veg Only</option>
                    <option value="Non-Veg">?? Non-Veg</option>
                    <option value="Mix">?? Mixed Items</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                    <FaClock /> Best Before (Expiry)
                  </label>
                  <input 
                    type="datetime-local" 
                    value={expiryTime} onChange={(e) => setExpiryTime(e.target.value)} 
                    className="w-full bg-[#F1F3F2] border-transparent rounded-2xl px-5 py-4 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none" 
                    required 
                  />
                </div>
              </div>

              {/* Map */}
              <div className="space-y-3">
                <button 
                  type="button" onClick={getCurrentLocation} 
                  className="w-full py-4 bg-[#E9F5EC] text-[#0B7A30] font-black text-[11px] uppercase tracking-widest rounded-full border border-[#09B948]/30 hover:bg-[#D5EAD9] transition-all flex items-center justify-center gap-3"
                >
                  ?? Pin Current Location
                </button>
                <div className="rounded-3xl overflow-hidden h-[180px] w-full border-4 border-[#F1F3F2] relative z-0">
                  <MapContainer center={position} zoom={16} className="h-full w-full z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position} />
                    <MapUpdater center={position} />
                  </MapContainer>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Additional Instructions</label>
                <textarea 
                  placeholder="E.g. Take from back gate, items are pre-packed..." 
                  value={notes} onChange={(e) => setNotes(e.target.value)} 
                  className="w-full bg-[#F1F3F2] border-transparent rounded-3xl px-5 py-5 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none min-h-[100px] resize-none" 
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button 
                  type="submit" disabled={loading} 
                  className="w-full bg-[#09B948] text-white py-5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#0B7A30] transition-all shadow-[0_6px_20px_rgb(9,185,72,0.4)] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? "Syncing with Cloud..." : "?? Dispatch Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
\n\nexport default ReportLeftoverFood;;

content = content.substring(0, startIdx) + newLayout;
fs.writeFileSync('src/Pages/ReportFood.jsx', content, 'utf8');
