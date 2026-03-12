import React, { useState } from "react";

const BUSINESS_TYPES = [
  "Salon/Barber",
  "Plumber/HVAC",
  "Dentist/Medical",
  "Electrician",
  "Auto Mechanic",
  "Other",
];

const SELLING_POINTS = [
  "First 50 customers get grandfathered pricing",
  "Personal onboarding call with Billy",
  "Lucy answering within 24 hours",
  "30-day money-back guarantee",
];

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#69b2cd] mt-0.5 shrink-0"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const inputClass =
  "w-full bg-[#0e1626] border border-[#3d5474]/30 rounded-xl px-4 py-3 text-white placeholder-[#3d5474] focus:border-cyan-500/50 focus:outline-none transition-colors";

export default function EarlyAccessForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const body = { name, email, phone, businessName, businessType, message };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/v1/leads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw new Error("Request failed");
      setSuccess(true);
    } catch {
      // Fallback: open mailto link
      const mailBody = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nBusiness: ${businessName}\nType: ${businessType}\n\n${message}`
      );
      window.location.href = `mailto:billy@deadapp.info?subject=Lucy%20Setup&body=${mailBody}`;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-[#080c18] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="gradient-text text-glow">Get Lucy Answering Your Phone</span>
          </h2>
          <p className="text-[#bab2b5] text-lg max-w-xl mx-auto">
            Join our first 50 customers and lock in founder pricing forever.
          </p>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">

          {/* Left: form */}
          <div>
            {success ? (
              <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-8 text-center">
                <div className="text-5xl mb-4">✓</div>
                <h3 className="text-2xl font-bold text-white mb-3">You're in!</h3>
                <p className="text-[#bab2b5] leading-relaxed">
                  We'll text you within 24 hours to get Lucy set up for your business.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-[#bab2b5] mb-1.5">
                    Full Name <span className="text-[#69b2cd]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className={inputClass}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#bab2b5] mb-1.5">
                    Email <span className="text-[#69b2cd]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@yourbusiness.com"
                    className={inputClass}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#bab2b5] mb-1.5">
                    Phone Number <span className="text-[#69b2cd]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-xs text-[#3d5474]">
                    So we can text you setup instructions
                  </p>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-[#bab2b5] mb-1.5">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Smith & Sons Plumbing"
                    className={inputClass}
                  />
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-sm font-medium text-[#bab2b5] mb-1.5">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled className="bg-[#0e1626]">
                      Select your industry…
                    </option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#0e1626]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-[#bab2b5] mb-1.5">
                    Anything else we should know?
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your business, call volume, specific needs…"
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] text-white font-bold py-4 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {submitting ? "Sending…" : "Get Lucy Set Up for My Business"}
                </button>
              </form>
            )}
          </div>

          {/* Right: selling points */}
          <div className="lg:pt-2">
            <h3 className="text-2xl font-bold text-white mb-6">
              What you get when you sign up
            </h3>
            <ul className="space-y-5">
              {SELLING_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-[#bab2b5] leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>

            {/* Trust note */}
            <div className="mt-10 rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-6">
              <p className="text-sm text-[#bab2b5] leading-relaxed">
                <span className="text-white font-semibold">No contracts. No setup fees.</span>{" "}
                Cancel anytime. We're so confident Lucy will pay for itself that we offer a
                full 30-day refund if you're not satisfied.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
