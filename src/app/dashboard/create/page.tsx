'use client'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import TagsInput from '@/components/ui/tags-input'
import { Textarea } from '@/components/ui/textarea'
import { H1, H2 } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown, Plus, Minus } from 'lucide-react'
import { type Resolver, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	category: z.string().optional(),
	servings: z.preprocess(
		(v) => (v === '' ? undefined : Number(v)),
		z.number().min(1),
	),
	prepTime: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number()),
	notes: z.string().optional(),
	ingredients: z
		.array(
			z.object({
				amount: z.preprocess(
					(v) => (v === '' ? undefined : Number(v)),
					z.number().optional(),
				),
				unit: z.string().optional(),
				product: z.string().min(1),
			}),
		)
		.min(1),
	steps: z.string().min(1),
})

export default function RecipeForm() {
	const meals = [
		'Breakfast',
		'Second Breakfast',
		'Brunch',
		'Lunch',
		'Dinner',
		'Dessert',
		'Snack',
		'Appetizer',
		'Beverage',
		'Preworkout',
		'Postworkout',
	] as const

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema) as unknown as Resolver<
			z.infer<typeof formSchema>
		>,
		defaultValues: {
			name: '',
			description: '',
			tags: [],
			category: '',
			servings: undefined,
			prepTime: undefined,
			notes: '',
			ingredients: [{ amount: undefined, unit: '', product: '' }],
		},
	})

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'ingredients',
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			const formData = new FormData()
			formData.append('data', JSON.stringify(values))

			const res = await fetch('/api/recipes', {
				method: 'POST',
				body: formData,
			})

			const result = await res.json()
			console.log(result)

			toast.success('Recipe created!')
		} catch (error) {
			console.error(error)
			toast.error('Failed to submit.')
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="mx-auto max-w-3xl space-y-8 py-10"
			>
				<H1>Create a recipe</H1>
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
												'w-[200px] justify-between',
												!field.value && 'text-muted-foreground',
											)}
											aria-haspopup="listbox"
										>
											{field.value ? field.value : 'Select meal'}
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
														value={meal}
														key={meal}
														onSelect={() => {
															form.setValue('category', meal)
														}}
													>
														<Check
															className={cn(
																'mr-2 h-4 w-4',
																meal === field.value
																	? 'opacity-100'
																	: 'opacity-0',
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
											value={field.value ?? ''}
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
											placeholder="e.g 50"
											type="number"
											{...field}
											value={field.value ?? ''}
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
					{fields.map((field, index) => (
						<div key={field.id} className="grid grid-cols-12 items-end gap-4">
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
													value={field.value ?? ''}
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
													value={field.value ?? ''}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="col-span-3">
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
													value={field.value ?? ''}
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
								append({ amount: undefined, unit: '', product: '' })
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

				<Button type="submit">Submit</Button>
			</form>
		</Form>
	)
}
