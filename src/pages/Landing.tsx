import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/PublicLayout";
import catCleaning from "@/assets/cat-cleaning.jpg";
import catPlumbing from "@/assets/cat-plumbing.jpg";
import catElectrical from "@/assets/cat-electrical.jpg";
import catHandyman from "@/assets/cat-handyman.jpg";
import catBeauty from "@/assets/cat-beauty.jpg";
import catTutoring from "@/assets/cat-tutoring.jpg";
import catMoving from "@/assets/cat-moving.jpg";
import catGardening from "@/assets/cat-gardening.jpg";
import {
  Sparkles, ShieldCheck, Clock, Star, Search, ArrowRight,
  ChevronLeft, ChevronRight, MapPin, Zap, Users, Award, TrendingUp
} from "lucide-react";

const heroSlides = [
  { img: catCleaning, title: "Sparkling clean results", subtitle: "Vetted cleaners for every room and routine" },
  { img: catHandyman, title: "Repairs handled fast", subtitle: "Reliable handyman support when things break" },
  { img: catBeauty, title: "Elevated personal care", subtitle: "Beauty and wellness services at your convenience" },
];

const categories = [
  { name: "Cleaning", img: catCleaning, slug: "cleaning", icon: "🧹", count: "240+ pros" },
  { name: "Plumbing", img: catPlumbing, slug: "plumbing", icon: "🔧", count: "180+ pros" },
  { name: "Electrical", img: catElectrical, slug: "electrical", icon: "⚡", count: "95+ pros" },
  { name: "Handyman", img: catHandyman, slug: "handyman", icon: "🛠️", count: "310+ pros" },
  { name: "Beauty & Spa", img: catBeauty, slug: "beauty", icon: "💆", count: "150+ pros" },
  { name: "Tutoring", img: catTutoring, slug: "tutoring", icon: "📚", count: "200+ pros" },
  { name: "Moving", img: catMoving, slug: "moving", icon: "📦", count: "88+ pros" },
  { name: "Gardening", img: catGardening, slug: "gardening", icon: "🌿", count: "120+ pros" },
];

const testimonials = [
  { name: "Sarah K.", city: "New York", rating: 5, text: "Found an amazing electrician in minutes. Super easy booking and the secure payment gave me total peace of mind.", avatar: "SK", service: "Electrical" },
  { name: "Marcus R.", city: "Austin", rating: 5, text: "My go-to for home maintenance. Providers are vetted, prices are fair, and everything just works.", avatar: "MR", service: "Handyman" },
  { name: "Priya L.", city: "Chicago", rating: 5, text: "Booked a cleaning crew last minute and they were incredible. Will absolutely use ServiceScout again.", avatar: "PL", service: "Cleaning" },
  { name: "James T.", city: "Seattle", rating: 5, text: "The tutor I found here helped my daughter go from C to A grades in just two months. Unbelievable platform.", avatar: "JT", service: "Tutoring" },
  { name: "Diana M.", city: "Miami", rating: 5, text: "Best experience using a service marketplace. Clean UI, reliable providers, and fast support.", avatar: "DM", service: "Beauty & Spa" },
];

const stats = [
  { value: "10K+", label: "Happy customers", icon: Users },
  { value: "1.2K+", label: "Verified providers", icon: Award },
  { value: "98%", label: "Satisfaction rate", icon: TrendingUp },
  { value: "50+", label: "Cities covered", icon: MapPin },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimatedSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ value, suffix = "", duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span>{new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(displayValue)}{suffix}</span>;
}

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  function go(dir: number) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive((prev) => (prev + dir + testimonials.length) % testimonials.length);
      setAnimating(false);
    }, 200);
  }

  useEffect(() => {
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [animating]);

  const t = testimonials[active];
  return (
    <div className="relative">
      <div
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "scale(0.97)" : "scale(1)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 max-w-2xl mx-auto"
      >
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {t.avatar}
          </div>
          <div className="flex-1">
            <StarRating />
            <p className="mt-3 text-slate-700 text-lg leading-relaxed italic">"{t.text}"</p>
            <div className="mt-4 flex items-center gap-3">
              <div>
                <div className="font-semibold text-slate-900">{t.name}</div>
                <div className="text-sm text-slate-500">{t.city} · {t.service}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={() => go(-1)} className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </button>
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (!animating) { setAnimating(true); setTimeout(() => { setActive(i); setAnimating(false); }, 200); } }}
              className="rounded-full transition-all duration-300"
              style={{ width: i === active ? "24px" : "8px", height: "8px", background: i === active ? "#0891b2" : "#cbd5e1" }}
            />
          ))}
        </div>
        <button onClick={() => go(1)} className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>
      </div>
    </div>
  );
}

function CategoryCarousel() {
  const [offset, setOffset] = useState(0);
  const visibleCount = 4;
  const maxOffset = categories.length - visibleCount;

  function slide(dir: number) {
    setOffset((prev) => Math.max(0, Math.min(maxOffset, prev + dir)));
  }

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex gap-5 transition-transform duration-500"
          style={{ transform: `translateX(calc(-${offset} * (100% / ${visibleCount} + 20px / ${visibleCount})))` }}
        >
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/services?category=${c.slug}`}
              className="flex-shrink-0 group"
              style={{ width: `calc((100% - ${(visibleCount - 1) * 20}px) / ${visibleCount})` }}
            >
              <div className="relative overflow-hidden rounded-2xl aspect-[3/4] shadow-md">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-cyan-600/0 group-hover:bg-cyan-600/20 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-white font-bold text-lg">{c.name}</div>
                  <div className="text-white/70 text-sm">{c.count}</div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                    <ArrowRight className="h-4 w-4 text-cyan-700" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <button
        onClick={() => slide(-1)}
        disabled={offset === 0}
        className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-5 w-5 text-slate-700" />
      </button>
      <button
        onClick={() => slide(1)}
        disabled={offset >= maxOffset}
        className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-5 w-5 text-slate-700" />
      </button>
    </div>
  );
}

function HeroCarousel({ fixedHeight }: { fixedHeight?: number }) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  function go(dir: number) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive((prev) => (prev + dir + heroSlides.length) % heroSlides.length);
      setAnimating(false);
    }, 220);
  }

  useEffect(() => {
    const timer = setInterval(() => go(1), 5000);
    return () => clearInterval(timer);
  }, [animating]);

  const slide = heroSlides[active];

  return (
    <div className="relative">
      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-300/40 border border-white/70 bg-slate-100">
        <div
          className={"relative " + (fixedHeight ? "h-auto" : "aspect-[4/5] md:aspect-[5/6] lg:aspect-[4/5]")}
          style={{ height: fixedHeight ? fixedHeight : undefined, opacity: animating ? 0.92 : 1, transform: animating ? "scale(0.99)" : "scale(1)", transition: "opacity 0.22s ease, transform 0.22s ease" }}
        >
          <img src={slide.img} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/35 via-slate-950/5 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Featured service spotlight
            </div>
            <h3 className="mt-4 text-2xl md:text-3xl font-extrabold leading-tight">{slide.title}</h3>
            <p className="mt-2 max-w-sm text-sm md:text-base text-white/85">{slide.subtitle}</p>
          </div>
        </div>

        <button
          onClick={() => go(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/90 backdrop-blur border border-white/60 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/90 backdrop-blur border border-white/60 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 text-slate-700" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { value: 10000, label: "Customers" },
          { value: 1200, label: "Providers" },
          { value: 98, label: "Satisfaction" },
        ].map((item, index) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm">
            <div className="text-2xl font-extrabold text-slate-900">
              <AnimatedCounter value={item.value} suffix={item.label === "Satisfaction" ? "%" : "+"} />
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => { if (!animating) setActive(i); }}
            className="rounded-full transition-all duration-300"
            style={{ width: i === active ? "28px" : "8px", height: "8px", background: i === active ? "#0891b2" : "#cbd5e1" }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const [leftHeight, setLeftHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function measure() {
      if (leftRef.current) setLeftHeight(leftRef.current.getBoundingClientRect().height);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (leftRef.current) ro.observe(leftRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [heroLoaded]);

  return (
    <PublicLayout>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white min-h-[80vh] flex items-start">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-cyan-100/60 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-blue-100/50 blur-3xl" />
        </div>
        <div className="container relative pt-8 pb-16 md:pt-12 md:pb-20 grid md:grid-cols-2 gap-12 items-start">
          <div ref={leftRef} style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? "none" : "translateY(24px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Trusted by 10,000+ customers across 50+ cities
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-slate-900">
              On-demand{" "}
              <span className="relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">services</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-cyan-100 rounded-sm" style={{ zIndex: -1 }} />
              </span>{" "}
              at your doorstep
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-xl">
              Book vetted local professionals for cleaning, repairs, beauty, tutoring and more. Pay securely with PayWay payment protection.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-200 rounded-full px-8 text-base" asChild>
                <Link to="/services"><Search className="mr-2 h-5 w-5" /> Find a service</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base border-slate-300 hover:border-cyan-400 hover:text-cyan-700" asChild>
                <Link to="/become-provider">Become a provider <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-600">
              {[{ icon: ShieldCheck, label: "Verified & vetted" }, { icon: Clock, label: "Same-day booking" }, { icon: Star, label: "4.9★ avg rating" }].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                  <Icon className="h-4 w-4 text-cyan-600" />{label}
                </div>
              ))}
            </div>
          </div>
          <div className="relative" style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? "none" : "translateX(32px) scale(0.97)", transition: "opacity 0.9s ease 0.15s, transform 0.9s ease 0.15s" }}>
            <HeroCarousel fixedHeight={leftHeight} />
            <FloatingBadge style={{ bottom: "10%", left: "-8%", animation: "float 4s ease-in-out infinite" }}>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex-shrink-0 flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-emerald-600" /></div>
              <div><div className="text-xs text-slate-500">PayWay secured</div><div className="font-bold">100% safe</div></div>
            </FloatingBadge>
            <FloatingBadge style={{ top: "12%", right: "-5%", animation: "float 4s ease-in-out infinite 2s" }}>
              <div className="flex -space-x-2">
                {[["bg-cyan-400", "S"], ["bg-blue-400", "M"], ["bg-violet-400", "J"]].map(([bg, l], i) => (
                  <div key={i} className={`w-7 h-7 rounded-full border-2 border-white ${bg} flex items-center justify-center text-white text-xs font-bold`}>{l}</div>
                ))}
              </div>
              <div><div className="text-xs text-slate-500">Booked today</div><div className="font-bold">3 new jobs ↑</div></div>
            </FloatingBadge>
            <FloatingBadge style={{ top: "52%", right: "-8%", animation: "float 4s ease-in-out infinite 1s" }}>
              <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
              <span className="font-bold">4.9 / 5.0</span>
            </FloatingBadge>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="bg-gradient-to-r from-cyan-600 to-blue-700 py-12">
        <div className="container">
          <AnimatedSection className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center text-white">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-white/10 items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-extrabold">{value}</div>
                <div className="text-cyan-100 text-sm mt-0.5">{label}</div>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── CATEGORIES CAROUSEL ── */}
      <section className="container py-20">
        <AnimatedSection className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold mb-4">
            <Zap className="h-3.5 w-3.5" /> 8 service categories
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">Popular Categories</h2>
          <p className="text-slate-500 mt-3 text-lg">Browse top services in your area</p>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <div className="px-6"><CategoryCarousel /></div>
        </AnimatedSection>
        <AnimatedSection delay={200} className="text-center mt-10">
          <Button variant="outline" size="lg" className="rounded-full px-8 border-slate-300 hover:border-cyan-400 hover:text-cyan-700" asChild>
            <Link to="/services">View all services <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </AnimatedSection>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-50 py-20">
        <div className="container">
          <AnimatedSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold mb-4">
              <Clock className="h-3.5 w-3.5" /> Simple 3-step process
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">How ServiceScout works</h2>
            <p className="text-slate-500 mt-3 text-lg">From booking to completion in minutes</p>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-14 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-cyan-200 via-cyan-400 to-cyan-200" />
            {[
              { n: "01", t: "Choose a service", d: "Browse our curated services. Pick the one you need and choose a time that works for you.", emoji: "🔍" },
              { n: "02", t: "Pay securely via PayWay", d: "Complete payment through Westpac PayWay. Funds are held securely until the job is done.", emoji: "🔒" },
              { n: "03", t: "We assign a pro, job done", d: "Our admin assigns a qualified professional. Confirm completion and rate your experience.", emoji: "⭐" },
            ].map((s, i) => (
              <AnimatedSection key={s.n} delay={i * 120}>
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-cyan-200 transition-all duration-300 hover:-translate-y-2 h-full">
                  <div className="relative mb-6 inline-block">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 flex items-center justify-center text-3xl">{s.emoji}</div>
                    <div className="absolute -top-2 -right-2 text-xs font-extrabold text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-full px-2 py-0.5">{s.n}</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{s.t}</h3>
                  <p className="text-slate-500 leading-relaxed">{s.d}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHT ── */}
      <section className="container py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 aspect-[4/3]">
                <img src={catHandyman} alt="Professional at work" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 max-w-[200px]">
                <div className="text-sm text-slate-500 mb-1">Payment secured</div>
                <div className="text-2xl font-extrabold text-slate-900">$186.00</div>
                <div className="flex items-center gap-1 mt-1 text-emerald-600 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4" /> Protected
                </div>
              </div>
              <div className="absolute -top-4 -left-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg p-4 text-white">
                <Star className="h-6 w-6 fill-white" />
                <div className="text-xl font-bold mt-1">4.9★</div>
                <div className="text-xs opacity-80">avg rating</div>
              </div>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-6">
              <ShieldCheck className="h-3.5 w-3.5" /> Built-in trust & safety
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              Pay with total<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">peace of mind</span>
            </h2>
            <p className="mt-5 text-xl text-slate-600 leading-relaxed">
              Every payment is secured via Westpac PayWay. Funds are held until the job is completed to your satisfaction.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { t: "PayWay payment protection", d: "Every booking is processed through Westpac's secure payment gateway." },
                { t: "Verified & background-checked providers", d: "Every professional is vetted before joining ServiceScout." },
                { t: "Dispute resolution team", d: "If anything goes wrong, our team steps in to help." },
              ].map(({ t, d }) => (
                <div key={t} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-cyan-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{t}</div>
                    <div className="text-slate-500 text-sm mt-0.5">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="container">
          <AnimatedSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-4">
              <Star className="h-3.5 w-3.5 fill-amber-500" /> Real customer reviews
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">What people say</h2>
            <p className="text-slate-500 mt-3 text-lg">Join thousands of satisfied customers</p>
          </AnimatedSection>
          <AnimatedSection delay={100}><TestimonialCarousel /></AnimatedSection>
        </div>
      </section>

      {/* ── PROVIDER CTA ── */}
      <section className="container py-20">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 p-12 md:p-16 text-white">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold mb-6">
                  <Sparkles className="h-3.5 w-3.5" /> Earn on your schedule
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">Turn your skills<br />into income</h2>
                <p className="mt-5 text-xl text-white/70 leading-relaxed">
                  Join 1,200+ providers earning on ServiceScout. Set your availability, get assigned jobs, get paid weekly.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 text-base font-semibold shadow-lg" asChild>
                    <Link to="/become-provider">Start earning today</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 text-base" asChild>
                    <Link to="/services">Browse first</Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ value: "Weekly", label: "Payouts", icon: "💸" }, { value: "90%", label: "You keep", icon: "🏆" }, { value: "Free", label: "To join", icon: "🎉" }, { value: "24/7", label: "Support", icon: "💬" }].map(({ value, label, icon }) => (
                  <div key={label} className="bg-white/10 border border-white/10 rounded-2xl p-5 text-center hover:bg-white/15 transition-colors">
                    <div className="text-3xl mb-2">{icon}</div>
                    <div className="text-2xl font-extrabold">{value}</div>
                    <div className="text-white/60 text-sm mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </PublicLayout>
  );
}

function FloatingBadge({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="absolute bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3 text-sm font-medium text-slate-800"
      style={style}
    >
      {children}
    </div>
  );
}
