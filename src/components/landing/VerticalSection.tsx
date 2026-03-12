import React from "react";

function ScissorsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-8 h-8 text-[#69b2cd]"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-8 h-8 text-[#69b2cd]"
      aria-hidden="true"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function MedicalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-8 h-8 text-[#69b2cd]"
      aria-hidden="true"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

const CARDS = [
  {
    icon: <ScissorsIcon />,
    title: "Salons & Studios",
    valueProp:
      "Hair salons, barbers, tattoo artists, nail salons, spas, lash studios, and more — Lucy books while your hands are busy.",
    features:
      "Appointment booking · Service menu · Walk-in availability · Confirmation texts",
    cta: "See how Lucy works for salons →",
    ctaHref: "#/salons",
    ctaDisabled: false,
  },
  {
    icon: <WrenchIcon />,
    title: "Plumbers, HVAC & Electricians",
    valueProp:
      "Never lose a $300 service call. Lucy answers while you're on the job site.",
    features:
      "Emergency triage · Job detail capture · Callback scheduling · After-hours coverage",
    cta: "See how Lucy works for service pros →",
    ctaHref: "#/plumbers",
    ctaDisabled: false,
  },
  {
    icon: <MedicalIcon />,
    title: "Dentists & Medical",
    valueProp:
      "Lucy handles appointment requests, insurance questions, and routes emergencies.",
    features:
      "HIPAA aware · Appointment requests · Insurance routing · Emergency triage",
    cta: "Coming soon",
    ctaHref: null,
    ctaDisabled: true,
  },
];

export default function VerticalSection() {
  return (
    <section className="bg-[#0a0f1e] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="gradient-text text-glow">Built for Your Business</span>
          </h2>
          <p className="text-[#bab2b5] text-lg max-w-xl mx-auto">
            Lucy already knows how to handle calls for your industry.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-6 flex flex-col hover:border-[#3d5474]/60 transition"
            >
              {/* Icon */}
              <div className="mb-4">{card.icon}</div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>

              {/* Value prop */}
              <p className="text-white font-semibold text-sm mb-3 leading-relaxed">
                {card.valueProp}
              </p>

              {/* Features */}
              <p className="text-[#bab2b5] text-sm mb-6 leading-relaxed flex-1">
                {card.features}
              </p>

              {/* CTA */}
              {card.ctaDisabled ? (
                <span className="text-sm text-[#3d5474] font-medium">{card.cta}</span>
              ) : (
                <a
                  href={card.ctaHref!}
                  className="text-sm text-[#69b2cd] font-semibold hover:text-white transition-colors"
                >
                  {card.cta}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
