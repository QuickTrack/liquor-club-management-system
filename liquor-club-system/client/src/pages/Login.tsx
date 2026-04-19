import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'email' | 'pin'>('email');
  const login = useAuthStore((state) => state.login);
  const pinLogin = useAuthStore((state) => state.pinLogin);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      phone: '',
      pin: '',
      branchId: '',
    },
  });

  const onSubmitEmail = async (data) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, data.branchId);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      // Error handled by store
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPin = async (data) => {
    setIsLoading(true);
    try {
      await pinLogin(data.phone, data.pin, data.branchId);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      // Error handled by store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-300 px-4">
      <div className="max-w-md w-full space-y-8 animate-fadeIn">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Liquor Club</h2>
          <p className="mt-2 text-gray-400">Management System</p>
        </div>

        <div className="bg-dark-200 p-8 rounded-2xl shadow-2xl border border-gray-800">
          {/* Tab switcher */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setLoginMode('email')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                loginMode === 'email'
                  ? 'bg-primary text-white'
                  : 'bg-dark-100 text-gray-400 hover:text-white'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setLoginMode('pin')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                loginMode === 'pin'
                  ? 'bg-primary text-white'
                  : 'bg-dark-100 text-gray-400 hover:text-white'
              }`}
            >
              PIN Login
            </button>
          </div>

          {loginMode === 'email' ? (
            <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Branch ID</label>
                <input
                  {...register('branchId', { required: 'Branch ID is required' })}
                  type="text"
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter branch ID"
                />
                {errors.branchId && <p className="mt-1 text-sm text-red-500">{errors.branchId.message as string}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary hover:bg-primary-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmitPin)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: /^\+?254[0-9]{9}$|^07[0-9]{8}$/,
                  })}
                  type="tel"
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="07xxxxxxxx or +254..."
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">PIN</label>
                <input
                  {...register('pin', {
                    required: 'PIN is required',
                    minLength: { value: 4, message: 'PIN must be at least 4 digits' },
                    maxLength: { value: 6, message: 'PIN cannot exceed 6 digits' },
                  })}
                  type="password"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center tracking-widest text-2xl"
                  placeholder="••••"
                />
                {errors.pin && <p className="mt-1 text-sm text-red-500">{errors.pin.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Branch ID</label>
                <input
                  {...register('branchId', { required: 'Branch ID is required' })}
                  type="text"
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter branch ID"
                />
                {errors.branchId && <p className="mt-1 text-sm text-red-500">{errors.branchId.message as string}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary hover:bg-primary-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Login with PIN'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm">
          Demo: Use email 'admin@example.com' / password 'password123'
        </p>
      </div>
    </div>
  );
}
