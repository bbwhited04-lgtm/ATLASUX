import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  FaInstagram,
  FaLinkedinIn,
  FaRedditAlien,
  FaFacebookF,
  FaWhatsapp,
  FaXTwitter,
  FaPinterestP,
  FaHandshake,
  FaTumblr,
  FaHashtag,
  FaTiktok,
  FaDiscord,
  FaYoutube,
  FaTwitch,
  FaGlobe,
} from "react-icons/fa6";
import { FiExternalLink } from "react-icons/fi";

type SocialProfile = {
  name: string;
  href: string;
  note?: string;
};

type SocialPlatform = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  profiles: SocialProfile[];
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "instagram",
    label: "Instagram",
    Icon: FaInstagram,
    profiles: [
      { name: "Billy", href: "https://www.instagram.com/billyw6160/" },
      { name: "Atlas UX", href: "https://www.instagram.com/atlas.ux/" },
      { name: "BNW Services", href: "https://www.instagram.com/bnwservicesllc/" },
      { name: "ShortyPro", href: "https://www.instagram.com/shortypro2/" },
      { name: "BuffaloHerde", href: "https://www.instagram.com/buffaloherde/" },
      { name: "DeadApp Pro", href: "https://www.instagram.com/deadapppro/" },
    ],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
    profiles: [
      { name: "Billy (Profile)", href: "https://www.linkedin.com/in/ruralcowboy/" },
      { name: "Company Page #1", href: "https://www.linkedin.com/company/109020222" },
      { name: "Company Page #2", href: "https://www.linkedin.com/company/111775077" },
    ],
  },
  {
    key: "reddit",
    label: "Reddit",
    Icon: FaRedditAlien,
    profiles: [{ name: "BuffaloHerde", href: "https://www.reddit.com/user/Buffaloherde/" }],
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: FaFacebookF,
    profiles: [
      { name: "Billy Whited", href: "https://www.facebook.com/billy.whited" },
      { name: "Profile 1", href: "https://www.facebook.com/profile.php?id=61587240537503" },
      { name: "Profile 2", href: "https://www.facebook.com/profile.php?id=61579847101347" },
      { name: "Profile 3", href: "https://www.facebook.com/profile.php?id=61587397650302" },
      { name: "Profile 4", href: "https://www.facebook.com/profile.php?id=61587277436466" },
      { name: "Profile 5", href: "https://www.facebook.com/profile.php?id=61587632936653" },
      { name: "Profile 6", href: "https://www.facebook.com/profile.php?id=61587085441982" },
    ],
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    Icon: FaWhatsapp,
    profiles: [
      { name: "BuffaloHerde Channel", href: "https://whatsapp.com/channel/0029Vb7pxOu0LKZCAyaXet3H" },
    ],
  },
  {
    key: "x",
    label: "X",
    Icon: FaXTwitter,
    profiles: [
      { name: "BuffaloHerde", href: "https://x.com/buffaloherde" },
      { name: "Atlas UX", href: "https://x.com/atlas_ux" },
      { name: "ShortyPro", href: "https://x.com/shortypro2" },
    ],
  },
  {
    key: "pinterest",
    label: "Pinterest",
    Icon: FaPinterestP,
    profiles: [{ name: "bbwhited", href: "https://www.pinterest.com/bbwhited" }],
  },
  {
    key: "alignable",
    label: "Alignable",
    Icon: FaHandshake,
    profiles: [{ name: "BNW Services LLC", href: "https://alignable.com/saint-joseph-mo/bnw-services-llc" }],
  },
  {
    key: "tumblr",
    label: "Tumblr",
    Icon: FaTumblr,
    profiles: [{ name: "buffaloherde", href: "https://buffaloherde.tumblr.com" }],
  },
  {
    key: "threads",
    label: "Threads",
    Icon: FaHashtag,
    profiles: [
      { name: "BuffaloHerde", href: "https://threads.com/@buffaloherde" },
      { name: "Atlas UX", href: "https://threads.com/@atlas.ux" },
      { name: "DeadApp Pro", href: "https://threads.com/@deadapppro" },
    ],
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: FaTiktok,
    profiles: [
      { name: "BuffaloHerde", href: "https://www.tiktok.com/@buffaloherde" },
      { name: "ShortyPro", href: "https://www.tiktok.com/@shortypro2" },
      { name: "ViralDead Engine", href: "https://www.tiktok.com/@viraldeadengine" },
    ],
  },
  {
    key: "discord",
    label: "Discord",
    Icon: FaDiscord,
    profiles: [{ name: "User Profile", href: "https://discord.com/users/609924892657451008" }],
  },
  {
    key: "telegram",
    label: "Telegram",
    Icon: Globe,
    profiles: [{ name: "BuffaloHerde", href: "https://t.me/@Buffaloherde" }],
  },
  {
    key: "youtube",
    label: "YouTube",
    Icon: FaYoutube,
    profiles: [
      { name: "Billy Whited", href: "https://www.youtube.com/@billywhited4442" },
      { name: "ShortyPro2", href: "https://www.youtube.com/@ShortyPro2" },
      { name: "ViralDead Engine", href: "https://www.youtube.com/@viraldeadengine" },
      { name: "BuffaloHerde", href: "https://www.youtube.com/@buffaloherde4170" },
    ],
  },
  {
    key: "twitch",
    label: "Twitch",
    Icon: FaTwitch,
    profiles: [{ name: "buffaloherde", href: "https://twitch.tv/buffaloherde" }],
  },
  {
    key: "web",
    label: "More",
    Icon: FaGlobe,
    profiles: [],
  },
];

function PlatformButton({
  platform,
  onClick,
}: {
  platform: SocialPlatform;
  onClick: () => void;
}) {
  const Icon = platform.Icon ?? FaGlobe;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-9 gap-2 rounded-full border-white/10 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white",
        "backdrop-blur"
      )}
      title={`${platform.label} (${platform.profiles.length})`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm">{platform.label}</span>
      {platform.profiles.length > 0 ? (
        <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
          {platform.profiles.length}
        </span>
      ) : null}
    </Button>
  );
}

export default function PublicFooter() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const activePlatform = useMemo(
    () => SOCIAL_PLATFORMS.find((p) => p.key === openKey) ?? null,
    [openKey]
  );

  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="text-lg font-semibold text-white">Atlas UX</div>
            <p className="text-sm text-white/70">
              Automations, listening, and workflows—built for real operators.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/"
                className="text-sm text-white/80 hover:text-white hover:underline"
              >
                Home
              </Link>
              <span className="text-white/30">·</span>
              <Link
                to="/privacy"
                className="text-sm text-white/80 hover:text-white hover:underline"
              >
                Privacy
              </Link>
              <span className="text-white/30">·</span>
              <Link
                to="/terms"
                className="text-sm text-white/80 hover:text-white hover:underline"
              >
                Terms
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold tracking-wide text-white/90">
              Social Profiles
            </div>
            <p className="text-sm text-white/60">
              Click a platform to choose the exact page/profile to visit.
            </p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_PLATFORMS.filter((p) => p.profiles.length > 0).map((p) => (
                <PlatformButton
                  key={p.key}
                  platform={p}
                  onClick={() => setOpenKey(p.key)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold tracking-wide text-white/90">
              Quick Links
            </div>
            <div className="grid gap-2">
              <a
                className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
                href="https://x.com/atlas_ux"
                target="_blank"
                rel="noreferrer"
              >
                <FaXTwitter className="h-4 w-4" /> Atlas UX on X{" "}
                <FiExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
              <a
                className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
                href="https://www.instagram.com/atlas.ux/"
                target="_blank"
                rel="noreferrer"
              >
                <FaInstagram className="h-4 w-4" /> Atlas UX on Instagram{" "}
                <FiExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
              <a
                className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
                href="https://www.youtube.com/@viraldeadengine"
                target="_blank"
                rel="noreferrer"
              >
                <FaYoutube className="h-4 w-4" /> ViralDead Engine on YouTube{" "}
                <FiExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
          <div className="text-xs text-white/50">
            © {new Date().getFullYear()} Atlas UX. All rights reserved.
          </div>
          <div className="text-xs text-white/40">
            Built by operators, for operators.
          </div>
        </div>
      </div>

      <Dialog open={!!openKey} onOpenChange={(v) => setOpenKey(v ? openKey : null)}>
        <DialogContent className="border-white/10 bg-black text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                {activePlatform ? (
                  <activePlatform.Icon className="h-4 w-4" />
                ) : (
                  <FaGlobe className="h-4 w-4" />
                )}
              </span>
              <span>{activePlatform?.label ?? "Social"} profiles</span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 grid gap-2">
            {(activePlatform?.profiles ?? []).map((profile) => (
              <a
                key={profile.href}
                href={profile.href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3",
                  "hover:bg-white/10"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    {profile.name}
                  </div>
                  <div className="truncate text-xs text-white/60">
                    {profile.href}
                  </div>
                </div>
                <span className="ml-3 inline-flex items-center gap-1 text-xs text-white/70 group-hover:text-white">
                  Open <FiExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
            ))}
          </div>

          <div className="mt-3 text-xs text-white/50">
            Tip: rename placeholder profiles (“Profile 1”, “Company Page #1”) once you confirm the real page names.
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
