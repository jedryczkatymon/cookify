export function H1({ children }: { children: React.ReactNode }) {
	return (
		<h1 className="scroll-m-20 text-balance text-center font-extrabold text-4xl tracking-tight">
			{children}
		</h1>
	)
}

export function H2({ children }: { children: React.ReactNode }) {
	return (
		<h2 className="scroll-m-20 border-b pb-2 font-semibold text-3xl tracking-tight first:mt-0">
			{children}
		</h2>
	)
}
