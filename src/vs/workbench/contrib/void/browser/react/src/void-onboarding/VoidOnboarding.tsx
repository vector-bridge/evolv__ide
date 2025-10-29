/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useEffect, useRef, useState } from 'react';
import { useAccessor, useIsDark, useSettingsState } from '../util/services.js';
import { Brain, Check, ChevronRight, DollarSign, ExternalLink, Lock, X } from 'lucide-react';
import { displayInfoOfProviderName, ProviderName, providerNames, localProviderNames, featureNames, FeatureName, isFeatureNameDisabled } from '../../../../common/voidSettingsTypes.js';
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js';
import { OllamaSetupInstructions, OneClickSwitchButton, SettingsForProvider, ModelDump } from '../void-settings-tsx/Settings.js';
import { ColorScheme } from '../../../../../../../platform/theme/common/theme.js';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';
import { isLinux } from '../../../../../../../base/common/platform.js';

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

const LoginPage = ({ setPageType }: { setPageType: (stepperType: StepperFlowType) => void }) => {
	return (
		<>
			<form className="space-y-4">
				<div>
					<label htmlFor="email" className='text-sm text-neutral-400'>Email</label>
					<input
						id="email"
						type="email"
						placeholder="Your email address"
						className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<button
					type="submit"
					className="w-full py-2 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition"
					onClick={() => setPageType('signIn')}
				>
					Continue
				</button>

				<div className="flex items-center gap-2 text-gray-500 text-sm my-4">
					<div className="flex-1 h-px bg-neutral-700"></div>
					<span>OR</span>
					<div className="flex-1 h-px bg-neutral-700"></div>
				</div>

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

				<p className="text-center text-sm text-gray-500 mt-6">
					Don't have an account?&nbsp;&nbsp;
					<a href="#" className="text-blue-500 hover:underline"
						onClick={() => setPageType('signUp')}
					>Sign up</a>
				</p>
			</form>

		</>
	)
}

const SignInPasswordPage = ({ setPageIndex }: { setPageIndex: (idx: 3 | 5) => void }) => {
	return (
		<>
			{/* Email */}
			<div className="mb-4">
				<label className="text-sm text-neutral-400 block mb-1">Email</label>
				<p className="text-sm text-neutral-200">••••••••@gmail.com</p>
			</div>

			{/* Password */}
			<div className="mb-6">
				<div className="flex justify-between items-center mb-1">
					<label className="text-sm text-neutral-400">Password</label>
					<button className="text-xs text-neutral-400 hover:underline"
						onClick={() => setPageIndex(3)}
					>
						Forgot your password?
					</button>
				</div>
				<input
					type="password"
					placeholder="Your password"
					className="w-full rounded-md bg-neutral-950 border border-neutral-700 focus:border-neutral-500 focus:outline-none px-3 py-2 text-sm placeholder-neutral-500"
				/>
			</div>

			{/* Sign in button */}
			<button className="w-full bg-white text-black font-medium py-2 rounded-md hover:bg-neutral-200 transition">
				Sign in
			</button>

			{/* Divider */}
			<div className="flex items-center my-4">
				<div className="flex-grow h-px bg-neutral-700" />
				<span className="text-neutral-500 text-xs mx-2">OR</span>
				<div className="flex-grow h-px bg-neutral-700" />
			</div>

			{/* Email sign-in code */}
			<button className="w-full border border-neutral-700 py-2 rounded-md text-sm flex items-center justify-center space-x-2 hover:bg-neutral-800 transition"
				onClick={() => setPageIndex(5)}
			>
				<span className="text-lg">✉️</span>
				<span>Email sign-in code</span>
			</button>

			{/* Footer */}
			<p className="text-xs text-neutral-600 mt-8">
				Terms of Service and Privacy Policy
			</p>
		</>
	);
}

const SignUpPage = ({ pageIndex, setPageIndex }: { pageIndex: number, setPageIndex: (index: number) => void }) => {
	return (
		<>
			<form className="space-y-4">
				{/*  First / Last Name */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="text-sm text-gray-400" htmlFor="firstName">First name</label>
						<input
							type="text"
							id="firstName"
							placeholder="Your first name"
							className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="text-sm text-gray-400" htmlFor="lastName">Last name</label>
						<input
							type="text"
							id="lastName"
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
						placeholder="Your email address"
						className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				{/*  Continue */}
				<button
					type="submit"
					className="w-full py-2 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition"
					onClick={() => setPageIndex(pageIndex + 1)}
				>
					Continue
				</button>

				{/*  Divider */}
				<div className="flex items-center gap-2 text-gray-500 text-sm my-4">
					<div className="flex-1 h-px bg-neutral-700"></div>
					<span>OR</span>
					<div className="flex-1 h-px bg-neutral-700"></div>
				</div>

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

				{/*  Sign in link */}
				<p className="text-center text-sm text-gray-500 mt-6">
					Already have an account?&nbsp;
					<a href="#" className="text-blue-500 hover:underline">Sign in</a>
				</p>
			</form>

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

const CreatePasswordPage = ({ pageIndex, setPageIndex }: { pageIndex: number, setPageIndex: (index: number) => void }) => {
	return <form className="space-y-4">
		{/*  Email */}
		<div>
			<label htmlFor="email">Email</label>
			<input
				type="email"
				id="email"
				placeholder="••••••••@gmail.com"
				className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				disabled
			/>
		</div>

		{/*  Password */}
		<div>
			<label htmlFor="password">Password</label>
			<input
				type="password"
				id="password"
				placeholder="Create a password"
				className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		{/*  Confirm Password */}
		<div>
			<label htmlFor="confirmPassword">Confirm password</label>
			<input
				id="confirm-password"
				type="password"
				placeholder="Confirm your password"
				className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		{/*  Continue */}
		<button
			type="submit"
			className="w-full py-2 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition"
			onClick={() => setPageIndex(pageIndex + 1)}
		>
			Continue
		</button>

		{/*  Divider */}
		<div className="flex items-center gap-2 text-gray-500 text-sm my-4">
			<div className="flex-1 h-px bg-neutral-700"></div>
			<span>OR</span>
			<div className="flex-1 h-px bg-neutral-700"></div>
		</div>

		{/*  Continue with Email Code */}
		<button
			type="button"
			className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md flex items-center justify-center gap-2"
		>
			<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l9 6 9-6m-18 8h18V8l-9 6-9-6v8z" />
			</svg>
			Continue with email code
		</button>
	</form>

}

const ConfirmEmailPasswordPage = () => {
	return (
		<div className="flex flex-col justify-center items-center" >
			<p className="text-sm text-neutral-300 mb-6">
				Enter the code sent to <br />
				<span className="text-white font-medium">••••••••@gmail.com</span>
			</p>

			{/* Code Inputs (placeholder area) */}
			<div className="flex justify-center space-x-2 mb-6">
				{/* Replace this block with 6 inputs later */}
				<div className="w-10 h-12 bg-neutral-800 rounded-md" />
				<div className="w-10 h-12 bg-neutral-800 rounded-md" />
				<div className="w-10 h-12 bg-neutral-800 rounded-md" />
				<div className="w-10 h-12 bg-neutral-800 rounded-md" />
				<div className="w-10 h-12 bg-neutral-800 rounded-md" />
				<div className="w-10 h-12 bg-neutral-800 rounded-md" />
			</div>

			{/* Resend Link */}
			<p className="text-xs text-neutral-500">
				Didn't receive a code?{" "}
				<button className="text-white hover:underline">
					Resend (25)
				</button>
			</p>
		</div >
	)
}

const ResetPasswordPage = () => {
	return (
		<>
			{/* Email */}
			<div className="mb-6">
				<label className="text-sm text-neutral-400 block mb-1">Email</label>
				<input
					type="email"
					placeholder="••••••••@gmail.com"
					className="w-full rounded-md bg-neutral-950 border border-neutral-700 focus:border-neutral-500 focus:outline-none px-3 py-2 text-sm placeholder-neutral-500 text-neutral-200"
					defaultValue="••••••••@gmail.com"
				/>
			</div>

			{/* Send reset instructions */}
			<button className="w-full bg-white text-black font-medium py-2 rounded-md hover:bg-neutral-200 transition">
				Send reset instructions
			</button>
		</>
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
// =============================================
// 	OnboardingPage
// 		title:
// 			div
// 				"Welcome to Void"
// 			image
// 		content:<></>
// 		title
// 		content
// 		prev/next

// 	OnboardingPage
// 		title:
// 			div
// 				"How would you like to use Void?"
// 		content:
// 			ModelQuestionContent
// 				|
// 					div
// 						"I want to:"
// 					div
// 						"Use the smartest models"
// 						"Keep my data fully private"
// 						"Save money"
// 						"I don't know"
// 				| div
// 					| div
// 						"We recommend using "
// 						"Set API"
// 					| div
// 						""
// 					| div
//
// 		title
// 		content
// 		prev/next
//
// 	OnboardingPage
// 		title
// 		content
// 		prev/next

const NextButton = ({ onClick, ...props }: { onClick: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {

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

const PreviousButton = ({ onClick, ...props }: { onClick: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
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


const PrevButton = ({ onClick }: { onClick: () => void }) => <div className="max-w-[600px] w-full mx-auto flex flex-col items-end">
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

const VoidOnboardingContent = () => {


	const accessor = useAccessor()
	const voidSettingsService = accessor.get('IVoidSettingsService')
	const voidMetricsService = accessor.get('IMetricsService')

	const voidSettingsState = useSettingsState()

	const [pageIndex, setPageIndex] = useState(0)
	const [stepperType, setStepperType] = useState<StepperFlowType>('signIn')

	// page 1 state
	const [wantToUseOption, setWantToUseOption] = useState<WantToUseOption>('smart')

	const setStep = (idx: number) => setPageIndex(idx)

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
	const returnToSignInButton = <PrevButton onClick={() => setStep(2)} />


	const lastPagePrevAndNextButtons = <div className="max-w-[600px] w-full mx-auto flex flex-col items-end">
		<div className="flex items-center gap-2">
			<PreviousButton
				onClick={() => { setPageIndex(pageIndex - 1) }}
			/>
			<PrimaryActionButton
				onClick={() => {
					voidSettingsService.setGlobalSetting('isOnboardingComplete', true);
					voidMetricsService.capture('Completed Onboarding', { selectedProviderName, wantToUseOption })
				}}
				ringSize={voidSettingsState.globalSettings.isOnboardingComplete ? 'screen' : undefined}
			>Enter the Void</PrimaryActionButton>
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

	const stepperFlowStartingPoint: { [pageIndex: number]: React.ReactNode } = {
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
				<LoginPage setPageType={setPageType} />
			}
		/>,
	}

	const signInStepperFlow: { [pageIndex: number]: React.ReactNode } = {
		...stepperFlowStartingPoint,
		2: <OnboardingFormPageShell
			title='Sign in'
			content={<SignInPasswordPage setPageIndex={setStep} />}
			bottom={prevButton}
		/>,
		// resetting password (only email input)
		3: <OnboardingFormPageShell
			title='Reset your password'
			content={<ResetPasswordPage />}
			bottom={prevButton}
		/>,
		// currently unused, reserved for reset password page
		4: <OnboardingFormPageShell
			title='Reset your password'
			content={<CreatePasswordPage pageIndex={pageIndex} setPageIndex={setPageIndex} />}
			bottom={prevButton}
		/>,
		// verifying the code via email
		5: <OnboardingFormPageShell
			title='Check your email'
			content={<ConfirmEmailPasswordPage />}
			bottom={returnToSignInButton}
		/>,
	}

	const signUpStepperFlow: { [pageIndex: number]: React.ReactNode } = {
		...stepperFlowStartingPoint,
		2: <OnboardingFormPageShell
			title='Sign up'
			content={<SignUpPage pageIndex={pageIndex} setPageIndex={setPageIndex} />}
			bottom={prevButton}
		/>,
		3: <OnboardingFormPageShell
			title='Create password'
			content={<CreatePasswordPage pageIndex={pageIndex} setPageIndex={setPageIndex} />}
			bottom={prevButton}
		/>,
		4: <OnboardingFormPageShell
			title='Check your email'
			content={<ConfirmEmailPasswordPage />}
			bottom={prevButton}
		/>,
		9: <OnboardingPageShell
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
		/>,
	}


	return <div key={`${stepperType}-${pageIndex}`} className="w-full h-[80vh] text-left mx-auto flex flex-col items-center justify-center">
		<ErrorBoundary>
			{stepperType === 'signIn' ? signInStepperFlow[pageIndex] : signUpStepperFlow[pageIndex]}
		</ErrorBoundary>
	</div>

}
