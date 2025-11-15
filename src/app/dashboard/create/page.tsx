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
import { Check, ChevronsUpDown } from 'lucide-react'
import { type Resolver, useForm } from 'react-hook-form'
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
	amount: z.preprocess(
		(v) => (v === '' ? undefined : Number(v)),
		z.number().optional(),
	),
	unit: z.string().min(1).optional(),
	product: z.string().min(1).optional(),
	steps: z.string().min(1),
})

export default function RecipeForm() {
	const languages = [
		{
			label: 'English',
			value: 'en',
		},
		{
			label: 'French',
			value: 'fr',
		},
		{
			label: 'German',
			value: 'de',
		},
		{
			label: 'Spanish',
			value: 'es',
		},
		{
			label: 'Portuguese',
			value: 'pt',
		},
		{
			label: 'Russian',
			value: 'ru',
		},
		{
			label: 'Japanese',
			value: 'ja',
		},
		{
			label: 'Korean',
			value: 'ko',
		},
		{
			label: 'Chinese',
			value: 'zh',
		},
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
			amount: undefined,
			unit: '',
			product: '',
		},
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
											{field.value
												? languages.find(
														(language) => language.value === field.value,
													)?.label
												: 'Select language'}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-[200px] p-0">
									<Command>
										<CommandInput placeholder="Search language..." />
										<CommandList>
											<CommandEmpty>No language found.</CommandEmpty>
											<CommandGroup>
												{languages.map((language) => (
													<CommandItem
														value={language.label}
														key={language.value}
														onSelect={() => {
															form.setValue('category', language.value)
														}}
													>
														<Check
															className={cn(
																'mr-2 h-4 w-4',
																language.value === field.value
																	? 'opacity-100'
																	: 'opacity-0',
															)}
														/>
														{language.label}
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
				<div className="grid grid-cols-12 gap-4">
					<div className="col-span-4">
						<FormField
							control={form.control}
							name="amount"
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
							name="unit"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Unit</FormLabel>
									<FormControl>
										<Input placeholder="e.g grams" type="text" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="col-span-4">
						<FormField
							control={form.control}
							name="product"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product</FormLabel>
									<FormControl>
										<Input placeholder="e.g butter" type="text" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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
