<script lang="ts">
	import { onMount } from 'svelte';
	import { linksApi } from '$lib/api';
	import { mapLink } from '$lib/utils/mappers';
	import type { LinkRequest } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import { Check, X, Ban, Clock, Mail, AlertCircle } from 'lucide-svelte';

	let requests: LinkRequest[] = [];
	let loading = true;
	let successMessage = '';
	let errorMessage = '';

	onMount(async () => {
		await loadLinks();
	});

	async function loadLinks() {
		try {
			loading = true;
			const links = await linksApi.getLinks();
			requests = links.map(link => mapLink(link));
		} catch (error) {
			console.error('Failed to load links', error);
			errorMessage = 'Failed to load link requests';
		} finally {
			loading = false;
		}
	}

	async function handleApprove(id: string) {
		try {
			const linkId = parseInt(id);
			await linksApi.updateLink(linkId, { status: 'accepted' });
			successMessage = 'Link request approved successfully!';
			setTimeout(() => successMessage = '', 3000);
			await loadLinks();
		} catch (error) {
			console.error('Failed to approve link', error);
			errorMessage = 'Failed to approve link request';
			setTimeout(() => errorMessage = '', 3000);
		}
	}

	async function handleReject(id: string) {
		try {
			const linkId = parseInt(id);
			await linksApi.updateLink(linkId, { status: 'removed' });
			successMessage = 'Link request rejected.';
			setTimeout(() => successMessage = '', 3000);
			await loadLinks();
		} catch (error) {
			console.error('Failed to reject link', error);
			errorMessage = 'Failed to reject link request';
			setTimeout(() => errorMessage = '', 3000);
		}
	}

	async function handleBlock(id: string) {
		try {
			const linkId = parseInt(id);
			await linksApi.updateLink(linkId, { status: 'blocked' });
			successMessage = 'User blocked successfully.';
			setTimeout(() => successMessage = '', 3000);
			await loadLinks();
		} catch (error) {
			console.error('Failed to block link', error);
			errorMessage = 'Failed to block user';
			setTimeout(() => errorMessage = '', 3000);
		}
	}

	function getStatusBadge(status: LinkRequest['status']) {
		const variants = {
			pending: { label: 'Pending', icon: Clock, color: 'bg-orange-50 text-orange-700 border-orange-200' },
			approved: { label: 'Approved', icon: Check, color: 'bg-green-50 text-green-700 border-green-200' },
			rejected: { label: 'Rejected', icon: X, color: 'bg-red-50 text-red-700 border-red-200' },
			blocked: { label: 'Blocked', icon: Ban, color: 'bg-red-50 text-red-700 border-red-200' },
		};
		return variants[status];
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		
		if (diffHours < 1) return 'Just now';
		if (diffHours < 24) return `${diffHours} hours ago`;
		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays} days ago`;
	}

	$: pendingRequests = requests.filter(r => r.status === 'pending');
	$: reviewedRequests = requests.filter(r => r.status !== 'pending');
</script>

<div class="space-y-7">
	<div class="flex items-center justify-between mb-2">
		<div>
			<h2 class="text-gray-900 mb-2">Link Requests</h2>
			<p class="text-gray-600">Approve or reject buyer connection requests from the mobile app</p>
		</div>
		<div class="flex items-center gap-2 px-4 py-2.5 bg-orange-50 rounded-xl border border-orange-200">
			<AlertCircle class="w-4 h-4 text-orange-600" />
			<span class="text-sm text-orange-700">{pendingRequests.length} pending</span>
		</div>
	</div>

	{#if successMessage}
		<Alert className="bg-green-50 text-green-800 border-green-200 shadow-sm animate-slide-in">
			<Check class="w-4 h-4" />
			<AlertDescription>{successMessage}</AlertDescription>
		</Alert>
	{/if}

	{#if errorMessage}
		<Alert className="bg-red-50 text-red-800 border-red-200 shadow-sm animate-slide-in">
			<AlertCircle class="w-4 h-4" />
			<AlertDescription>{errorMessage}</AlertDescription>
		</Alert>
	{/if}

	{#if loading}
		<Card className="border-0 shadow-md">
			<CardContent className="p-6">
				<p class="text-gray-500 text-center py-8">Loading link requests...</p>
			</CardContent>
		</Card>
	{/if}

	<!-- Pending Requests -->
	<Card className="border-0 shadow-md">
		<CardHeader className="border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white px-6 py-5">
			<CardTitle className="flex items-center gap-2">
				<Clock class="w-5 h-5 text-orange-600" />
				Pending Requests ({pendingRequests.length})
			</CardTitle>
		</CardHeader>
		<CardContent className="p-6">
			{#if pendingRequests.length === 0}
				<p class="text-gray-500 text-center py-8">No pending requests</p>
			{:else}
				<div class="space-y-4">
					{#each pendingRequests as request}
						{@const statusConfig = getStatusBadge(request.status)}
						{@const StatusIcon = statusConfig.icon}
						<div class="border border-gray-200 rounded-lg p-5 hover:border-green-300 transition-colors">
							<div class="flex items-start justify-between mb-4">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-2">
										<h4 class="text-gray-900">{request.userName}</h4>
										<Badge variant="outline" className={statusConfig.color}>
											<StatusIcon class="w-3 h-3 mr-1" />
											{statusConfig.label}
										</Badge>
									</div>
									<div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
										<Mail class="w-4 h-4" />
										<span>{request.userEmail}</span>
									</div>
									<p class="text-xs text-gray-500">Requested {formatDate(request.requestedAt)}</p>
								</div>
							</div>
							<div class="flex gap-2">
								<Button
									variant="default"
									on:click={() => handleApprove(request.id)}
									className="flex-1 bg-green-600 hover:bg-green-700"
								>
									<Check class="w-4 h-4 mr-2" />
									Approve
								</Button>
								<Button
									variant="outline"
									on:click={() => handleReject(request.id)}
									className="flex-1"
								>
									<X class="w-4 h-4 mr-2" />
									Reject
								</Button>
								<Button
									variant="destructive"
									on:click={() => handleBlock(request.id)}
									className="px-4"
								>
									<Ban class="w-4 h-4" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Reviewed Requests -->
	{#if reviewedRequests.length > 0}
		<Card className="border-0 shadow-md">
			<CardHeader className="border-b border-gray-100 px-6 py-5">
				<CardTitle>Reviewed Requests ({reviewedRequests.length})</CardTitle>
			</CardHeader>
			<CardContent className="p-6">
				<div class="space-y-3">
					{#each reviewedRequests as request}
						{@const statusConfig = getStatusBadge(request.status)}
						{@const StatusIcon = statusConfig.icon}
						<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
							<div class="flex items-center gap-3">
								<div>
									<p class="text-sm text-gray-900">{request.userName}</p>
									<p class="text-xs text-gray-500">{request.userEmail}</p>
								</div>
							</div>
							<Badge variant="outline" className={statusConfig.color}>
								<StatusIcon class="w-3 h-3 mr-1" />
								{statusConfig.label}
							</Badge>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

