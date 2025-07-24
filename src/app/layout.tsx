import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Galerie d'Images Personnelle | Stockez et Organisez vos Photos",
  description: "Application moderne de galerie d'images avec authentification sécurisée. Stockez, organisez et partagez vos images préférées dans votre espace personnel.",
  keywords: ["galerie", "images", "photos", "upload", "stockage", "personnel"],
  authors: [{ name: "Votre Nom" }],
  openGraph: {
    title: "Galerie d'Images Personnelle",
    description: "Stockez et organisez vos images dans votre espace personnel sécurisé",
    type: "website",
  },
  viewport: "width=device-width, initial-scale=1",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="font-inter antialiased bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
        <AuthProvider>
          <div className="relative">
            {/* Background decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
            </div>
            
            {/* Main content */}
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
