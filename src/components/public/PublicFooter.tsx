import { Link } from "react-router-dom";

const SOCIALS = [
  { label: "Instagram (Billy)", href: "https://www.instagram.com/billyw6160/" },
  { label: "Instagram (Atlas)", href: "https://www.instagram.com/atlas.ux/" },
  { label: "Instagram (BNW)", href: "https://www.instagram.com/bnwservicesllc/" },
  { label: "Instagram (ShortyPro)", href: "https://www.instagram.com/shortypro2/" },
  { label: "Instagram (BuffaloHerde)", href: "https://www.instagram.com/buffaloherde/" },
  { label: "Instagram (Dead App)", href: "https://www.instagram.com/deadapppro/" },
  { label: "LinkedIn (Billy)", href: "https://www.linkedin.com/in/ruralcowboy/" },
  { label: "LinkedIn (Company)", href: "https://www.linkedin.com/company/109020222" },
  { label: "LinkedIn (Company 2)", href: "https://www.linkedin.com/company/111775077" },
  { label: "Reddit", href: "https://www.reddit.com/user/Buffaloherde/" },
  { label: "Facebook (Billy)", href: "https://www.facebook.com/billy.whited" },
  { label: "Facebook (Page 1)", href: "https://www.facebook.com/profile.php?id=61587240537503" },
  { label: "Facebook (Page 2)", href: "https://www.facebook.com/profile.php?id=61579847101347" },
  { label: "Facebook (Page 3)", href: "https://www.facebook.com/profile.php?id=61587397650302" },
  { label: "Facebook (Page 4)", href: "https://www.facebook.com/profile.php?id=61587277436466" },
  { label: "Facebook (Page 5)", href: "https://www.facebook.com/profile.php?id=61587632936653" },
  { label: "Facebook (Page 6)", href: "https://www.facebook.com/profile.php?id=61587085441982" },
  { label: "WhatsApp", href: "https://whatsapp.com/channel/0029Vb7pxOu0LKZCAyaXet3H" },
  { label: "X (BuffaloHerde)", href: "https://x.com/buffaloherde" },
  { label: "X (Atlas UX)", href: "https://x.com/atlas_ux" },
  { label: "X (ShortyPro)", href: "https://x.com/shortypro2" },
  { label: "Pinterest", href: "https://www.pinterest.com/bbwhited" },
  { label: "Alignable", href: "https://alignable.com/saint-joseph-mo/bnw-services-llc" },
  { label: "Tumblr", href: "https://buffaloherde.tumblr.com" },
  { label: "Threads (BuffaloHerde)", href: "https://threads.com/@buffaloherde" },
  { label: "Threads (Atlas UX)", href: "https://threads.com/@atlas.ux" },
  { label: "Threads (Dead App)", href: "https://threads.com/@deadapppro" },
  { label: "TikTok (BuffaloHerde)", href: "https://www.tiktok.com/@buffaloherde" },
  { label: "TikTok (ShortyPro)", href: "https://www.tiktok.com/@shortypro2" },
  { label: "TikTok (Viral Dead)", href: "https://www.tiktok.com/@viraldeadengine" },
  { label: "Telegram", href: "https://t.me/@Buffaloherde" },
  { label: "YouTube (Billy)", href: "https://www.youtube.com/@billywhited4442" },
  { label: "YouTube (ShortyPro)", href: "https://www.youtube.com/@ShortyPro2" },
  { label: "YouTube (Viral Dead)", href: "https://www.youtube.com/@viraldeadengine" },
  { label: "YouTube (BuffaloHerde)", href: "https://www.youtube.com/@buffaloherde4170" },
  { label: "Twitch", href: "https://twitch.tv/buffaloherde" },
  { label: "Discord", href: "https://discord.com/users/609924892657451008" },
];

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-sm text-slate-400">
      <div className="mx-auto max-w-6xl px-6 pt-8 pb-10">
      <div className="flex flex-wrap gap-6 justify-center">
        <Link to="/about" className="hover:text-white">About</Link>
        <Link to="/blog" className="hover:text-white">Blog</Link>
        <Link to="/store" className="hover:text-white">Store</Link>
        <Link to="/payment" className="hover:text-white">Payment</Link>
        <Link to="/privacy" className="hover:text-white">Privacy</Link>
        <Link to="/terms" className="hover:text-white">Terms</Link>
        <Link to="/acceptable-use" className="hover:text-white">Acceptable Use</Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
        {SOCIALS.map((s) => (
          <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="hover:text-white">
            {s.label}
          </a>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Atlas UX &mdash; a product of DEAD APP CORP, a Missouri closed corporation owned by THE DEAD APP CORP TRUST. All rights reserved.
      </p>
      </div>
    </footer>
  );
}
