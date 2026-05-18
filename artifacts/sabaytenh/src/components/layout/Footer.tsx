import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-card border-t py-12 mt-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link href="/" className="flex flex-col mb-4">
            <span className="text-2xl font-bold text-primary tracking-tight">SabayTenh</span>
            <span className="text-sm font-medium text-muted-foreground">សប្បាយទិញ</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(
              "Cambodia's premier online marketplace. Shop everything from daily groceries to the latest electronics.",
              "ទីផ្សារអនឡាញឈានមុខគេនៅកម្ពុជា។ ទិញទំនិញគ្រប់យ៉ាងចាប់ពីគ្រឿងទេសប្រចាំថ្ងៃរហូតដល់គ្រឿងអេឡិចត្រូនិកចុងក្រោយបំផុត។"
            )}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4">{t("Shop", "ទិញទំនិញ")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/products" className="hover:text-primary transition-colors">{t("All Products", "ផលិតផលទាំងអស់")}</Link></li>
            <li><Link href="/deals" className="hover:text-primary transition-colors">{t("Daily Deals", "ប្រូម៉ូសិនប្រចាំថ្ងៃ")}</Link></li>
            <li><Link href="/best-sellers" className="hover:text-primary transition-colors">{t("Best Sellers", "លក់ដាច់បំផុត")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4">{t("Customer Service", "សេវាកម្មអតិថិជន")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/account" className="hover:text-primary transition-colors">{t("My Account", "គណនីរបស់ខ្ញុំ")}</Link></li>
            <li><Link href="/orders" className="hover:text-primary transition-colors">{t("Track Order", "តាមដានការបញ្ជាទិញ")}</Link></li>
            <li><Link href="/support" className="hover:text-primary transition-colors">{t("Help Center", "មជ្ឈមណ្ឌលជំនួយ")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4">{t("Payment Methods", "វិធីសាស្រ្តទូទាត់")}</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="px-2 py-1 bg-muted rounded text-xs font-semibold">KHQR</div>
            <div className="px-2 py-1 bg-muted rounded text-xs font-semibold">ABA</div>
            <div className="px-2 py-1 bg-muted rounded text-xs font-semibold">WING</div>
            <div className="px-2 py-1 bg-muted rounded text-xs font-semibold">CASH</div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SabayTenh. {t("All rights reserved.", "រក្សាសិទ្ធិគ្រប់យ៉ាង។")}
      </div>
    </footer>
  );
}
