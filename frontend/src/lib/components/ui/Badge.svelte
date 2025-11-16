<script lang="ts">
	import { cn } from '$lib/utils';
	
	type Variant = 'default' | 'secondary' | 'destructive' | 'outline';
	
	export let variant: Variant = 'default';
	export let className: string = '';
	
	const variantClasses = {
		default: 'border-transparent bg-primary text-primary-foreground',
		secondary: 'border-transparent bg-secondary text-secondary-foreground',
		destructive: 'border-transparent bg-destructive text-white',
		outline: 'text-foreground'
	};
	
	$: classes = cn(
		'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
		variantClasses[variant],
		className
	);
</script>

<span class={classes}>
	<slot />
</span>

