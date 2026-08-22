import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const vazirmatn = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic"],
});

export const metadata = {
  title: "پنل مدیریت دلیسا",
  description: "پنل مدیریت فروشگاه دلیسا",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
