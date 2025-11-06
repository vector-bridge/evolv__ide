/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useEffect, useRef, useState } from 'react';
import { useAccessor, useIsDark, useSettingsState } from '../util/services.js';
import { Brain, Check, ChevronRight, DollarSign, ExternalLink, Eye, EyeOff, Lock, X } from 'lucide-react';
import { displayInfoOfProviderName, ProviderName, providerNames, localProviderNames, featureNames, FeatureName, isFeatureNameDisabled } from '../../../../common/voidSettingsTypes.js';
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js';
import { OllamaSetupInstructions, OneClickSwitchButton, SettingsForProvider, ModelDump } from '../void-settings-tsx/Settings.js';
import { ColorScheme } from '../../../../../../../platform/theme/common/theme.js';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';
import { isLinux } from '../../../../../../../base/common/platform.js';
import { OTPInput, SlotProps } from 'input-otp'

const OVERRIDE_VALUE = false

export const VoidOnboarding = () => {

	const voidSettingsState = useSettingsState()
	const isOnboardingComplete = voidSettingsState.globalSettings.isOnboardingComplete || OVERRIDE_VALUE

	const isDark = useIsDark()

	return (
		<div className={`@@void-scope ${isDark ? 'dark' : ''}`}>
			<div
				className={`
					bg-void-bg-3 fixed top-0 right-0 bottom-0 left-0 width-full z-[99999]
					transition-all duration-1000 ${isOnboardingComplete ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
				`}
				style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
			>
				<ErrorBoundary>
					<VoidOnboardingContent />
				</ErrorBoundary>
			</div>
		</div>
	)
}

const VoidIcon = () => {
	const accessor = useAccessor()
	const themeService = accessor.get('IThemeService')

	const divRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		// void icon style
		const updateTheme = () => {
			const theme = themeService.getColorTheme().type
			const isDark = theme === ColorScheme.DARK || theme === ColorScheme.HIGH_CONTRAST_DARK
			if (divRef.current) {
				divRef.current.style.maxWidth = '220px'
				divRef.current.style.opacity = '50%'
				divRef.current.style.filter = isDark ? '' : 'invert(1)' //brightness(.5)
			}
		}
		updateTheme()
		const d = themeService.onDidColorThemeChange(updateTheme)
		return () => d.dispose()
	}, [])

	return <div ref={divRef} className='@@void-void-icon' />
}

// loading spinner
const Loader = () => {
	return (
		<div className='flex justify-center items-center'>
			<svg className="size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="#000000" strokeWidth="4"></circle><path className="opacity-75" fill="#000000" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
		</div>
	)
}

const FADE_DURATION_MS = 2000

const FadeIn = ({ children, className, delayMs = 0, durationMs, ...props }: { children: React.ReactNode, delayMs?: number, durationMs?: number, className?: string } & React.HTMLAttributes<HTMLDivElement>) => {

	const [opacity, setOpacity] = useState(0)

	const effectiveDurationMs = durationMs ?? FADE_DURATION_MS

	useEffect(() => {

		const timeout = setTimeout(() => {
			setOpacity(1)
		}, delayMs)

		return () => clearTimeout(timeout)
	}, [setOpacity, delayMs])


	return (
		<div className={className} style={{ opacity, transition: `opacity ${effectiveDurationMs}ms ease-in-out` }} {...props}>
			{children}
		</div>
	)
}

// Onboarding

// =============================================
//  New AddProvidersPage Component and helpers
// =============================================

const tabNames = ['Free', 'Paid', 'Local'] as const;

type TabName = typeof tabNames[number] | 'Cloud/Other';

// Data for cloud providers tab
const cloudProviders: ProviderName[] = ['googleVertex', 'liteLLM', 'microsoftAzure', 'awsBedrock', 'openAICompatible'];

// Data structures for provider tabs
const providerNamesOfTab: Record<TabName, ProviderName[]> = {
	Free: ['gemini', 'openRouter'],
	Local: localProviderNames,
	Paid: providerNames.filter(pn => !(['gemini', 'openRouter', ...localProviderNames, ...cloudProviders] as string[]).includes(pn)) as ProviderName[],
	'Cloud/Other': cloudProviders,
};

const descriptionOfTab: Record<TabName, string> = {
	Free: `Providers with a 100% free tier. Add as many as you'd like!`,
	Paid: `Connect directly with any provider (bring your own key).`,
	Local: `Active providers should appear automatically. Add as many as you'd like! `,
	'Cloud/Other': `Add as many as you'd like! Reach out for custom configuration requests.`,
};


const featureNameMap: { display: string, featureName: FeatureName }[] = [
	{ display: 'Chat', featureName: 'Chat' },
	{ display: 'Quick Edit', featureName: 'Ctrl+K' },
	{ display: 'Autocomplete', featureName: 'Autocomplete' },
	{ display: 'Fast Apply', featureName: 'Apply' },
	{ display: 'Source Control', featureName: 'SCM' },
];

const SubmitFormButton = ({ isSubmitting, title }: { isSubmitting: boolean, title: string }) => {
	return (
		<button type='submit' className="w-full py-2 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition text-center">
			{isSubmitting ? <Loader /> : title}
		</button>
	)
}

const ORDivider = () => (
	<div className="flex items-center gap-2 text-gray-500 text-sm my-4">
		<div className="flex-1 h-px bg-neutral-700"></div>
		<span>OR</span>
		<div className="flex-1 h-px bg-neutral-700"></div>
	</div>
)

const LoginPage = ({ setPageType, setPageIndex }: { setPageType: (stepperType: StepperFlowType) => void, setPageIndex: (idx: 2 | 5 | 6) => void }) => {
	// signup flow will be selected if user press 'back' in a signup flow
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		const data = new FormData(e.currentTarget)
		const email = data.get('email')
		const password = data.get('password')
		setIsSubmitting(true)
		const req = await new Promise((resolve) => setTimeout(resolve, 1500));
		setPageType('signIn')
		setPageIndex(6)
		setIsSubmitting(false)
	}

	return (
		<>
			<form className="space-y-4" onSubmit={submitForm}>
				<div className="grid place-items-center gap-2 w-full">
					<div className="w-full">
						<label htmlFor="email" className='text-sm text-neutral-400'>Email</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							placeholder="Your email address"
							className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div className="w-full">
						<div className="flex justify-between items-center mb-1">
							<label htmlFor="password" className="text-sm text-neutral-400">Password</label>
							<button className="text-xs text-neutral-400 hover:underline"
								onClick={() => {
									setPageType('signIn')
									setPageIndex(2)
								}}
							>
								Forgot your password?
							</button>
						</div>
						<div className="relative">
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : "password"}
								minLength={8}
								required
								placeholder="Your password"
								className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>

							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
								className="absolute inset-y-0 right-2 flex items-center text-gray-500"
							>
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>
				</div>

				<SubmitFormButton isSubmitting={isSubmitting} title='Continue' />

				{/* <div className="space-y-2">
					<button
						type="button"
						className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
					>
						Continue with Google
					</button>

					<button
						type="button"
						className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
					>
						Continue with GitHub
					</button>

					<button
						type="button"
						className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
					>
						Continue with Apple
					</button>
				</div> */}
			</form>

			<ORDivider />

			{/* Email sign-in code */}
			<button className="w-full border border-neutral-700 py-2 rounded-md text-sm flex items-center justify-center space-x-2 hover:bg-neutral-800 transition"
				onClick={() => setPageIndex(5)}
			>
				<span className="text-lg">✉️</span>
				<span>Email sign-in code</span>
			</button>

			<p className="text-center text-sm text-gray-500 mt-6">
				Don't have an account?&nbsp;&nbsp;
				<a href="#" className="text-blue-500 hover:underline"
					onClick={() => setPageType('signUp')}
				>Sign up</a>
			</p>
		</>
	)
}

const SignUpPage = ({ onSuccess, setPageIndex }: { setPageIndex: (idx: number) => void } & OnSuccess) => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const namePattern = "^[A-Z][a-zA-Z]*$"

	const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const data = new FormData(e.currentTarget)
		const firstName = data.get('firstName')
		const lastName = data.get('lastName')
		setIsSubmitting(true)
		const req = await new Promise((resolve) => setTimeout(resolve, 1500));
		onSuccess()
		setIsSubmitting(false)
	}

	return (
		<>
			<form className="space-y-4" onSubmit={submitForm}>
				{/*  First / Last Name */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="text-sm text-gray-400" htmlFor="firstName">First name</label>
						<input
							type="text"
							id="firstName"
							name="firstName"
							required
							pattern={namePattern}
							placeholder="Your first name"
							className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="text-sm text-gray-400" htmlFor="lastName">Last name</label>
						<input
							type="text"
							id="lastName"
							name="lastName"
							required
							pattern={namePattern}
							placeholder="Your last name"
							className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				{/*  Email */}
				<div>
					<label className="text-sm text-gray-400" htmlFor="email">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						placeholder="Your email address"
						className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<SubmitFormButton isSubmitting={isSubmitting} title='Continue' />

				<ORDivider />

				{/*  Social Buttons */}
				{/* <div className="space-y-2">
					<button
						type="button"
						className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
					>
						<img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
						Continue with Google
					</button>

					<button
						type="button"
						className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
					>
						<img src="https://www.svgrepo.com/show/512317/github-142.svg" className="w-5 h-5 invert" />
						Continue with GitHub
					</button>

					<button
						type="button"
						className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
					>
						<img src="https://www.svgrepo.com/show/349442/apple.svg" className="w-5 h-5 invert" />
						Continue with Apple
					</button>
				</div> */}
			</form>
			{/*  Sign in link */}
			<p className="text-center text-sm text-gray-500 mt-6">
				Already have an account?&nbsp;
				<a href="#" className="text-blue-500 hover:underline"
					onClick={() => setPageIndex(1)}
				>Sign in</a>
			</p>

			{/*  Footer */}
			<p className="text-gray-500 text-xs mt-6 text-center max-w-sm leading-relaxed">
				By creating an account, you agree to the&nbsp;&nbsp;
				<a href="#" className="underline hover:text-gray-300">Terms of Service</a> and
				<>&nbsp;&nbsp;</>
				<a href="#" className="underline hover:text-gray-300">Privacy Policy</a>.
			</p>
		</>
	)
}

const CreatePasswordPage = ({ onSuccess }: OnSuccess) => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)

	const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
		setError('')
		e.preventDefault()

		const data = new FormData(e.currentTarget)
		const password = data.get('password')
		const confirmPassword = data.get('confirmPassword')
		if (password !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		setIsSubmitting(true)
		const req = await new Promise((resolve) => setTimeout(resolve, 1500));
		onSuccess()
		setIsSubmitting(false)
	}

	return <form className="space-y-4" onSubmit={submitForm}>
		{/*  Email */}
		<div>
			<label
				htmlFor="email"
				className="block text-sm font-medium text-gray-300 mb-1"
			>
				Email
			</label>

			<input
				type="email"
				id="email"
				placeholder="••••••••@gmail.com"
				className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				disabled
			/>
		</div>

		{/*  Password */}
		<div className="relative">
			<label
				htmlFor="password"
				className="block text-sm font-medium text-gray-300 mb-1"
			>
				Password
			</label>

			<div className="relative">
				<input
					type={showPassword ? "text" : "password"}
					id="password"
					name="password"
					required
					minLength={8}
					placeholder="Your password"
					className="w-full pl-3 pr-10 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>

				<button
					type="button"
					onClick={() => setShowPassword((prev) => !prev)}
					className="absolute inset-y-0 right-2 flex items-center text-gray-500"
				>
					{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
				</button>
			</div>
		</div>

		{/*  Confirm Password */}
		<div className="relative">
			<label
				htmlFor="confirmPassword"
				className="block text-sm font-medium text-gray-300 mb-1"
			>
				Confirm password
			</label>

			<div className="relative">
				<input
					type={showConfirmPassword ? "text" : "password"}
					id="confirmPassword"
					name="confirmPassword"
					required
					minLength={8}
					placeholder="Confirm your password"
					className="w-full pl-3 pr-10 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>

				<button
					type="button"
					onClick={() => setShowConfirmPassword((prev) => !prev)}
					className="absolute inset-y-0 right-2 flex items-center text-gray-500"
				>
					{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
				</button>
			</div>

			{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
		</div>

		{/*  Continue */}
		<SubmitFormButton isSubmitting={isSubmitting} title='Continue' />
	</form>
}

function Slot(props: SlotProps) {
	return (
		<div
			className={`
				w-10 h-14 text-2xl
				flex items-center justify-center
				transition-all duration-300
				border border-neutral-500 rounded-md
				bg-transparent text-white
				focus:outline-none
				hover:border-neutral-400
				${props.isActive ? 'border-2 border-white' : 'border border-neutral-500'}
			`}
		>
			<div className="group-has-[input[data-input-otp-placeholder-shown]]:opacity-20">
				{props.char ?? props.placeholderChar}
			</div>
			{/* {props.hasFakeCaret && <FakeCaret />} */}
		</div>
	)
}

const ResetPasswordPage = ({ onSuccess }: OnSuccess) => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const data = new FormData(e.currentTarget)
		const email = data.get('email')
		setIsSubmitting(true)
		// send reset instructions
		const req = await new Promise((resolve) => setTimeout(resolve, 1500));
		onSuccess()
		setIsSubmitting(false)
	}

	return (
		<form className="space-y-4" onSubmit={submitForm}>
			<div className="grid place-items-center gap-2 w-full">
				<div className="w-full">
					{/* Email */}
					<label htmlFor="email" className='text-sm text-neutral-400'>Email</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						placeholder="Your email address"
						className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>

			{/* Send reset instructions */}
			<SubmitFormButton isSubmitting={isSubmitting} title='Continue' />

			{/* <div className="space-y-2">
					<button
						type="button"
						className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
					>
						Continue with Google
					</button>

					<button
						type="button"
						className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
					>
						Continue with GitHub
					</button>

					<button
						type="button"
						className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
					>
						Continue with Apple
					</button>
				</div> */}
		</form>
	)
}

const OTPPasswordPage = ({ email, onSuccess }: { email?: string } & OnSuccess) => {
	const [otp, setOtp] = useState('');

	useEffect(() => {
		if (otp.length === 6) {
			console.log('confirm otp request')
			onSuccess && onSuccess()
		}
	}, [otp])

	return (
		<div className="flex flex-col justify-center items-center" >
			<p className="text-sm text-neutral-300 mb-6">
				Enter the code sent to <br />
				<span className="text-white font-medium">{email}</span>
			</p>

			{/* Code Inputs (placeholder area) */}
			<OTPInput
				value={otp}
				onChange={setOtp}
				minLength={6}
				maxLength={6}
				required
				containerClassName="flex justify-center gap-2"
				render={({ slots }) => (
					<div style={{
						width: '100%'
					}}>
						<div className="flex gap-2">
							{slots.map((slot, idx) => (
								<Slot key={idx} {...slot} />
							))}
						</div>
					</div>
				)} />

			{/* Resend Link */}
			<p className="text-xs text-neutral-500 mt-6">
				Didn't receive a code?{" "}
				<button className="text-white hover:underline">
					Resend (25)
				</button>
			</p>
		</div >
	)
}

const AddProvidersPage = ({ pageIndex, setPageIndex }: { pageIndex: number, setPageIndex: (index: number) => void }) => {
	const [currentTab, setCurrentTab] = useState<TabName>('Free');
	const settingsState = useSettingsState();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Clear error message after 5 seconds
	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		if (errorMessage) {
			timeoutId = setTimeout(() => {
				setErrorMessage(null);
			}, 5000);
		}

		// Cleanup function to clear the timeout if component unmounts or error changes
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [errorMessage]);

	return (<div className="flex flex-col md:flex-row w-full h-[80vh] gap-6 max-w-[900px] mx-auto relative">
		{/* Left Column */}
		<div className="md:w-1/4 w-full flex flex-col gap-6 p-6 border-none border-void-border-2 h-full overflow-y-auto">
			{/* Tab Selector */}
			<div className="flex md:flex-col gap-2">
				{[...tabNames, 'Cloud/Other'].map(tab => (
					<button
						key={tab}
						className={`py-2 px-4 rounded-md text-left ${currentTab === tab
							? 'bg-[#0e70c0]/80 text-white font-medium shadow-sm'
							: 'bg-void-bg-2 hover:bg-void-bg-2/80 text-void-fg-1'
							} transition-all duration-200`}
						onClick={() => {
							setCurrentTab(tab as TabName);
							setErrorMessage(null); // Reset error message when changing tabs
						}}
					>
						{tab}
					</button>
				))}
			</div>

			{/* Feature Checklist */}
			<div className="flex flex-col gap-1 mt-4 text-sm opacity-80">
				{featureNameMap.map(({ display, featureName }) => {
					const hasModel = settingsState.modelSelectionOfFeature[featureName] !== null;
					return (
						<div key={featureName} className="flex items-center gap-2">
							{hasModel ? (
								<Check className="w-4 h-4 text-emerald-500" />
							) : (
								<div className="w-3 h-3 rounded-full flex items-center justify-center">
									<div className="w-1 h-1 rounded-full bg-white/70"></div>
								</div>
							)}
							<span>{display}</span>
						</div>
					);
				})}
			</div>
		</div>

		{/* Right Column */}
		<div className="flex-1 flex flex-col items-center justify-start p-6 h-full overflow-y-auto">
			<div className="text-5xl mb-2 text-center w-full">Add a Provider</div>

			<div className="w-full max-w-xl mt-4 mb-10">
				<div className="text-4xl font-light my-4 w-full">{currentTab}</div>
				<div className="text-sm opacity-80 text-void-fg-3 my-4 w-full">{descriptionOfTab[currentTab]}</div>
			</div>

			{providerNamesOfTab[currentTab].map((providerName) => (
				<div key={providerName} className="w-full max-w-xl mb-10">
					<div className="text-xl mb-2">
						Add {displayInfoOfProviderName(providerName).title}
						{providerName === 'gemini' && (
							<span
								data-tooltip-id="void-tooltip-provider-info"
								data-tooltip-content="Gemini 2.5 Pro offers 25 free messages a day, and Gemini 2.5 Flash offers 500. We recommend using models down the line as you run out of free credits."
								data-tooltip-place="right"
								className="ml-1 text-xs align-top text-blue-400"
							>*</span>
						)}
						{providerName === 'openRouter' && (
							<span
								data-tooltip-id="void-tooltip-provider-info"
								data-tooltip-content="OpenRouter offers 50 free messages a day, and 1000 if you deposit $10. Only applies to models labeled ':free'."
								data-tooltip-place="right"
								className="ml-1 text-xs align-top text-blue-400"
							>*</span>
						)}
					</div>
					<div>
						<SettingsForProvider providerName={providerName} showProviderTitle={false} showProviderSuggestions={true} />

					</div>
					{providerName === 'ollama' && <OllamaSetupInstructions />}
				</div>
			))}

			{(currentTab === 'Local' || currentTab === 'Cloud/Other') && (
				<div className="w-full max-w-xl mt-8 bg-void-bg-2/50 rounded-lg p-6 border border-void-border-4">
					<div className="flex items-center gap-2 mb-4">
						<div className="text-xl font-medium">Models</div>
					</div>

					{currentTab === 'Local' && (
						<div className="text-sm opacity-80 text-void-fg-3 my-4 w-full">Local models should be detected automatically. You can add custom models below.</div>
					)}

					{currentTab === 'Local' && <ModelDump filteredProviders={localProviderNames} />}
					{currentTab === 'Cloud/Other' && <ModelDump filteredProviders={cloudProviders} />}
				</div>
			)}



			{/* Navigation buttons in right column */}
			<div className="flex flex-col items-end w-full mt-auto pt-8">
				{errorMessage && (
					<div className="text-amber-400 mb-2 text-sm opacity-80 transition-opacity duration-300">{errorMessage}</div>
				)}
				<div className="flex items-center gap-2">
					<PreviousButton onClick={() => setPageIndex(pageIndex - 1)} />
					<NextButton
						onClick={() => {
							const isDisabled = isFeatureNameDisabled('Chat', settingsState)

							if (!isDisabled) {
								setPageIndex(pageIndex + 1);
								setErrorMessage(null);
							} else {
								// Show error message
								setErrorMessage("Please set up at least one Chat model before moving on.");
							}
						}}
					/>
				</div>
			</div>
		</div>
	</div>);
};

const NextButton = ({ onClick, ...props }: { onClick: VoidFunction } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {

	// Create a new props object without the disabled attribute
	const { disabled, ...buttonProps } = props;

	return (
		<button
			onClick={disabled ? undefined : onClick}
			onDoubleClick={onClick}
			className={`px-6 py-2 bg-zinc-100 ${disabled
				? 'bg-zinc-100/40 cursor-not-allowed'
				: 'hover:bg-zinc-100'
				} rounded text-black duration-600 transition-all
			`}
			{...disabled && {
				'data-tooltip-id': 'void-tooltip',
				"data-tooltip-content": 'Please enter all required fields or choose another provider', // (double-click to proceed anyway, can come back in Settings)
				"data-tooltip-place": 'top',
			}}
			{...buttonProps}
		>
			Next
		</button>
	)
}

const PreviousButton = ({ onClick, ...props }: { onClick: VoidFunction } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
	return (
		<button
			onClick={onClick}
			className="px-6 py-2 rounded text-void-fg-3 opacity-80 hover:brightness-115 duration-600 transition-all"
			{...props}
		>
			Back
		</button>
	)
}

const OnboardingPageShell = ({ top, bottom, content, hasMaxWidth = true, className = '', }: {
	top?: React.ReactNode,
	bottom?: React.ReactNode,
	content?: React.ReactNode,
	hasMaxWidth?: boolean,
	className?: string,
}) => {
	return (
		<div className={`h-[80vh] text-lg flex flex-col gap-4 w-full mx-auto ${hasMaxWidth ? 'max-w-[600px]' : ''} ${className}`}>
			{top && <FadeIn className='w-full mb-auto pt-16'>{top}</FadeIn>}
			{content && <FadeIn className='w-full my-auto'>{content}</FadeIn>}
			{bottom && <div className='w-full pb-8'>{bottom}</div>}
		</div>
	)
}

const OnboardingFormPageShell = ({ top, bottom, content, title = '', hasMaxWidth = true, className = '', }: {
	top?: React.ReactNode,
	bottom?: React.ReactNode,
	content?: React.ReactNode,
	title?: string,
	hasMaxWidth?: boolean,
	className?: string,
}) => {
	return (
		<div className={`h-[80vh] text-lg flex flex-col justify-center gap-4 w-full mx-auto ${hasMaxWidth ? 'max-w-[600px]' : ''} ${className}`}>
			{top && <FadeIn className='w-full mb-auto pt-16'>{top}</FadeIn>}
			{content && <FadeIn className='w-full
			// my-auto
			' >
				<div className='flex flex-col justify-center items-center'>
					<div className="flex flex-col items-center mb-6">
						<div className="w-10 h-10 bg-neutral-700 rounded-lg mb-3"></div>
						<h1 className="text-xl font-semibold">{title}</h1>
					</div>
					<div className="bg-neutral-900 rounded-xl p-8 shadow-lg w-full max-w-sm ">
						{content}
					</div>
				</div>
			</FadeIn>}
			{bottom && <div className='w-full pb-8'>{bottom}</div>}
		</div>
	)
}

const OllamaDownloadOrRemoveModelButton = ({ modelName, isModelInstalled, sizeGb }: { modelName: string, isModelInstalled: boolean, sizeGb: number | false | 'not-known' }) => {
	// for now just link to the ollama download page
	return <a
		href={`https://ollama.com/library/${modelName}`}
		target="_blank"
		rel="noopener noreferrer"
		className="flex items-center justify-center text-void-fg-2 hover:text-void-fg-1"
	>
		<ExternalLink className="w-3.5 h-3.5" />
	</a>

}


const YesNoText = ({ val }: { val: boolean | null }) => {

	return <div
		className={
			val === true ? "text text-emerald-500"
				: val === false ? 'text-rose-600'
					: "text text-amber-300"
		}
	>
		{
			val === true ? "Yes"
				: val === false ? 'No'
					: "Yes*"
		}
	</div>

}



const abbreviateNumber = (num: number): string => {
	if (num >= 1000000) {
		// For millions
		return Math.floor(num / 1000000) + 'M';
	} else if (num >= 1000) {
		// For thousands
		return Math.floor(num / 1000) + 'K';
	} else {
		// For numbers less than 1000
		return num.toString();
	}
}





const PrimaryActionButton = ({ children, className, ringSize, ...props }: { children: React.ReactNode, ringSize?: undefined | 'xl' | 'screen' } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {


	return (
		<button
			type='button'
			className={`
				flex items-center justify-center

				text-white dark:text-black
				bg-black/90 dark:bg-white/90

				${ringSize === 'xl' ? `
					gap-2 px-16 py-8
					transition-all duration-300 ease-in-out
					`
					: ringSize === 'screen' ? `
					gap-2 px-16 py-8
					transition-all duration-1000 ease-in-out
					`: ringSize === undefined ? `
					gap-1 px-4 py-2
					transition-all duration-300 ease-in-out
				`: ''}

				rounded-lg
				group
				${className}
			`}
			{...props}
		>
			{children}
			<ChevronRight
				className={`
					transition-all duration-300 ease-in-out

					transform
					group-hover:translate-x-1
					group-active:translate-x-1
				`}
			/>
		</button>
	)
}


const PrevButton = ({ onClick }: { onClick: VoidFunction }) => <div className="max-w-[600px] w-full mx-auto flex flex-col items-end">
	<div className="flex items-center gap-2">
		<PreviousButton
			onClick={onClick}
		/>
		{/* <NextButton
				onClick={() => { setPageIndex(pageIndex + 1) }}
			/> */}
	</div>
</div>

type WantToUseOption = 'smart' | 'private' | 'cheap' | 'all'
type StepperFlowType = 'signIn' | 'signUp'
type StepperPages = { [pageIndex: number]: React.ReactNode }
type OnSuccess = { onSuccess: VoidFunction }

const VoidOnboardingContent = () => {


	const accessor = useAccessor()
	const voidSettingsService = accessor.get('IVoidSettingsService')
	const voidMetricsService = accessor.get('IMetricsService')

	const voidSettingsState = useSettingsState()

	const [pageIndex, setPageIndex] = useState(0)
	const [stepperType, setStepperType] = useState<StepperFlowType>('signIn')

	// page 1 state
	const [wantToUseOption, setWantToUseOption] = useState<WantToUseOption>('smart')

	// Replace the single selectedProviderName with four separate states
	// page 2 state - each tab gets its own state
	const [selectedIntelligentProvider, setSelectedIntelligentProvider] = useState<ProviderName>('anthropic');
	const [selectedPrivateProvider, setSelectedPrivateProvider] = useState<ProviderName>('ollama');
	const [selectedAffordableProvider, setSelectedAffordableProvider] = useState<ProviderName>('gemini');
	const [selectedAllProvider, setSelectedAllProvider] = useState<ProviderName>('anthropic');

	// Helper function to get the current selected provider based on active tab
	const getSelectedProvider = (): ProviderName => {
		switch (wantToUseOption) {
			case 'smart': return selectedIntelligentProvider;
			case 'private': return selectedPrivateProvider;
			case 'cheap': return selectedAffordableProvider;
			case 'all': return selectedAllProvider;
		}
	}

	// Helper function to set the selected provider for the current tab
	const setSelectedProvider = (provider: ProviderName) => {
		switch (wantToUseOption) {
			case 'smart': setSelectedIntelligentProvider(provider); break;
			case 'private': setSelectedPrivateProvider(provider); break;
			case 'cheap': setSelectedAffordableProvider(provider); break;
			case 'all': setSelectedAllProvider(provider); break;
		}
	}

	const providerNamesOfWantToUseOption: { [wantToUseOption in WantToUseOption]: ProviderName[] } = {
		smart: ['anthropic', 'openAI', 'gemini', 'openRouter'],
		private: ['ollama', 'vLLM', 'openAICompatible', 'lmStudio'],
		cheap: ['gemini', 'deepseek', 'openRouter', 'ollama', 'vLLM'],
		all: providerNames,
	}


	const selectedProviderName = getSelectedProvider();
	const didFillInProviderSettings = selectedProviderName && voidSettingsState.settingsOfProvider[selectedProviderName]._didFillInProviderSettings
	const isApiKeyLongEnoughIfApiKeyExists = selectedProviderName && voidSettingsState.settingsOfProvider[selectedProviderName].apiKey ? voidSettingsState.settingsOfProvider[selectedProviderName].apiKey.length > 15 : true
	const isAtLeastOneModel = selectedProviderName && voidSettingsState.settingsOfProvider[selectedProviderName].models.length >= 1

	const didFillInSelectedProviderSettings = !!(didFillInProviderSettings && isApiKeyLongEnoughIfApiKeyExists && isAtLeastOneModel)

	const prevButton = <PrevButton onClick={() => setPageIndex(idx => idx - 1)} />
	const returnToSignInButton = <PrevButton onClick={() => setPageIndex(1)} />


	const lastPagePrevAndNextButtons = <div className="max-w-[600px] w-full mx-auto flex flex-col items-end">
		<div className="flex items-center gap-2">
			<PrimaryActionButton
				onClick={() => {
					voidSettingsService.setGlobalSetting('isOnboardingComplete', true);
					voidMetricsService.capture('Completed Onboarding', { selectedProviderName, wantToUseOption })
				}}
				ringSize={voidSettingsState.globalSettings.isOnboardingComplete ? 'screen' : undefined}
			>Enter the Evolv</PrimaryActionButton>
		</div>
	</div>


	// cannot be md
	const basicDescOfWantToUseOption: { [wantToUseOption in WantToUseOption]: string } = {
		smart: "Models with the best performance on benchmarks.",
		private: "Host on your computer or local network for full data privacy.",
		cheap: "Free and affordable options.",
		all: "",
	}

	// can be md
	const detailedDescOfWantToUseOption: { [wantToUseOption in WantToUseOption]: string } = {
		smart: "Most intelligent and best for agent mode.",
		private: "Private-hosted so your data never leaves your computer or network. [Email us](mailto:founders@voideditor.com) for help setting up at your company.",
		cheap: "Use great deals like Gemini 2.5 Pro, or self-host a model with Ollama or vLLM for free.",
		all: "",
	}

	// Modified: initialize separate provider states on initial render instead of watching wantToUseOption changes
	useEffect(() => {
		if (selectedIntelligentProvider === undefined) {
			setSelectedIntelligentProvider(providerNamesOfWantToUseOption['smart'][0]);
		}
		if (selectedPrivateProvider === undefined) {
			setSelectedPrivateProvider(providerNamesOfWantToUseOption['private'][0]);
		}
		if (selectedAffordableProvider === undefined) {
			setSelectedAffordableProvider(providerNamesOfWantToUseOption['cheap'][0]);
		}
		if (selectedAllProvider === undefined) {
			setSelectedAllProvider(providerNamesOfWantToUseOption['all'][0]);
		}
	}, []);

	// reset the page to page 0 if the user redos onboarding
	useEffect(() => {
		if (!voidSettingsState.globalSettings.isOnboardingComplete) {
			setPageIndex(0)
		}
	}, [setPageIndex, voidSettingsState.globalSettings.isOnboardingComplete])

	const setPageType = (stepperType: StepperFlowType) => {
		setStepperType(stepperType)
		setPageIndex(pageIdx => pageIdx + 1)
	}

	const renderLastStep = <OnboardingPageShell
		content={
			<div>
				<div className="text-5xl font-light text-center">Settings and Themes</div>

				<div className="mt-8 text-center flex flex-col items-center gap-4 w-full max-w-md mx-auto">
					<h4 className="text-void-fg-3 mb-4">Transfer your settings from an existing editor?</h4>
					<OneClickSwitchButton className='w-full px-4 py-2' fromEditor="VS Code" />
					<OneClickSwitchButton className='w-full px-4 py-2' fromEditor="Cursor" />
					<OneClickSwitchButton className='w-full px-4 py-2' fromEditor="Windsurf" />
				</div>
			</div>
		}
		bottom={lastPagePrevAndNextButtons}
	/>

	const stepperFlowStartingPoint: StepperPages = {
		0: <OnboardingPageShell
			content={
				<div className='flex flex-col items-center gap-8'>
					<div className="text-5xl font-light text-center">The editor that Evolves with your code</div>

					{/* Slice of Void image */}
					<div className='max-w-md w-full h-[30vh] mx-auto flex items-center justify-center'>
						{!isLinux && <VoidIcon />}
					</div>

					<FadeIn
						delayMs={500}
					>
						<PrimaryActionButton
							onClick={() => { setPageIndex(1) }}
						>
							Login/Signup
						</PrimaryActionButton>
					</FadeIn>
				</div>
			}
		/>,
		1: <OnboardingFormPageShell
			title='Sign in'
			content={
				<LoginPage setPageType={setPageType} setPageIndex={setPageIndex} />
			}
		/>,
	}

	console.log(stepperType, pageIndex)

	const signInStepperFlow: StepperPages = {
		...stepperFlowStartingPoint,
		// resetting password (only email input)
		2: <OnboardingFormPageShell
			title='Enter your email'
			content={<ResetPasswordPage onSuccess={() => setPageIndex(3)} />}
			bottom={prevButton}
		/>,
		3: <OnboardingFormPageShell
			title='Check your email'
			content={<OTPPasswordPage email='test@proton.com' onSuccess={() => setPageIndex(4)} />}
			bottom={prevButton}
		/>,
		// reset password page
		4: <OnboardingFormPageShell
			title='Create new password'
			content={<CreatePasswordPage onSuccess={() => setPageIndex(6)} />}
			bottom={prevButton}
		/>,
		// verifying the code via email
		5: <OnboardingFormPageShell
			title='Check your email'
			content={<OTPPasswordPage email='test_verify_code@proton.com' onSuccess={() => setPageIndex(6)} />}
			bottom={returnToSignInButton}
		/>,
		6: renderLastStep
	}

	const signUpStepperFlow: StepperPages = {
		...stepperFlowStartingPoint,
		2: <OnboardingFormPageShell
			title='Sign up'
			content={<SignUpPage setPageIndex={setPageIndex} onSuccess={() => setPageIndex(3)} />}
			bottom={prevButton}
		/>,
		3: <OnboardingFormPageShell
			title='Create password'
			content={<CreatePasswordPage onSuccess={() => setPageIndex(4)} />}
			bottom={prevButton}
		/>,
		4: renderLastStep
	}

	return <div key={`${stepperType}-${pageIndex}`} className="w-full h-[80vh] text-left mx-auto flex flex-col items-center justify-center">
		<ErrorBoundary>
			{stepperType === 'signIn' ? signInStepperFlow[pageIndex] : signUpStepperFlow[pageIndex]}
		</ErrorBoundary>
	</div>

}
