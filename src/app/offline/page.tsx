'use client';

/**
 * Booking App Offline Page
 * 
 * Displays when user is offline and accessing a non-cached page.
 * To remove: Delete this folder and update sw.js fallback
 */
export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                {/* Offline Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">You&apos;re Offline</h1>
                <p className="text-gray-400 mb-6">
                    No internet connection. Check your connection and try again.
                </p>

                {/* Retry Button */}
                <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                    Try Again
                </button>

                {/* What's Available */}
                <div className="mt-8 p-4 bg-gray-900 rounded-xl">
                    <h2 className="text-sm font-semibold text-white mb-2">Available Offline:</h2>
                    <ul className="text-sm text-gray-400 space-y-1 text-left">
                        <li>• Previously viewed café pages</li>
                        <li>• Cached booking history</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
