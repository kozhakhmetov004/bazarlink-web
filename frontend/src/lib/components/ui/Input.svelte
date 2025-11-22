<script lang="ts">
	import { cn } from '$lib/utils';
	
	export let type: string = 'text';
	export let className: string = '';
	export let value: string = '';
	export let placeholder: string = '';
	export let required: boolean = false;
	export let id: string = '';
	export let disabled: boolean = false;
	export let step: string | number | undefined = undefined;
	export let min: string | number | undefined = undefined;
	export let max: string | number | undefined = undefined;
	
	const baseClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
</script>

{#if type === 'text'}
	<input
		type="text"
		{id}
		class={cn(baseClasses, className)}
		bind:value
		{placeholder}
		{required}
		{disabled}
	/>
{:else if type === 'email'}
	<input
		type="email"
		{id}
		class={cn(baseClasses, className)}
		bind:value
		{placeholder}
		{required}
		{disabled}
	/>
{:else if type === 'password'}
	<input
		type="password"
		{id}
		class={cn(baseClasses, className)}
		bind:value
		{placeholder}
		{required}
		{disabled}
	/>
{:else if type === 'number'}
	<input
		type="number"
		{id}
		class={cn(baseClasses, className)}
		bind:value
		{placeholder}
		{required}
		{disabled}
		{step}
		{min}
		{max}
	/>
{:else if type === 'url'}
	<input
		type="url"
		{id}
		class={cn(baseClasses, className)}
		bind:value
		{placeholder}
		{required}
		{disabled}
	/>
{:else if type === 'tel'}
	<input
		type="tel"
		{id}
		class={cn(baseClasses, className)}
		bind:value
		{placeholder}
		{required}
		{disabled}
	/>
{:else}
	<input
		type="text"
		{id}
		class={cn(baseClasses, className)}
		bind:value
		{placeholder}
		{required}
		{disabled}
	/>
{/if}

