import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Calendar, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [moodleId, setMoodleId] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  // If user is already logged in, redirect them to their dashboard
  // or provide a way to log out. For now, let's redirect.
  useEffect(() => {
    if (user) {
      if (user.user_type === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newFieldErrors = {};
    
    // Email validation
    if (!email.endsWith('@apsit.edu.in')) {
      newFieldErrors.email = "Please use your APSIT email address (@apsit.edu.in)";
    }

    // Moodle ID validation (numeric only)
    if (!/^\d+$/.test(moodleId)) {
      newFieldErrors.moodle_id = "Moodle ID must contain numbers only";
    } else if (moodleId.length !== 8) {
      newFieldErrors.moodle_id = "Moodle ID must be exactly 8 digits";
    }

    // Check that email prefix matches moodle ID 
    const emailPrefix = email.split('@')[0]; 
    if (emailPrefix !== moodleId) { 
      newFieldErrors.moodle_id = "Moodle ID must match the number in your email address"; 
      newFieldErrors.email = "Email must start with your Moodle ID (e.g. 24102073@apsit.edu.in)"; 
    }

    // Password validation
    if (password.length < 6) {
      newFieldErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
    }

    if (!fullName.trim()) {
      newFieldErrors.fullName = 'Full name is required';
    }

    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    // Clear any existing session before creating a new one
    logout();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      console.log('Attempting signup for:', email);
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          full_name: fullName,
          moodle_id: moodleId,
          department: department,
          // Backend will enforce that public signups are students only
          user_type: 'student',
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          // Extract messages from Pydantic validation errors
          const apiFieldErrors = {};
          data.detail.forEach(err => {
            const field = err.loc[err.loc.length - 1];
            apiFieldErrors[field] = err.msg;
          });
          setFieldErrors(apiFieldErrors);
          setError('Please correct the highlighted errors.');
        } else {
          setError(data.detail || 'Sign up failed. Please try again.');
        }
        return;
      }

      setSuccess('Account created successfully! Redirecting to login...');
      
      // Clear form
      setFullName('');
      setEmail('');
      setMoodleId('');
      setDepartment('');
      setPassword('');
      setConfirmPassword('');

      // Redirect after 1 second
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError('Connection error. Make sure the backend server is running on port 8000.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d1f] flex relative">
      {/* Logo moved to the top right */}
      <div className="absolute top-8 right-8 flex items-center gap-2 border-l border-white/10 pl-6 z-20">
        <span className="text-xl text-white tracking-tight hidden sm:inline">CampusEvents</span>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Calendar className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Left Side - Illustration/Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-900">
          <div className="absolute inset-0 opacity-30">
            {/* Animated gradient blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-lg flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10" />
            </div>
            <h2 className="text-5xl mb-6 leading-tight">Join CampusEvents</h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Create your account today and start discovering amazing campus events. Connect with thousands of students and experience unforgettable moments.
            </p>
            
            <div className="mt-12 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">✓</span>
                </div>
                <div>
                  <div className="mb-1">Easy Registration</div>
                  <div className="text-sm text-white/60">Sign up in just a few seconds</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">✓</span>
                </div>
                <div>
                  <div className="mb-1">Secure Account</div>
                  <div className="text-sm text-white/60">Your data is encrypted and protected</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">✓</span>
                </div>
                <div>
                  <div className="mb-1">Full Access</div>
                  <div className="text-sm text-white/60">Get instant access to all campus events</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Sign Up Card */}
          <div className="rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="text-3xl mb-2 text-white">Create Account</h1>
              <p className="text-gray-400">Join us and start exploring campus events</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm mb-2 text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border ${fieldErrors.fullName || fieldErrors.full_name ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
                    required
                  />
                </div>
                {(fieldErrors.fullName || fieldErrors.full_name) && (
                  <p className="mt-1 text-xs text-red-400 ml-1">{fieldErrors.fullName || fieldErrors.full_name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm mb-2 text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="moodleid@apsit.edu.in"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border ${fieldErrors.email ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-400 ml-1">{fieldErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Moodle ID Field */}
                <div>
                  <label htmlFor="moodleId" className="block text-sm mb-2 text-gray-300">
                    Moodle ID
                  </label>
                  <input
                    id="moodleId"
                    type="text"
                    required
                    value={moodleId}
                    onChange={(e) => setMoodleId(e.target.value)}
                    placeholder="ID Number"
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${fieldErrors.moodle_id ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
                  />
                  {fieldErrors.moodle_id && (
                    <p className="mt-1 text-xs text-red-400 ml-1">{fieldErrors.moodle_id}</p>
                  )}
                </div>

                {/* Department Field */}
                <div>
                  <label htmlFor="department" className="block text-sm mb-2 text-gray-300">
                    Department
                  </label>
                  <select
                    id="department"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-[#1a1d35] border ${fieldErrors.department ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20'} text-white focus:outline-none focus:ring-2 transition-all`}
                  >
                    <option value="" disabled>Select</option>
                    <option value="Computer Science">CS</option>
                    <option value="Information Technology">IT</option>
                    <option value="AIML">AIML</option>
                    <option value="Data Science ">Data Science </option>
                  </select>
                  {fieldErrors.department && (
                    <p className="mt-1 text-xs text-red-400 ml-1">{fieldErrors.department}</p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm mb-2 text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border ${fieldErrors.password ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
                    required
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-400 ml-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm mb-2 text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border ${fieldErrors.confirmPassword ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
                    required
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400 ml-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms & Conditions */}
              <label className="flex items-start gap-3 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 mt-0.5" required />
                <span>I agree to the Terms of Service and Privacy Policy</span>
              </label>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-8 text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Additional Info */}
          <p className="mt-6 text-center text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
