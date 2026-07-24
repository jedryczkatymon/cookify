import { BottomTabs } from "@/components/bottom-tabs"

export default function DashboardLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="pb-20 md:pb-0">
			{children}
			<BottomTabs />
		</div>
	)
}
