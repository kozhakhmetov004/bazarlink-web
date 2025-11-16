<script lang="ts">
	import { user } from '$lib/stores/auth';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import CardDescription from '$lib/components/ui/CardDescription.svelte';
	import AddTeamMemberModal from '$lib/components/AddTeamMemberModal.svelte';
	import { Users, Plus } from 'lucide-svelte';
	import { usersApi } from '$lib/api/users';
	import { onMount } from 'svelte';
	import type { UserResponse } from '$lib/api/users';

	let showAddMemberModal = false;
	let teamMembers: UserResponse[] = [];
	let loadingMembers = false;

	async function loadTeamMembers() {
		if ($user?.role !== 'owner') return;
		
		loadingMembers = true;
		try {
			const users = await usersApi.getUsers();
			// Filter to only show managers and sales reps (team members)
			teamMembers = users.filter(u => 
				u.role === 'manager' || u.role === 'sales_representative'
			);
		} catch (error) {
			console.error('Failed to load team members:', error);
		} finally {
			loadingMembers = false;
		}
	}

	function handleMemberCreated() {
		loadTeamMembers();
	}

	onMount(() => {
		loadTeamMembers();
	});

	$: isOwner = $user?.role === 'owner';
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-gray-900 mb-1">Team Management</h2>
		<p class="text-gray-600">Manage your team members and their roles</p>
	</div>

	{#if isOwner}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Users class="w-5 h-5 text-green-600" />
							Team Members
						</CardTitle>
						<CardDescription className="mt-1">
							Manage your team members (Managers and Sales Representatives)
						</CardDescription>
					</div>
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
				</div>
			</CardHeader>
			<CardContent>
				{#if loadingMembers}
					<div class="text-center py-8 text-gray-500">Loading team members...</div>
				{:else if teamMembers.length === 0}
					<div class="text-center py-8 text-gray-500">
						No team members yet. Click "Add Member" to get started.
					</div>
				{:else}
					<div class="space-y-3">
						{#each teamMembers as member}
							<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
								<div>
									<div class="font-medium text-gray-900">{member.full_name}</div>
									<div class="text-sm text-gray-500">{member.email}</div>
									<div class="text-xs text-gray-400 mt-1 capitalize">
										{member.role.replace('_', ' ')}
									</div>
								</div>
								<div class="text-sm text-gray-500">
									{member.is_active ? 'Active' : 'Inactive'}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		<AddTeamMemberModal
			bind:open={showAddMemberModal}
			on:close={() => showAddMemberModal = false}
			on:created={handleMemberCreated}
		/>
	{:else}
		<Card>
			<CardContent>
				<p class="text-gray-500 text-center py-8">
					You need to be an owner to manage team members.
				</p>
			</CardContent>
		</Card>
	{/if}
</div>

