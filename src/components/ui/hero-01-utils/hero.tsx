export interface AvatarList {
  image: string;
}

interface HeroProps {
  avatarList: AvatarList[];
}

export default function HeroSection({ avatarList }: HeroProps) {
  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden text-center">
      {/* Background radial gradient glow (soft blue & warm yellow matching design) */}
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] opacity-40 blur-3xl -z-10"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(186, 230, 253, 0.8) 0%, transparent 60%), radial-gradient(circle at 75% 45%, rgba(254, 240, 138, 0.7) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-neutral-900 leading-[1.1] mb-6">
          Building bold brands
          <br />
          with{" "}
          <span className="font-serif italic font-normal text-neutral-900">
            thoughtful design
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-neutral-600 text-base md:text-lg mb-10 leading-relaxed font-normal">
          At shadcn space, we help small startups tackle the world&apos;s biggest
          challenges with tailored solutions, guiding you from strategy to
          success in a competitive market.
        </p>

        {/* Action & Social Proof Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {/* CTA Button */}
          <a
            href="#get-started"
            className="inline-flex items-center gap-3 bg-neutral-950 hover:bg-neutral-800 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-md group"
          >
            <span>Get Started</span>
            <span className="w-6 h-6 rounded-full bg-white text-neutral-950 flex items-center justify-center text-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              ↗
            </span>
          </a>

          {/* Social Proof (Avatars + Stars) */}
          <div className="flex items-center gap-4">
            {/* Avatars Stack */}
            <div className="flex -space-x-2.5 overflow-hidden py-1">
              {avatarList.map((avatar, idx) => (
                <img
                  key={idx}
                  src={avatar.image}
                  alt={`User avatar ${idx + 1}`}
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-xs"
                />
              ))}
            </div>

            {/* Stars & Text */}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center text-amber-500 gap-0.5 text-sm">
                {"★★★★★"}
              </div>
              <span className="text-xs font-medium text-neutral-600 mt-0.5">
                Trusted by 1000+ clients
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
