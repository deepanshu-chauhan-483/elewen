import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'

export default function SignUpPage() {
  return (
    <AuthLayout
      activeTab="signup"
      title="Sign Up Account"
      subtitle="Explore the collection. Your seamless event is just a few clicks away!"
      footer={
        <p
          className="text-[#364022] text-[12px] leading-[150%]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Already have an account?{' '}
          <Link to="/login" className="font-bold hover:underline">
            Login.
          </Link>
        </p>
      }
    >
      <div
        className="flex flex-col w-full gap-[24px]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="flex gap-[16px] w-full">
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[#364022] text-[16px] font-medium leading-[150%]">
              First name
            </label>
            <input
              type="text"
              placeholder="Name"
              className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[#364022] text-[16px] font-medium leading-[150%]">
              Last name
            </label>
            <input
              type="text"
              placeholder="Name"
              className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[#364022] text-[16px] font-medium leading-[150%]">Email</label>
          <input
            type="email"
            placeholder="email@"
            className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[#364022] text-[16px] font-medium leading-[150%]">
            Phone number
          </label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[#364022] text-[16px] font-medium leading-[150%]">Password</label>
          <div className="relative w-full">
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFAC9B] hover:text-[#364022] transition-colors"
              aria-label="Toggle password visibility"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                  fill="currentColor"
                />
                <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-[#727355] text-[12px] leading-[150%]">
            Must be at least 8 characters.
          </p>

          <div className="flex items-center gap-[8px] w-full pt-[2px]">
            <input
              type="checkbox"
              className="w-[12px] h-[12px] border border-[rgba(45,45,45,0.5)] rounded-[2px] accent-[#CDB17E]"
            />
            <span className="text-[#364022] text-[12px] leading-[150%]">
              I agree with{' '}
              <a href="#" className="font-bold hover:underline">
                Terms
              </a>{' '}
              &{' '}
              <a href="#" className="font-bold hover:underline">
                Privacy
              </a>
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex flex-col items-center w-full gap-[16px]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <button className="w-full h-[44px] flex justify-center items-center bg-[#CDB17E] text-[#FAFAFA] text-[16px] font-medium leading-[150%] rounded-[56px] hover:bg-[#b89e6e] transition-colors">
          Sign up
        </button>
        <span className="text-[#364022] text-[12px] leading-[150%] uppercase tracking-widest">
          OR
        </span>
        <button className="w-full h-[44px] flex justify-center items-center gap-[16px] bg-transparent border border-[#1C1C1C] text-[#1C1C1C] text-[16px] font-normal leading-[150%] rounded-[56px] hover:bg-gray-50 transition-colors">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z"
              fill="#4285F4"
            />
            <path
              d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.58C14.72 18.24 13.48 18.64 12 18.64C9.13 18.64 6.71 16.7 5.84 14.11H2.15V16.97C3.97 20.59 7.71 23 12 23Z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.11C5.62 13.45 5.49 12.74 5.49 12C5.49 11.26 5.62 10.55 5.84 9.89V7.03H2.15C1.4 8.53 0.98 10.22 0.98 12C0.98 13.78 1.4 15.47 2.15 16.97L5.84 14.11Z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.36C13.62 5.36 15.06 5.92 16.2 7.01L19.36 3.85C17.46 2.08 14.97 1 12 1C7.71 1 3.97 3.41 2.15 7.03L5.84 9.89C6.71 7.3 9.13 5.36 12 5.36Z"
              fill="#EA4335"
            />
          </svg>
          Sign up with Google
        </button>
      </div>
    </AuthLayout>
  )
}
