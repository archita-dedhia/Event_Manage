import { useRouteError, Link } from "react-router";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen bg-[#0a0d1f] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">Oops! Something went wrong</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          An unexpected error occurred. Don't worry, our team has been notified.
          {error.statusText || error.message ? (
            <span className="block mt-2 text-sm font-mono text-red-400/60 bg-red-400/5 p-3 rounded-xl border border-red-400/10">
              Error: {error.statusText || error.message}
            </span>
          ) : null}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02]"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <Link 
            to="/"
            className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
