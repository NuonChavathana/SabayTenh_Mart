import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Facebook, Instagram, Send, Youtube, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PAYMENT_METHODS = [
  { name: "KHQR", color: "bg-blue-700" },
  { name: "ABA", color: "bg-blue-500" },
  { name: "ACLEDA", color: "bg-red-600" },
  { name: "Wing", color: "bg-purple-600" },
  { name: "Canadia", color: "bg-emerald-600" },
  { name: "Vattanac", color: "bg-indigo-600" },
  { name: "Cash", color: "bg-green-600" },
];

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* Newsletter */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <p className="font-bold text-white text-lg leading-tight">
              {t("Get Exclusive Deals!", "ទទួលការផ្ដល់ជូនពិសេស!")}
            </p>
            <p className="text-white/80 text-sm">
              {t("Subscribe for offers, new arrivals & flash sales", "ជាវសម្រាប់ប្រម៉ូ ទំនិញថ្មី និងការបញ្ចុះតម្លៃ")}
            </p>
          </div>
          <form className="flex gap-2 w-full sm:w-auto" onSubmit={e => e.preventDefault()}>
            <Input
              placeholder={t("Your email address", "អ៊ីមែលរបស់អ្នក")}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 w-full sm:w-64 h-9"
            />
            <Button type="submit" variant="secondary" size="sm" className="font-semibold whitespace-nowrap gap-1 shrink-0">
              {t("Subscribe", "ជាវ")} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Main grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-3">
              <span className="text-2xl font-bold text-white tracking-tight">SabayTenh</span>
              <p className="text-primary text-sm font-medium">សប្បាយទិញ</p>
            </div>
            <p className="text-sm leading-relaxed mb-5">
              {t(
                "Cambodia's #1 marketplace for groceries, electronics, fashion & more — delivered fast nationwide.",
                "ទីផ្សារ #1 របស់កម្ពុជាសម្រាប់គ្រឿងទំនិញ អេឡិចត្រូនិច ម៉ូត និងច្រើនទៀត — ដឹកជញ្ជូនលឿនទូទាំងប្រទេស។"
              )}
            </p>
            <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-2">{t("We Accept", "ទទួលការទូទាត់")}</p>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <span key={m.name} className={`${m.color} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>{m.name}</span>
              ))}
            </div>
          </div>

          {/* Shopping */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">{t("Shopping", "ទិញទំនិញ")}</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/products", en: "All Products", kh: "ផលិតផលទាំងអស់" },
                { href: "/products?featured=true", en: "Today's Deals", kh: "ការផ្ដល់ជូនថ្ងៃនេះ" },
                { href: "/products", en: "New Arrivals", kh: "ទំនិញថ្មី" },
                { href: "/products", en: "Best Sellers", kh: "លក់ដាច់បំផុត" },
                { href: "/category/electronics", en: "Electronics", kh: "អេឡិចត្រូនិច" },
                { href: "/category/groceries", en: "Groceries", kh: "គ្រឿងទំនិញ" },
                { href: "/category/beauty", en: "Beauty", kh: "ផលិតផលសម្រស់" },
              ].map(l => (
                <li key={l.href + l.en}>
                  <Link href={l.href} className="hover:text-primary transition-colors">{t(l.en, l.kh)}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">{t("Customer Service", "សេវាអតិថិជន")}</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/", en: "Help Center", kh: "មជ្ឈមណ្ឌលជំនួយ" },
                { href: "/orders", en: "Track My Order", kh: "តាមដានការបញ្ជា" },
                { href: "/", en: "Returns & Refunds", kh: "ត្រឡប់ & សងប្រាក់" },
                { href: "/", en: "Shipping Policy", kh: "គោលការណ៍ដឹក" },
                { href: "/", en: "Payment FAQ", kh: "សំណួរទូទាត់" },
                { href: "/account", en: "My Account", kh: "គណនីខ្ញុំ" },
                { href: "/", en: "Report a Problem", kh: "រាយការណ៍បញ្ហា" },
              ].map((l, i) => (
                <li key={i}>
                  <Link href={l.href} className="hover:text-primary transition-colors">{t(l.en, l.kh)}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">{t("About", "អំពី")}</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/", en: "Our Story", kh: "រឿងរ៉ាវរបស់យើង" },
                { href: "/", en: "Careers", kh: "ការងារ" },
                { href: "/", en: "Press & Media", kh: "សារព័ត៌មាន" },
                { href: "/", en: "Blog", kh: "ប្លុក" },
                { href: "/", en: "Sell on SabayTenh", kh: "លក់នៅ SabayTenh" },
                { href: "/", en: "Affiliate Program", kh: "កម្មវិធីភ្ជាប់" },
                { href: "/admin", en: "Admin Panel", kh: "ផ្ទាំងរដ្ឋបាល" },
              ].map((l, i) => (
                <li key={i}>
                  <Link href={l.href} className="hover:text-primary transition-colors">{t(l.en, l.kh)}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Social */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">{t("Contact", "ទំនាក់ទំនង")}</h4>
            <ul className="space-y-3 text-sm mb-5">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{t("Phnom Penh, Cambodia", "ភ្នំពេញ, កម្ពុជា")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>+855 23 123 456</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span>hello@sabaytenh.com</span>
              </li>
            </ul>
            <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-3">{t("Follow Us", "តាមដានយើង")}</p>
            <div className="flex gap-3">
              {[
                { Icon: Facebook, label: "Facebook", color: "hover:text-blue-500" },
                { Icon: Instagram, label: "Instagram", color: "hover:text-pink-400" },
                { Icon: Send, label: "Telegram", color: "hover:text-sky-400" },
                { Icon: Youtube, label: "YouTube", color: "hover:text-red-500" },
              ].map(({ Icon, label, color }) => (
                <button key={label} aria-label={label} className={`text-gray-600 ${color} transition-colors`}>
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} SabayTenh (សប្បាយទិញ). {t("All rights reserved.", "រក្សាសិទ្ធគ្រប់យ៉ាង។")}</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-gray-400 transition-colors">{t("Privacy Policy", "ឯកជនភាព")}</Link>
            <Link href="/" className="hover:text-gray-400 transition-colors">{t("Terms of Use", "លក្ខខណ្ឌ")}</Link>
            <Link href="/" className="hover:text-gray-400 transition-colors">{t("Cookie Policy", "គូគី")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
