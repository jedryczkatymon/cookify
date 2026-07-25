import { CalendarDays } from "lucide-react"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"

export default function CalendarPage() {
	return (
		<div className="mx-auto mb-10 w-4/5 space-y-6 pb-6">
			<h1 className="font-bold text-2xl tracking-tight">Calendar</h1>
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<CalendarDays />
					</EmptyMedia>
					<EmptyTitle>No meals planned yet</EmptyTitle>
					<EmptyDescription>
						Coming soon — plan recipes across your week and see what&apos;s
						cooking next.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}
