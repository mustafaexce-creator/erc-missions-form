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
} from 'lucide-react';

// ─── Configuration ───────────────────────────────────────────────────────────
// Replace this URL with your deployed Google Apps Script web app URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfZ_rufx-ViD4calgJ5qcT1Aw53pUC9EHzIN_KoaVQ6oB8_LrpM1M99DdvfXUm_fY5/exec';

// ─── ERC Logo Component ─────────────────────────────────────────────────────
function ERCLogo({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-erc-red to-erc-red-dark flex items-center justify-center shadow-lg shadow-erc-red/30">
          <svg viewBox="0 0 100 100" className="w-9 h-9 text-white pl-1">
            <defs>
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
  const [missionHours, setMissionHours] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    setErrorMessage('');

    // Validation
    if (!missionDate) {
      setErrorMessage('يرجى تحديد تاريخ المهمة');
      return;
    }
    if (!missionHours || parseFloat(missionHours) <= 0) {
      setErrorMessage('يرجى إدخال عدد ساعات صحيح');
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
        setMissionHours('');
      }, 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        action: 'logMission',
        date: missionDate,
        hours: parseFloat(missionHours),
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
          setMissionHours('');
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
    <div className="min-h-screen py-6 px-4 sm:py-10">
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
              اسم المهمة (اختياري للتوثيق والنسخ)
            </label>
            <input
              type="text"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              placeholder="مثال: التغطية الطبية في استاد القاهرة"
              className="w-full px-4 py-3 rounded-xl bg-erc-warm-gray/50 border border-erc-warm-gray text-erc-dark font-medium text-base placeholder:text-erc-dark-soft/30 focus:outline-none focus:ring-2 focus:ring-erc-red/30 focus:border-erc-red/50 transition-all duration-200"
            />
          </div>

          {/* Mission Date */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg shadow-black/[0.04] p-5 animate-fade-in-up-delay-1">
            <label className="flex items-center gap-2 text-sm font-bold text-erc-dark mb-3">
              <CalendarDays className="w-4 h-4 text-erc-red" />
              تاريخ المهمة
            </label>
            <input
              type="date"
              value={missionDate}
              onChange={(e) => setMissionDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-erc-warm-gray/50 border border-erc-warm-gray text-erc-dark font-medium text-base focus:outline-none focus:ring-2 focus:ring-erc-red/30 focus:border-erc-red/50 transition-all duration-200"
              required
            />
            {missionDate && (
              <p className="mt-2 text-sm text-erc-dark-soft/50 font-medium">
                {formatArabicDate(missionDate)}
              </p>
            )}
          </div>

          {/* Mission Hours */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg shadow-black/[0.04] p-5 animate-fade-in-up-delay-2">
            <label className="flex items-center gap-2 text-sm font-bold text-erc-dark mb-3">
              <Clock className="w-4 h-4 text-erc-red" />
              عدد ساعات المهمة
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={missionHours}
                onChange={(e) => setMissionHours(e.target.value)}
                placeholder="مثال: 4"
                className="w-full px-4 py-3 rounded-xl bg-erc-warm-gray/50 border border-erc-warm-gray text-erc-dark font-medium text-base placeholder:text-erc-dark-soft/30 focus:outline-none focus:ring-2 focus:ring-erc-red/30 focus:border-erc-red/50 transition-all duration-200"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-erc-dark-soft/40 font-medium pointer-events-none">
                ساعة
              </span>
            </div>
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
          {selectedVolunteers.length > 0 && missionHours && (
            <div className="bg-erc-dark rounded-2xl p-4 text-white animate-fade-in-up">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-erc-red-light" />
                  <span className="text-white/70">المتطوعون:</span>
                  <span className="font-bold">{selectedVolunteers.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-erc-red-light" />
                  <span className="text-white/70">ساعات المهمة:</span>
                  <span className="font-bold">{missionHours} ساعة</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || selectedVolunteers.length === 0 || !missionHours}
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
            {!isSubmitting && selectedVolunteers.length > 0 && missionHours && (
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
        <footer className="text-center mt-8 mb-4">
          <p className="text-xs text-erc-dark-soft/30 font-medium">
            الهلال الأحمر المصري © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}
