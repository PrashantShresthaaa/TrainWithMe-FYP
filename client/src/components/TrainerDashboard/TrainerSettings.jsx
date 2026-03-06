import React, { useState, useEffect } from 'react';
import { Save, Award, FileText, MapPin, Globe, Clock, Plus, Trash2, Edit2, Check, X, Loader, Image, Package, DollarSign } from 'lucide-react';
import axios from 'axios';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];
const LANGUAGES = ['Nepali', 'English', 'Hindi', 'Newari', 'Maithili'];
const SPECIALTIES = ['Gym', 'Yoga', 'HIIT', 'Martial Arts', 'Zumba', 'Pilates', 'CrossFit', 'Swimming'];

const getAuth = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : null;
};

const TrainerSettings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // ── Profile fields ──
  const [form, setForm] = useState({
    bio: '', specialty: 'Gym', price: '', experience: '',
    profileImage: '', location: 'Kathmandu, Nepal',
  });
  const [languages, setLanguages] = useState(['Nepali']);
  const [certifications, setCertifications] = useState([]);
  const [newCert, setNewCert] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);

  // ── Package fields ──
  const [packages, setPackages] = useState([]);
  const [editingPkg, setEditingPkg] = useState(null); // null = not editing, {} = new, {_id,...} = existing
  const [pkgForm, setPkgForm] = useState({ name: '', sessions: '', price: '', discount: '0', description: '' });
  const [pkgSaving, setPkgSaving] = useState(false);

  // Load existing profile on mount
  useEffect(() => {
    const load = async () => {
      try {
        const config = getAuth();
        if (!config) return;
        const res = await axios.get('http://localhost:5000/api/trainers/me', config);
        const p = res.data;
        setForm({
          bio: p.bio || '',
          specialty: p.specialty || 'Gym',
          price: p.price || '',
          experience: p.experience || '',
          profileImage: p.profileImage || '',
          location: p.location || 'Kathmandu, Nepal',
        });
        setLanguages(p.languages?.length ? p.languages : ['Nepali']);
        setCertifications(p.certifications || []);
        setTimeSlots(p.timeSlots || []);
        setPackages(p.packages || []);
      } catch {
        // Profile doesn't exist yet — start fresh
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // ── Save profile ──
  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const config = getAuth();
      if (!config) { showMsg('Not logged in', 'error'); return; }
      await axios.post('http://localhost:5000/api/trainers', {
        ...form,
        price: Number(form.price),
        experience: Number(form.experience),
        languages,
        certifications,
        timeSlots,
      }, config);
      showMsg('Profile saved successfully! ✅');
    } catch {
      showMsg('Save failed. Please try again. ❌', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Time slot toggle ──
  const toggleSlot = (slot) => {
    setTimeSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  // ── Certification add/remove ──
  const addCert = () => {
    if (!newCert.trim()) return;
    setCertifications(prev => [...prev, newCert.trim()]);
    setNewCert('');
  };

  // ── Language toggle ──
  const toggleLanguage = (lang) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  // ── Package save ──
  const savePkg = async () => {
    if (!pkgForm.name || !pkgForm.sessions || !pkgForm.price) {
      showMsg('Package name, sessions, and price are required', 'error'); return;
    }
    setPkgSaving(true);
    try {
      const config = getAuth();
      const payload = {
        name: pkgForm.name,
        sessions: Number(pkgForm.sessions),
        price: Number(pkgForm.price),
        discount: Number(pkgForm.discount) || 0,
        description: pkgForm.description,
      };
      if (editingPkg?._id) payload.packageId = editingPkg._id;

      const res = await axios.post('http://localhost:5000/api/trainers/packages', payload, config);
      setPackages(res.data);
      setEditingPkg(null);
      setPkgForm({ name: '', sessions: '', price: '', discount: '0', description: '' });
      showMsg(editingPkg?._id ? 'Package updated ✅' : 'Package added ✅');
    } catch {
      showMsg('Failed to save package ❌', 'error');
    } finally {
      setPkgSaving(false);
    }
  };

  const deletePkg = async (pkgId) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      const config = getAuth();
      const res = await axios.delete(`http://localhost:5000/api/trainers/packages/${pkgId}`, config);
      setPackages(res.data.packages);
      showMsg('Package deleted');
    } catch {
      showMsg('Failed to delete ❌', 'error');
    }
  };

  const startEditPkg = (pkg) => {
    setEditingPkg(pkg);
    setPkgForm({
      name: pkg.name, sessions: pkg.sessions, price: pkg.price,
      discount: pkg.discount || 0, description: pkg.description || '',
    });
  };

  const startNewPkg = () => {
    setEditingPkg({});
    setPkgForm({ name: '', sessions: '', price: '', discount: '0', description: '' });
  };

  const sections = [
    { id: 'profile',  label: 'Profile Info',  icon: <FileText size={16}/> },
    { id: 'slots',    label: 'Availability',  icon: <Clock size={16}/> },
    { id: 'packages', label: 'My Packages',   icon: <Package size={16}/> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size={28} className="animate-spin text-brandOrange" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Trainer Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage your profile, availability, and packages.</p>
      </div>

      {/* Message banner */}
      {message.text && (
        <div className={`p-3 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">

        {/* Sidebar nav */}
        <div className="md:w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-2">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
                  ${activeSection === s.id ? 'bg-brandOrange/10 text-brandOrange font-semibold' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">

          {/* ── PROFILE INFO ── */}
          {activeSection === 'profile' && (
            <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 space-y-6">
              <h3 className="font-bold text-gray-800 text-base">Profile Information</h3>

              {/* Profile image */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Profile Photo URL</label>
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                    {form.profileImage
                      ? <img src={form.profileImage} alt="Preview" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300"><Image size={24}/></div>}
                  </div>
                  <input type="text" value={form.profileImage} onChange={e => setForm({...form, profileImage: e.target.value})}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm" />
                </div>
              </div>

              {/* Specialty + Price */}
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Specialty</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-3 text-gray-400" size={16}/>
                    <select value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange bg-white text-sm">
                      {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hourly Rate (Rs.)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={16}/>
                    <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                      placeholder="e.g. 1500"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm" />
                  </div>
                </div>
              </div>

              {/* Experience + Location */}
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Experience (Years)</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-3 text-gray-400" size={16}/>
                    <input type="number" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})}
                      placeholder="e.g. 5"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Location / Gym</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={16}/>
                    <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                      placeholder="e.g. Thamel, Kathmandu"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm" />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400" size={16}/>
                  <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={4}
                    placeholder="Tell clients about yourself, your training style, and what makes you unique..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm resize-none" />
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button type="button" key={lang} onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${languages.includes(lang) ? 'bg-brandOrange text-white border-brandOrange' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Certifications</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newCert} onChange={e => setNewCert(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCert())}
                    placeholder="e.g. NASM CPT, Yoga Alliance RYT-200"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm" />
                  <button type="button" onClick={addCert}
                    className="bg-brandOrange text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-orange-600 transition flex items-center gap-1">
                    <Plus size={16}/> Add
                  </button>
                </div>
                {certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert, i) => (
                      <span key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">
                        {cert}
                        <button type="button" onClick={() => setCertifications(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500 transition"><X size={12}/></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <button type="submit" disabled={saving}
                  className="bg-brandOrange text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader size={16} className="animate-spin"/> : <Save size={16}/>}
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

          {/* ── AVAILABILITY ── */}
          {activeSection === 'slots' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h3 className="font-bold text-gray-800 text-base mb-2">Available Time Slots</h3>
              <p className="text-xs text-gray-400 mb-6">Select the days and times you're available for sessions. Clients will see these when booking.</p>

              {DAYS.map(day => (
                <div key={day} className="mb-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{day}</p>
                  <div className="flex flex-wrap gap-2">
                    {TIMES.map(time => {
                      const slot = `${day} ${time}`;
                      const active = timeSlots.includes(slot);
                      return (
                        <button key={time} type="button" onClick={() => toggleSlot(slot)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${active ? 'bg-brandOrange text-white border-brandOrange shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <button onClick={onSubmit} disabled={saving}
                  className="bg-brandOrange text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader size={16} className="animate-spin"/> : <Save size={16}/>}
                  Save Availability
                </button>
              </div>
            </div>
          )}

          {/* ── PACKAGES ── */}
          {activeSection === 'packages' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 text-base">My Packages</h3>
                {!editingPkg && (
                  <button onClick={startNewPkg}
                    className="bg-brandOrange text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition flex items-center gap-1.5">
                    <Plus size={14}/> Add Package
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-6">Create custom packages for your clients. You can set your own pricing and discounts.</p>

              {/* Package form */}
              {editingPkg !== null && (
                <div className="bg-orange-50 border border-brandOrange/20 rounded-2xl p-5 mb-6">
                  <h4 className="font-bold text-gray-800 text-sm mb-4">{editingPkg._id ? 'Edit Package' : 'New Package'}</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Package Name</label>
                      <input type="text" value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})}
                        placeholder="e.g. Monthly Grind, Beginner Starter Pack"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Number of Sessions</label>
                      <input type="number" value={pkgForm.sessions} onChange={e => setPkgForm({...pkgForm, sessions: e.target.value})}
                        placeholder="e.g. 12"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Price (Rs.)</label>
                      <input type="number" value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: e.target.value})}
                        placeholder="e.g. 15000"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount % (optional)</label>
                      <input type="number" value={pkgForm.discount} onChange={e => setPkgForm({...pkgForm, discount: e.target.value})}
                        placeholder="e.g. 10"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (optional)</label>
                      <input type="text" value={pkgForm.description} onChange={e => setPkgForm({...pkgForm, description: e.target.value})}
                        placeholder="e.g. Perfect for beginners"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-brandOrange text-sm bg-white" />
                    </div>
                  </div>

                  {/* Preview */}
                  {pkgForm.name && pkgForm.sessions && pkgForm.price && (
                    <div className="mt-4 bg-white rounded-xl p-3 border border-gray-100 text-xs text-gray-500">
                      <span className="font-bold text-gray-700">{pkgForm.name}</span> — {pkgForm.sessions} sessions for{' '}
                      <span className="font-bold text-brandOrange">Rs. {Number(pkgForm.price).toLocaleString()}</span>
                      {pkgForm.discount > 0 && <span className="ml-1 text-green-600 font-bold">({pkgForm.discount}% off)</span>}
                      {' · '}Rs. {pkgForm.sessions ? Math.round(pkgForm.price / pkgForm.sessions) : 0}/session
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button onClick={savePkg} disabled={pkgSaving}
                      className="bg-brandOrange text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition flex items-center gap-1.5 disabled:opacity-50">
                      {pkgSaving ? <Loader size={12} className="animate-spin"/> : <Check size={14}/>}
                      {pkgSaving ? 'Saving...' : 'Save Package'}
                    </button>
                    <button onClick={() => { setEditingPkg(null); setPkgForm({ name: '', sessions: '', price: '', discount: '0', description: '' }); }}
                      className="bg-gray-100 text-gray-600 px-5 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1.5">
                      <X size={14}/> Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Package list */}
              {packages.filter(p => p.isActive !== false).length === 0 && editingPkg === null ? (
                <div className="text-center py-12 text-gray-400">
                  <Package size={40} className="mx-auto mb-3 text-gray-200"/>
                  <p className="font-bold text-gray-500">No packages yet</p>
                  <p className="text-xs mt-1">Add your first package to offer clients flexible booking options.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {packages.map(pkg => (
                    <div key={pkg._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-800 text-sm">{pkg.name}</p>
                          {pkg.discount > 0 && (
                            <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{pkg.discount}% off</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{pkg.sessions} sessions · Rs. {pkg.price?.toLocaleString()} total · Rs. {Math.round(pkg.price / pkg.sessions)}/session</p>
                        {pkg.description && <p className="text-xs text-gray-400 mt-0.5 italic">{pkg.description}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => startEditPkg(pkg)}
                          className="p-2 text-gray-400 hover:text-brandOrange hover:bg-orange-50 rounded-lg transition">
                          <Edit2 size={15}/>
                        </button>
                        <button onClick={() => deletePkg(pkg._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerSettings;