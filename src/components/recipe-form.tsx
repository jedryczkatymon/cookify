"use client"

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
import { cn } from "@/lib/utils"
import { useUploadThing } from "@/utils/uploadthing"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronsUpDown, Minus, Plus } from "lucide-react"
import { useState } from "react"
import { type Resolver, useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { Recipe, Tag } from "types/types"
import { z } from "zod"

const formSchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	category: z.string().optional(),
	servings: z.preprocess(
		(v) => (v === "" ? undefined : Number(v)),
		z.number().min(1),
	),
	prepTime: z.preprocess(
		(v) => (v === "" ? undefined : Number(v)),
		z.number().optional(),
	),
	notes: z.string().optional(),
	ingredients: z
		.array(
			z.object({
				amount: z.preprocess(
					(v) => (v === "" ? undefined : Number(v)),
					z.number().optional(),
				),
				unit: z.string().optional(),
				product: z.string().min(1),
			}),
		)
		.min(1),
	steps: z.string().min(1),
	imageUrl: z.string().optional(),
})

export default function RecipeForm({
	recipe,
	onSubmit,
	submitLabel = recipe ? "Update" : "Submit",
}: {
	recipe?: Recipe | null
	onSubmit?: (values: z.infer<typeof formSchema>) => Promise<void>
	submitLabel?: string
}) {
	const [files, setFiles] = useState<File[]>([])
	const { startUpload, isUploading } = useUploadThing("imageUploader")

	const meals = [
		"Breakfast",
		"Second Breakfast",
		"Brunch",
		"Lunch",
		"Dinner",
		"Dessert",
		"Snack",
		"Appetizer",
		"Beverage",
		"Preworkout",
		"Postworkout",
	] as const

	const initialIngredients = recipe?.ingredients?.map((ing) => ({
		amount: ing.amount ?? undefined,
		unit: ing.unit ?? "",
		product: ing.name ?? "",
	})) ?? [{ amount: undefined, unit: "", product: "" }]

	const initialSteps = (recipe?.steps ?? [])
		.slice()
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		.map((s) => s.content)
		.join("\n\n")

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema) as unknown as Resolver<
			z.infer<typeof formSchema>
		>,
		defaultValues: {
			name: recipe?.name ?? "",
			description: recipe?.description ?? "",
			tags: recipe?.tags?.map((t: Tag) => t.name) ?? [],
			category: recipe?.category ?? "",
			servings: recipe?.servings ?? undefined,
			prepTime: recipe?.prepTime ?? undefined,
			notes: recipe?.notes ?? "",
			ingredients: initialIngredients,
			steps: initialSteps,
			imageUrl: "",
		},
	})

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "ingredients",
	})

	const internalSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			let uploadedImageUrl = values.imageUrl

			if (files.length > 0) {
				// 3. Upload logic: Only runs if a user selected a file
				const uploadRes = await startUpload(files)

				if (!uploadRes || uploadRes.length === 0) {
					toast.error("Image upload failed")
					return
				}

				// Get the URL from Uploadthing response
				uploadedImageUrl = uploadRes[0]?.ufsUrl
			}

			// 4. Attach the new URL to the values sent to API
			const submissionData = {
				...values,
				imageUrl: uploadedImageUrl,
			}

			if (onSubmit) {
				await onSubmit(submissionData)
				return
			}

			const formData = new FormData()
			formData.append("data", JSON.stringify(submissionData))

			const url = recipe ? `/api/recipes/${recipe.slug}` : "/api/recipes"
			const method = recipe ? "PUT" : "POST"

			const res = await fetch(url, {
				method,
				body: formData,
			})
			if (!res.ok) throw new Error("Failed to submit")

			toast.success(recipe ? "Recipe updated!" : "Recipe created!")
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
						<FormLabel>Cover Image</FormLabel>
						<FormControl>
							<Input
								type="file"
								accept="image/*"
								onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
							/>
						</FormControl>
						{/* Preview (Optional) */}
						{files.length > 0 && (
							<p className="text-muted-foreground text-sm">
								Selected: {files[0]?.name}
							</p>
						)}
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
												"w-[200px] justify-between",
												!field.value && "text-muted-foreground",
											)}
											aria-haspopup="listbox"
										>
											{field.value ? field.value : "Select meal"}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-[200px] p-0">
									<Command>
										<CommandInput placeholder="Search meal..." />
										<CommandList>
											<CommandEmpty>No meal found.</CommandEmpty>
											<CommandGroup>
												{meals.map((meal) => (
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

				<div className="grid grid-cols-12 gap-4">
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
				</div>

				<H2>Ingredients</H2>
				<div className="space-y-4">
					{fields.map((fieldItem, index) => (
						<div
							key={fieldItem.id}
							className="grid grid-cols-13 items-end gap-4"
						>
							<div className="col-span-4">
								<FormField
									control={form.control}
									name={`ingredients.${index}.amount` as const}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Amount</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g 50"
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

							<div className="col-span-4">
								<FormField
									control={form.control}
									name={`ingredients.${index}.unit` as const}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Unit</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g grams"
													type="text"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="col-span-4">
								<FormField
									control={form.control}
									name={`ingredients.${index}.product` as const}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Product</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g butter"
													type="text"
													{...field}
													value={field.value ?? ""}
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
									onClick={() => remove(index)}
									aria-label={`Remove ingredient ${index + 1}`}
								>
									<Minus className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}

					<div>
						<Button
							type="button"
							onClick={() =>
								append({ amount: undefined, unit: "", product: "" })
							}
						>
							<Plus className="mr-2 h-4 w-4" />
							Add ingredient
						</Button>
					</div>
				</div>

				<H2>Directions</H2>
				<FormField
					control={form.control}
					name="steps"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Recipe content</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Recipe steps"
									className="resize-y"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit">{submitLabel}</Button>
			</form>
		</Form>
	)
}
