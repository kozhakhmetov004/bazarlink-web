<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { complaintsApi } from '$lib/api/complaints';
	import { user } from '$lib/stores/auth';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import CardDescription from '$lib/components/ui/CardDescription.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import { _ } from 'svelte-i18n';
	import { currentLocale } from '$lib/stores/i18n';
	import { AlertTriangle, Clock, CheckCircle2, ArrowUpCircle, Eye } from 'lucide-svelte';
	import type { ComplaintResponse } from '$lib/api/complaints';

	let complaints: ComplaintResponse[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadComplaints();
	});

	async function loadComplaints() {
		try {
			loading = true;
			error = '';
			const userRole = $user?.role;
			const currentUserId = parseInt($user?.id || '0');
			
			if (userRole === 'owner') {
				// Owners see ALL complaints including escalated ones
				// Backend filters owners to exclude escalated by default
				// We need to fetch both separately and combine
				const nonEscalated = await complaintsApi.getComplaints();
				
				// Try to fetch escalated - backend role filter may block this
				// If backend allows level parameter to override role filter, this will work
				let escalated: ComplaintResponse[] = [];
				try {
					escalated = await complaintsApi.getComplaints({ level: 'manager' });
				} catch (e: any) {
					// If backend blocks, escalated will be empty
					escalated = [];
				}
				
				// Combine and remove duplicates
				const allComplaints = [...nonEscalated, ...escalated];
				complaints = Array.from(
					new Map(allComplaints.map(c => [c.id, c])).values()
				);
			} else if (userRole === 'manager') {
				// Managers see escalated complaints, but filter to only those escalated to them
				const allEscalated = await complaintsApi.getComplaints({ level: 'manager' });
				// Filter to only complaints escalated to this manager
				complaints = allEscalated.filter(c => c.escalated_to_user_id === currentUserId);
			} else {
				// Sales reps or others - use default backend filtering
				complaints = await complaintsApi.getComplaints();
			}
		} catch (err: any) {
			const errorMessage = err?.message || err?.detail || err?.toString() || $_('complaints.failedToLoad');
			error = errorMessage;
		} finally {
			loading = false;
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'open':
				return { label: $_('complaints.open'), class: 'bg-yellow-100 text-yellow-700', icon: Clock };
			case 'in_progress':
				return { label: $_('complaints.inProgress'), class: 'bg-blue-100 text-blue-700', icon: Clock };
			case 'escalated':
				return { label: $_('complaints.escalated'), class: 'bg-orange-100 text-orange-700', icon: ArrowUpCircle };
			case 'resolved':
				return { label: $_('complaints.resolved'), class: 'bg-green-100 text-green-700', icon: CheckCircle2 };
			default:
				return { label: status, class: 'bg-gray-100 text-gray-700', icon: Clock };
		}
	}

	// Kazakh month names
	const kazakhMonths: Record<number, string> = {
		1: 'қаң',
		2: 'ақп',
		3: 'нау',
		4: 'сәу',
		5: 'мам',
		6: 'мау',
		7: 'шіл',
		8: 'там',
		9: 'қыр',
		10: 'қаз',
		11: 'қар',
		12: 'жел'
	};
	
	// Map locale codes to proper locale strings for date formatting
	const localeMap: Record<string, string> = {
		'en': 'en-US',
		'ru': 'ru-RU',
		'kz': 'kk-KZ'
	};
	
	// Reactive date formatter that updates when locale changes
	$: formatDate = ((locale: string) => {
		return (dateString: string) => {
			const date = new Date(dateString);
			
			// Custom formatting for Kazakh
			if (locale === 'kz') {
				const day = date.getDate();
				const month = kazakhMonths[date.getMonth() + 1] || '';
				const year = date.getFullYear();
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				return `${day} ${month} ${year} ж., ${hours}:${minutes}`;
			}
			
			// Use standard locale formatting for other languages
			const dateLocale = localeMap[locale] || 'en-US';
			return date.toLocaleDateString(dateLocale, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		};
	})($currentLocale);

	function viewComplaint(complaintId: number) {
		goto(`/complaints/${complaintId}`);
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-gray-900 mb-1">{$_('complaints.title')}</h2>
		<p class="text-gray-600">
			{#if $user?.role === 'owner'}
				{$_('complaints.ownerDescription')}
			{:else}
				{$_('complaints.description')}
			{/if}
		</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle className="flex items-center gap-2">
				<AlertTriangle class="w-5 h-5 text-orange-600" />
				{$_('complaints.title')}
			</CardTitle>
			<CardDescription>
				{$_('complaints.description')}
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="text-center py-8 text-gray-500">{$_('complaints.loadingComplaints')}</div>
			{:else if error}
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{:else if complaints.length === 0}
				<div class="text-center py-8 text-gray-500">{$_('complaints.noComplaints')}</div>
			{:else}
				<div class="space-y-3">
					{#each complaints as complaint}
						{@const statusBadge = getStatusBadge(complaint.status)}
						{@const StatusIcon = statusBadge.icon}
						<div
							class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
							on:click={() => viewComplaint(complaint.id)}
							on:keydown={(e) => e.key === 'Enter' && viewComplaint(complaint.id)}
							role="button"
							tabindex="0"
						>
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="font-medium text-gray-900">{complaint.title}</h3>
									<span class="px-2 py-1 rounded-full text-xs font-medium {statusBadge.class} flex items-center gap-1">
										<StatusIcon class="w-3 h-3" />
										{statusBadge.label}
									</span>
								</div>
								<p class="text-sm text-gray-600 mb-2 line-clamp-2">{complaint.description}</p>
								<div class="flex items-center gap-4 text-xs text-gray-500">
									<span>{$_('complaints.order')} #{complaint.order_id}</span>
									<span>{$_('complaints.createdAt')}: {formatDate(complaint.created_at)}</span>
									{#if complaint.escalated_by_user_id}
										<span>{$_('complaints.escalatedAt')}: {formatDate(complaint.updated_at || complaint.created_at)}</span>
									{/if}
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								on:click={(e) => {
									e.stopPropagation();
									viewComplaint(complaint.id);
								}}
								className="ml-4"
							>
								<Eye class="w-4 h-4 mr-2" />
								{$_('complaints.viewDetails')}
							</Button>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

