import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, UserPlus, CheckCircle2, ShieldCheck, AudioWaveform, Clock3, Sun, Moon } from "lucide-react";
import { useLocation } from "wouter";
import { pt } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register" | "pending">("login");
  const [language, setLanguage] = useState<"en" | "pt">(() => {
    const saved = localStorage.getItem("vhub_language");
    return saved === "pt" ? "pt" : "en";
  });
  const [showSignInPanel, setShowSignInPanel] = useState(true);
  const [isAlignHover, setIsAlignHover] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, user, register, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const resolvedTheme = useMemo(() => {
    if (theme === "system") {
      if (typeof window === "undefined") return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme;
  }, [theme]);

  const hubDubRef = useRef<HTMLElement | null>(null);
  const hubSchoolRef = useRef<HTMLElement | null>(null);
  const hubAlignRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress: hubDubProgress } = useScroll({
    target: hubDubRef,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress: hubSchoolProgress } = useScroll({
    target: hubSchoolRef,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress: hubAlignProgress } = useScroll({
    target: hubAlignRef,
    offset: ["start start", "end start"],
  });

  // Transição contínua: quanto mais rola para a próxima, mais a atual desfoca e reduz.
  const hubDubScale = useTransform(hubDubProgress, [0, 0.2, 1], [1, 1, 0.92]);
  const hubDubBlur = useTransform(hubDubProgress, [0, 0.2, 1], [0, 0, 18]);
  const hubDubOpacity = useTransform(hubDubProgress, [0, 0.2, 1], [1, 1, 0]);
  const hubDubFilter = useMotionTemplate`blur(${hubDubBlur}px)`;

  const hubSchoolScale = useTransform(hubSchoolProgress, [0, 0.2, 1], [1, 1, 0.92]);
  const hubSchoolBlur = useTransform(hubSchoolProgress, [0, 0.2, 1], [0, 0, 18]);
  const hubSchoolOpacity = useTransform(hubSchoolProgress, [0, 0.2, 1], [1, 1, 0]);
  const hubSchoolFilter = useMotionTemplate`blur(${hubSchoolBlur}px)`;

  // Final section remains stable; only animate its internal grid.
  const hubAlignOpacity = 1;
  const hubAlignScale = 1;
  const hubAlignFilter = "none";

  const hubAlignGridY = useTransform(hubAlignProgress, [0, 1], [10, -10]);
  const hubAlignGridRotate = useTransform(hubAlignProgress, [0, 1], [-0.5, 0.5]);

  const content = useMemo(() => ({
    en: {
      nav: ["HubDub", "HubSchool", "HubAlign"],
      signIn: "Sign In",
      heroTitle: "Professional ADR, Reinvented.",
      heroDescription: "Elite environment for performance, direction and final delivery in one elegant connected flow.",
      heroPrimary: "Explore Platform",
      heroSecondary: "See Workflow",
      secureAccess: "Secure access for production and recording workspace.",
      profiles: "Profiles",
      sessions: "Sessions",
      liveScheduled: "Live and scheduled",
      dubbingDirection: "Dubbing • Direction",
      waitingApproval: "Waiting for approval",
      approvalHint: "You will be notified by email.",
      pendingTitle: "Account under review",
      pendingDescription: "Your account has been created and is waiting for approval.",
      backToLogin: "Back to sign in",
      rights: "All rights reserved.",
      timeline: "Take Timeline",
      quality: "Assisted Quality",
      schedule: "Precise Scheduling",
      delivery: "Organized Delivery",
      section2Title: "Master Your Voice",
      section2Desc: "Dubbing, Voiceover, Singing and Vocal Treatment.",
      section3Title: "Intelligent Sync",
      section3Desc: "Generate export-ready tracks with precise alignment.",
    },
    pt: {
      nav: ["HubDub", "HubSchool", "HubAlign"],
      signIn: "Sign In",
      heroTitle: "ADR Profissional, Reinventado.",
      heroDescription: "Ambiente de elite para performance, direção e entrega final em um fluxo elegante e conectado.",
      heroPrimary: "Explore Platform",
      heroSecondary: "See Workflow",
      secureAccess: "Acesso seguro ao ambiente de produção e gravação.",
      profiles: "Perfis",
      sessions: "Sessões",
      liveScheduled: "Ao vivo e agendadas",
      dubbingDirection: "Dublador • Direção",
      waitingApproval: "Aguardando aprovação",
      approvalHint: "Você será notificado por email.",
      pendingTitle: "Conta em análise",
      pendingDescription: "Sua conta foi criada e está aguardando aprovação.",
      backToLogin: "Voltar para o login",
      rights: "Todos os direitos reservados.",
      timeline: "Timeline de Takes",
      quality: "Qualidade Assistida",
      schedule: "Agendamento Preciso",
      delivery: "Entrega Organizada",
      section2Title: "Domine sua Voz",
      section2Desc: "Dublagem, Locução, Canto e Tratamento.",
      section3Title: "Sincronia Inteligente",
      section3Desc: "Geração de tracks prontas para exportação.",
    },
  }[language]), [language]);

  const authText = useMemo(() => language === "pt" ? pt.auth : {
    login: "Sign In",
    loginTitle: "Sign In",
    loginSubtitle: "Access your V.HUB workspace",
    loginButton: "Sign In",
    createAccount: "Create Account",
    newHere: "New here",
    email: "Email",
    emailPlaceholder: "Email",
    password: "Password",
    passwordPlaceholder: "Password",
    welcomeBack: "Welcome back",
    signInSubtitle: "Access your V.HUB workspace",
    signingIn: "Signing in...",
    loginFailed: "Login failed",
    successLogin: "Login successful.",
    pendingTitle: "Account under review",
    pendingDescription: "Your account has been created and is waiting for approval.",
    pendingMessage: "Your account has been created and is waiting for admin approval.",
    accountCreated: "Account created",
    registerTitle: "Create Account",
    registerSubtitle: "Fill in your professional details to create your account",
    fullName: "Full name",
    artistName: "Artist name (optional)",
    phone: "Mobile phone",
    altPhone: "Alternative phone (optional)",
    birthDate: "Birth date",
    city: "City",
    state: "State",
    country: "Country",
    mainLanguage: "Main language",
    additionalLanguages: "Additional languages (optional)",
    experience: "Professional experience",
    specialty: "Specialty",
    bio: "Short bio",
    portfolioUrl: "Portfolio link (optional)",
    selectStudio: "Select studio",
    registering: "Registering...",
    signOut: "Sign out",
    switchStudio: "Switch Studio",
  }, [language]);

  const registerText = useMemo(() => language === "pt" ? pt.register : {
    submit: "Create Account",
    backToLogin: "Back to Sign In",
  }, [language]);

  const [form, setForm] = useState({
    fullName: "", artistName: "", email: "", password: "",
    phone: "", altPhone: "", birthDate: "", city: "", state: "", country: "",
    mainLanguage: "", additionalLanguages: "", experience: "", specialty: "",
    bio: "", portfolioUrl: "", studioId: "",
  });

  const [publicStudios, setPublicStudios] = useState<{ id: string; name: string }[]>([]);
  const [studiosLoading, setStudiosLoading] = useState(false);

  useEffect(() => {
    if (mode === "register" && publicStudios.length === 0) {
      setStudiosLoading(true);
      fetch("/api/auth/studios-public")
        .then(res => res.json())
        .then(data => setPublicStudios(Array.isArray(data) ? data : []))
        .catch(() => setPublicStudios([]))
        .finally(() => setStudiosLoading(false));
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("vhub_language", language);
    document.documentElement.lang = language;
  }, [language]);

  // We remove the automatic redirect to /studios if already logged in,
  // to respect the user's wish that the initial page is always the Login page.
  useEffect(() => {
    // No auto-redirect here to allow the login page to be the entry point.
  }, [user, setLocation]);

  // We no longer return null if user exists, allowing the login page to be visible.
  // The UI can handle showing a "Continue" button if needed.

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    login({ email, password }, {
      onError: (err: any) => {
        if (err.message === "pending") {
          setMode("pending");
        } else {
          toast({ title: language === "en" ? "Sign in error" : "Erro ao entrar", description: err.message, variant: "destructive" });
        }
      },
      onSuccess: async () => {
        try {
          const res = await fetch("/api/studios");
          if (!res.ok) throw new Error(language === "en" ? "Failed to load studios" : "Falha ao buscar estúdios");
          const studios = await res.json();
          if (Array.isArray(studios) && studios.length === 1) {
            setLocation(`/studio/${studios[0].id}/dashboard`);
          } else {
            setLocation("/studios");
          }
        } catch {
          setLocation("/studios");
        }
      }
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.phone ||
        !form.city || !form.state || !form.country ||
        !form.mainLanguage || !form.experience || !form.specialty || !form.bio || !form.studioId) {
      toast({ title: language === "en" ? "Error" : "Erro", description: language === "en" ? "Fill all required fields." : "Preencha todos os campos obrigatorios.", variant: "destructive" });
      return;
    }
    register(form, {
      onSuccess: () => {
        setMode("pending");
      },
      onError: (err: any) => {
        toast({ title: language === "en" ? "Failed to create account" : "Erro ao criar conta", description: err.message, variant: "destructive" });
      }
    });
  };

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Cinematic Background Component
  const CinematicBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 aurora-layer bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-300/28 via-transparent to-transparent dark:from-blue-500/20" />
      <div className="absolute inset-0 aurora-layer bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-slate-200/35 via-transparent to-transparent dark:from-indigo-400/14" />
      <div className="absolute inset-0 bg-[linear-gradient(130deg,transparent_0%,rgba(17,17,17,0.03)_42%,transparent_78%)] dark:bg-[linear-gradient(130deg,transparent_0%,rgba(37,99,235,0.12)_42%,transparent_78%)]" />
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,_currentColor_1px,_transparent_0)] text-black dark:text-white bg-[length:24px_24px]" />
      <div className="absolute top-[14%] right-[9%] h-52 w-52 rounded-full bg-slate-300/30 dark:bg-blue-500/20 blur-3xl float-soft" />
      <div className="absolute bottom-[8%] left-[14%] h-56 w-56 rounded-full bg-slate-300/30 dark:bg-indigo-500/20 blur-3xl float-soft" />
    </div>
  );

  if (mode === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070d] p-4 relative overflow-hidden">
        <CinematicBackground />
        <div className="w-full max-w-md bg-slate-950/60 backdrop-blur-2xl border border-white/15 rounded-2xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/50 blur-xl opacity-50 rounded-full animate-pulse"></div>
              <img src="/logo.svg" alt="V.HUB" className="h-16 w-16 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {authText.pendingTitle}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {authText.pendingDescription}
              </p>
            </div>

            <div className="w-full p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 text-left">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{content.waitingApproval}</p>
                <p className="text-xs text-primary/80">{content.approvalHint}</p>
              </div>
            </div>

            <button 
              onClick={() => setMode("login")}
              className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> {content.backToLogin}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "register") {
    return (
      <div className="min-h-screen bg-[#05070d] p-4 relative overflow-hidden flex flex-col items-center">
        <CinematicBackground />
        
        <div className="w-full max-w-4xl relative z-10 my-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8">
            <img src="/logo.svg" alt="V.HUB" className="h-12 w-12 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h1 className="text-3xl font-bold text-white mb-2">{authText.registerTitle}</h1>
            <p className="text-slate-300/85">{authText.registerSubtitle}</p>
          </div>

          <form onSubmit={handleRegister} className="bg-slate-950/60 backdrop-blur-2xl border border-white/15 rounded-2xl p-8 shadow-2xl space-y-8">
            {/* Form Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/10 pb-2">{language === "en" ? "Personal Details" : "Dados Pessoais"}</h3>
                <div className="space-y-4">
                  <Input placeholder={authText.fullName} value={form.fullName} onChange={e => updateForm("fullName", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  <Input placeholder={authText.artistName} value={form.artistName} onChange={e => updateForm("artistName", e.target.value)} className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  <Input type="email" placeholder={authText.emailPlaceholder} value={form.email} onChange={e => updateForm("email", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  <Input type="password" placeholder={authText.passwordPlaceholder} value={form.password} onChange={e => updateForm("password", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder={authText.phone} value={form.phone} onChange={e => updateForm("phone", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                    <Input placeholder={authText.altPhone} value={form.altPhone} onChange={e => updateForm("altPhone", e.target.value)} className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  </div>
                  <Input type="date" placeholder={authText.birthDate} value={form.birthDate} onChange={e => updateForm("birthDate", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/10 pb-2">{language === "en" ? "Location and Profile" : "Localização e Perfil"}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                     <Input placeholder={authText.city} value={form.city} onChange={e => updateForm("city", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                     <Input placeholder={authText.state} value={form.state} onChange={e => updateForm("state", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                     <Input placeholder={authText.country} value={form.country} onChange={e => updateForm("country", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  </div>
                  <Input placeholder={authText.mainLanguage} value={form.mainLanguage} onChange={e => updateForm("mainLanguage", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  <Input placeholder={authText.additionalLanguages} value={form.additionalLanguages} onChange={e => updateForm("additionalLanguages", e.target.value)} className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  <Input placeholder={authText.experience} value={form.experience} onChange={e => updateForm("experience", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  <Input placeholder={authText.specialty} value={form.specialty} onChange={e => updateForm("specialty", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  <Textarea placeholder={authText.bio} value={form.bio} onChange={e => updateForm("bio", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 min-h-[80px] text-white placeholder:text-slate-400/70" />
                  <Input placeholder={authText.portfolioUrl} value={form.portfolioUrl} onChange={e => updateForm("portfolioUrl", e.target.value)} className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-400/70" />
                  
                  {studiosLoading ? (
                    <div className="flex justify-center p-2"><Loader2 className="animate-spin text-primary" /></div>
                  ) : (
                    <Select value={form.studioId} onValueChange={v => updateForm("studioId", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 focus:border-primary/50">
                        <SelectValue placeholder={authText.selectStudio} />
                      </SelectTrigger>
                      <SelectContent>
                        {publicStudios.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 text-muted-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {registerText.backToLogin}
              </button>
              <button
                type="submit"
                disabled={isRegistering}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {registerText.submit} <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const scrollToSection = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <CinematicBackground />

      <header className="fixed top-4 left-0 right-0 z-30 px-4 md:px-8">
        <div className="group max-w-6xl mx-auto rounded-full border border-border/60 bg-[var(--glass-bg)] backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_55px_rgba(0,0,0,0.45)] px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-[140px]">
            <img src="/logo.svg" alt="VOICE.HUB" className="h-7 w-7" />
            <span className="text-sm md:text-base font-light tracking-[0.18em]">VOICE.HUB</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-light tracking-wide">
            {content.nav.map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-foreground/70 hover:text-foreground transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 min-w-[190px] justify-end">
            <div className="flex items-center gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="h-9 w-9 rounded-full border border-border/80 bg-card/70 backdrop-blur flex items-center justify-center text-foreground/75 hover:text-foreground transition-all"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </motion.button>

              <div className="flex items-center rounded-full border border-border/80 bg-card/70 p-1">
                <motion.button whileTap={{ scale: 0.92 }} onClick={() => setLanguage("en")} className={cn("px-2 h-7 rounded-full text-[10px] font-semibold transition-all", language === "en" ? "bg-primary text-primary-foreground shadow" : "text-foreground/60 hover:text-foreground")}>EN</motion.button>
                <motion.button whileTap={{ scale: 0.92 }} onClick={() => setLanguage("pt")} className={cn("px-2 h-7 rounded-full text-[10px] font-semibold transition-all", language === "pt" ? "bg-primary text-primary-foreground shadow" : "text-foreground/60 hover:text-foreground")}>PT</motion.button>
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowSignInPanel(true)} className="h-9 px-4 rounded-full border border-border/70 bg-transparent text-sm font-medium hover:bg-card/60 transition-all">
              {content.signIn}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section id="HubDub" ref={hubDubRef} className="relative h-[150dvh]">
          <motion.div
            className="sticky top-0 z-30 h-[100dvh] flex items-center px-6 md:px-10 pt-24 will-change-[transform,filter]"
            style={{ opacity: hubDubOpacity, scale: hubDubScale, filter: hubDubFilter as any }}
          >
            <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[1.06fr_0.94fr] gap-12 items-center">
              <div className="space-y-7">
                <h1 className="text-5xl md:text-6xl font-semibold leading-[1.02] tracking-tight">{content.heroTitle}</h1>
                <p className="text-lg text-foreground/75 max-w-2xl">{content.heroDescription}</p>
                <button 
                  onClick={() => setShowSignInPanel(true)}
                  className="h-11 px-6 rounded-xl border border-primary/70 bg-transparent text-foreground font-semibold shadow-[0_0_0_rgba(59,130,246,0)] hover:shadow-[0_0_22px_rgba(59,130,246,0.30)] hover:border-primary transition-all"
                >
                  {content.heroPrimary}
                </button>
              </div>

              <div className="relative h-[320px] md:h-[390px] rounded-[1.8rem] border border-border/70 bg-card/55 backdrop-blur-xl overflow-hidden">
                <img
                  src="/landing/hubdub-mic.svg"
                  alt="Professional condenser microphone in recording booth"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(59,130,246,0.18),transparent_45%)] opacity-60" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),transparent_55%,rgba(0,0,0,0.22))] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.35),transparent_55%,rgba(0,0,0,0.55))]" />
              </div>
            </div>
          </motion.div>
        </section>

        <section id="HubSchool" ref={hubSchoolRef} className="relative h-[150dvh] -mt-[100dvh]">
          <motion.div
            className="sticky top-0 z-20 h-[100dvh] flex items-center px-6 md:px-10 pt-24 will-change-[transform,filter]"
            style={{ opacity: hubSchoolOpacity, scale: hubSchoolScale, filter: hubSchoolFilter as any }}
          >
            <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[0.94fr_1.06fr] gap-12 items-center">
              <div className="relative h-[320px] md:h-[390px] rounded-[1.8rem] border border-border/70 bg-card/60 backdrop-blur-xl overflow-hidden">
                <img
                  src="/landing/hubschool-student.svg"
                  alt="Student wearing studio headphones"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.14),transparent_58%)]" />
              </div>
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-semibold leading-[1.04] tracking-tight">{content.section2Title}</h1>
                <p className="text-lg text-foreground/75 max-w-xl">{content.section2Desc}</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="HubAlign" ref={hubAlignRef} className="relative h-[150dvh] -mt-[100dvh]">
          <motion.div
            className="sticky top-0 z-10 h-[100dvh] flex items-center px-6 md:px-10 pb-12 pt-24 will-change-[transform,filter]"
            style={{ opacity: hubAlignOpacity, scale: hubAlignScale, filter: hubAlignFilter as any }}
          >
            <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[1.06fr_0.94fr] gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-semibold leading-[1.04] tracking-tight">{content.section3Title}</h1>
                <p className="text-lg text-foreground/75 max-w-xl">{content.section3Desc}</p>
              </div>

              <div className="relative h-[320px] md:h-[390px] rounded-[1.8rem] border border-border/70 bg-card/60 backdrop-blur-xl overflow-hidden p-8">
                <motion.div
                  style={{ y: hubAlignGridY, rotate: hubAlignGridRotate }}
                  className="absolute inset-0 opacity-80 bg-[linear-gradient(0deg,rgba(59,130,246,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.10)_1px,transparent_1px)] dark:bg-[linear-gradient(0deg,rgba(59,130,246,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.18)_1px,transparent_1px)] bg-[size:28px_28px]"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.16),transparent_52%)]" />
                <div className="relative h-full flex items-center">
                  <div className="w-full h-3 rounded-full bg-foreground/15">
                    <motion.div
                      onHoverStart={() => setIsAlignHover(true)}
                      onHoverEnd={() => setIsAlignHover(false)}
                      animate={isAlignHover ? { x: 150, y: 0, scale: 1 } : { x: 0, y: -44, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 280, damping: 22 }}
                      className="w-28 h-11 rounded-lg bg-primary/85 border border-primary/60 shadow-[0_8px_24px_rgba(59,130,246,0.35)] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <div className="relative z-10 px-6 md:px-10 pb-8 text-xs text-foreground/55">
        © {new Date().getFullYear()} VOICE.HUB. {content.rights}
      </div>

      <AnimatePresence>
        {showSignInPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/45 dark:bg-black/65 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setShowSignInPanel(false)}>
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} transition={{ duration: 0.28 }} className="w-full max-w-md bg-card/92 dark:bg-card/75 backdrop-blur-2xl border border-border/80 rounded-2xl p-8 shadow-[0_24px_55px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_55px_rgba(0,0,0,0.45)] pulse-glow" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col space-y-2 text-center mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">{authText.loginTitle}</h2>
                <p className="text-sm text-foreground/75">{authText.loginSubtitle}</p>
                <p className="text-xs text-foreground/60">{content.secureAccess}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-4">
                  <Input type="email" placeholder={authText.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/75 border-border/80 focus:border-primary/60 focus:ring-primary/25 h-11 transition-all text-foreground placeholder:text-foreground/45" />
                  <Input type="password" placeholder={authText.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/75 border-border/80 focus:border-primary/60 focus:ring-primary/25 h-11 transition-all text-foreground placeholder:text-foreground/45" />
                </div>

                <button type="submit" disabled={isLoggingIn} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all shadow-[0_12px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_16px_36px_rgba(37,99,235,0.55)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
                  {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {authText.loginButton} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="grid grid-cols-2 gap-2 mt-5 mb-6">
                <div className="rounded-lg border border-border/80 bg-background/60 p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-foreground/55">{content.profiles}</p>
                  <p className="text-xs text-foreground/85">{content.dubbingDirection}</p>
                </div>
                <div className="rounded-lg border border-border/80 bg-background/60 p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-foreground/55">{content.sessions}</p>
                  <p className="text-xs text-foreground/85">{content.liveScheduled}</p>
                </div>
              </div>

              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/90 px-2 text-foreground/60 backdrop-blur-xl">{authText.newHere}</span>
                </div>
              </div>

              <button onClick={() => { setShowSignInPanel(false); setMode("register"); }} className="w-full h-11 border border-border/80 hover:bg-card/80 text-foreground/85 font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                {authText.createAccount}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
