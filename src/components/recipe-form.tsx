"use client"

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronsUpDown, GripVertical, Minus, Plus } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
	type Control,
	type Resolver,
	useFieldArray,
	useForm,
} from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import TagsInput from "@/components/ui/tags-input"
import { Textarea } from "@/components/ui/textarea"
import { H1, H2 } from "@/components/ui/typography"
import { MEALS } from "@/lib/enums"
import { splitStepsText } from "@/lib/split-steps"
import { cn } from "@/lib/utils"
import type { Ingredient, Recipe, Step, Tag, Upload } from "@/prisma"
import { useUploadThing } from "@/utils/uploadthing"
import DialogDelete from "./dialog-delete"

type RecipeWithRelations = Recipe & {
	tags: Tag[]
	ingredients: Ingredient[]
	steps: Step[]
	uploads: Upload | null
}

const amountSchema = z.preprocess(
	(v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
	z.number().optional(),
)

const sectionRowSchema = z.object({
	kind: z.literal("section"),
	title: z.string(),
})

const ingredientRowSchema = z.object({
	kind: z.literal("ingredient"),
	amount: amountSchema,
	unit: z.string().optional().or(z.literal("")),
	product: z.string().min(1).optional().or(z.literal("")),
})

const ingredientListItemSchema = z.discriminatedUnion("kind", [
	sectionRowSchema,
	ingredientRowSchema,
])

const formSchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().optional().or(z.literal("")),
	tags: z.array(z.string()).optional(),
	category: z.string().optional().or(z.literal("")),
	servings: z.preprocess(
		(v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
		z.number().min(1).optional(),
	),
	prepTime: z.preprocess(
		(v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
		z.number().optional(),
	),
	calories: z.preprocess(
		(v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
		z.number().optional(),
	),
	notes: z.string().optional().or(z.literal("")),
	ingredients: z.array(ingredientListItemSchema).optional(),
	steps: z.array(z.object({ content: z.string() })).optional(),
	imageUrl: z.string().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>
type IngredientListItem = z.infer<typeof ingredientListItemSchema>

type FlattenedIngredient = {
	amount?: number
	unit: string | null
	product: string
	section: string | null
}

function expandIngredientsFromDb(
	ingredients: Ingredient[] | undefined,
): IngredientListItem[] {
	if (!ingredients?.length) {
		return [{ kind: "ingredient", amount: undefined, unit: "", product: "" }]
	}

	const sorted = ingredients.slice().sort((a, b) => {
		if (a.order == null && b.order == null) return 0
		if (a.order == null) return 1
		if (b.order == null) return -1
		return a.order - b.order
	})

	const rows: IngredientListItem[] = []
	let lastHeader: string | null = null

	for (const ing of sorted) {
		const section = ing.section?.trim() || null
		if (section && section !== lastHeader) {
			rows.push({ kind: "section", title: section })
			lastHeader = section
		} else if (!section) {
			lastHeader = null
		}

		rows.push({
			kind: "ingredient",
			amount: ing.amount ?? undefined,
			unit: ing.unit ?? "",
			product: ing.product ?? "",
		})
	}

	return rows
}

function flattenIngredientRows(
	rows: IngredientListItem[] | undefined,
): FlattenedIngredient[] {
	let currentSection: string | null = null
	const out: FlattenedIngredient[] = []

	for (const row of rows ?? []) {
		if (row.kind === "section") {
			const title = row.title.trim()
			currentSection = title || null
			continue
		}

		if (!row.product?.trim()) continue

		out.push({
			amount: row.amount,
			unit: row.unit?.trim() ? row.unit : null,
			product: row.product.trim(),
			section: currentSection,
		})
	}

	return out
}

function SortableSectionRow({
	id,
	index,
	control,
	onRemove,
}: {
	id: string
	index: number
	control: Control<FormValues>
	onRemove: () => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
		zIndex: isDragging ? 1 : undefined,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-2 border-b pb-2"
		>
			<button
				type="button"
				className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
				aria-label={`Drag to reorder section ${index + 1}`}
				{...attributes}
				{...listeners}
			>
				<GripVertical className="h-5 w-5" />
			</button>
			<div className="min-w-0 flex-1">
				<FormField
					control={control}
					name={`ingredients.${index}.title` as const}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									placeholder="e.g Naleśniki"
									type="text"
									aria-label="Section title"
									className="font-semibold"
									{...field}
									value={typeof field.value === "string" ? field.value : ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onRemove}
				aria-label={`Remove section ${index + 1}`}
			>
				<Minus className="h-4 w-4" />
			</Button>
		</div>
	)
}

function SortableIngredientRow({
	id,
	index,
	control,
	onRemove,
}: {
	id: string
	index: number
	control: Control<FormValues>
	onRemove: () => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
		zIndex: isDragging ? 1 : undefined,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="grid grid-cols-13 items-center gap-4"
		>
			<div className="col-span-1 flex items-center justify-center">
				<button
					type="button"
					className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
					aria-label={`Drag to reorder ingredient ${index + 1}`}
					{...attributes}
					{...listeners}
				>
					<GripVertical className="h-5 w-5" />
				</button>
			</div>

			<div className="col-span-3">
				<FormField
					control={control}
					name={`ingredients.${index}.amount` as const}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									placeholder="e.g 50"
									type="number"
									aria-label="Amount"
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="col-span-3">
				<FormField
					control={control}
					name={`ingredients.${index}.unit` as const}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									placeholder="e.g grams"
									type="text"
									aria-label="Unit"
									{...field}
									value={typeof field.value === "string" ? field.value : ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="col-span-5">
				<FormField
					control={control}
					name={`ingredients.${index}.product` as const}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									placeholder="e.g butter"
									type="text"
									aria-label="Product"
									{...field}
									value={typeof field.value === "string" ? field.value : ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="col-span-1 flex justify-end">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onRemove}
					aria-label={`Remove ingredient ${index + 1}`}
				>
					<Minus className="h-4 w-4" />
				</Button>
			</div>
		</div>
	)
}

export default function RecipeForm({
	recipe,
	onSubmit,
	submitLabel = recipe ? "Update" : "Submit",
}: {
	recipe?: RecipeWithRelations | null
	onSubmit?: (
		values: Omit<FormValues, "steps" | "ingredients"> & {
			steps: string[]
			ingredients: FlattenedIngredient[]
		},
	) => Promise<void>
	submitLabel?: string
}) {
	const router = useRouter()
	const [files, setFiles] = useState<File[]>([])
	const { startUpload } = useUploadThing("imageUploader")

	const initialIngredients = expandIngredientsFromDb(recipe?.ingredients)

	const initialSteps = (() => {
		const fromDb = (recipe?.steps ?? [])
			.slice()
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.flatMap((s) => splitStepsText(s.content ?? ""))
			.map((content) => ({ content }))

		return fromDb.length > 0 ? fromDb : [{ content: "" }]
	})()

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
		defaultValues: {
			name: recipe?.name ?? "",
			description: recipe?.description ?? "",
			tags: recipe?.tags?.map((t) => t.name) ?? [],
			category: recipe?.category ?? "",
			servings: recipe?.servings ?? undefined,
			prepTime: recipe?.prepTime ?? undefined,
			calories: recipe?.calories ?? undefined,
			notes: recipe?.notes ?? "",
			ingredients: initialIngredients,
			steps: initialSteps,
			imageUrl: "",
		},
	})

	const { fields, append, remove, move } = useFieldArray({
		control: form.control,
		name: "ingredients",
	})

	const {
		fields: stepFields,
		append: appendStep,
		remove: removeStep,
	} = useFieldArray({
		control: form.control,
		name: "steps",
	})

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 6 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const handleIngredientDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		if (!over || active.id === over.id) return

		const oldIndex = fields.findIndex((f) => f.id === active.id)
		const newIndex = fields.findIndex((f) => f.id === over.id)
		if (oldIndex < 0 || newIndex < 0) return
		move(oldIndex, newIndex)
	}

	const internalSubmit = async (values: FormValues) => {
		const submissionData = {
			...values,
			ingredients: flattenIngredientRows(values.ingredients),
			steps: (values.steps ?? []).map((s) => s.content.trim()).filter(Boolean),
			imageUrl: values.imageUrl,
		}

		if (onSubmit) {
			try {
				let uploadedImageUrl = values.imageUrl
				if (files.length > 0) {
					const uploadRes = await startUpload(files)
					if (!uploadRes || uploadRes.length === 0) {
						toast.error("Image upload failed")
						return
					}
					uploadedImageUrl = uploadRes[0]?.ufsUrl
				}
				await onSubmit({ ...submissionData, imageUrl: uploadedImageUrl })
			} catch (err) {
				console.error(err)
				toast.error("Failed to submit.")
			}
			return
		}

		// Optimistic update: navigate immediately, save in background
		if (recipe) {
			const filesToUpload = files
			const slug = recipe.slug
			toast.success("Recipe updated!")
			router.push("/dashboard")

			void (async () => {
				try {
					let uploadedImageUrl = submissionData.imageUrl

					if (filesToUpload.length > 0) {
						const uploadRes = await startUpload(filesToUpload)
						if (!uploadRes || uploadRes.length === 0) {
							toast.error("Image upload failed", {
								action: {
									label: "Edit again",
									onClick: () => router.push(`/dashboard/edit/${slug}`),
								},
							})
							return
						}
						uploadedImageUrl = uploadRes[0]?.ufsUrl
					}

					const formData = new FormData()
					formData.append(
						"data",
						JSON.stringify({ ...submissionData, imageUrl: uploadedImageUrl }),
					)

					const res = await fetch(`/api/recipes/${slug}`, {
						method: "PUT",
						body: formData,
					})
					if (!res.ok) throw new Error("Failed to submit")

					router.refresh()
				} catch (err) {
					console.error(err)
					toast.error("Failed to update recipe.", {
						action: {
							label: "Edit again",
							onClick: () => router.push(`/dashboard/edit/${slug}`),
						},
					})
				}
			})()
			return
		}

		// Create: wait for upload + API as before
		try {
			let uploadedImageUrl = values.imageUrl

			if (files.length > 0) {
				try {
					const uploadRes = await startUpload(files)

					if (!uploadRes || uploadRes.length === 0) {
						toast.error("Image upload failed")
						return
					}

					uploadedImageUrl = uploadRes[0]?.ufsUrl
				} catch (uploadError) {
					console.error("Upload error:", uploadError)
					toast.error("Failed to upload image. Please try again.")
					return
				}
			}

			const formData = new FormData()
			formData.append(
				"data",
				JSON.stringify({ ...submissionData, imageUrl: uploadedImageUrl }),
			)

			const res = await fetch("/api/recipes", {
				method: "POST",
				body: formData,
			})
			if (!res.ok) throw new Error("Failed to submit")

			toast.success("Recipe created!")
		} catch (err) {
			console.error(err)
			toast.error("Failed to submit.")
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(internalSubmit)}
				className="mx-auto max-w-3xl space-y-8 py-10"
			>
				<H1>{recipe ? "Edit recipe" : "Create a recipe"}</H1>
				<div className="space-y-2">
					<H2>Recipe Photo</H2>
					<FormItem>
						<FormControl>
							<div className="space-y-4">
								{recipe?.uploads?.url ? (
									<div className="relative">
										<Image
											src={recipe.uploads.url}
											alt={recipe.name}
											width={640}
											height={600}
											className="size-full rounded-lg object-cover"
										/>
										<Button
											variant="destructive"
											className="absolute top-2 right-2"
											onClick={() => {
												const handleRemoveImage = async () => {
													try {
														if (!recipe?.uploads) return

														const res = await fetch(
															`/api/recipes/${recipe.slug}/image`,
															{
																method: "DELETE",
															},
														)

														if (!res.ok)
															throw new Error("Failed to delete image")

														toast.success("Image removed successfully")
														router.refresh()
													} catch (error) {
														console.error("Error removing image:", error)
														toast.error("Failed to remove image")
													}
												}

												handleRemoveImage()
											}}
										>
											Remove
										</Button>
									</div>
								) : (
									<>
										<FormLabel>Cover Image</FormLabel>
										<Input
											type="file"
											accept="image/*"
											onChange={(e) =>
												setFiles(Array.from(e.target.files ?? []))
											}
										/>
									</>
								)}
							</div>
						</FormControl>
					</FormItem>
				</div>
				<H2>Basic Information</H2>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Recipe name</FormLabel>
							<FormControl>
								<Input placeholder="e.g Pancakes" type="text" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Describe your recipe"
									className="resize-none"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="tags"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tags</FormLabel>
							<FormControl>
								<TagsInput
									value={Array.isArray(field.value) ? field.value : []}
									onValueChange={field.onChange}
									placeholder="Enter your tags"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="category"
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel>Category</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant="outline"
											className={cn(
												"w-50 justify-between",
												!field.value && "text-muted-foreground",
											)}
											aria-haspopup="listbox"
										>
											{field.value ? field.value : "Select meal"}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-50 p-0">
									<Command>
										<CommandInput placeholder="Search meal..." />
										<CommandList>
											<CommandEmpty>No meal found.</CommandEmpty>
											<CommandGroup>
												{MEALS.map((meal) => (
													<CommandItem
														key={meal}
														onSelect={() => {
															form.setValue("category", meal)
														}}
														value={meal}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																meal === field.value
																	? "opacity-100"
																	: "opacity-0",
															)}
														/>
														{meal}
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-18 gap-4">
					<div className="col-span-6">
						<FormField
							control={form.control}
							name="servings"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Servings</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g 4"
											type="number"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="col-span-6">
						<FormField
							control={form.control}
							name="prepTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Prep time (minutes)</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g 20"
											type="number"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="col-span-6">
						<FormField
							control={form.control}
							name="calories"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Calories</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g 500"
											type="number"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>
				<H2>Ingredients</H2>
				<div className="space-y-4">
					{fields.some((f) => f.kind === "ingredient") ? (
						<div className="grid grid-cols-13 gap-4">
							<div className="col-span-1" />
							<div className="col-span-3 font-medium text-sm leading-none">
								Amount
							</div>
							<div className="col-span-3 font-medium text-sm leading-none">
								Unit
							</div>
							<div className="col-span-5 font-medium text-sm leading-none">
								Product
							</div>
							<div className="col-span-1" />
						</div>
					) : null}
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleIngredientDragEnd}
					>
						<SortableContext
							items={fields.map((f) => f.id)}
							strategy={verticalListSortingStrategy}
						>
							{fields.map((fieldItem, index) =>
								fieldItem.kind === "section" ? (
									<SortableSectionRow
										key={fieldItem.id}
										id={fieldItem.id}
										index={index}
										control={form.control}
										onRemove={() => remove(index)}
									/>
								) : (
									<SortableIngredientRow
										key={fieldItem.id}
										id={fieldItem.id}
										index={index}
										control={form.control}
										onRemove={() => remove(index)}
									/>
								),
							)}
						</SortableContext>
					</DndContext>

					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							onClick={() =>
								append({
									kind: "ingredient",
									amount: undefined,
									unit: "",
									product: "",
								})
							}
						>
							<Plus className="mr-2 h-4 w-4" />
							Add ingredient
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => append({ kind: "section", title: "" })}
						>
							<Plus className="mr-2 h-4 w-4" />
							Add section
						</Button>
					</div>
				</div>
				<H2>Directions</H2>
				<div className="space-y-4">
					{stepFields.map((fieldItem, index) => (
						<div key={fieldItem.id} className="flex items-start gap-2">
							<div className="min-w-0 flex-1">
								<FormField
									control={form.control}
									name={`steps.${index}.content` as const}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Step {index + 1}</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Recipe step"
													className="resize-y"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<Button
								type="button"
								variant="ghost"
								className="mt-8"
								onClick={() => removeStep(index)}
								aria-label={`Remove step ${index + 1}`}
							>
								<Minus className="h-4 w-4" />
							</Button>
						</div>
					))}
					<div>
						<Button type="button" onClick={() => appendStep({ content: "" })}>
							<Plus className="mr-2 h-4 w-4" />
							Add step
						</Button>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Button type="submit">{submitLabel}</Button>
					{recipe ? <DialogDelete slug={recipe?.slug ?? ""} /> : null}
				</div>
			</form>
		</Form>
	)
}
