export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-300 p-4">
      {children}
    </div>
  );
}
