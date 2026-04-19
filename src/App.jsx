import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  UserPlus,
  X,
  Clock,
  CalendarDays,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  FileText,
  Copy,
  Lock,
  LogOut,
  Award,
  TrendingUp,
  TableProperties,
  Moon,
  ArrowLeft,
  Download
} from 'lucide-react';

// ─── Configuration ───────────────────────────────────────────────────────────
// Replace this URL with your deployed Google Apps Script web app URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwVkK0SNBJzJksVEFhW75hFqPsXBZ28P8Qj0YsIEEtRiowEW6pBP6As2GPrL-JLCG-X/exec';

// ─── ERC Logo Component ─────────────────────────────────────────────────────
function ERCLogo({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-erc-red to-erc-red-dark flex items-center justify-center shadow-lg shadow-erc-red/30">
          <svg viewBox="0 0 100 100" className="w-9 h-9 text-white pl-1">
            <defs>توقيغ
              <mask id="crescentMask">
                <rect width="100" height="100" fill="white" />
                <circle cx="62" cy="50" r="40" fill="black" />
              </mask>
            </defs>
            <circle cx="45" cy="50" r="40" fill="currentColor" mask="url(#crescentMask)" />
          </svg>
        </div>
        <div className="absolute -inset-1 rounded-full bg-erc-red/20 animate-pulse -z-10" />
      </div>
    </div>
  );
}

// ─── Volunteer Tag ──────────────────────────────────────────────────────────
function VolunteerTag({ volunteer, onRemove }) {
  return (
    <div className="group flex items-center gap-2 bg-erc-red-50 border border-erc-red-200 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-erc-red-100 hover:shadow-sm">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-erc-red to-erc-red-dark flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {volunteer.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-erc-dark truncate">{volunteer.name}</p>
        <p className="text-xs text-erc-dark-soft/60 font-medium">#{volunteer.id}</p>
      </div>
      <button
        onClick={() => onRemove(volunteer.id)}
        className="p-1 rounded-full hover:bg-erc-red/10 text-erc-dark-soft/40 hover:text-erc-red transition-colors flex-shrink-0 cursor-pointer"
        aria-label={`إزالة ${volunteer.name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  // State
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [missionName, setMissionName] = useState('');
  const [copied, setCopied] = useState(false);
  const [missionDate, setMissionDate] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Manager Portal State
  const [isManagerPortal, setIsManagerPortal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const managerDropdownRef = useRef(null);

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setMissionDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Fetch volunteers from Google Apps Script
  useEffect(() => {
    if (!APPS_SCRIPT_URL) {
      // Demo data when no Apps Script URL is configured
      const demoVolunteers = [
        { id: '1', name: 'أحمد سامي عبد العظيم الحسيني' },
        { id: '2', name: 'نورهان رمضان مسعد مليجي' },
        { id: '3', name: 'تغريد عبد الحميد عبد الحميد' },
        { id: '4', name: 'محمد عبد الرحمن أحمد' },
        { id: '5', name: 'فاطمة الزهراء محمود علي' },
        { id: '6', name: 'يوسف إبراهيم حسن خليل' },
        { id: '7', name: 'مريم أحمد السيد عمر' },
        { id: '8', name: 'عمر خالد محمد إسماعيل' },
        { id: '9', name: 'سارة حسام الدين أحمد' },
        { id: '10', name: 'خالد مصطفى عبد الله' },
      ];
      setAllVolunteers(demoVolunteers);
      setIsLoading(false);
      return;
    }

    fetch(`${APPS_SCRIPT_URL}?action=getVolunteers`)
      .then(res => res.json())
      .then(data => {
        setAllVolunteers(data.volunteers || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch volunteers:', err);
        setErrorMessage('فشل في تحميل قائمة المتطوعين. تأكد من اتصالك بالإنترنت.');
        setIsLoading(false);
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (managerDropdownRef.current && !managerDropdownRef.current.contains(event.target)) {
        setIsManagerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize Arabic text for better searching (e.g. match 'احمد' with 'أحمد')
  const normalizeText = (text) => {
    if (!text) return '';
    return text.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();
  };

  // Filter volunteers based on search
  const filteredVolunteers = allVolunteers.filter(v => {
    const isNotSelected = !selectedVolunteers.find(sv => sv.id === v.id);
    const query = normalizeText(searchQuery);
    const matchesSearch = query === '' ||
      normalizeText(v.name).includes(query) ||
      v.id.toString().includes(query);
    return isNotSelected && matchesSearch;
  });

  // Add volunteer
  const addVolunteer = useCallback((volunteer) => {
    setSelectedVolunteers(prev => [...prev, volunteer]);
    setSearchQuery('');
    setIsDropdownOpen(false);
    searchInputRef.current?.focus();
  }, []);

  // Remove volunteer
  const removeVolunteer = useCallback((id) => {
    setSelectedVolunteers(prev => prev.filter(v => v.id !== id));
  }, []);

  // ─── Time Calculation ──────────────────────────────────────────────────────
  const calculateHours = (from, to) => {
    if (!from || !to) return 0;
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    let fromMinutes = fh * 60 + fm;
    let toMinutes = th * 60 + tm;
    if (toMinutes <= fromMinutes) toMinutes += 24 * 60; // past midnight
    return (toMinutes - fromMinutes) / 60;
  };

  // Convert Western digits to Arabic-Indic digits
  const toAr = (val) => String(val).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

  // Convert 24h time to 12h Arabic format (e.g. "٨:٠٠ ص")
  const to12h = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'م' : 'ص';
    const hour12 = h % 12 || 12;
    return `${toAr(hour12)}:${toAr(String(m).padStart(2, '0'))} ${period}`;
  };

  const calculatedHours = calculateHours(timeFrom, timeTo);
  const isCrossingMidnight = timeFrom && timeTo && (() => {
    const [fh, fm] = timeFrom.split(':').map(Number);
    const [th, tm] = timeTo.split(':').map(Number);
    return (th * 60 + tm) <= (fh * 60 + fm);
  })();

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    setErrorMessage('');

    // Validation
    if (!missionName.trim()) {
      setErrorMessage('يرجى إدخال اسم المهمة');
      return;
    }
    if (!missionDate) {
      setErrorMessage('يرجى تحديد تاريخ المهمة');
      return;
    }
    if (!timeFrom || !timeTo) {
      setErrorMessage('يرجى تحديد وقت البداية والنهاية');
      return;
    }
    if (calculatedHours <= 0) {
      setErrorMessage('يرجى إدخال وقت صحيح');
      return;
    }
    if (selectedVolunteers.length === 0) {
      setErrorMessage('يرجى إضافة متطوع واحد على الأقل');
      return;
    }

    if (!APPS_SCRIPT_URL) {
      // Demo mode
      setIsSubmitting(true);
      await new Promise(r => setTimeout(r, 1500));
      setIsSubmitting(false);
      setSubmitStatus('success');
      setTimeout(() => {
        setSubmitStatus(null);
        setSelectedVolunteers([]);
        setTimeFrom('');
        setTimeTo('');
      }, 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        action: 'logMission',
        missionName: missionName.trim(),
        date: missionDate,
        hours: parseFloat(calculatedHours.toFixed(2)),
        timeFrom: timeFrom,
        timeTo: timeTo,
        volunteerIds: selectedVolunteers.map(v => v.id),
      };

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          setSubmitStatus(null);
          setSelectedVolunteers([]);
          setTimeFrom('');
          setTimeTo('');
        }, 3000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'حدث خطأ غير متوقع');
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitStatus('error');
      setErrorMessage('فشل في إرسال البيانات. تأكد من اتصالك بالإنترنت.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate text for copying
  const generateMissionText = () => {
    let text = missionName ? `${missionName}\n\n` : 'تفاصيل المهمة:\n\n';
    selectedVolunteers.forEach((v, idx) => {
      text += `${idx + 1}. ${v.name} ${v.id}\n`;
    });
    return text.trim();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateMissionText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Format date for display
  const formatArabicDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return `${days[date.getDay()]} — ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // ─── Manager Logic ─────────────────────────────────────────────────────────
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '1911') {
      setIsManagerPortal(true);
      setShowPinModal(false);
      setPinInput('');
    } else {
      alert('الرمز السري غير صحيح');
      setPinInput('');
    }
  };

  // ─── PDF Report ─────────────────────────────────────────────────────────────
  const downloadPDF = () => {
    if (!reportData || !currentVolunteerReport) return;
    const vol = currentVolunteerReport;
    const ar = (v) => String(v).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    const rows = reportData.missions.map((m) => `
      <tr>
        <td>${m.missionName}</td>
        <td>${ar(m.date)}${m.timeRange ? `<br/><span style="font-size:11px;color:#666">${ar(m.timeRange)}</span>` : ''}</td>
        <td>${ar(m.hours.toFixed(1))}</td>
        <td></td>
        <td></td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>تقرير ${vol.name}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #222; padding: 40px; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #c0392b; padding-bottom: 20px; }
  .header h1 { font-size: 20px; color: #c0392b; margin-bottom: 6px; }
  .header p { font-size: 13px; color: #555; }
  .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
  .info span { background: #f5f5f5; padding: 6px 14px; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #c0392b; color: white; padding: 10px 8px; font-weight: bold; }
  td { border: 1px solid #ddd; padding: 10px 8px; text-align: center; vertical-align: middle; }
  tr:nth-child(even) td { background: #fafafa; }
  .total-row td { font-weight: bold; background: #fff3f3 !important; border-top: 2px solid #c0392b; }
  .footer { margin-top: 30px; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <h1>الهلال الأحمر المصري</h1>
    <p>تقرير ساعات التطوع</p>
  </div>
  <div class="info">
    <span><b>الاسم:</b> ${vol.name}</span>
    <span><b>رقم العضوية:</b> ${ar(vol.id)}</span>
    <span><b>إجمالي الساعات:</b> ${ar(reportData.totalHours.toFixed(1))} ساعة</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>النشاط</th>
        <th>تاريخ النشاط والفترة من الي</th>
        <th>اجمالي عدد الساعات</th>
        <th>عدد النقاط المستحقة</th>
        <th>توقيع المشرف</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="2">الإجمالي</td>
        <td>${ar(reportData.totalHours.toFixed(1))}</td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <div class="footer">تم إنشاء هذا التقرير آلياً</div>
</body>
</html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  };

  const filteredManagerVolunteers = allVolunteers.filter(v => {
    if (!managerSearchQuery) return true;
    const query = normalizeText(managerSearchQuery);
    return normalizeText(v.name).includes(query) || v.id.toString().includes(query);
  });

  const fetchReport = async (volunteerId) => {
    setIsLoadingReport(true);
    setReportData(null);
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getVolunteerReport&volunteerId=${volunteerId}`);
      const data = await res.json();
      if (data.success) {
        setReportData({
          totalHours: data.totalHours || 0,
          missions: data.missions || []
        });
      } else {
        alert(data.error || 'حدث خطأ في جلب التقرير');
      }
    } catch (err) {
      console.error(err);
      alert('فشل في الاتصال. تأكد من الإنترنت.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const currentVolunteerReport = allVolunteers.find(v => managerSearchQuery && v.id.toString() === managerSearchQuery) || null;

  // ─── Manager UI ────────────────────────────────────────────────────────────
  if (isManagerPortal) {
    return (
      <div className="min-h-screen py-6 px-4 sm:py-10 bg-erc-warm-gray/10" dir="rtl">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ERCLogo className="scale-75 origin-right" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-erc-dark">بوابة الإدارة والتقارير</h1>
                <p className="text-erc-dark-soft/60 text-xs sm:text-sm">متابعة ساعات المهام للمتطوعين</p>
              </div>
            </div>
            <button onClick={() => { setIsManagerPortal(false); setReportData(null); setManagerSearchQuery(''); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-erc-warm-gray/60 rounded-xl shadow-sm text-erc-dark-soft font-bold hover:bg-erc-red hover:border-erc-red text-erc-red hover:text-white transition-all cursor-pointer text-sm">
              <LogOut className="w-4 h-4" /> خروج
            </button>
          </header>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Search */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg p-5 sticky top-6 z-10 transition-all">
                <label className="flex items-center gap-2 text-sm font-bold text-erc-dark mb-3">
                  <Search className="w-4 h-4 text-erc-red" /> بحث والوصول لمتطوع
                </label>

                <div className="relative" ref={managerDropdownRef}>
                  <div className="flex gap-2 relative">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erc-dark-soft/30 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="الاسم أو رقم العضوية..."
                        value={managerSearchQuery}
                        onChange={e => {
                          setManagerSearchQuery(e.target.value);
                          setIsManagerDropdownOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setIsManagerDropdownOpen(true);
                          }
                        }}
                        className="w-full pr-10 pl-4 py-3 rounded-xl bg-erc-warm-gray/50 border border-erc-warm-gray text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-200"
                        autoComplete="off"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsManagerDropdownOpen(true)}
                      className="px-6 rounded-xl bg-erc-dark hover:bg-black text-white font-bold text-sm transition-all duration-200 shadow-md shadow-black/10 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-erc-dark/50"
                    >
                      بحث
                    </button>
                  </div>

                  {isManagerDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-erc-warm-gray shadow-2xl shadow-black/10 max-h-56 overflow-y-auto">
                      {filteredManagerVolunteers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-erc-dark-soft/40 text-sm">
                          {managerSearchQuery ? 'لا توجد نتائج' : 'اكتب للبحث'}
                        </div>
                      ) : (
                        filteredManagerVolunteers.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setManagerSearchQuery(v.id.toString());
                              setIsManagerDropdownOpen(false);
                              fetchReport(v.id);
                            }}
                            className="w-full text-right px-4 py-3 hover:bg-erc-red-50 border-b border-erc-warm-gray/50 last:border-b-0 cursor-pointer transition-colors focus:outline-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-erc-red/80 to-erc-red-dark/80 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {v.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-erc-dark truncate">{v.name}</p>
                                <div className="text-xs text-erc-dark-soft/50 font-medium flex justify-between items-center">
                                  <span>#{v.id}</span>
                                  {currentVolunteerReport?.id === v.id && <TrendingUp className="w-3 h-3 text-erc-red" />}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Report */}
            <div className="lg:col-span-2 space-y-6 relative z-0">
              {!reportData && !isLoadingReport && (
                <div className="bg-white/50 border-2 border-dashed border-erc-dark-soft/20 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Search className="w-8 h-8 text-erc-dark-soft/30" />
                  </div>
                  <p className="text-erc-dark-soft/70 font-bold text-lg">الرجاء اختيار متطوع لعرض تقريره</p>
                </div>
              )}

              {isLoadingReport && (
                <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-lg rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-10 h-10 text-erc-red animate-spin mx-auto mb-4" />
                  <p className="text-erc-dark-soft/70 font-bold">جاري جلب الساعات والمهام من جميع الشهور...</p>
                  <p className="text-xs mt-2 text-erc-dark-soft/40">قد يستغرق هذا بضع ثوانٍ</p>
                </div>
              )}

              {reportData && !isLoadingReport && (
                <div className="animate-fade-in-up">
                  {/* Summary Card */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg p-6 relative overflow-hidden mb-6">
                    <div className="absolute top-0 left-0 w-48 h-48 bg-erc-red/5 rounded-full blur-3xl -z-10" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-erc-warm-gray/50 pb-6">
                      <div>
                        <h2 className="text-xl font-bold text-erc-dark mb-1">ملخص الإنجاز</h2>
                        <p className="text-sm font-semibold text-erc-dark-soft/70">
                          {currentVolunteerReport?.name} <span className="mr-2 px-2 py-0.5 bg-erc-dark-soft/10 rounded-md text-xs">#{currentVolunteerReport?.id}</span>
                        </p>
                      </div>

                      <div className="text-center sm:text-left bg-erc-red-50 border border-erc-red/10 rounded-2xl p-4 min-w-[140px]">
                        <p className="text-xs text-erc-red-dark font-bold mb-1">إجمالي الساعات</p>
                        <p className="text-4xl font-black text-erc-red">
                          {toAr(reportData.totalHours.toFixed(1))} <span className="text-base font-bold">س</span>
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2 flex justify-between items-end">
                      <span className="font-bold text-sm text-erc-dark flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> مسار الـ 200 ساعة
                      </span>
                      <span className="text-xs font-bold text-erc-dark-soft/50">%{toAr(Math.min(100, (reportData.totalHours / 200) * 100).toFixed(0))}</span>
                    </div>

                    <div className="h-4 w-full bg-erc-warm-gray rounded-full overflow-hidden mb-4 shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${reportData.totalHours >= 200 ? 'bg-gradient-to-l from-emerald-400 to-green-600' : 'bg-gradient-to-l from-erc-red to-orange-400'}`}
                        style={{ width: `${Math.min(100, (reportData.totalHours / 200) * 100)}%` }}
                      />
                    </div>

                    {reportData.totalHours >= 200 ? (
                      <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl w-full sm:w-fit mt-5">
                        <Award className="w-6 h-6 flex-shrink-0 text-emerald-500" />
                        <span className="text-sm font-bold">إنجاز رائع! لقد أتم المتطوع 200 ساعة بنجاح!</span>
                      </div>
                    ) : (
                      <p className="text-sm text-erc-dark-soft/70 font-medium flex items-center gap-2 mt-5">
                        يحتاج المتطوع لإتمام <strong className="text-erc-red bg-erc-red-50 px-2 rounded tracking-wide">{toAr(Math.max(0, 200 - reportData.totalHours).toFixed(1))}</strong> ساعة إضافية للوصول للهدف.
                      </p>
                    )}
                  </div>

                  {/* Table */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg text-erc-dark flex items-center gap-2">
                        <TableProperties className="w-5 h-5 text-erc-red" />
                        سجل المهمات المفصل
                      </h3>
                      <span className="bg-erc-warm-gray px-3 py-1 rounded-full text-xs font-bold text-erc-dark-soft/60">
                        {toAr(reportData.missions.length)} مهمة
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead>
                          <tr className="border-b-2 border-erc-warm-gray/80">
                            <th className="pb-3 px-2 font-black text-erc-dark-soft/70 whitespace-nowrap">التاريخ</th>
                            <th className="pb-3 px-2 font-black text-erc-dark-soft/70">المهمة</th>
                            <th className="pb-3 px-2 font-black text-erc-dark-soft/70 whitespace-nowrap">الوقت</th>
                            <th className="pb-3 px-2 font-black text-erc-dark-soft/70 whitespace-nowrap">الساعات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.missions.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="py-12 text-center text-erc-dark-soft/50 font-medium">عذراً، لا توجد مهمات مسجلة لهذا المتطوع.</td>
                            </tr>
                          ) : (
                            reportData.missions.map((m, idx) => (
                              <tr key={idx} className="border-b border-erc-warm-gray/40 last:border-b-0 hover:bg-black/[0.015] transition-colors">
                                <td className="py-4 px-2 text-erc-dark/70 font-medium whitespace-nowrap align-middle">{toAr(m.date)}</td>
                                <td className="py-4 px-2 font-bold text-erc-dark leading-relaxed">{m.missionName}</td>
                                <td className="py-4 px-2 text-erc-dark-soft/60 font-medium whitespace-nowrap align-middle text-center">{toAr(m.timeRange) || '—'}</td>
                                <td className="py-4 px-2 text-erc-red font-black align-middle">{toAr(m.hours.toFixed(1))} س</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Download PDF Button */}
                  <button
                    onClick={downloadPDF}
                    className="w-full mt-4 py-3 bg-erc-dark hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    تحميل التقرير PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ERCLogo className="mb-6" />
          <Loader2 className="w-8 h-8 text-erc-red animate-spin mx-auto mb-4" />
          <p className="text-erc-dark-soft/70 font-medium">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // ─── Success State ─────────────────────────────────────────────────────────
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-in-up">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-erc-dark mb-3">تم التسجيل بنجاح!</h2>
          <p className="text-erc-dark-soft/70 text-lg mb-2">تم إضافة الساعات في الجدول</p>
          <p className="text-erc-dark-soft/50 text-sm">سيتم إعادة التوجيه تلقائياً...</p>
        </div>
      </div>
    );
  }

  // ─── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-6 px-4 sm:py-10 overflow-x-hidden">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <header className="text-center mb-8 animate-fade-in-up">
          <ERCLogo className="mb-5" />
          <h1 className="text-2xl sm:text-3xl font-bold text-erc-dark mb-2">
            تسجيل المهمات
          </h1>
          <p className="text-erc-dark-soft/60 text-sm sm:text-base">
            الهلال الأحمر المصري — نموذج تسجيل ساعات المهمات
          </p>
        </header>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Mission Name */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg shadow-black/[0.04] p-5 animate-fade-in-up-delay-1">
            <label className="flex items-center gap-2 text-sm font-bold text-erc-dark mb-3">
              <FileText className="w-4 h-4 text-erc-red" />
              اسم المهمة
            </label>
            <input
              type="text"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              placeholder="مثال: التغطية الطبية في استاد القاهرة"
              className="w-full px-4 py-3 rounded-xl bg-erc-warm-gray/50 border border-erc-warm-gray text-erc-dark font-medium text-base placeholder:text-erc-dark-soft/30 focus:outline-none focus:ring-2 focus:ring-erc-red/30 focus:border-erc-red/50 transition-all duration-200"
              required
            />
          </div>

          {/* Mission Date */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg shadow-black/[0.04] p-5 animate-fade-in-up-delay-1 overflow-hidden">
            <label className="flex items-center gap-2 text-sm font-bold text-erc-dark mb-3">
              <CalendarDays className="w-4 h-4 text-erc-red" />
              تاريخ المهمة
            </label>
            <input
              type="date"
              value={missionDate}
              onChange={(e) => setMissionDate(e.target.value)}
              className="w-full min-w-0 px-4 py-3 rounded-xl bg-erc-warm-gray/50 border border-erc-warm-gray text-erc-dark font-medium text-base focus:outline-none focus:ring-2 focus:ring-erc-red/30 focus:border-erc-red/50 transition-all duration-200"
              required
            />
            {missionDate && (
              <p className="mt-2 text-sm text-erc-dark-soft/50 font-medium">
                {formatArabicDate(missionDate)}
              </p>
            )}
          </div>

          {/* Mission Time Range */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg shadow-black/[0.04] p-5 animate-fade-in-up-delay-2 overflow-hidden">
            <label className="flex items-center gap-2 text-sm font-bold text-erc-dark mb-3">
              <Clock className="w-4 h-4 text-erc-red" />
              وقت المهمة
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-full sm:flex-1 min-w-0">
                <label className="text-xs text-erc-dark-soft/50 font-medium mb-1 block">من الساعة</label>
                <input
                  type="time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  className="w-full min-w-0 px-4 py-3 rounded-xl bg-erc-warm-gray/50 border border-erc-warm-gray text-erc-dark font-medium text-base focus:outline-none focus:ring-2 focus:ring-erc-red/30 focus:border-erc-red/50 transition-all duration-200"
                  required
                />
              </div>
              <ArrowLeft className="hidden sm:block w-5 h-5 text-erc-dark-soft/30 mt-5 flex-shrink-0" />
              <div className="w-full sm:flex-1 min-w-0">
                <label className="text-xs text-erc-dark-soft/50 font-medium mb-1 block">إلى الساعة</label>
                <input
                  type="time"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  className="w-full min-w-0 px-4 py-3 rounded-xl bg-erc-warm-gray/50 border border-erc-warm-gray text-erc-dark font-medium text-base focus:outline-none focus:ring-2 focus:ring-erc-red/30 focus:border-erc-red/50 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Calculated hours display */}
            {timeFrom && timeTo && calculatedHours > 0 && (
              <div className="mt-3 flex items-center justify-between bg-erc-red-50 border border-erc-red/10 rounded-xl px-4 py-2.5">
                <span className="text-sm font-bold text-erc-dark flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-erc-red" />
                  المدة المحسوبة
                </span>
                <span className="text-lg font-black text-erc-red">{toAr(calculatedHours.toFixed(1))} <span className="text-xs font-bold">ساعة</span></span>
              </div>
            )}

            {/* Past midnight notice */}
            {isCrossingMidnight && (
              <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <Moon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs font-medium text-amber-800">
                  ⚠️ هذه المهمة تتجاوز منتصف الليل — تأكد أن الأوقات صحيحة
                </p>
              </div>
            )}
          </div>

          {/* Volunteer Selector */}
          <div className="relative z-10 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg shadow-black/[0.04] p-5 animate-fade-in-up-delay-3">
            <label className="flex items-center gap-2 text-sm font-bold text-erc-dark mb-3">
              <Users className="w-4 h-4 text-erc-red" />
              المتطوعون المشاركون
              {selectedVolunteers.length > 0 && (
                <span className="mr-auto bg-erc-red text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {selectedVolunteers.length}
                </span>
              )}
            </label>

            {/* Search Input */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erc-dark-soft/30 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setIsDropdownOpen(true);
                      }
                    }}
                    placeholder="ابحث بالاسم أو رقم العضوية..."
                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-erc-warm-gray/50 border border-erc-warm-gray text-erc-dark font-medium text-sm placeholder:text-erc-dark-soft/30 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-all duration-200"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(true)}
                  className="px-6 rounded-xl bg-erc-dark hover:bg-black text-white font-bold text-sm transition-all duration-200 shadow-md shadow-black/10 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-erc-dark/50"
                >
                  بحث
                </button>
              </div>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-erc-warm-gray shadow-2xl shadow-black/10 max-h-56 overflow-y-auto">
                  {filteredVolunteers.length === 0 ? (
                    <div className="px-4 py-6 text-center text-erc-dark-soft/40 text-sm">
                      {searchQuery ? 'لا توجد نتائج' : 'تم اختيار جميع المتطوعين'}
                    </div>
                  ) : (
                    filteredVolunteers.map((volunteer) => (
                      <button
                        key={volunteer.id}
                        type="button"
                        onClick={() => addVolunteer(volunteer)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-erc-red-50 transition-colors duration-150 cursor-pointer border-b border-erc-warm-gray/50 last:border-b-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-erc-red/80 to-erc-red-dark/80 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {volunteer.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <p className="text-sm font-semibold text-erc-dark truncate">{volunteer.name}</p>
                          <p className="text-xs text-erc-dark-soft/50">عضوية #{volunteer.id}</p>
                        </div>
                        <UserPlus className="w-4 h-4 text-erc-red/40 flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Volunteers */}
            {selectedVolunteers.length > 0 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selectedVolunteers.map((volunteer) => (
                  <VolunteerTag
                    key={volunteer.id}
                    volunteer={volunteer}
                    onRemove={removeVolunteer}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Summary Bar */}
          {selectedVolunteers.length > 0 && timeFrom && timeTo && calculatedHours > 0 && (
            <div className="bg-erc-dark rounded-2xl p-4 text-white animate-fade-in-up">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-erc-red-light" />
                  <span className="text-white/70">المتطوعون:</span>
                  <span className="font-bold">{selectedVolunteers.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-erc-red-light" />
                  <span className="text-white/70">الوقت:</span>
                  <span className="font-bold">{to12h(timeFrom)} — {to12h(timeTo)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/70">المدة:</span>
                  <span className="font-bold">{toAr(calculatedHours.toFixed(1))} ساعة</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || selectedVolunteers.length === 0 || !timeFrom || !timeTo || calculatedHours <= 0}
            className="relative w-full py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 cursor-pointer
              bg-gradient-to-l from-erc-red to-erc-red-dark
              hover:shadow-xl hover:shadow-erc-red/30 hover:scale-[1.01]
              active:scale-[0.99]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
              focus:outline-none focus:ring-4 focus:ring-erc-red/30"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري التسجيل...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Send className="w-5 h-5" />
                تسجيل المهمة
              </span>
            )}
            {!isSubmitting && selectedVolunteers.length > 0 && timeFrom && timeTo && calculatedHours > 0 && (
              <div className="absolute inset-0 rounded-2xl animate-shimmer pointer-events-none" />
            )}
          </button>
        </form>

        {/* Copy Mission Details */}
        {selectedVolunteers.length > 0 && (
          <div className="mt-6 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg shadow-black/[0.04] p-5 animate-fade-in-up text-right">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-erc-dark flex items-center gap-2">
                <FileText className="w-4 h-4 text-erc-red" />
                تفاصيل المهمة للنسخ
              </h3>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-erc-red-50 hover:bg-erc-red-100 text-erc-red-dark transition-colors active:scale-95"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'تم النسخ!' : 'نسخ النص'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-erc-dark-soft font-mono bg-erc-warm-gray/30 p-4 rounded-xl border border-erc-warm-gray/50 leading-loose text-right" dir="rtl">
              {generateMissionText()}
            </pre>
          </div>
        )}

        {/* Footer */}
        <footer className="flex items-center justify-between mt-8 mb-4 px-2">
          <p className="text-xs text-erc-dark-soft/30 font-medium">
            الهلال الأحمر المصري © {new Date().getFullYear()}
          </p>
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            className="p-2 text-erc-dark-soft/20 hover:text-erc-red transition-colors rounded-full hover:bg-erc-red/5 cursor-pointer"
            aria-label="بوابة الإدارة"
          >
            <Lock className="w-4 h-4" />
          </button>
        </footer>
      </div>

      {/* PIN Modal overlay */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-erc-dark flex items-center gap-2">
                <Lock className="w-5 h-5 text-erc-red" />
                بوابة الإدارة
              </h3>
              <button
                onClick={() => { setShowPinModal(false); setPinInput(''); }}
                className="p-1.5 hover:bg-erc-warm-gray rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-erc-dark-soft/60" />
              </button>
            </div>
            <form onSubmit={handlePinSubmit}>
              <p className="text-xs text-erc-dark-soft/60 mb-2 font-medium">أدخل الرمز السري للوصول للتقارير</p>
              <input
                type="password"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-4 rounded-xl bg-erc-warm-gray/30 border border-erc-warm-gray/80 mb-4 text-center tracking-[1em] font-black text-xl text-erc-dark focus:outline-none focus:ring-2 focus:ring-erc-red/40"
                autoFocus
              />
              <button type="submit" className="w-full py-4 bg-gradient-to-l from-erc-red to-erc-red-dark text-white font-bold rounded-xl hover:shadow-lg hover:shadow-erc-red/30 active:scale-[0.98] transition-all cursor-pointer">
                دخول
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
