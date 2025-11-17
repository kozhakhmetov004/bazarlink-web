<script lang="ts">
	import { user } from '$lib/stores/auth';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import CardDescription from '$lib/components/ui/CardDescription.svelte';
	import AddTeamMemberModal from '$lib/components/AddTeamMemberModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import { Users, Plus, Trash2 } from 'lucide-svelte';
	import { usersApi } from '$lib/api/users';
	import { onMount } from 'svelte';
	import type { UserResponse } from '$lib/api/users';

	let showAddMemberModal = false;
	let teamMembers: UserResponse[] = [];
	let loadingMembers = false;
	let deletingMemberId: number | null = null;
	let deleteError = '';

	async function loadTeamMembers() {
		if ($user?.role !== 'owner' && $user?.role !== 'manager') return;
		
		loadingMembers = true;
		try {
			const users = await usersApi.getUsers();
			// Filter based on current user role:
			// - Owner can see Managers and Sales Reps
			// - Manager can only see Sales Reps
			if ($user?.role === 'owner') {
				teamMembers = users.filter(u => 
					u.role === 'manager' || u.role === 'sales_representative'
				);
			} else if ($user?.role === 'manager') {
				teamMembers = users.filter(u => 
					u.role === 'sales_representative'
				);
			}
		} catch (error) {
			console.error('Failed to load team members:', error);
		} finally {
			loadingMembers = false;
		}
	}

	function handleMemberCreated() {
		loadTeamMembers();
	}

	async function handleDeleteMember(memberId: number, memberName: string, memberRole: string) {
		if (!confirm(`Are you sure you want to delete ${memberName} (${memberRole})? This action cannot be undone.`)) {
			return;
		}

		deletingMemberId = memberId;
		deleteError = '';

		try {
			await usersApi.deleteUser(memberId);
			// Reload team members after successful deletion
			await loadTeamMembers();
		} catch (err: any) {
			deleteError = err?.message || 'Failed to delete team member. Please try again.';
			console.error('Delete member error:', err);
		} finally {
			deletingMemberId = null;
		}
	}

	function canDeleteMember(member: UserResponse): boolean {
		if (!$user) return false;
		
		// Owner can delete Managers and Sales Reps
		if ($user.role === 'owner') {
			return member.role === 'manager' || member.role === 'sales_representative';
		}
		
		// Manager can only delete Sales Reps
		if ($user.role === 'manager') {
			return member.role === 'sales_representative';
		}
		
		return false;
	}

	onMount(() => {
		loadTeamMembers();
	});

	$: isOwner = $user?.role === 'owner';
	$: isManager = $user?.role === 'manager';
	$: canManageTeam = isOwner || isManager;
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-gray-900 mb-1">Team Management</h2>
		<p class="text-gray-600">Manage your team members and their roles</p>
	</div>

	{#if canManageTeam}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Users class="w-5 h-5 text-green-600" />
							Team Members
						</CardTitle>
						<CardDescription className="mt-1">
							{#if isOwner}
								Manage your team members (Managers and Sales Representatives)
							{:else if isManager}
								Manage Sales Representatives
							{/if}
						</CardDescription>
					</div>
					{#if isOwner}
						<button
							type="button"
							on:click={() => {
								showAddMemberModal = true;
							}}
							class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-green-600 hover:bg-green-700 text-white h-9 px-4 py-2"
						>
							<Plus class="w-4 h-4" />
							Add Member
						</button>
					{/if}
				</div>
			</CardHeader>
			<CardContent>
				{#if loadingMembers}
					<div class="text-center py-8 text-gray-500">Loading team members...</div>
				{:else if teamMembers.length === 0}
					<div class="text-center py-8 text-gray-500">
						{#if isOwner}
							No team members yet. Click "Add Member" to get started.
						{:else}
							No sales representatives yet.
						{/if}
					</div>
				{:else}
					<div class="space-y-3">
						{#if deleteError}
							<Alert variant="destructive">
								<AlertDescription>{deleteError}</AlertDescription>
							</Alert>
						{/if}
						
						{#each teamMembers as member}
							<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
								<div class="flex-1">
									<div class="font-medium text-gray-900">{member.full_name}</div>
									<div class="text-sm text-gray-500">{member.email}</div>
									<div class="text-xs text-gray-400 mt-1 capitalize">
										{member.role.replace('_', ' ')}
									</div>
								</div>
								<div class="flex items-center gap-4">
									<div class="text-sm text-gray-500">
										{#if member.is_active}
											<span class="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
												Active
											</span>
										{:else}
											<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
												Inactive
											</span>
										{/if}
									</div>
									{#if canDeleteMember(member)}
										<Button
											type="button"
											variant="destructive"
											size="sm"
											on:click={() => handleDeleteMember(member.id, member.full_name, member.role.replace('_', ' '))}
											disabled={deletingMemberId === member.id}
											className="h-8 px-3 bg-red-600 hover:bg-red-700"
										>
											{#if deletingMemberId === member.id}
												Deleting...
											{:else}
												<Trash2 class="w-4 h-4" />
											{/if}
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		{#if isOwner}
			<AddTeamMemberModal
				bind:open={showAddMemberModal}
				on:close={() => showAddMemberModal = false}
				on:created={handleMemberCreated}
			/>
		{/if}
	{:else}
		<Card>
			<CardContent>
				<p class="text-gray-500 text-center py-8">
					You need to be an owner or manager to manage team members.
				</p>
			</CardContent>
		</Card>
	{/if}
</div>

