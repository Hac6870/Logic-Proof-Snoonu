import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Pulse Dispatch",
    description: "Minimal Customer Journey Demo",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="bg-gray-100 flex justify-center min-h-screen">
                <div className="w-full max-w-[390px] bg-[#F8F8F8] min-h-screen shadow-2xl relative overflow-x-hidden font-sans text-text-primary">
                    {children}
                </div>
            </body>
        </html>
    );
}
