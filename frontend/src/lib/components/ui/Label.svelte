<script lang="ts">
	import { cn } from '$lib/utils';
	
	export let className: string = '';
	export let htmlFor: string = '';
</script>

<label
	class={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50', className)}
	for={htmlFor}
>
	<slot />
</label>

