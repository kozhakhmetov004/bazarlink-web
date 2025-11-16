<script lang="ts">
	import { cn } from '$lib/utils';
	
	export let variant: 'default' | 'destructive' = 'default';
	export let className: string = '';
	
	$: classes = cn(
		'relative w-full rounded-lg border p-4',
		variant === 'destructive' ? 'border-red-200 bg-red-50 text-destructive' : 'bg-background text-foreground',
		className
	);
</script>

<div class={classes}>
	<slot />
</div>

