import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Flame, Beef, Calendar, TrendingUp, Users, ShieldCheck, Mail, MapPin, Phone, 
  User, CheckCircle2, ChevronRight, LayoutDashboard, Utensils, ClipboardList, 
  Store, Calculator, FileStack, Download, StickyNote, Globe, Share2, 
  Cpu, Server, Code, Database
} from 'lucide-react';
import { useState } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    location: '', 
    referrer: 'Búsqueda en Google',
    message: '' 
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setFormData({ 
          name: '', 
          email: '', 
          location: '', 
          referrer: 'Búsqueda en Google',
          message: '' 
        });
      }, 5000);
    }
  };

  // 12 compact features for the 2-row train carousel
  const featuresRow1 = [
    { title: "Cálculo de Insumos", desc: "Kilos exactos de carne, embutidos y carbón.", icon: Beef },
    { title: "Calendario de Eventos", desc: "Control de fechas de catering y asados sin solapamientos.", icon: Calendar },
    { title: "Cotizador Veloz", desc: "Generación de presupuestos listos en PDF.", icon: Calculator },
    { title: "Plantillas de Cotización", desc: "Reutiliza plantillas para agilizar ofertas.", icon: FileStack },
    { title: "Logística y Tiempos", desc: "Cronograma preciso para encendido y despacho.", icon: ClipboardList },
    { title: "Gestión de Clientes", desc: "Historial completo de clientes corporativos y privados.", icon: Users },
  ];

  const featuresRow2 = [
    { title: "Lista de Compras", desc: "Consolidación de compras automáticas del mercado.", icon: ClipboardList },
    { title: "Control de Inventario", desc: "Gestión de existencias e insumos en tiempo real.", icon: Store },
    { title: "Métricas Financieras", desc: "Reportes visuales de ganancias netas por evento.", icon: TrendingUp },
    { title: "Control de Costos Fijos", desc: "Administración de alquileres, leña y servicios.", icon: ShieldCheck },
    { title: "Gestión de Notas", desc: "Notas rápidas y recordatorios específicos del cliente.", icon: StickyNote },
    { title: "Exportación de Datos", desc: "Descarga de reportes financieros en Excel y PDF.", icon: Download },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1428] text-white selection:bg-[#E8834A] selection:text-[#0A1428] overflow-x-hidden font-sans relative">
      {/* Decorative CSS Styles for train-like infinite marquee animations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-left {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee-left:hover {
          animation-play-state: paused;
        }
        .animate-marquee-left-slow {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee-left-slow:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Decorative fire-like glowing gradients in background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E8834A]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-[#E8834A]/5 rounded-full blur-[180px] pointer-events-none" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A1428]/80 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#E8834A]/10 shadow-[0_0_20px_rgba(232,131,74,0.15)] border border-[#E8834A]/20">
              <Flame className="size-6 text-[#E8834A] animate-pulse" />
            </span>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-[#E8834A] bg-clip-text text-transparent">
              AsamApp
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200"
            >
              Ingresar
            </button>
            <button
              onClick={() => navigate('/register')}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-white rounded-lg group bg-gradient-to-br from-[#E8834A] to-[#D4733A] hover:text-[#0A1428] focus:ring-4 focus:outline-none focus:ring-[#E8834A]/30 transition-all duration-300"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-200 bg-[#0A1428] rounded-md group-hover:bg-opacity-0 font-semibold block">
                Registrarse
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:items-center"
          >
            <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8834A]/10 border border-[#E8834A]/20 w-fit">
                <span className="flex size-2 rounded-full bg-[#E8834A] animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#E8834A]">
                  Exclusivo para Catering y Asadores Premium
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
              >
                El arte del fuego bajo un <span className="bg-gradient-to-r from-[#E8834A] to-amber-500 bg-clip-text text-transparent">control absoluto</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-lg sm:text-xl text-[#8BA0B0] max-w-2xl font-light leading-relaxed"
              >
                AsamApp está diseñado específicamente para organizadores de eventos gastronómicos a las brasas. Olvídate de los cálculos a ojo: optimiza las compras de cortes de carne, gestiona tus costos fijos y el personal en tiempo real.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center gap-2 bg-[#E8834A] text-[#0A1428] hover:bg-[#D4733A] font-bold px-8 py-4 rounded-xl shadow-[0_4px_20px_rgba(232,131,74,0.3)] hover:shadow-[0_4px_25px_rgba(232,131,74,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Probar Gratis
                  <ChevronRight className="size-5" />
                </button>
                <a
                  href="#contacto"
                  className="flex items-center justify-center gap-2 bg-[#0F1B33] hover:bg-[#132240] text-white border border-white/5 font-semibold px-8 py-4 rounded-xl transition-all duration-300"
                >
                  Solicitar Asesoría
                </a>
              </motion.div>
            </div>

            <motion.div
              variants={itemVariants}
              className="lg:col-span-5 relative flex justify-center"
            >
              {/* Custom CSS/HTML Interactive Dashboard Mockup */}
              <div className="w-full max-w-md bg-[#0F1B33] border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#E8834A] to-amber-500" />
                
                {/* Header Mockup */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-red-500/80" />
                    <div className="size-3 rounded-full bg-yellow-500/80" />
                    <div className="size-3 rounded-full bg-green-500/80" />
                    <span className="text-[11px] text-[#8BA0B0] ml-2 tracking-wider uppercase font-semibold">PRESUPUESTO ACTIVO</span>
                  </div>
                  <span className="text-[12px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Rentable</span>
                </div>

                {/* Dashboard Stats */}
                <div className="py-4 space-y-4">
                  <div>
                    <span className="text-[11px] text-[#8BA0B0] uppercase block">Asado Corporativo - 120 Invitados</span>
                    <span className="text-xl font-bold tracking-tight text-white mt-1">$4,850 USD</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-[#132240] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-[#8BA0B0] uppercase block">Insumos (Carne/Carbón)</span>
                      <span className="text-sm font-semibold text-white mt-1">54.5 kg calculados</span>
                    </div>
                    <div className="bg-[#132240] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-[#8BA0B0] uppercase block">Personal Requerido</span>
                      <span className="text-sm font-semibold text-white mt-1">2 Parrilleros, 4 Mozos</span>
                    </div>
                  </div>

                  {/* Visual scale indicator */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] text-[#8BA0B0] mb-1">
                      <span>Costo de Materia Prima</span>
                      <span className="font-semibold text-white">35% del total</span>
                    </div>
                    <div className="w-full h-2 bg-[#0A1428] rounded-full overflow-hidden">
                      <div className="h-full bg-[#E8834A] rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>
                </div>

                {/* Simulated list of items */}
                <div className="mt-2 space-y-2 border-t border-white/5 pt-4">
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-[#8BA0B0]">Vacío / Asado de Tira</span>
                    <span className="text-white font-medium">36.0 kg</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-[#8BA0B0]">Leña / Carbón Quebracho</span>
                    <span className="text-white font-medium">4 bolsas</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-[#8BA0B0]">Logística & Traslado</span>
                    <span className="text-emerald-400 font-medium">Optimizado</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT HELPS (IMPORTANCIA) */}
      <section className="py-20 bg-[#0F1B33]/40 border-y border-white/5 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              ¿Por qué automatizar tu gestión gastronómica?
            </h2>
            <p className="text-lg text-[#8BA0B0] font-light">
              Organizar catering a las brasas sin un control exacto de insumos devora el margen de ganancia. AsamApp profesionaliza tu operación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0F1B33] border border-white/5 p-8 rounded-2xl hover:border-[#E8834A]/30 transition-all duration-300">
              <div className="size-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
                <Beef className="size-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Merma Cero en Carnes</h3>
              <p className="text-[#8BA0B0] leading-relaxed text-sm font-light">
                Los algoritmos de cálculo estiman de forma milimétrica la cantidad necesaria de carne, achuras y acompañamientos según el perfil de los invitados, evitando compras excesivas o faltantes críticos.
              </p>
            </div>

            <div className="bg-[#0F1B33] border border-white/5 p-8 rounded-2xl hover:border-[#E8834A]/30 transition-all duration-300">
              <div className="size-12 rounded-xl bg-[#E8834A]/10 flex items-center justify-center mb-6">
                <Flame className="size-6 text-[#E8834A]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Costos Fijos Controlados</h3>
              <p className="text-[#8BA0B0] leading-relaxed text-sm font-light">
                No descuides la leña, el hielo, los mozos ni el flete. Añade cada costo operativo a tu cotización para asegurar una rentabilidad neta real por evento.
              </p>
            </div>

            <div className="bg-[#0F1B33] border border-white/5 p-8 rounded-2xl hover:border-[#E8834A]/30 transition-all duration-300">
              <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <TrendingUp className="size-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Cotizaciones Profesionales</h3>
              <p className="text-[#8BA0B0] leading-relaxed text-sm font-light">
                Genera presupuestos exportables en PDF de inmediato. Cierra tratos comerciales rápidamente sin esperar horas haciendo cálculos manuales en Excel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES (TRAIN CAROUSEL) */}
      <section className="py-20 overflow-hidden bg-[#0A1428]">
        <div className="mx-auto max-w-7xl px-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              El control de todo el evento en un solo lugar
            </h2>
            <p className="text-[#8BA0B0] text-lg font-light">
              Módulos diseñados meticulosamente y de manera compacta para maximizar la velocidad de carga y facilitar la administración en el terreno.
            </p>
          </div>
        </div>

        {/* Carousel Row 1 - Right to Left */}
        <div className="relative w-full flex items-center overflow-hidden py-3">
          <div className="animate-marquee-left flex gap-4">
            {[...featuresRow1, ...featuresRow1].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div 
                  key={`row1-${idx}`} 
                  className="w-72 shrink-0 bg-[#0F1B33] border border-white/5 rounded-xl p-4 flex items-center gap-3.5 hover:border-[#E8834A]/30 transition-all duration-200"
                >
                  <div className="size-10 rounded-lg bg-[#E8834A]/10 flex items-center justify-center shrink-0 border border-[#E8834A]/10">
                    <Icon className="size-5 text-[#E8834A]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{f.title}</h4>
                    <p className="text-xs text-[#8BA0B0] truncate mt-0.5 font-light">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Row 2 - Right to Left (Slower speed for parallax effect) */}
        <div className="relative w-full flex items-center overflow-hidden py-3 mt-2">
          <div className="animate-marquee-left-slow flex gap-4">
            {[...featuresRow2, ...featuresRow2].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div 
                  key={`row2-${idx}`} 
                  className="w-72 shrink-0 bg-[#0F1B33] border border-white/5 rounded-xl p-4 flex items-center gap-3.5 hover:border-[#E8834A]/30 transition-all duration-200"
                >
                  <div className="size-10 rounded-lg bg-[#E8834A]/10 flex items-center justify-center shrink-0 border border-[#E8834A]/10">
                    <Icon className="size-5 text-[#E8834A]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{f.title}</h4>
                    <p className="text-xs text-[#8BA0B0] truncate mt-0.5 font-light">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TECH STACK SHOWCASE */}
      <section className="py-16 bg-[#0F1B33]/20 border-t border-white/5 px-6">
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-xs font-bold text-[#E8834A] uppercase tracking-widest block mb-4">
            Nuestra Tecnología
          </span>
          <h3 className="text-xl sm:text-2xl font-bold mb-10 text-white/90">
            Construido sobre una pila tecnológica moderna y robusta
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#0F1B33] border border-white/5 rounded-xl p-5 flex flex-col items-center justify-center">
              <Code className="size-8 text-[#E8834A] mb-3" />
              <span className="text-sm font-semibold">React 19 & Vite</span>
              <span className="text-xs text-[#8BA0B0] mt-1 font-light">Interfaz reactiva veloz</span>
            </div>
            <div className="bg-[#0F1B33] border border-white/5 rounded-xl p-5 flex flex-col items-center justify-center">
              <Cpu className="size-8 text-[#E8834A] mb-3" />
              <span className="text-sm font-semibold">Tailwind CSS v4</span>
              <span className="text-xs text-[#8BA0B0] mt-1 font-light">Estilos y animaciones fluidos</span>
            </div>
            <div className="bg-[#0F1B33] border border-white/5 rounded-xl p-5 flex flex-col items-center justify-center">
              <Server className="size-8 text-[#E8834A] mb-3" />
              <span className="text-sm font-semibold">Node.js / Express</span>
              <span className="text-xs text-[#8BA0B0] mt-1 font-light">API segura y escalable</span>
            </div>
            <div className="bg-[#0F1B33] border border-white/5 rounded-xl p-5 flex flex-col items-center justify-center">
              <Database className="size-8 text-[#E8834A] mb-3" />
              <span className="text-sm font-semibold">Base de datos</span>
              <span className="text-xs text-[#8BA0B0] mt-1 font-light">Almacenamiento persistente</span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & FOUNDER INFO */}
      <section id="contacto" className="py-20 bg-[#0F1B33]/40 border-t border-white/5 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Contact details and Founder */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
                  Conversemos sobre tu negocio
                </h2>
                <p className="text-[#8BA0B0] font-light leading-relaxed">
                  ¿Tienes alguna consulta comercial o necesitas soporte para implementar AsamApp en tu empresa de banquetes? Ponte en contacto directamente con nosotros.
                </p>
              </div>

              {/* Founder Profile Card */}
              <div className="bg-[#0F1B33] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 size-24 bg-[#E8834A]/5 rounded-full blur-xl" />
                <span className="text-[10px] font-bold text-[#E8834A] uppercase tracking-wider block mb-3">Desarrollo y Soporte</span>
                <h4 className="text-lg font-semibold text-white">Iván Fernández Peñates</h4>
                <p className="text-sm text-[#8BA0B0] mt-1">Fundador & Desarrollador Principal</p>
                
                <div className="mt-5 space-y-3.5 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3 text-sm text-[#8BA0B0]">
                    <MapPin className="size-4 text-[#E8834A] shrink-0" />
                    <span>Sampués - Sucre, Colombia</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#8BA0B0]">
                    <Mail className="size-4 text-[#E8834A] shrink-0" />
                    <span>contacto@asamapp.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#8BA0B0]">
                    <Phone className="size-4 text-[#E8834A] shrink-0" />
                    <span>+57 3216624399</span>
                  </div>
                </div>

                {/* Social Networks Connect */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-bold text-[#8BA0B0] uppercase tracking-wider block mb-3">Conéctate en Redes</span>
                  <div className="flex gap-4">
                    <a 
                      href="https://github.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="size-9 rounded-lg bg-[#0A1428] hover:bg-[#E8834A]/20 hover:text-[#E8834A] border border-white/5 flex items-center justify-center transition-all duration-200 text-white"
                      title="GitHub"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                    </a>
                    <a 
                      href="https://linkedin.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="size-9 rounded-lg bg-[#0A1428] hover:bg-[#E8834A]/20 hover:text-[#E8834A] border border-white/5 flex items-center justify-center transition-all duration-200 text-white"
                      title="LinkedIn"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://instagram.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="size-9 rounded-lg bg-[#0A1428] hover:bg-[#E8834A]/20 hover:text-[#E8834A] border border-white/5 flex items-center justify-center transition-all duration-200 text-white"
                      title="Instagram"
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                      </svg>
                    </a>
                    <a 
                      href="https://twitter.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="size-9 rounded-lg bg-[#0A1428] hover:bg-[#E8834A]/20 hover:text-[#E8834A] border border-white/5 flex items-center justify-center transition-all duration-200 text-white"
                      title="X (Twitter)"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://facebook.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="size-9 rounded-lg bg-[#0A1428] hover:bg-[#E8834A]/20 hover:text-[#E8834A] border border-white/5 flex items-center justify-center transition-all duration-200 text-white"
                      title="Facebook"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.85z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7 bg-[#0F1B33] border border-white/10 rounded-2xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative">
              {formSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="size-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">¡Mensaje recibido con éxito!</h3>
                  <p className="text-sm text-[#8BA0B0] max-w-sm">
                    Muchas gracias por escribirnos. Iván Fernández se comunicará contigo a la brevedad.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-xl font-semibold text-white mb-2 border-b border-white/5 pb-3">Escríbenos un mensaje</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-[10px] font-bold text-[#8BA0B0] uppercase tracking-wider block">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Ej. Juan Pérez"
                        className="w-full bg-[#0A1428] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#E8834A] focus:outline-none transition-colors duration-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-[10px] font-bold text-[#8BA0B0] uppercase tracking-wider block">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="juan@ejemplo.com"
                        className="w-full bg-[#0A1428] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#E8834A] focus:outline-none transition-colors duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="location" className="text-[10px] font-bold text-[#8BA0B0] uppercase tracking-wider block">
                        ¿De dónde nos escribes? (Ubicación)
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                        placeholder="Ej. Sincelejo, Sucre"
                        className="w-full bg-[#0A1428] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#E8834A] focus:outline-none transition-colors duration-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="referrer" className="text-[10px] font-bold text-[#8BA0B0] uppercase tracking-wider block">
                        ¿Cómo nos encontraste?
                      </label>
                      <select
                        id="referrer"
                        name="referrer"
                        value={formData.referrer}
                        onChange={handleInputChange}
                        className="w-full bg-[#0A1428] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#E8834A] focus:outline-none transition-colors duration-200"
                      >
                        <option value="Búsqueda en Google">Búsqueda en Google</option>
                        <option value="Recomendación">Recomendación o Amigo</option>
                        <option value="Redes Sociales">Redes Sociales</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-[10px] font-bold text-[#8BA0B0] uppercase tracking-wider block">
                      Tu Mensaje / Consulta
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      placeholder="Cuéntanos un poco sobre tu negocio de eventos gastronómicos..."
                      className="w-full bg-[#0A1428] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#E8834A] focus:outline-none transition-colors duration-200 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#E8834A] hover:bg-[#D4733A] text-[#0A1428] font-bold py-3 px-6 rounded-lg shadow-[0_4px_15px_rgba(232,131,74,0.25)] transition-all duration-300"
                  >
                    Enviar Mensaje
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#0A1428] py-8 text-center text-xs text-[#8BA0B0] px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-[#E8834A]" />
            <span className="font-semibold text-white">AsamApp</span>
          </div>
          <span>&copy; {new Date().getFullYear()} AsamApp. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
