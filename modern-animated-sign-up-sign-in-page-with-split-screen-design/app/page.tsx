"use client"

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, Check, Loader2 } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"
import { getRememberedEmail } from "@/lib/auth/remember-me"

type FormErrors = {
  firstName?: string
  lastName?: string
  usn?: string
  phone?: string
  email?: string
  password?: string
  confirmPassword?: string
  terms?: string
}

type ButtonState = "default" | "loading" | "success"

const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "8+ characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

function getPasswordStrength(password: string): "Weak" | "Medium" | "Strong" | null {
  if (!password) return null
  const metCount = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length
  if (metCount <= 2) return "Weak"
  if (metCount <= 4) return "Medium"
  return "Strong"
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidUsn(usn: string): boolean {
  return /^[A-Za-z0-9]{14}$/.test(usn.trim())
}

function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone.trim())
}

function AuthPageContent() {
	
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp, login, signInWithGoogle, isAuthenticated, isApproved, isPending, isLoading: authLoading } = useAuth()

  const redirectTo = searchParams.get("redirect") || "/marketplace"
  const initialMode = searchParams.get("mode")

  const [isSignUp, setIsSignUp] = useState(initialMode !== "login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [usn, setUsn] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [buttonState, setButtonState] = useState<ButtonState>("default")
  const [rememberMe, setRememberMe] = useState(true)

  const firstNameRef = useRef<HTMLInputElement>(null)
  const lastNameRef = useRef<HTMLInputElement>(null)
  const usnRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)
  const termsRef = useRef<HTMLLabelElement>(null)

  const slides = [
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UVCE3-scNKiop2cPHp4ljvWmMHsUDRTHwzXR.jpg",
      alt: "UVCE heritage building courtyard framed by large rain trees",
      title: "A Century of Excellence",
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UVCE4-r4pWTZKNqNYKRWAGwwbRLEQuMvOEcO.jpg",
      alt: "UVCE main building lit up with blue lights at night",
      title: "Lighting Up Tradition",
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UVCE1-FUzQh5CaZP65Ls5yYOMEGxpHNN1wOp.jpg",
      alt: "UVCE building glowing with colorful lights on Alumni Day",
      title: "Celebrating Our Legacy",
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UVCE5-Z3BFwh6qkJqFcQGt7O2osuFLyZrRxE.jpg",
      alt: "Garlanded entrance archway of UVCE decorated with flowers",
      title: "Honoring Our Roots",
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UVCE_Gallery2-wNCzhowfSNxCSk3W9CJ0agovKtUBT7.jpg",
      alt: "Garlanded statue of Sir M. Visvesvaraya with floor rangoli at UVCE",
      title: "The Visionary Behind It All",
    },
  ]

  const passwordStrength = getPasswordStrength(password)

  const isSignUpFormComplete = useMemo(() => {
    if (!isSignUp) return email.trim() && password.trim()
    return (
      firstName.trim() &&
      lastName.trim() &&
      isValidUsn(usn) &&
      isValidPhone(phone) &&
      email.trim() &&
      password.trim() &&
      confirmPassword.trim() &&
      agreedToTerms
    )
  }, [isSignUp, firstName, lastName, usn, phone, email, password, confirmPassword, agreedToTerms])

  const validateSignUpForm = useCallback((): FormErrors => {
    const nextErrors: FormErrors = {}

    if (!firstName.trim()) nextErrors.firstName = "First name is required"
    if (!lastName.trim()) nextErrors.lastName = "Last name is required"
    if (!usn.trim()) {
      nextErrors.usn = "USN is required"
    } else if (!isValidUsn(usn)) {
      nextErrors.usn = "USN must be exactly 14 alphanumeric characters"
    }
    if (!phone.trim()) {
      nextErrors.phone = "Phone number is required"
    } else if (!isValidPhone(phone)) {
      nextErrors.phone = "Phone number must be exactly 10 digits"
    }
    if (!email.trim()) {
      nextErrors.email = "Please enter a valid email address"
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Please enter a valid email address"
    }
    if (!password.trim()) {
      nextErrors.password = "Password is required"
    }
    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Passwords do not match"
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match"
    }
    if (!agreedToTerms) {
      nextErrors.terms = "You must agree to the Terms & Conditions"
    }

    return nextErrors
  }, [firstName, lastName, usn, phone, email, password, confirmPassword, agreedToTerms])

  const focusFirstInvalidField = useCallback((nextErrors: FormErrors) => {
    const fieldOrder: { key: keyof FormErrors; ref: React.RefObject<HTMLElement | null> }[] = [
      { key: "firstName", ref: firstNameRef },
      { key: "lastName", ref: lastNameRef },
      { key: "usn", ref: usnRef },
      { key: "phone", ref: phoneRef },
      { key: "email", ref: emailRef },
      { key: "password", ref: passwordRef },
      { key: "confirmPassword", ref: confirmPasswordRef },
      { key: "terms", ref: termsRef },
    ]

    for (const { key, ref } of fieldOrder) {
      if (nextErrors[key] && ref.current) {
        ref.current.focus()
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" })
        break
      }
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isPending) {
        router.replace("/pending-approval")
      } else if (isApproved) {
        router.replace(redirectTo)
      }
    }
  }, [authLoading, isAuthenticated, isPending, isApproved, redirectTo, router])

  useEffect(() => {
    const rememberedEmail = getRememberedEmail()
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  useEffect(() => {
    if (initialMode === "login") setIsSignUp(false)
  }, [initialMode])

  useEffect(() => {
    if (isCarouselPaused) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length, isCarouselPaused])

  const handleModeSwitch = () => {
    setIsTransitioning(true)
    setErrors({})
    setButtonState("default")
    setTimeout(() => {
      setIsSignUp(!isSignUp)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
    }, 150)
  }

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle()
    if (!result.success) {
      setErrors({ email: result.error ?? "Google sign-in failed" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSignUp) {
      const loginErrors: FormErrors = {}
      if (!email.trim()) loginErrors.email = "Please enter a valid email address"
      else if (!isValidEmail(email)) loginErrors.email = "Please enter a valid email address"
      if (!password.trim()) loginErrors.password = "Password is required"
      setErrors(loginErrors)
      if (Object.keys(loginErrors).length > 0) {
        focusFirstInvalidField(loginErrors)
        return
      }

      setButtonState("loading")
      const result = await login({ email, password, rememberMe })
      if (result.success) {
        setButtonState("success")
        setTimeout(() => {
          router.push(result.isPending ? "/pending-approval" : redirectTo)
        }, 800)
      } else {
        setButtonState("default")
        setErrors({ email: result.error ?? "Login failed" })
      }
      return
    }

    const nextErrors = validateSignUpForm()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(nextErrors)
      return
    }

    setButtonState("loading")
    const result = await signUp({ firstName, lastName, email, password, usn, phone })
    if (result.success) {
      setButtonState("success")
      setTimeout(() => router.push("/pending-approval"), 1200)
    } else {
      setButtonState("default")
      setErrors({ email: result.error ?? "Sign up failed" })
    }
  }

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const inputClassName = (hasError: boolean) =>
    `signup-input ${hasError ? "signup-input-error" : ""}`

  const strengthColorClass =
    passwordStrength === "Strong"
      ? "text-purple-300"
      : passwordStrength === "Medium"
        ? "text-purple-400/80"
        : "text-white/50"

  const strengthBarClass =
    passwordStrength === "Strong"
      ? "bg-purple-400 w-full"
      : passwordStrength === "Medium"
        ? "bg-purple-500/70 w-2/3"
        : "bg-purple-500/40 w-1/3"

  return (
    <div className="min-h-screen bg-[#1a1a24] flex items-center justify-center p-4 sm:p-6">
      <div
        className={`w-full max-w-4xl bg-[#12121a] rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl shadow-black/50 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Left Panel */}
        <div className="lg:w-[45%] bg-[#0f0f16] p-5 sm:p-6 flex flex-col">
          <div
            className={`flex items-center justify-between mb-4 transition-all duration-500 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            <div className="text-white text-xl font-bold tracking-wider">
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Sync - UVCE
              </span>
            </div>
            <Link
              href="/marketplace"
              className="flex items-center gap-1.5 bg-[#1f1f2a]/80 backdrop-blur-sm hover:bg-[#2a2a38] text-white/90 text-xs px-3 py-1.5 rounded-full transition-all duration-300 border border-white/5 hover:border-purple-500/30 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)]"
            >
              Back to website
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div
            className={`flex-1 relative rounded-2xl overflow-hidden min-h-[220px] sm:min-h-[260px] transition-all duration-700 delay-300 group ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            {slides.map((slide, index) => (
              <Image
                key={slide.src}
                src={slide.src || "/placeholder.svg"}
                alt={slide.alt}
                fill
                priority={index === 0}
                className={`object-cover transition-all duration-1000 ease-in-out ${
                  currentSlide === index
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-[1.03]"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f16] via-[#0f0f16]/30 to-transparent" />

            <div
              className={`absolute bottom-0 left-0 right-0 px-5 pb-5 pt-12 transition-all duration-500 delay-500 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div
                key={currentSlide}
                className="carousel-caption-enter rounded-xl bg-black/30 backdrop-blur-sm px-4 py-3 border border-white/5"
              >
                <h2 className="text-white text-lg sm:text-xl font-semibold leading-tight tracking-tight text-center">
                  {slides[currentSlide].title}
                </h2>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center justify-center gap-2 mt-4 transition-all duration-500 delay-[600ms] ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
                className={`rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "w-7 h-1.5 bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]"
                    : "w-2 h-2 bg-white/20 hover:bg-purple-400/50 hover:scale-110"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="lg:w-[55%] p-6 sm:p-8 flex flex-col justify-center">
          <div
            className={`transition-all duration-300 ease-out ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
          >
            <h1
              className={`text-white text-2xl lg:text-3xl font-bold mb-1.5 tracking-tight transition-all duration-500 delay-300 ${
                mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              {isSignUp ? "Create an account" : "Welcome back"}
            </h1>
            <p
              className={`text-white/40 text-sm mb-6 transition-all duration-500 delay-[350ms] ${
                mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={handleModeSwitch}
                className="text-white/80 underline underline-offset-2 hover:text-purple-400 transition-colors duration-300"
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Name Fields */}
            <div
              className={`grid transition-all duration-400 ease-out overflow-hidden ${
                isSignUp ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1 transition-all duration-500 delay-[400ms] ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="space-y-1.5">
                    <input
                      ref={firstNameRef}
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value)
                        clearFieldError("firstName")
                      }}
                      className={inputClassName(!!errors.firstName)}
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? "firstName-error" : undefined}
                    />
                    {errors.firstName && (
                      <p id="firstName-error" className="text-red-400/90 text-xs pl-1 error-message-enter">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input
                      ref={lastNameRef}
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value)
                        clearFieldError("lastName")
                      }}
                      className={inputClassName(!!errors.lastName)}
                      aria-invalid={!!errors.lastName}
                      aria-describedby={errors.lastName ? "lastName-error" : undefined}
                    />
                    {errors.lastName && (
                      <p id="lastName-error" className="text-red-400/90 text-xs pl-1 error-message-enter">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* USN & Phone — sign up only */}
            <div
              className={`grid transition-all duration-400 ease-out overflow-hidden ${
                isSignUp ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1 transition-all duration-500 delay-[425ms] ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="space-y-1.5">
                    <input
                      ref={usnRef}
                      type="text"
                      placeholder="USN (14 characters)"
                      maxLength={14}
                      value={usn}
                      onChange={(e) => {
                        setUsn(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
                        clearFieldError("usn")
                      }}
                      className={inputClassName(!!errors.usn)}
                      aria-invalid={!!errors.usn}
                      aria-describedby={errors.usn ? "usn-error" : undefined}
                    />
                    {errors.usn && (
                      <p id="usn-error" className="text-red-400/90 text-xs pl-1 error-message-enter">
                        {errors.usn}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input
                      ref={phoneRef}
                      type="tel"
                      placeholder="Phone (10 digits)"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ""))
                        clearFieldError("phone")
                      }}
                      className={inputClassName(!!errors.phone)}
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "phone-error" : undefined}
                    />
                    {errors.phone && (
                      <p id="phone-error" className="text-red-400/90 text-xs pl-1 error-message-enter">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`space-y-1.5 transition-all duration-500 delay-[450ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <input
                ref={emailRef}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearFieldError("email")
                }}
                className={inputClassName(!!errors.email)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-red-400/90 text-xs pl-1 error-message-enter">
                  {errors.email}
                </p>
              )}
            </div>

            <div
              className={`space-y-2 transition-all duration-500 delay-[500ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearFieldError("password")
                    if (confirmPassword) clearFieldError("confirmPassword")
                  }}
                  className={`${inputClassName(!!errors.password)} pr-11`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : "password-strength"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-purple-400 transition-colors duration-300 p-0.5 rounded-md hover:bg-white/5 active:scale-95"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-red-400/90 text-xs pl-1 error-message-enter">
                  {errors.password}
                </p>
              )}

              {isSignUp && password && (
                <div id="password-strength" className="space-y-2 requirement-enter">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">
                      Password strength:{" "}
                      <span className={`font-medium ${strengthColorClass}`}>{passwordStrength}</span>
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${strengthBarClass}`}
                    />
                  </div>
                  <ul className="space-y-1">
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const met = req.test(password)
                      return (
                        <li
                          key={req.id}
                          className={`flex items-center gap-2 text-xs transition-all duration-300 requirement-enter ${
                            met ? "text-purple-300/90" : "text-white/35"
                          }`}
                        >
                          <span
                            className={`flex items-center justify-center w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                              met
                                ? "bg-purple-500/30 text-purple-300"
                                : "bg-white/5 text-white/20"
                            }`}
                          >
                            {met ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : "·"}
                          </span>
                          {req.label}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Remember Me — login only */}
            <div
              className={`grid transition-all duration-400 ease-out overflow-hidden ${
                !isSignUp ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <label className="flex cursor-pointer items-center gap-2.5 py-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded transition-all duration-300 ${
                      rememberMe
                        ? "bg-purple-500 shadow-lg shadow-purple-500/30"
                        : "border border-white/20 bg-transparent"
                    }`}
                  >
                    <svg
                      className={`h-2.5 w-2.5 text-white transition-all ${rememberMe ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/50">Remember me</span>
                </label>
              </div>
            </div>

            {/* Confirm Password - Sign up only */}
            <div
              className={`grid transition-all duration-400 ease-out overflow-hidden ${
                isSignUp ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-1.5 pb-1">
                  <div className="relative">
                    <input
                      ref={confirmPasswordRef}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        clearFieldError("confirmPassword")
                      }}
                      className={`${inputClassName(!!errors.confirmPassword)} pr-11`}
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-purple-400 transition-colors duration-300 p-0.5 rounded-md hover:bg-white/5 active:scale-95"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="text-red-400/90 text-xs pl-1 error-message-enter"
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div
              className={`grid transition-all duration-400 ease-out overflow-hidden ${
                isSignUp ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <label
                  ref={termsRef}
                  tabIndex={-1}
                  className={`flex items-start gap-3 cursor-pointer py-1 transition-all duration-500 delay-[550ms] ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked)
                        clearFieldError("terms")
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-300 ${
                        agreedToTerms
                          ? "bg-purple-500 shadow-lg shadow-purple-500/30"
                          : "border border-white/20 bg-transparent hover:border-purple-400/40"
                      } ${errors.terms ? "ring-1 ring-red-400/40" : ""}`}
                    >
                      <svg
                        className={`w-2.5 h-2.5 text-white transition-all duration-300 ${
                          agreedToTerms ? "opacity-100 scale-100" : "opacity-0 scale-50"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="text-white/40 text-xs leading-relaxed">
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-purple-400 underline underline-offset-2 hover:text-purple-300 transition-colors duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms & Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-purple-400 underline underline-offset-2 hover:text-purple-300 transition-colors duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-red-400/90 text-xs pl-7 mt-1 error-message-enter">{errors.terms}</p>
                )}
              </div>
            </div>

            <div
              className={`transition-all duration-500 delay-[600ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <button
                type="submit"
                disabled={buttonState === "loading" || buttonState === "success"}
                className={`w-full font-medium py-3 rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                  buttonState === "success"
                    ? "bg-purple-500/90 text-white shadow-lg shadow-purple-500/30"
                    : buttonState === "loading"
                      ? "bg-purple-500/80 text-white shadow-lg shadow-purple-500/25 cursor-wait"
                      : isSignUp && !isSignUpFormComplete
                        ? "bg-purple-500/40 text-white/60 shadow-none hover:bg-purple-500/50 hover:text-white/70 hover:shadow-[0_4px_16px_rgba(168,85,247,0.15)]"
                        : "bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/45 hover:shadow-[0_8px_24px_rgba(168,85,247,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-purple-500/20 active:scale-[0.99]"
                }`}
              >
                {buttonState === "loading" && (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                )}
                {buttonState === "success" && (
                  <Check className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
                )}
                <span
                  className={`inline-block transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
                >
                  {buttonState === "loading"
                    ? isSignUp
                      ? "Creating account..."
                      : "Signing in..."
                    : buttonState === "success"
                      ? isSignUp
                        ? "Account created"
                        : "Signed in"
                      : isSignUp
                        ? "Create account"
                        : "Sign in"}
                </span>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div
            className={`flex items-center gap-3 my-5 transition-all duration-500 delay-[650ms] ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span
              className={`text-white/30 text-xs transition-all duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
            >
              {isSignUp ? "Or register with" : "Or sign in with"}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Social — Google only */}
          <div
            className={`transition-all duration-500 delay-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/5 bg-[#1a1a26] text-sm text-white transition-all duration-300 hover:border-purple-500/25 hover:bg-[#1f1f2a] hover:shadow-[0_4px_16px_rgba(168,85,247,0.1)] active:scale-[0.98]"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-white/80">Continue with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1a1a24]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  )
}
