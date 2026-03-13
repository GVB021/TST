import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, UserPlus, CheckCircle2, ShieldCheck, AudioWaveform, Clock3 } from "lucide-react";
import { useLocation } from "wouter";
import { pt } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register" | "pending">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, user, register, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
    if (user) {
      setLocation("/studios");
    }
  }, [user, setLocation]);

  if (user) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    login({ email, password }, {
      onError: (err: any) => {
        if (err.message === "pending") {
          setMode("pending");
        } else {
          toast({ title: "Erro ao entrar", description: err.message, variant: "destructive" });
        }
      },
      onSuccess: async () => {
        try {
          const res = await fetch("/api/studios");
          if (!res.ok) throw new Error("Falha ao buscar estúdios");
          const studios = await res.json();
          if (Array.isArray(studios) && studios.length === 1) {
            setLocation(`/studio/${studios[0].id}`);
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
      toast({ title: "Erro", description: "Preencha todos os campos obrigatorios.", variant: "destructive" });
      return;
    }
    register(form, {
      onSuccess: () => {
        setMode("pending");
      },
      onError: (err: any) => {
        toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
      }
    });
  };

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Cinematic Background Component
  const CinematicBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/14 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-70" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(37,99,235,0.08)_42%,transparent_78%)]" />
    </div>
  );

  if (mode === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <CinematicBackground />
        <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/50 blur-xl opacity-50 rounded-full animate-pulse"></div>
              <img src="/logo.svg" alt="V.HUB" className="h-16 w-16 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {pt.auth.pendingTitle}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {pt.auth.pendingDescription}
              </p>
            </div>

            <div className="w-full p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 text-left">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Aguardando Aprovação</p>
                <p className="text-xs text-primary/80">Você será notificado por email.</p>
              </div>
            </div>

            <button 
              onClick={() => setMode("login")}
              className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "register") {
    return (
      <div className="min-h-screen bg-background p-4 relative overflow-hidden flex flex-col items-center">
        <CinematicBackground />
        
        <div className="w-full max-w-4xl relative z-10 my-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8">
            <img src="/logo.svg" alt="V.HUB" className="h-12 w-12 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h1 className="text-3xl font-bold text-white mb-2">{pt.auth.registerTitle}</h1>
            <p className="text-muted-foreground">{pt.auth.registerSubtitle}</p>
          </div>

          <form onSubmit={handleRegister} className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-8">
            {/* Form Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/10 pb-2">Dados Pessoais</h3>
                <div className="space-y-4">
                  <Input placeholder={pt.auth.fullName} value={form.fullName} onChange={e => updateForm("fullName", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                  <Input placeholder={pt.auth.artistName} value={form.artistName} onChange={e => updateForm("artistName", e.target.value)} className="bg-white/5 border-white/10 focus:border-primary/50" />
                  <Input type="email" placeholder={pt.auth.emailPlaceholder} value={form.email} onChange={e => updateForm("email", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                  <Input type="password" placeholder={pt.auth.passwordPlaceholder} value={form.password} onChange={e => updateForm("password", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder={pt.auth.phone} value={form.phone} onChange={e => updateForm("phone", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                    <Input placeholder={pt.auth.altPhone} value={form.altPhone} onChange={e => updateForm("altPhone", e.target.value)} className="bg-white/5 border-white/10 focus:border-primary/50" />
                  </div>
                  <Input type="date" placeholder={pt.auth.birthDate} value={form.birthDate} onChange={e => updateForm("birthDate", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/10 pb-2">Localização e Perfil</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                     <Input placeholder={pt.auth.city} value={form.city} onChange={e => updateForm("city", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                     <Input placeholder={pt.auth.state} value={form.state} onChange={e => updateForm("state", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                     <Input placeholder={pt.auth.country} value={form.country} onChange={e => updateForm("country", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                  </div>
                  <Input placeholder={pt.auth.mainLanguage} value={form.mainLanguage} onChange={e => updateForm("mainLanguage", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                  <Input placeholder={pt.auth.additionalLanguages} value={form.additionalLanguages} onChange={e => updateForm("additionalLanguages", e.target.value)} className="bg-white/5 border-white/10 focus:border-primary/50" />
                  <Input placeholder={pt.auth.experience} value={form.experience} onChange={e => updateForm("experience", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                  <Input placeholder={pt.auth.specialty} value={form.specialty} onChange={e => updateForm("specialty", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50" />
                  <Textarea placeholder={pt.auth.bio} value={form.bio} onChange={e => updateForm("bio", e.target.value)} required className="bg-white/5 border-white/10 focus:border-primary/50 min-h-[80px]" />
                  <Input placeholder={pt.auth.portfolioUrl} value={form.portfolioUrl} onChange={e => updateForm("portfolioUrl", e.target.value)} className="bg-white/5 border-white/10 focus:border-primary/50" />
                  
                  {studiosLoading ? (
                    <div className="flex justify-center p-2"><Loader2 className="animate-spin text-primary" /></div>
                  ) : (
                    <Select value={form.studioId} onValueChange={v => updateForm("studioId", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 focus:border-primary/50">
                        <SelectValue placeholder={pt.auth.selectStudio} />
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
                {pt.register.backToLogin}
              </button>
              <button
                type="submit"
                disabled={isRegistering}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {pt.register.submit} <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Login Mode - Split Layout
  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      <CinematicBackground />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-between p-12 border-r border-border/50 bg-black/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="V.HUB" className="h-10 w-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
          <span className="text-2xl font-bold tracking-tight text-white">V.HUB</span>
        </div>
        
        <div className="space-y-7 max-w-xl">
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-white">
            O Estúdio de Dublagem do Futuro.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
            Produção, sala e entrega final em um só lugar. Fluxo de ADR com timeline, takes inteligentes e operação profissional.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
              <AudioWaveform className="w-4 h-4 text-primary" />
              <span className="text-xs text-white/80">Timeline de Takes</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs text-white/80">Qualidade Assistida</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
              <Clock3 className="w-4 h-4 text-primary" />
              <span className="text-xs text-white/80">Agendamento Preciso</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-white/80">Entrega Organizada</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground/40">
          © {new Date().getFullYear()} V.HUB Studio. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo.svg" alt="V.HUB" className="h-12 w-12 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>

          <div className="bg-black/35 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col space-y-2 text-center mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {pt.auth.loginTitle}
              </h2>
              <p className="text-sm text-muted-foreground">
                {pt.auth.loginSubtitle}
              </p>
              <p className="text-xs text-muted-foreground/80">Acesso seguro ao ambiente de produção e gravação.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder={pt.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-11 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder={pt.auth.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-11 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.45)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {pt.auth.loginButton} <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2 mt-5 mb-6">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Perfis</p>
                <p className="text-xs text-white/85">Dublador • Direção</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sessões</p>
                <p className="text-xs text-white/85">Ao vivo e agendadas</p>
              </div>
            </div>

            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/35 px-2 text-muted-foreground backdrop-blur-xl">
                  {pt.auth.newHere}
                </span>
              </div>
            </div>

            <button
              onClick={() => setMode("register")}
              className="w-full h-11 border border-white/10 hover:bg-white/5 hover:text-white text-muted-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {pt.auth.createAccount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
