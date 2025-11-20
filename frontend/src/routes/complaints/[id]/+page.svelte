<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { complaintsApi } from '$lib/api/complaints';
	import { messagesApi } from '$lib/api/messages';
	import { user } from '$lib/stores/auth';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import { _ } from 'svelte-i18n';
	import { currentLocale } from '$lib/stores/i18n';
	import { ArrowLeft, Send, CheckCircle2, Clock, AlertTriangle, Paperclip, User, Briefcase, ShoppingBag } from 'lucide-svelte';
	import { usersApi } from '$lib/api/users';
	import { consumersApi } from '$lib/api/consumers';
	import type { ComplaintResponse } from '$lib/api/complaints';
	import type { MessageResponse } from '$lib/api/messages';
	import type { UserResponse } from '$lib/api/users';
	import type { ConsumerResponse } from '$lib/api/consumers';

	let complaint: ComplaintResponse | null = null;
	let messages: MessageResponse[] = [];
	let newMessage = '';
	let attachmentFile: File | null = null;
	let loading = true;
	let sendingMessage = false;
	let resolving = false;
	let error = '';
	let success = '';
	
	// Cache for user/consumer info - use object for reactivity
	let userCache: Record<number, { name: string; role: string; type: 'user' | 'consumer' }> = {};
	let cacheVersion = 0; // Trigger reactivity

	$: complaintId = parseInt($page.params.id || '0');
	$: isOwner = $user?.role === 'owner';
	$: isManager = $user?.role === 'manager';
	$: canSendMessages = isManager; // Only managers can send messages
	$: canResolve = isManager; // Only managers can resolve complaints

	onMount(async () => {
		await loadComplaint();
		await loadMessages();
	});

	async function loadComplaint() {
		try {
			loading = true;
			error = '';
			complaint = await complaintsApi.getComplaint(complaintId);
		} catch (err: any) {
			error = err?.message || 'Failed to load complaint';
		} finally {
			loading = false;
		}
	}

	async function loadMessages() {
		if (!complaint) return;
		
		try {
			const data = await messagesApi.getMessages(complaint.link_id);
			messages = data;
			
			// Load user/consumer info for all unique sender IDs
			const uniqueSenderIds = [...new Set(data.map(m => m.sender_id))];
			
			// Load all sender info first
			await Promise.all(uniqueSenderIds.map(id => loadSenderInfo(id)));
			
			// Force reactivity update
			messages = [...messages];
		} catch (err: any) {
			// Failed to load messages
		}
	}

	async function loadSenderInfo(senderId: number) {
		if (userCache[senderId]) {
			return;
		}
		
		try {
			// sender_id is always a user ID, so get the user first
			const user = await usersApi.getUser(senderId);
			
			// If user has consumer_id, get consumer info for better name
			if (user.consumer_id) {
				try {
					const consumer = await consumersApi.getConsumer(user.consumer_id);
					userCache[senderId] = {
						name: consumer.business_name || user.full_name,
						role: user.role,
						type: user.role === 'consumer' ? 'consumer' : 'user'
					};
				} catch (consumerErr) {
					// Fallback to user info if consumer fetch fails
					userCache[senderId] = {
						name: user.full_name,
						role: user.role,
						type: user.role === 'consumer' ? 'consumer' : 'user'
					};
				}
			} else {
				// Regular user (owner, manager, sales_rep)
				userCache[senderId] = {
					name: user.full_name,
					role: user.role,
					type: 'user'
				};
			}
			// Force reactivity by reassigning the entire object
			userCache = { ...userCache };
			cacheVersion++;
			// Force messages to re-render
			messages = [...messages];
		} catch (err: any) {
			// Fallback - try to get from current user if it's them
			if (parseInt($user?.id || '0') === senderId) {
				userCache[senderId] = {
					name: $user?.name || `User ${senderId}`,
					role: $user?.role || 'unknown',
					type: 'user'
				};
			} else {
				userCache[senderId] = {
					name: `User ${senderId}`,
					role: 'unknown',
					type: 'user'
				};
			}
			// Force reactivity by updating cacheVersion and reassigning
			userCache = { ...userCache };
			cacheVersion++;
		}
	}

	function getSenderInfo(senderId: number) {
		// Access cacheVersion to trigger reactivity
		const _ = cacheVersion;
		const cached = userCache[senderId];
		if (!cached) {
			// Try to load it if not cached
			loadSenderInfo(senderId);
		}
		return cached || { name: `User ${senderId}`, role: 'unknown', type: 'user' as const };
	}

	function getAvatarIcon(role: string, type: 'user' | 'consumer') {
		if (type === 'consumer') return ShoppingBag;
		if (role === 'manager') return Briefcase;
		if (role === 'sales_representative') return User;
		if (role === 'owner') return Briefcase;
		return User;
	}

	function getAvatarColor(role: string, type: 'user' | 'consumer') {
		if (type === 'consumer') return 'bg-blue-500';
		if (role === 'manager') return 'bg-purple-500';
		if (role === 'sales_representative') return 'bg-green-500';
		if (role === 'owner') return 'bg-yellow-500';
		return 'bg-gray-500';
	}

	function getRoleLabel(role: string, type: 'user' | 'consumer') {
		// Access $_ in reactive context
		const _ = $_;
		if (type === 'consumer') return _('common.roles.consumer');
		if (role === 'manager') return _('common.roles.manager');
		if (role === 'sales_representative') return _('common.roles.sales_representative');
		if (role === 'owner') return _('common.roles.owner');
		if (role === 'consumer') return _('common.roles.consumer');
		// Fallback for unknown roles
		return role;
	}

	async function sendMessage() {
		if (!complaint || (!newMessage.trim() && !attachmentFile) || sendingMessage || !canSendMessages) return;

		try {
			sendingMessage = true;
			error = '';
			
			// For now, we'll send text message. Attachment upload would need backend file upload endpoint
			// TODO: Implement file upload when backend endpoint is available
			await messagesApi.createMessage({
				link_id: complaint.link_id,
				content: newMessage.trim() || (attachmentFile ? `Attachment: ${attachmentFile.name}` : ''),
				message_type: attachmentFile ? 'attachment' : 'text',
				attachment_url: undefined, // Would be set after upload
				attachment_type: attachmentFile?.type
			});
			
			newMessage = '';
			attachmentFile = null;
			await loadMessages();
		} catch (err: any) {
			error = err?.message || $_('complaints.sendError');
		} finally {
			sendingMessage = false;
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			attachmentFile = target.files[0];
		}
	}

	function removeAttachment() {
		attachmentFile = null;
	}

	async function resolveComplaint() {
		if (!complaint || resolving || !canResolve) return;

		if (!confirm($_('complaints.resolveConfirm'))) {
			return;
		}

		try {
			resolving = true;
			error = '';
			await complaintsApi.updateComplaint(complaint.id, {
				status: 'resolved'
			});
			success = $_('complaints.resolveSuccess');
			await loadComplaint();
		} catch (err: any) {
			error = err?.message || $_('complaints.resolveError');
		} finally {
			resolving = false;
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
	// This reactive statement recreates the function when locale changes, triggering re-renders
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

	function isMyMessage(message: MessageResponse) {
		return message.sender_id === parseInt($user?.id || '0');
	}
</script>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<Button
			variant="outline"
			size="sm"
			on:click={() => goto('/complaints')}
		>
			<ArrowLeft class="w-4 h-4 mr-2" />
			{$_('common.back')}
		</Button>
		<div>
			<h2 class="text-gray-900 mb-1">{$_('complaints.detailTitle')}</h2>
		</div>
	</div>

	{#if loading}
		<div class="text-center py-8 text-gray-500">{$_('complaints.loadingComplaints')}</div>
	{:else if error && !complaint}
		<Alert variant="destructive">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else if complaint}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Complaint Details -->
			<div class="lg:col-span-1 space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>{$_('complaints.complaint')} #{complaint.id}</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div>
							<label class="text-sm font-medium text-gray-700">{$_('complaints.titleLabel')}</label>
							<p class="text-gray-900 mt-1">{complaint.title}</p>
						</div>
						<div>
							<label class="text-sm font-medium text-gray-700">{$_('complaints.descriptionLabel')}</label>
							<p class="text-gray-600 mt-1 whitespace-pre-wrap">{complaint.description}</p>
						</div>
						<div>
							<label class="text-sm font-medium text-gray-700">{$_('complaints.status')}</label>
							<div class="mt-1">
								{#if complaint.status === 'resolved'}
									<span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1 w-fit">
										<CheckCircle2 class="w-3 h-3" />
										{$_('complaints.resolved')}
									</span>
								{:else}
									<span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1 w-fit">
										<AlertTriangle class="w-3 h-3" />
										{$_('complaints.escalated')}
									</span>
								{/if}
							</div>
						</div>
						<div>
							<label class="text-sm font-medium text-gray-700">{$_('complaints.order')}</label>
							<p class="text-gray-600 mt-1">#{complaint.order_id}</p>
						</div>
						<div>
							<label class="text-sm font-medium text-gray-700">{$_('complaints.createdAt')}</label>
							<p class="text-gray-600 mt-1">{formatDate(complaint.created_at)}</p>
						</div>
						{#if complaint.status !== 'resolved' && canResolve}
							<Button
								on:click={resolveComplaint}
								disabled={resolving}
								className="w-full bg-green-600 hover:bg-green-700"
							>
								{#if resolving}
									<Clock class="w-4 h-4 mr-2 animate-spin" />
									{$_('complaints.resolving')}
								{:else}
									<CheckCircle2 class="w-4 h-4 mr-2" />
									{$_('complaints.resolve')}
								{/if}
							</Button>
						{/if}
						{#if isOwner}
							<div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
								<p class="text-sm text-blue-800">
									{$_('complaints.viewOnlyMode')}
								</p>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Chat -->
			<div class="lg:col-span-2">
				<Card class="flex flex-col h-[calc(100vh-200px)]">
					<CardHeader>
						<CardTitle>{$_('complaints.chat')}</CardTitle>
					</CardHeader>
					<CardContent class="flex-1 flex flex-col p-0">
						<!-- Messages -->
						<div class="flex-1 overflow-y-auto p-4 space-y-4">
							{#if messages.length === 0}
								<div class="text-center py-8 text-gray-500">{$_('complaints.noMessages')}</div>
							{:else}
								{#key cacheVersion}
									{#each messages as message (message.id)}
										{@const senderInfo = getSenderInfo(message.sender_id)}
										{@const isMyMsg = isMyMessage(message)}
										{@const AvatarIcon = getAvatarIcon(senderInfo.role, senderInfo.type)}
										<div class="flex {isMyMsg ? 'justify-end' : 'justify-start'} gap-2">
											{#if !isMyMsg}
												<div class="flex-shrink-0">
													<div class="w-8 h-8 rounded-full {getAvatarColor(senderInfo.role, senderInfo.type)} flex items-center justify-center text-white">
														<AvatarIcon class="w-4 h-4" />
													</div>
												</div>
											{/if}
											<div class="max-w-[70%] {isMyMsg ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2">
												<div class="flex items-center gap-2 mb-1">
													<span class="text-xs font-medium opacity-90">
														{isMyMsg ? ($user?.name || $_('complaints.you')) : senderInfo.name}
													</span>
													<span class="text-xs opacity-70">
														{#if senderInfo.type === 'consumer'}
															{$_('common.roles.consumer')}
														{:else if senderInfo.role === 'manager'}
															{$_('common.roles.manager')}
														{:else if senderInfo.role === 'sales_representative'}
															{$_('common.roles.sales_representative')}
														{:else if senderInfo.role === 'owner'}
															{$_('common.roles.owner')}
														{:else if senderInfo.role === 'consumer'}
															{$_('common.roles.consumer')}
														{:else}
															{senderInfo.role}
														{/if}
													</span>
												</div>
												<p class="text-sm whitespace-pre-wrap">{message.content}</p>
												{#if message.attachment_url}
													<a href={message.attachment_url} target="_blank" rel="noopener noreferrer" class="text-xs underline mt-1 block">
														📎 {message.attachment_type || 'Attachment'}
													</a>
												{/if}
												<p class="text-xs mt-1 opacity-70">{formatDate(message.created_at)}</p>
											</div>
											{#if isMyMsg}
												<div class="flex-shrink-0">
													<div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
														<AvatarIcon class="w-4 h-4" />
													</div>
												</div>
											{/if}
										</div>
									{/each}
								{/key}
							{/if}
						</div>

						<!-- Message Input -->
						{#if complaint.status !== 'resolved'}
							<div class="border-t border-gray-200 p-4">
								{#if error}
									<Alert variant="destructive" class="mb-4">
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								{/if}
								{#if success}
									<Alert className="bg-green-50 border-green-200 mb-4">
										<AlertDescription className="text-green-800">{success}</AlertDescription>
									</Alert>
								{/if}
								{#if canSendMessages}
									{#if attachmentFile}
										<div class="mb-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
											<Paperclip class="w-4 h-4 text-gray-600" />
											<span class="text-sm text-gray-700 flex-1 truncate">{attachmentFile.name}</span>
											<button
												type="button"
												on:click={removeAttachment}
												class="text-red-600 hover:text-red-700 text-sm"
											>
												×
											</button>
										</div>
									{/if}
									<form on:submit|preventDefault={sendMessage} class="flex gap-2">
										<label class="cursor-pointer">
											<input
												type="file"
												on:change={handleFileSelect}
												class="hidden"
												accept="image/*,application/pdf,.doc,.docx"
												disabled={sendingMessage || !canSendMessages}
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={sendingMessage || !canSendMessages}
												className="flex-shrink-0"
											>
												<Paperclip class="w-4 h-4" />
											</Button>
										</label>
										<Input
											bind:value={newMessage}
											placeholder={$_('complaints.messagePlaceholder')}
											className="flex-1"
											disabled={sendingMessage || !canSendMessages}
										/>
										<Button
											type="submit"
											disabled={(!newMessage.trim() && !attachmentFile) || sendingMessage || !canSendMessages}
											className="bg-green-600 hover:bg-green-700"
										>
											<Send class="w-4 h-4" />
										</Button>
									</form>
								{:else}
									<div class="border-t border-gray-200 p-4">
										<div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
											<p class="text-sm text-blue-800">
												{$_('complaints.viewOnlyMode')}
											</p>
										</div>
									</div>
								{/if}
							</div>
						{:else if !canSendMessages}
							<div class="border-t border-gray-200 p-4">
								<div class="text-center text-gray-500 text-sm mb-2">
									{$_('complaints.resolved')}
								</div>
								{#if isOwner}
									<div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
										<p class="text-sm text-blue-800">
											{$_('complaints.viewOnlyMode')}
										</p>
									</div>
								{/if}
							</div>
						{:else}
							<div class="border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
								{$_('complaints.resolved')}
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</div>

