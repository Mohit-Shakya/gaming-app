// src/components/CafeDetailsAccordion.tsx
"use client";

import { useState } from "react";
import {
  Clock,
  Flame,
  Gamepad2,
  Tag,
  Monitor,
  Cpu,
  Gauge,
  MemoryStick,
  HardDrive,
  Headphones,
  Maximize,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Award,
  Shield,
  Coffee,
  Sparkles
} from "lucide-react";

type CafeDetailsAccordionProps = {
  opening_hours?: string | null;
  peak_hours?: string | null;
  popular_games?: string | null;
  offers?: string | null;
  monitor_details?: string | null;
  processor_details?: string | null;
  gpu_details?: string | null;
  ram_details?: string | null;
  ssd_details?: string | null;
  accessories_details?: string | null;
  screen_size?: string | null;
  show_tech_specs?: boolean;
};

type SectionId = "highlights" | "specs" | null;

export default function CafeDetailsAccordion(props: CafeDetailsAccordionProps) {
  const [openSection, setOpenSection] = useState<SectionId>("highlights");

  const toggle = (id: SectionId) =>
    setOpenSection((current) => (current === id ? null : id));

  const hasHighlights =
    props.opening_hours ||
    props.peak_hours ||
    props.popular_games ||
    props.offers;

  const hasDeviceSpecs =
    props.show_tech_specs !== false &&
    (props.monitor_details ||
      props.processor_details ||
      props.gpu_details ||
      props.ram_details ||
      props.ssd_details ||
      props.accessories_details ||
      props.screen_size);

  if (!hasHighlights && !hasDeviceSpecs) return null;

  // Highlight items config with Lucide icons
  const highlightItems = [
    { 
      key: "opening_hours", 
      icon: <Clock className="w-4 h-4" />, 
      label: "Opening Hours", 
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10"
    },
    { 
      key: "peak_hours", 
      icon: <Flame className="w-4 h-4" />, 
      label: "Peak Hours", 
      color: "text-orange-400",
      bgColor: "bg-orange-400/10"
    },
    { 
      key: "popular_games", 
      icon: <Gamepad2 className="w-4 h-4" />, 
      label: "Popular Games", 
      color: "text-red-400",
      bgColor: "bg-red-400/10"
    },
    { 
      key: "offers", 
      icon: <Tag className="w-4 h-4" />, 
      label: "Special Offers", 
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10"
    },
  ];

  // Spec items config with Lucide icons
  const specItems = [
    { 
      key: "monitor_details", 
      icon: <Monitor className="w-4 h-4" />, 
      label: "Monitor" 
    },
    { 
      key: "screen_size", 
      icon: <Maximize className="w-4 h-4" />, 
      label: "Screen Size" 
    },
    { 
      key: "processor_details", 
      icon: <Cpu className="w-4 h-4" />, 
      label: "Processor" 
    },
    { 
      key: "gpu_details", 
      icon: <Gauge className="w-4 h-4" />, 
      label: "Graphics Card" 
    },
    { 
      key: "ram_details", 
      icon: <MemoryStick className="w-4 h-4" />, 
      label: "RAM" 
    },
    { 
      key: "ssd_details", 
      icon: <HardDrive className="w-4 h-4" />, 
      label: "Storage" 
    },
    { 
      key: "accessories_details", 
      icon: <Headphones className="w-4 h-4" />, 
      label: "Accessories" 
    },
  ];

  return (
    <>
      <style jsx global>{`
        .details-section {
          background: linear-gradient(145deg, 
            rgba(18, 18, 24, 0.95) 0%, 
            rgba(14, 14, 18, 0.98) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .accordion-header {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .accordion-header:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .highlight-card {
          background: linear-gradient(145deg, 
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .highlight-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255, 7, 58, 0.3), 
            transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .highlight-card:hover::before {
          opacity: 1;
        }

        .highlight-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 
            0 8px 30px rgba(0, 0, 0, 0.2),
            0 0 20px rgba(255, 7, 58, 0.05);
        }

        .spec-item {
          background: linear-gradient(145deg, 
            rgba(255, 255, 255, 0.02) 0%,
            rgba(255, 255, 255, 0.005) 100%);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.2s ease;
        }

        .spec-item:hover {
          background: rgba(0, 240, 255, 0.05);
          border-color: rgba(0, 240, 255, 0.2);
          transform: translateX(4px);
        }

        .icon-container {
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.1) 0%,
            rgba(255, 7, 58, 0.1) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }

        .accordion-content {
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 7, 58, 0.3);
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 7, 58, 0.5);
          }
        }
      `}</style>

      <section className="details-section rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#ff073a]/20 to-[#00f0ff]/20">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 
              className="text-base font-bold text-white tracking-wide"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              CAFÉ DETAILS
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
              Essential information and technical specifications
            </p>
          </div>
        </div>

        {/* Highlights Section */}
        {hasHighlights && (
          <div className="border-b border-white/10">
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => toggle("highlights")}
              className={`accordion-header w-full flex items-center justify-between p-5 ${
                openSection === "highlights" 
                  ? "bg-gradient-to-r from-[#ff073a]/5 to-transparent" 
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${openSection === "highlights" ? "bg-[#ff073a]/20" : "bg-white/5"}`}>
                  <Zap className="w-5 h-5 text-[#ff073a]" />
                </div>
                <div className="text-left">
                  <h3 
                    className="text-sm font-bold text-white"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Top Highlights
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Key information about this gaming café
                  </p>
                </div>
              </div>
              <div className={`p-2 rounded-lg transition-all ${
                openSection === "highlights" 
                  ? "bg-[#ff073a]/20 rotate-180" 
                  : "bg-white/5"
              }`}>
                {openSection === "highlights" ? (
                  <ChevronUp className="w-4 h-4 text-[#ff073a]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </div>
            </button>

            {/* Accordion Content */}
            {openSection === "highlights" && (
              <div className="accordion-content px-5 pb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {highlightItems.map((item) => {
                    const value = props[item.key as keyof CafeDetailsAccordionProps];
                    if (!value) return null;

                    return (
                      <div
                        key={item.key}
                        className="highlight-card p-4 rounded-xl group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-lg ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform`}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span 
                                className={`text-xs font-bold uppercase tracking-wide ${item.color}`}
                                style={{ fontFamily: 'Inter, sans-serif' }}
                              >
                                {item.label}
                              </span>
                              {item.key === "offers" && (
                                <span className="text-[10px] bg-gradient-to-r from-[#ff073a] to-[#00f0ff] text-white px-2 py-0.5 rounded-full font-bold">
                                  SPECIAL
                                </span>
                              )}
                            </div>
                            <p 
                              className="text-sm text-zinc-300 leading-relaxed"
                              style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                              {value}
                            </p>
                            {/* Special indicator for popular games */}
                            {item.key === "popular_games" && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <Award className="w-3 h-3 text-yellow-400" />
                                <span className="text-[10px] text-zinc-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Most played games
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Additional Features */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#00f0ff]" />
                    <span className="text-xs font-semibold text-zinc-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Additional Features
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs text-zinc-300">
                      <Shield className="w-3 h-3" />
                      Premium Security
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs text-zinc-300">
                      <Coffee className="w-3 h-3" />
                      Refreshments Available
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs text-zinc-300">
                      <Headphones className="w-3 h-3" />
                      Premium Audio
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Device Specifications Section */}
        {hasDeviceSpecs && (
          <div>
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => toggle("specs")}
              className={`accordion-header w-full flex items-center justify-between p-5 ${
                openSection === "specs" 
                  ? "bg-gradient-to-r from-[#00f0ff]/5 to-transparent" 
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${openSection === "specs" ? "bg-[#00f0ff]/20" : "bg-white/5"}`}>
                  <Cpu className="w-5 h-5 text-[#00f0ff]" />
                </div>
                <div className="text-left">
                  <h3 
                    className="text-sm font-bold text-white"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Device Specifications
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Technical details of gaming equipment
                  </p>
                </div>
              </div>
              <div className={`p-2 rounded-lg transition-all ${
                openSection === "specs" 
                  ? "bg-[#00f0ff]/20 rotate-180" 
                  : "bg-white/5"
              }`}>
                {openSection === "specs" ? (
                  <ChevronUp className="w-4 h-4 text-[#00f0ff]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </div>
            </button>

            {/* Accordion Content */}
            {openSection === "specs" && (
              <div className="accordion-content px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {specItems.map((item) => {
                    const value = props[item.key as keyof CafeDetailsAccordionProps];
                    if (!value) return null;

                    return (
                      <div
                        key={item.key}
                        className="spec-item p-4 rounded-xl group flex items-center gap-3"
                      >
                        <div className="icon-container p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div 
                            className="text-xs text-zinc-400 uppercase tracking-wide mb-1"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {item.label}
                          </div>
                          <div 
                            className="text-sm font-medium text-white truncate group-hover:text-[#00f0ff] transition-colors"
                            style={{ fontFamily: 'Orbitron, sans-serif' }}
                          >
                            {value}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Performance Indicator */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-[#ff073a]" />
                      <span className="text-xs font-semibold text-zinc-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Performance Rating
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="w-2 h-4 rounded-sm bg-gradient-to-b from-[#ff073a] to-[#ff073a]/60"></div>
                      ))}
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#ff073a] to-[#00f0ff] rounded-full"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>Basic</span>
                    <span>Premium Gaming Experience</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Sections Open State */}
        {!openSection && (
          <div className="p-5 text-center">
            <div className="p-3 rounded-lg bg-gradient-to-br from-[#ff073a]/10 to-[#00f0ff]/10 inline-block mb-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Tap on a section above to view details
            </p>
          </div>
        )}
      </section>
    </>
  );
}