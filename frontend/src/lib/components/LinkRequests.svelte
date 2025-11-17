<script lang="ts">
	import { onMount } from 'svelte';
	import { linksApi, consumersApi } from '$lib/api';
	import { mapLink } from '$lib/utils/mappers';
	import type { LinkRequest } from '$lib/types';
	import type { ConsumerResponse } from '$lib/api/consumers';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { Check, X, Ban, Clock, Mail, AlertCircle, User, Phone, MapPin, Building2, FileText, Eye } from 'lucide-svelte';

	interface LinkRequestWithConsumer extends LinkRequest {
		consumerId: number; // Store consumer_id from link
		consumer?: ConsumerResponse;
		loadingConsumer?: boolean;
	}

	let requests: LinkRequestWithConsumer[] = [];
	let loading = true;
	let successMessage = '';
	let errorMessage = '';
	let selectedConsumer: ConsumerResponse | null = null;
	let showConsumerModal = false;

	onMount(async () => {
		await loadLinks();
	});

	async function loadLinks() {
		try {
			loading = true;
			const links = await linksApi.getLinks();
			requests = links.map(link => ({
				...mapLink(link),
				consumerId: link.consumer_id, // Store consumer_id directly
				consumer: undefined,
				loadingConsumer: false
			}));
		} catch (error) {
			console.error('Failed to load links', error);
			errorMessage = 'Failed to load link requests';
		} finally {
			loading = false;
		}
	}

	async function loadConsumerInfo(request: LinkRequestWithConsumer) {
		if (request.consumer || request.loadingConsumer) return;
		
		try {
			request.loadingConsumer = true;
			const consumer = await consumersApi.getConsumer(request.consumerId);
			request.consumer = consumer;
		} catch (error) {
			console.error('Failed to load consumer info', error);
		} finally {
			request.loadingConsumer = false;
		}
	}

	function openConsumerProfile(request: LinkRequestWithConsumer) {
		if (!request.consumer) {
			loadConsumerInfo(request).then(() => {
				if (request.consumer) {
					selectedConsumer = request.consumer;
					showConsumerModal = true;
				}
			});
		} else {
			selectedConsumer = request.consumer;
			showConsumerModal = true;
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
									variant="outline"
									on:click={() => openConsumerProfile(request)}
									className="flex-1"
									disabled={request.loadingConsumer}
								>
									<Eye class="w-4 h-4 mr-2" />
									{request.loadingConsumer ? 'Loading...' : 'View Profile'}
								</Button>
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
							<div class="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									on:click={() => openConsumerProfile(request)}
									className="h-8 px-3"
									disabled={request.loadingConsumer}
								>
									<Eye class="w-3 h-3 mr-1" />
									View
								</Button>
								<Badge variant="outline" className={statusConfig.color}>
									<StatusIcon class="w-3 h-3 mr-1" />
									{statusConfig.label}
								</Badge>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Consumer Profile Modal -->
	<Dialog open={showConsumerModal} title="Consumer Profile" on:close={() => showConsumerModal = false}>
		{#if selectedConsumer}
			<div class="space-y-4">
				<div class="flex items-start gap-4 pb-4 border-b border-gray-200">
					<div class="p-3 rounded-full bg-green-100">
						<Building2 class="w-6 h-6 text-green-600" />
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold text-gray-900 mb-1">{selectedConsumer.business_name}</h3>
						{#if selectedConsumer.legal_name}
							<p class="text-sm text-gray-600 mb-2">{selectedConsumer.legal_name}</p>
						{/if}
						<div class="flex items-center gap-2 text-sm text-gray-600">
							<Badge variant="outline" className={selectedConsumer.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
								{selectedConsumer.is_active ? 'Active' : 'Inactive'}
							</Badge>
							{#if selectedConsumer.business_type}
								<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
									{selectedConsumer.business_type}
								</Badge>
							{/if}
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-3">
						<div class="flex items-start gap-3">
							<Mail class="w-5 h-5 text-gray-400 mt-0.5" />
							<div>
								<p class="text-xs text-gray-500 mb-1">Email</p>
								<p class="text-sm text-gray-900">{selectedConsumer.email}</p>
							</div>
						</div>

						{#if selectedConsumer.phone}
							<div class="flex items-start gap-3">
								<Phone class="w-5 h-5 text-gray-400 mt-0.5" />
								<div>
									<p class="text-xs text-gray-500 mb-1">Phone</p>
									<p class="text-sm text-gray-900">{selectedConsumer.phone}</p>
								</div>
							</div>
						{/if}

						{#if selectedConsumer.address || selectedConsumer.city}
							<div class="flex items-start gap-3">
								<MapPin class="w-5 h-5 text-gray-400 mt-0.5" />
								<div>
									<p class="text-xs text-gray-500 mb-1">Address</p>
									<p class="text-sm text-gray-900">
										{#if selectedConsumer.address}{selectedConsumer.address}{/if}
										{#if selectedConsumer.address && selectedConsumer.city}, {/if}
										{#if selectedConsumer.city}{selectedConsumer.city}{/if}
										{#if selectedConsumer.country && selectedConsumer.country !== 'KZ'}, {selectedConsumer.country}{/if}
									</p>
								</div>
							</div>
						{/if}
					</div>

					<div class="space-y-3">
						{#if selectedConsumer.tax_id}
							<div class="flex items-start gap-3">
								<FileText class="w-5 h-5 text-gray-400 mt-0.5" />
								<div>
									<p class="text-xs text-gray-500 mb-1">Tax ID</p>
									<p class="text-sm text-gray-900">{selectedConsumer.tax_id}</p>
								</div>
							</div>
						{/if}

						<div class="flex items-start gap-3">
							<Clock class="w-5 h-5 text-gray-400 mt-0.5" />
							<div>
								<p class="text-xs text-gray-500 mb-1">Member Since</p>
								<p class="text-sm text-gray-900">{new Date(selectedConsumer.created_at).toLocaleDateString()}</p>
							</div>
						</div>
					</div>
				</div>

				{#if selectedConsumer.description}
					<div class="pt-4 border-t border-gray-200">
						<p class="text-xs text-gray-500 mb-2">Description</p>
						<p class="text-sm text-gray-700 leading-relaxed">{selectedConsumer.description}</p>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-gray-500 text-center py-4">Loading consumer information...</p>
		{/if}
	</Dialog>
</div>

