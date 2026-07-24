import { ShoppingCart } from "lucide-react"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"

export default function ShoppingPage() {
	return (
		<div className="mx-auto w-4/5 space-y-6">
			<h1 className="font-bold text-2xl tracking-tight">Shopping</h1>
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ShoppingCart />
					</EmptyMedia>
					<EmptyTitle>Your shopping list is empty</EmptyTitle>
					<EmptyDescription>
						Coming soon — gather ingredients from planned meals into one
						shopping list.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}
