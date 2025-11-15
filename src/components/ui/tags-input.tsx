import type React from 'react'
import { forwardRef, useEffect, useRef, useState } from 'react'

type TagsInputProps = {
	value?: string[] // controlled value
	onValueChange?: (v: string[]) => void
	placeholder?: string
	disabled?: boolean
	className?: string
	id?: string
}

const TagsInput = forwardRef(function TagsInput(
	{
		value = [],
		onValueChange,
		placeholder,
		disabled,
		className,
		id,
	}: TagsInputProps,
	ref: React.Ref<HTMLInputElement>,
) {
	const [input, setInput] = useState('')
	const internalRef = useRef<HTMLInputElement | null>(null)
	const inputRef = (ref as React.RefObject<HTMLInputElement>) ?? internalRef
	// no-op effect removed: there's nothing to synchronize here when parent resets tags
	const normalizeTag = (t: string) => t.trim()

	const addTag = (raw: string) => {
		const tag = normalizeTag(raw)
		if (!tag) return false
		const exists = value.some((v) => v.toLowerCase() === tag.toLowerCase())
		if (exists) return false
		const next = [...value, tag]
		onValueChange?.(next)
		setInput('')
		return true
	}

	const removeTagAt = (index: number) => {
		const next = value.slice(0, index).concat(value.slice(index + 1))
		onValueChange?.(next)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (disabled) return

		if (
			e.key === 'Enter' ||
			e.key === ',' ||
			e.key === 'Tab' ||
			e.key === ';'
		) {
			// On Tab we want to let it blur only if we add a tag
			e.preventDefault()
			if (input) addTag(input)
		} else if (e.key === 'Backspace' && !input) {
			// remove last tag
			if (value.length > 0) {
				removeTagAt(value.length - 1)
			}
		}
	}

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		if (disabled) return
		const text = e.clipboardData.getData('text')
		if (!text) return
		const parts = text
			.split(/[,;]+/)
			.map((p) => p.trim())
			.filter(Boolean)
		if (parts.length > 0) {
			e.preventDefault()
			let added = false
			for (const p of parts) {
				if (addTag(p)) added = true
			}
			if (!added) {
				// if nothing added, put pasted text into input
				setInput(text)
			}
		}
	}

	const handleBlur = () => {
		if (disabled) return
		if (input) addTag(input)
	}

	return (
		<fieldset
			id={id}
			className={className}
			tabIndex={disabled ? -1 : 0}
			disabled={disabled}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				flexWrap: 'wrap',
				padding: 6,
				borderRadius: 6,
				border: '1px solid rgba(0,0,0,0.12)',
				background: disabled ? 'rgba(0,0,0,0.03)' : 'white',
				minHeight: 44,
			}}
			onClick={() => {
				if (!disabled) inputRef.current?.focus()
			}}
			onKeyDown={(e: React.KeyboardEvent<HTMLFieldSetElement>) => {
				if (disabled) return
				// Only handle keys when the fieldset itself is focused (not when the input inside it is)
				if (e.target !== e.currentTarget) return
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					inputRef.current?.focus()
				}
			}}
		>
			{value.map((tag, i) => (
				<span
					key={tag}
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 8,
						padding: '4px 8px',
						borderRadius: 999,
						background: 'rgba(0,0,0,0.06)',
						fontSize: 13,
					}}
				>
					<span>{tag}</span>
					<button
						type="button"
						aria-label={`Remove ${tag}`}
						onClick={(e) => {
							e.stopPropagation()
							removeTagAt(i)
						}}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 18,
							height: 18,
							borderRadius: 999,
							border: 'none',
							background: 'transparent',
							cursor: 'pointer',
							padding: 0,
						}}
					>
						×
					</button>
				</span>
			))}

			<input
				ref={inputRef}
				value={input}
				disabled={disabled}
				placeholder={value.length === 0 ? placeholder : undefined}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
				onBlur={handleBlur}
				style={{
					flex: 1,
					minWidth: 120,
					border: 'none',
					outline: 'none',
					padding: 6,
					fontSize: 14,
					background: 'transparent',
				}}
			/>
		</fieldset>
	)
})
export default TagsInput
