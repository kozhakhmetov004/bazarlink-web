<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { incidentsApi, usersApi } from '$lib/api';
	import { user } from '$lib/stores/auth';

	// Redirect non-managers
	$: if ($user && $user.role !== 'manager') {
		goto('/dashboard');
	}
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { _ } from 'svelte-i18n';
	import { AlertTriangle, Clock, CheckCircle2, Loader2, Plus, Eye, User } from 'lucide-svelte';
	import type { IncidentResponse, IncidentStatus } from '$lib/api/incidents';
	import type { UserResponse } from '$lib/api/users';

	let incidents: IncidentResponse[] = [];
	let loading = true;
	let error = '';
	let successMessage = '';
	let showCreateDialog = false;
	let showDetailsDialog = false;
	let selectedIncident: IncidentResponse | null = null;
	let teamMembers: UserResponse[] = [];
	
	// Form state
	let newIncident = {
		title: '',
		description: '',
		order_id: undefined as number | undefined,
		assigned_to_user_id: undefined as number | undefined
	};

	onMount(async () => {
		await Promise.all([loadIncidents(), loadTeamMembers()]);
	});

	async function loadIncidents() {
		try {
			loading = true;
			error = '';
			incidents = await incidentsApi.getIncidents();
		} catch (err: any) {
			const errorMessage = err?.message || err?.detail || err?.toString() || $_('incidents.failedToLoad');
			error = errorMessage;
		} finally {
			loading = false;
		}
	}

	async function loadTeamMembers() {
		try {
			const allUsers = await usersApi.getUsers();
			// Filter to only show managers
			teamMembers = allUsers.filter(u => u.role === 'manager');
		} catch (err) {
			console.error('Failed to load team members', err);
		}
	}

	function getStatusBadge(status: IncidentStatus) {
		switch (status) {
			case 'open':
				return { labelKey: 'incidents.open', class: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock };
			case 'in_progress':
				return { labelKey: 'incidents.inProgress', class: 'bg-blue-50 text-blue-700 border-blue-200', icon: Loader2 };
			case 'resolved':
				return { labelKey: 'incidents.resolved', class: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 };
			default:
				return { labelKey: 'incidents.open', class: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock };
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getUserName(userId?: number): string {
		if (!userId) return $_('incidents.unassigned');
		const member = teamMembers.find(u => u.id === userId);
		return member?.full_name || `User ${userId}`;
	}

	async function handleCreateIncident() {
		try {
			if (!newIncident.title || !newIncident.description) {
				error = $_('common.required');
				return;
			}

			await incidentsApi.createIncident({
				title: newIncident.title,
				description: newIncident.description,
				order_id: newIncident.order_id,
				assigned_to_user_id: newIncident.assigned_to_user_id
			});

			successMessage = $_('incidents.incidentCreated');
			setTimeout(() => successMessage = '', 3000);
			showCreateDialog = false;
			newIncident = { title: '', description: '', order_id: undefined, assigned_to_user_id: undefined };
			await loadIncidents();
		} catch (err: any) {
			error = err?.message || err?.detail || $_('incidents.failedToCreate');
			setTimeout(() => error = '', 5000);
		}
	}

	async function handleUpdateStatus(incidentId: number, status: IncidentStatus) {
		try {
			await incidentsApi.updateIncident(incidentId, { status });
			successMessage = $_('incidents.statusUpdated');
			setTimeout(() => successMessage = '', 3000);
			await loadIncidents();
			if (selectedIncident?.id === incidentId) {
				selectedIncident = incidents.find(i => i.id === incidentId) || null;
			}
		} catch (err: any) {
			error = err?.message || err?.detail || $_('incidents.failedToUpdate');
			setTimeout(() => error = '', 5000);
		}
	}

	async function handleAssign(incidentId: number, userId?: number) {
		try {
			await incidentsApi.updateIncident(incidentId, { assigned_to_user_id: userId });
			successMessage = $_('incidents.assignmentUpdated');
			setTimeout(() => successMessage = '', 3000);
			await loadIncidents();
			if (selectedIncident?.id === incidentId) {
				selectedIncident = incidents.find(i => i.id === incidentId) || null;
			}
		} catch (err: any) {
			error = err?.message || err?.detail || $_('incidents.failedToAssign');
			setTimeout(() => error = '', 5000);
		}
	}

	function viewIncident(incident: IncidentResponse) {
		selectedIncident = incident;
		showDetailsDialog = true;
	}

	$: openIncidents = incidents.filter(i => i.status === 'open');
	$: inProgressIncidents = incidents.filter(i => i.status === 'in_progress');
	$: resolvedIncidents = incidents.filter(i => i.status === 'resolved');
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-gray-900 mb-1">{$_('incidents.title')}</h2>
			<p class="text-gray-600">{$_('incidents.description')}</p>
		</div>
		<Button
			variant="default"
			on:click={() => showCreateDialog = true}
			className="bg-green-600 hover:bg-green-700"
		>
			<Plus class="w-4 h-4 mr-2" />
			{$_('incidents.createIncident')}
		</Button>
	</div>

	{#if successMessage}
		<Alert className="bg-green-50 text-green-800 border-green-200">
			<CheckCircle2 class="w-4 h-4" />
			<AlertDescription>{successMessage}</AlertDescription>
		</Alert>
	{/if}

	{#if error}
		<Alert className="bg-red-50 text-red-800 border-red-200">
			<AlertTriangle class="w-4 h-4" />
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if loading}
		<Card>
			<CardContent className="p-6">
				<div class="text-center py-8 text-gray-500">{$_('incidents.loadingIncidents')}</div>
			</CardContent>
		</Card>
	{:else}
		<!-- Open Incidents -->
		{#if openIncidents.length > 0}
			<Card className="border-0 shadow-md">
				<CardHeader className="border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-white px-6 py-5">
					<CardTitle className="flex items-center gap-2">
						<Clock class="w-5 h-5 text-yellow-600" />
						{$_('incidents.open')} ({openIncidents.length})
					</CardTitle>
				</CardHeader>
				<CardContent className="p-6">
					<div class="space-y-3">
						{#each openIncidents as incident}
							{@const statusBadge = getStatusBadge(incident.status)}
							{@const StatusIcon = statusBadge.icon}
							<div class="border border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition-colors">
								<div class="flex items-start justify-between mb-3">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<h3 class="font-medium text-gray-900">{incident.title}</h3>
											<Badge variant="outline" className={statusBadge.class}>
												<StatusIcon class="w-3 h-3 mr-1" />
												{$_(statusBadge.labelKey)}
											</Badge>
										</div>
										<p class="text-sm text-gray-600 mb-2 line-clamp-2">{incident.description}</p>
										<div class="flex items-center gap-4 text-xs text-gray-500">
											{#if incident.order_id}
												<span>{$_('incidents.orderId')} #{incident.order_id}</span>
											{/if}
											<span>{$_('incidents.created')}: {formatDate(incident.created_at)}</span>
											<span class="flex items-center gap-1">
												<User class="w-3 h-3" />
												{getUserName(incident.assigned_to_user_id)}
											</span>
										</div>
									</div>
									<div class="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											on:click={() => viewIncident(incident)}
										>
											<Eye class="w-4 h-4 mr-2" />
											{$_('incidents.viewDetails')}
										</Button>
										<Button
											variant="default"
											size="sm"
											on:click={() => handleUpdateStatus(incident.id, 'in_progress')}
											className="bg-blue-600 hover:bg-blue-700"
										>
											{$_('incidents.startProgress')}
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- In Progress Incidents -->
		{#if inProgressIncidents.length > 0}
			<Card className="border-0 shadow-md">
				<CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-6 py-5">
					<CardTitle className="flex items-center gap-2">
						<Loader2 class="w-5 h-5 text-blue-600" />
						{$_('incidents.inProgress')} ({inProgressIncidents.length})
					</CardTitle>
				</CardHeader>
				<CardContent className="p-6">
					<div class="space-y-3">
						{#each inProgressIncidents as incident}
							{@const statusBadge = getStatusBadge(incident.status)}
							{@const StatusIcon = statusBadge.icon}
							<div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
								<div class="flex items-start justify-between mb-3">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<h3 class="font-medium text-gray-900">{incident.title}</h3>
											<Badge variant="outline" className={statusBadge.class}>
												<StatusIcon class="w-3 h-3 mr-1" />
												{$_(statusBadge.labelKey)}
											</Badge>
										</div>
										<p class="text-sm text-gray-600 mb-2 line-clamp-2">{incident.description}</p>
										<div class="flex items-center gap-4 text-xs text-gray-500">
											{#if incident.order_id}
												<span>{$_('incidents.orderId')} #{incident.order_id}</span>
											{/if}
											<span>{$_('incidents.created')}: {formatDate(incident.created_at)}</span>
											<span class="flex items-center gap-1">
												<User class="w-3 h-3" />
												{getUserName(incident.assigned_to_user_id)}
											</span>
										</div>
									</div>
									<div class="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											on:click={() => viewIncident(incident)}
										>
											<Eye class="w-4 h-4 mr-2" />
											{$_('incidents.viewDetails')}
										</Button>
										<Button
											variant="default"
											size="sm"
											on:click={() => handleUpdateStatus(incident.id, 'resolved')}
											className="bg-green-600 hover:bg-green-700"
										>
											{$_('incidents.resolve')}
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Resolved Incidents -->
		{#if resolvedIncidents.length > 0}
			<Card className="border-0 shadow-md">
				<CardHeader className="border-b border-gray-100 px-6 py-5">
					<CardTitle className="flex items-center gap-2">
						<CheckCircle2 class="w-5 h-5 text-green-600" />
						{$_('incidents.resolved')} ({resolvedIncidents.length})
					</CardTitle>
				</CardHeader>
				<CardContent className="p-6">
					<div class="space-y-3">
						{#each resolvedIncidents as incident}
							{@const statusBadge = getStatusBadge(incident.status)}
							{@const StatusIcon = statusBadge.icon}
							<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-2">
										<h3 class="font-medium text-gray-900">{incident.title}</h3>
										<Badge variant="outline" className={statusBadge.class}>
											<StatusIcon class="w-3 h-3 mr-1" />
											{$_(statusBadge.labelKey)}
										</Badge>
									</div>
									<div class="flex items-center gap-4 text-xs text-gray-500">
										{#if incident.order_id}
											<span>{$_('incidents.orderId')} #{incident.order_id}</span>
										{/if}
										<span>{$_('incidents.resolved')}: {incident.resolved_at ? formatDate(incident.resolved_at) : formatDate(incident.updated_at || incident.created_at)}</span>
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									on:click={() => viewIncident(incident)}
								>
									<Eye class="w-4 h-4 mr-2" />
									{$_('incidents.viewDetails')}
								</Button>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if incidents.length === 0}
			<Card>
				<CardContent className="p-6">
					<div class="text-center py-8 text-gray-500">{$_('incidents.noIncidents')}</div>
				</CardContent>
			</Card>
		{/if}
	{/if}
</div>

<!-- Create Incident Dialog -->
<Dialog open={showCreateDialog} title={$_('incidents.createIncident')} on:close={() => showCreateDialog = false}>
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">{$_('incidents.titleLabel')} *</label>
			<input
				type="text"
				bind:value={newIncident.title}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
				placeholder={$_('incidents.titlePlaceholder')}
			/>
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">{$_('incidents.descriptionLabel')} *</label>
			<textarea
				bind:value={newIncident.description}
				rows="4"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
				placeholder={$_('incidents.descriptionPlaceholder')}
			></textarea>
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">{$_('incidents.orderIdOptional')}</label>
			<input
				type="number"
				bind:value={newIncident.order_id}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
				placeholder={$_('incidents.orderIdPlaceholder')}
			/>
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">{$_('incidents.assignToOptional')}</label>
			<select
				bind:value={newIncident.assigned_to_user_id}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
			>
				<option value={undefined}>{$_('incidents.unassigned')}</option>
				{#each teamMembers as member}
					<option value={member.id}>{member.full_name} ({member.email})</option>
				{/each}
			</select>
		</div>
		<div class="flex gap-2 justify-end pt-2">
			<Button variant="outline" on:click={() => showCreateDialog = false}>{$_('common.cancel')}</Button>
			<Button variant="default" on:click={handleCreateIncident} className="bg-green-600 hover:bg-green-700">
				{$_('incidents.createIncident')}
			</Button>
		</div>
	</div>
</Dialog>

<!-- Incident Details Dialog -->
<Dialog open={showDetailsDialog} title={$_('incidents.incidentDetails')} on:close={() => showDetailsDialog = false}>
	{#if selectedIncident}
		{@const statusBadge = getStatusBadge(selectedIncident.status)}
		{@const StatusIcon = statusBadge.icon}
		<div class="space-y-4">
			<div>
				<div class="flex items-center gap-3 mb-2">
					<h3 class="text-lg font-semibold text-gray-900">{selectedIncident.title}</h3>
					<Badge variant="outline" className={statusBadge.class}>
						<StatusIcon class="w-3 h-3 mr-1" />
						{$_(statusBadge.labelKey)}
					</Badge>
				</div>
				<p class="text-sm text-gray-600 mb-4">{selectedIncident.description}</p>
			</div>

			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<p class="text-gray-500 mb-1">{$_('incidents.created')}</p>
					<p class="text-gray-900">{formatDate(selectedIncident.created_at)}</p>
				</div>
				<div>
					<p class="text-gray-500 mb-1">{$_('incidents.assignedTo')}</p>
					<p class="text-gray-900">{getUserName(selectedIncident.assigned_to_user_id)}</p>
				</div>
				{#if selectedIncident.order_id}
					<div>
						<p class="text-gray-500 mb-1">{$_('incidents.orderId')}</p>
						<p class="text-gray-900">#{selectedIncident.order_id}</p>
					</div>
				{/if}
				{#if selectedIncident.resolved_at}
					<div>
						<p class="text-gray-500 mb-1">{$_('incidents.resolved')}</p>
						<p class="text-gray-900">{formatDate(selectedIncident.resolved_at)}</p>
					</div>
				{/if}
			</div>

			{#if selectedIncident.resolution}
				<div class="pt-4 border-t border-gray-200">
					<p class="text-sm font-medium text-gray-700 mb-2">{$_('incidents.resolution')}</p>
					<p class="text-sm text-gray-600">{selectedIncident.resolution}</p>
				</div>
			{/if}

			{#if selectedIncident.status !== 'resolved'}
				<div class="pt-4 border-t border-gray-200 space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">{$_('incidents.assignedTo')}</label>
						<select
							value={selectedIncident.assigned_to_user_id}
							on:change={(e) => handleAssign(selectedIncident.id, e.target.value ? parseInt(e.target.value) : undefined)}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
						>
							<option value="">{$_('incidents.unassigned')}</option>
							{#each teamMembers as member}
								<option value={member.id}>{member.full_name} ({member.email})</option>
							{/each}
						</select>
					</div>
					<div class="flex gap-2">
						{#if selectedIncident.status === 'open'}
							<Button
								variant="default"
								on:click={() => handleUpdateStatus(selectedIncident.id, 'in_progress')}
								className="bg-blue-600 hover:bg-blue-700"
							>
								{$_('incidents.startProgress')}
							</Button>
						{/if}
						{#if selectedIncident.status === 'in_progress'}
							<Button
								variant="default"
								on:click={() => handleUpdateStatus(selectedIncident.id, 'resolved')}
								className="bg-green-600 hover:bg-green-700"
							>
								{$_('incidents.resolve')}
							</Button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</Dialog>

