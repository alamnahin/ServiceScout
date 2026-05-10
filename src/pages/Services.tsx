import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, Sparkles, ArrowRight, Filter } from "lucide-react";
import type { Variants } from "framer-motion";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  image_url: string | null;
  category_id: string | null;
  service_categories: { name: string; slug: string } | null;
}

export default function Services() {
  const [params, setParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const categorySlug = params.get("category") ?? "all";

  useEffect(() => {
    supabase.from("service_categories").select("id,name,slug").eq("is_active", true).then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      let q = supabase
        .from("services")
        .select("*, service_categories(name, slug)")
        .eq("is_active", true);

      if (categorySlug !== "all") {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (search) q = q.ilike("title", `%${search}%`);

      const { data } = await q;
      setServices((data as any) ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [categorySlug, search, categories]);

  function updateParam(key: string, val: string) {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next);
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-sky-50" />
        <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="container relative py-16 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-2 mb-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="h-5 w-5 text-cyan-600" />
              </motion.div>
              <span className="text-sm font-semibold text-cyan-700">Explore 1000+ services</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-gradient mb-4">
              Find trusted professionals
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">
              From home care to business services — book vetted experts instantly with secure payments and real-time tracking.
            </p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid md:grid-cols-2 gap-3 max-w-2xl mb-8"
          >
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-cyan-600" />
              <Input
                placeholder="Search services…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 border-slate-200 rounded-xl transition-all focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <Select value={categorySlug} onValueChange={(v) => updateParam("category", v === "all" ? "" : v)}>
                <SelectTrigger className="h-11 border-slate-200 rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Category Pills */}
          {categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-2"
            >
              {[{ id: "all", name: "All", slug: "all" }, ...categories].map((cat, idx) => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => updateParam("category", cat.slug === "all" ? "" : cat.slug)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${categorySlug === (cat.slug === "all" ? "all" : cat.slug)
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-200"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
                    }`}
                >
                  {cat.name}
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Services Grid */}
      <section className="container py-12">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="overflow-hidden h-full">
                    <Skeleton className="aspect-video" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : services.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center py-20">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <div className="text-6xl mb-4">🔍</div>
              </motion.div>
              <p className="text-xl font-semibold mb-2">No services found</p>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or explore all available services.</p>
              <Button onClick={() => { setSearch(""); updateParam("category", ""); }} className="rounded-full">
                <Sparkles className="mr-2 h-4 w-4" /> View All Services
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {services.map((s) => (
                <motion.div key={s.id} variants={itemVariants}>
                  <Link to={`/services/${s.id}`}>
                    <motion.div whileHover={{ y: -8 }} whileTap={{ scale: 0.98 }}>
                      <Card className="overflow-hidden hover:shadow-elevated transition-shadow h-full flex flex-col cursor-pointer group">
                        <div className="aspect-video bg-gradient-soft flex items-center justify-center overflow-hidden relative">
                          {s.image_url ? (
                            <>
                              <img src={s.image_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </>
                          ) : (
                            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                              <span className="text-5xl">🛠️</span>
                            </motion.div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          {s.service_categories && (
                            <motion.div whileHover={{ scale: 1.05 }} className="mb-3">
                              <Badge variant="secondary" className="group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors">
                                {s.service_categories.name}
                              </Badge>
                            </motion.div>
                          )}
                          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-cyan-700 transition-colors">{s.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{s.description}</p>
                          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{s.duration_minutes}m</span>
                            </div>
                            <motion.div whileHover={{ gap: "0.5rem" }} className="flex items-center gap-0">
                              <div className="text-lg font-bold text-primary">${Number(s.price).toFixed(2)}</div>
                              <ArrowRight className="h-4 w-4 text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        {!loading && services.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10 text-center">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-slate-900">{services.length}</span> service{services.length !== 1 ? "s" : ""}
              {categorySlug !== "all" && ` in ${categories.find((c) => c.slug === categorySlug)?.name}`}
            </p>
          </motion.div>
        )}
      </section>
    </PublicLayout>
  );
}
