<script lang="ts">
	import { cn } from '$lib/utils';
	
	type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
	type Size = 'default' | 'sm' | 'lg' | 'icon';
	
	interface Props {
		variant?: Variant;
		size?: Size;
		className?: string;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
	}
	
	export let variant: Variant = 'default';
	export let size: Size = 'default';
	export let className: string = '';
	export let disabled: boolean = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	
	const variantClasses = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		destructive: 'bg-destructive text-white hover:bg-destructive/90',
		outline: 'border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
		link: 'text-primary underline-offset-4 hover:underline'
	};
	
	const sizeClasses = {
		default: 'h-9 px-4 py-2',
		sm: 'h-8 rounded-md gap-1.5 px-3',
		lg: 'h-10 rounded-md px-6',
		icon: 'size-9 rounded-md'
	};
	
	$: classes = cn(
		'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50',
		variantClasses[variant],
		sizeClasses[size],
		className
	);
</script>

<button
	type={type}
	class={classes}
	disabled={disabled}
	on:click
>
	<slot />
</button>

