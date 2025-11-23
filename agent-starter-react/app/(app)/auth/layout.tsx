import { BookOpen } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 opacity-70 mix-blend-multiply blur-xl filter"></div>
        <div className="animate-blob animation-delay-2000 absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-70 mix-blend-multiply blur-xl filter"></div>
        <div className="animate-blob animation-delay-4000 absolute top-40 left-40 h-80 w-80 rounded-full bg-gradient-to-br from-pink-200 to-blue-200 opacity-70 mix-blend-multiply blur-xl filter"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
                BookWise
              </h1>
              <p className="text-sm font-medium text-gray-600">AI Sales Assistant</p>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="border-gradient-to-r rounded-2xl border bg-gradient-to-br from-blue-200/50 from-white/95 via-blue-50/30 to-purple-50/20 to-purple-200/50 p-8 shadow-xl backdrop-blur-sm">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">Secure authentication powered by BookWise AI</p>
        </div>
      </div>
    </div>
  );
}
