import {
	SignInButton,
	SignUpButton,
	SignedIn,
	SignedOut,
	UserButton,
} from "@clerk/nextjs"

export function Login() {
	return (
		<div className="flex h-16 items-center justify-end gap-4 p-4">
			<SignedOut>
				<SignInButton />
				<SignUpButton>
					<button
						type="button"
						className="h-10 cursor-pointer rounded-full bg-[#6c47ff] px-4 font-medium text-ceramic-white text-sm sm:h-12 sm:px-5 sm:text-base"
					>
						Sign Up
					</button>
				</SignUpButton>
			</SignedOut>
			<SignedIn>
				<UserButton />
			</SignedIn>
		</div>
	)
}
