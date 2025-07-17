import { Video } from "lucide-react";

interface NavigationProps {
  currentPage: string;
}

export function Navigation({ currentPage }: NavigationProps) {
  const pageNames = {
    '/': 'Login',
    '/dashboard': 'Dashboard',
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
              <Video className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">BintuNet</h1>
              <p className="text-xs text-gray-500">Live Stream Buddy</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-sky-50 text-sky-700 text-sm font-medium rounded-full border border-sky-200">
            {pageNames[currentPage as keyof typeof pageNames] || 'Login'}
          </div>
        </div>
      </div>
    </nav>
  );
}