export interface NavigationSection {
  title: string;
  href: string;
  isActive?: boolean;
}

interface HeaderProps {
  navigationData: NavigationSection[];
}

export default function Header({ navigationData }: HeaderProps) {
  return (
    <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-white ml-2" />
        </div>
        <span className="font-bold text-xl tracking-tight text-neutral-900">
          shadcn<span className="font-normal text-neutral-500">space.</span>
        </span>
      </div>

      {/* Navigation Pills */}
      <nav className="hidden md:flex items-center bg-neutral-100/80 backdrop-blur-sm p-1 rounded-full border border-neutral-200/50 shadow-xs">
        {navigationData.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              item.isActive
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {item.title}
          </a>
        ))}
      </nav>

      {/* CTA Button */}
      <div>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm group"
        >
          <span>Let&apos;s Collaborate</span>
          <span className="w-6 h-6 rounded-full bg-white text-neutral-900 flex items-center justify-center text-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            ↗
          </span>
        </a>
      </div>
    </header>
  );
}
