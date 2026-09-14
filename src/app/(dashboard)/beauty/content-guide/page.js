import { Droplets, Sparkles, FlaskConical, ListChecks, BookOpen, AlertTriangle, Flag } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

const TYPES = [
  { icon: Droplets, name: "نوع پوست", role: "نقطه شروع؛ خواننده خودش را اینجا پیدا می‌کند" },
  { icon: Sparkles, name: "دغدغه پوستی", role: "مسئله‌ای که خواننده می‌خواهد حل کند" },
  { icon: FlaskConical, name: "ترکیب", role: "پاسخ به «این ماده چیست و چه‌کار می‌کند»" },
  { icon: ListChecks, name: "روتین", role: "راه‌حل آماده و مرحله‌به‌مرحله" },
  { icon: BookOpen, name: "راهنما / مقاله", role: "محتوای روایی؛ همه‌چیز را می‌تواند کنار هم بیاورد" },
];

const MATRIX_COLUMNS = ["نوع پوست", "دغدغه پوستی", "ترکیب", "روتین", "راهنما"];

const MATRIX_ROWS = [
  { label: "نوع پوست", cells: [null, "commonConcerns", "relatedIngredients", "relatedRoutines", "relatedBlogTags"] },
  { label: "دغدغه پوستی", cells: ["relatedSkinTypes", "relatedConcerns", "relatedIngredients", "relatedRoutines", "relatedBlogTags"] },
  { label: "ترکیب", cells: ["relatedSkinTypes", "relatedConcerns", "relatedIngredients", "relatedRoutines", "—"] },
  { label: "روتین", cells: ["targetSkinTypes", "targetConcerns", "—", "—", "—"] },
  { label: "راهنما", cells: ["—", "—", "—", "—", "—"] },
];

function FieldBadge({ value, diag }) {
  if (!value) {
    return <span className={diag ? "text-[var(--text-faint)]" : ""}>{diag ? "—" : ""}</span>;
  }
  if (value === "—") {
    return <span className="text-[var(--text-faint)]">—</span>;
  }
  return (
    <span
      dir="ltr"
      className="inline-block rounded-md border border-[var(--brand-100)] bg-[var(--brand-50)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--brand-700)]"
    >
      {value}
    </span>
  );
}

function ProfileCard({ model, title, role, fields, relations, note }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-bold text-[var(--text)]">{title}</h3>
          <span dir="ltr" className="font-mono text-[11px] text-[var(--text-faint)]">
            {model}
          </span>
        </div>
        <p className="mb-5 text-sm text-[var(--text-muted)]">{role}</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2.5 text-xs font-semibold tracking-wide text-[var(--text-faint)]">فیلدهای محتوایی</h4>
            <ul className="flex flex-col gap-2.5">
              {fields.map((f, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-2 text-[13.5px]">
                  {f.name && (
                    <span dir="ltr" className="shrink-0 rounded-md bg-[var(--brand-50)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--brand-700)]">
                      {f.name}
                    </span>
                  )}
                  <span className="text-[var(--text-muted)]">{f.desc}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2.5 text-xs font-semibold tracking-wide text-[var(--text-faint)]">ارتباط‌هایی که ثبت می‌کنید</h4>
            <ul className="flex flex-col gap-2.5">
              {relations.map((r, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[13.5px] text-[var(--text)]">
                  <span className="text-[var(--text-faint)]">←</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            {note && <p className="mt-3 text-[12.5px] text-[var(--text-faint)]">{note}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BeautyContentGuidePage() {
  return (
    <div>
      <PageHeader
        title="نقشه محتوای دانشنامه زیبایی"
        subtitle="راهنمای مدیر محتوا و متخصص‌ها — دانشنامه زیبایی از ۵ نوع محتوای به‌هم‌مرتبط ساخته شده؛ این صفحه دقیقاً نشان می‌دهد هر صفحه باید به کدام صفحات دیگر وصل شود."
      />

      <div className="flex flex-col gap-10">
        {/* 5 types */}
        <section>
          <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">۵ نوع محتوا</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {TYPES.map(({ icon: Icon, name, role }) => (
              <Card key={name}>
                <CardContent className="flex flex-col items-center gap-2.5 p-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-600)]">
                    <Icon size={18} />
                  </div>
                  <div className="text-sm font-bold text-[var(--text)]">{name}</div>
                  <div className="text-[12px] leading-relaxed text-[var(--text-faint)]">{role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Matrix */}
        <section>
          <h3 className="mb-1 text-sm font-semibold text-[var(--text)]">نقشه ارتباط‌ها</h3>
          <p className="mb-4 max-w-2xl text-sm text-[var(--text-muted)]">
            هر سطر یک نوع محتواست که از آن صفحه لینک می‌گذارید؛ هر ستون مقصد آن لینک است. نام کنار هر خط، همان فیلدی‌ست که در فرم این پنل می‌بینید.
          </p>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-center text-[13px]">
              <thead>
                <tr className="bg-[var(--surface-muted)]">
                  <th className="border-b border-[var(--border)] p-3"></th>
                  {MATRIX_COLUMNS.map((c) => (
                    <th key={c} className="border-b border-s border-[var(--border)] p-3 font-bold text-[var(--text)]">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map((row, ri) => (
                  <tr key={row.label}>
                    <th className="whitespace-nowrap border-b border-[var(--border)] bg-[var(--surface-muted)] p-3 text-start font-bold text-[var(--text)]">
                      {row.label}
                    </th>
                    {row.cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`border-b border-s border-[var(--border)] p-3 ${ri === ci ? "bg-[var(--surface-muted)]" : ""}`}
                      >
                        <FieldBadge value={cell} diag={ri === ci} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="mt-3 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-[13.5px] text-[var(--text-muted)]">
            <Flag size={16} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
            <span>
              <b className="text-[var(--text)]">روتین و راهنما «فقط گیرنده» لینک‌اند</b> — این دو خودشان به بیرون لینک نمی‌سازند، فقط از سمت نوع پوست و
              دغدغه پوستی به آن‌ها اشاره می‌شود. یعنی اگر می‌خواهید صفحه یک روتین به یک ترکیب خاص اشاره کند، آن اتصال باید از صفحه همان ترکیب (یا نوع
              پوست/دغدغه) به روتین ثبت شود، نه برعکس.
            </span>
          </div>
        </section>

        {/* Profiles */}
        <section>
          <h3 className="mb-1 text-sm font-semibold text-[var(--text)]">جزئیات هر نوع محتوا</h3>
          <p className="mb-4 max-w-2xl text-sm text-[var(--text-muted)]">
            برای هر نوع، دو چیز لازم دارید: متنی که خودِ آن صفحه را می‌سازد، و لینک‌هایی که آن را به بقیه دانشنامه وصل می‌کند.
          </p>
          <div className="flex flex-col gap-4">
            <ProfileCard
              model="SkinType"
              title="نوع پوست"
              role="صفحه‌ای که خواننده با انتخاب نوع پوستش وارد دانشنامه می‌شود."
              fields={[
                { name: "shortDescription", desc: "معرفی یک‌خطی، برای کارت‌ها" },
                { name: "descriptionHtml", desc: "توضیح کامل این نوع پوست" },
                { name: "commonMistakes", desc: "اشتباهات رایج (کارت عنوان+توضیح)" },
                { name: "faq", desc: "سوالات متداول (پرسش+پاسخ)" },
              ]}
              relations={["دغدغه‌های شایع این نوع پوست", "ترکیبات مناسب این نوع پوست", "روتین‌های ساخته‌شده برای این نوع پوست", "راهنماها/مقالات مرتبط (با تگ/دسته وبلاگ)"]}
            />
            <ProfileCard
              model="SkinConcern"
              title="دغدغه پوستی"
              role="پرمصرف‌ترین قالب — پرچرب‌ترین صفحه در تعداد ارتباط با بقیه دانشنامه."
              fields={[
                { name: "whatIsItHtml", desc: "این دغدغه چیست" },
                { name: "whyItHappensHtml", desc: "چرا این اتفاق می‌افتد" },
                { name: "commonFactors", desc: "عوامل رایج (کارت‌های ساختاریافته)" },
                { name: "goodIngredients", desc: "ترکیبات توصیه‌شده (یادداشت درون‌متنی)" },
                { name: "avoidIngredients", desc: "ترکیباتی که باید پرهیز کرد" },
                { name: "routineSteps", desc: "روتین ساده درون‌صفحه‌ای (متنی)" },
                { name: "faq", desc: "سوالات متداول" },
              ]}
              relations={[
                "نوع پوست‌هایی که این دغدغه در آن‌ها شایع است",
                "ترکیبات مرتبط با این دغدغه",
                "دغدغه‌های دیگر که همراه این یکی می‌آیند",
                "روتین‌های کامل مخصوص این دغدغه",
                "راهنماها/مقالات مرتبط",
              ]}
            />
            <ProfileCard
              model="Ingredient"
              title="ترکیب"
              role="مرجع «این ماده چیست» — معمولاً از صفحه نوع پوست یا دغدغه به اینجا می‌رسند، نه برعکس."
              fields={[
                { name: "descriptionHtml", desc: "این ترکیب چیست" },
                { name: "commonUsesHtml", desc: "چرا در محصولات آرایشی استفاده می‌شود" },
                { name: "faq", desc: "سوالات متداول" },
              ]}
              relations={[
                "نوع پوست‌هایی که این ترکیب برایشان مناسب است",
                "دغدغه‌هایی که این ترکیب رفعشان می‌کند",
                "ترکیبات دیگری که خوب/بد ترکیب می‌شوند",
                "روتین‌هایی که این ترکیب در آن‌ها هست",
              ]}
            />
            <ProfileCard
              model="Routine"
              title="روتین"
              role="قالب مرحله‌به‌مرحله؛ خودش به چیزی لینک نمی‌سازد، فقط هدف‌گذاری می‌شود."
              fields={[
                { name: "introHtml", desc: "معرفی روتین" },
                { name: "steps[]", desc: "عنوان، توضیح و زمان هر مرحله (صبح/شب/هردو)" },
              ]}
              relations={["نوع پوست‌هایی که این روتین برایشان مناسب است", "دغدغه‌هایی که این روتین هدف گرفته"]}
              note={
                <>
                  نکته: لینک از سمت روتین به یک ترکیب خاص وجود ندارد — اگر لازم است، آن ترکیب باید در متن{" "}
                  <span dir="ltr" className="font-mono text-[11px]">steps[].description</span> نام برده شود.
                </>
              }
            />
            <ProfileCard
              model="Blog"
              title="راهنما / مقاله"
              role="تنها قالبی که آزادانه روایت می‌کند و همه‌چیز را به هم می‌بافد — اما گیرنده لینک است، نه فرستنده."
              fields={[{ desc: "متن کامل مقاله + برچسب و دسته وبلاگ (برای دیده‌شدن در صفحات دیگر)" }]}
              relations={["هیچ فیلد رابطه‌ای ندارد — دیده‌شدنش در صفحه نوع پوست/دغدغه، فقط با گذاشتن تگ/دسته درست تضمین می‌شود."]}
            />
          </div>
        </section>

        {/* Golden rule */}
        <section>
          <Card className="bg-[var(--warning-bg)]">
            <CardContent className="flex gap-4 p-6">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--warning)] text-white">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h3 className="mb-2 text-[15px] font-bold text-[var(--text)]">قانون طلایی ارتباط‌ها: دستی، نه خودکار</h3>
                <p className="mb-2.5 text-sm text-[var(--text)]">
                  هیچ ارتباطی نباید فقط به‌خاطر «شاید به‌درد بخورد» ثبت شود. هر لینکی که بین دو صفحه می‌گذارید باید پشتوانه محتوایی واقعی داشته باشد —
                  یعنی جایی در متن همان صفحه، این رابطه توضیح داده شده باشد.
                </p>
                <p className="mb-3 text-sm text-[var(--text)]">
                  مثال غلط: لینک‌کردن «نیاسینامید» به «پوست چرب» فقط چون هر دو محبوب‌اند. مثال درست: لینک‌کردن وقتی در متن ترکیب واقعاً نوشته‌اید
                  «نیاسینامید ترشح چربی پوست چرب را تنظیم می‌کند».
                </p>
                <p className="border-s-2 border-[var(--warning)] ps-3 text-[12.5px] text-[var(--text-muted)]">
                  برداشت از کامنت فنی تیم توسعه روی مدل ترکیب: «روابط دستی‌ست، نه استنتاج خودکار — فقط رابطه‌ای که واقعاً پشتوانه محتوایی دارد ثبت
                  شود.»
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Workflow */}
        <section>
          <h3 className="mb-1 text-sm font-semibold text-[var(--text)]">ترتیب پیشنهادی تولید محتوا</h3>
          <p className="mb-5 max-w-2xl text-sm text-[var(--text-muted)]">چون این پنج نوع به هم وابسته‌اند، نوشتن به این ترتیب از دوباره‌کاری جلوگیری می‌کند.</p>
          <Card>
            <CardContent className="flex flex-col gap-5 p-6">
              {[
                { title: "نوع‌های پوست و دغدغه‌های پوستی", desc: "این دو، اسکلت دانشنامه‌اند. تا این‌ها آماده نباشند، هیچ ترکیب یا روتینی چیزی برای اشاره‌کردن ندارد." },
                { title: "ترکیبات", desc: "هر ترکیب را مستقیم به نوع‌پوست/دغدغه‌ای که در مرحله قبل نوشتید وصل کنید — همان نکته‌ای که در متن آورده‌اید." },
                { title: "روتین‌ها", desc: "روتین‌ها ترکیب‌ها و دغدغه‌ها را در قالب مراحل روزانه کنار هم می‌گذارند؛ برای همین آخر نوشته می‌شوند." },
                { title: "راهنماها و مقالات", desc: "چون آزادترین قالب‌اند و می‌توانند به هر چهار نوع دیگر اشاره کنند، بهتر است آخر از همه نوشته شوند — وقتی همه صفحات دیگر برای لینک‌دادن آماده‌اند." },
                { title: "بازبینی اتصال‌ها", desc: "یک دور کامل، از نوع پوست شروع کنید و مطابق «نقشه ارتباط‌ها» بالا چک کنید هیچ لینک منطقی جا نمانده باشد." },
              ].map((step, i, arr) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--brand-300)] font-mono text-sm font-bold text-[var(--brand-600)]">
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && <div className="mt-1 w-px flex-1 bg-[var(--border)]" />}
                  </div>
                  <div className={i < arr.length - 1 ? "pb-1" : ""}>
                    <h4 className="mb-1 text-[15px] font-bold text-[var(--text)]">{step.title}</h4>
                    <p className="max-w-xl text-[13.5px] text-[var(--text-muted)]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <p className="border-t border-[var(--border)] pt-4 text-[12.5px] text-[var(--text-faint)]">
          این صفحه بر اساس ساختار فعلی مدل‌های Beauty Knowledge Hub (نوع پوست، دغدغه پوستی، ترکیب، روتین) نوشته شده و با هر تغییر در آن مدل‌ها باید
          به‌روزرسانی شود.
        </p>
      </div>
    </div>
  );
}
