<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let currentUser: any = $state(null);
	let showDeleteConfirm = $state(false);
	let deletePassword = $state('');
	let isDeleting = $state(false);
	let message = $state('');
	let isLoading = $state(false);

	onMount(() => {
		// Check authentication
		const unsubscribe = auth.subscribe(({ user, isAuthenticated }) => {
			if (!isAuthenticated) {
				goto('/');
			} else {
				currentUser = user;
			}
		});

		auth.checkAuth();

		return () => {
			unsubscribe();
		};
	});

	function handleLogout() {
		auth.logout();
		goto('/');
	}

	async function deleteUser() {
		if (!deletePassword.trim()) {
			message = 'Please enter your password to confirm deletion';
			return;
		}

		isDeleting = true;
		message = '';

		try {
			// First verify the password by attempting login
			const loginResponse = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: currentUser?.username,
					password: deletePassword
				})
			});

			if (!loginResponse.ok) {
				message = 'Invalid password. Please try again.';
				isDeleting = false;
				return;
			}

			// If password is correct, delete the user
			const deleteResponse = await fetch('/api/auth/delete', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: currentUser?.username,
					password: deletePassword
				})
			});

			const data = await deleteResponse.json();

			if (data.success) {
				message = 'Account deleted successfully. Redirecting...';
				setTimeout(() => {
					auth.logout();
					goto('/');
				}, 2000);
			} else {
				message = data.error || 'Failed to delete account';
			}
		} catch (error) {
			message = 'An error occurred while deleting the account';
		} finally {
			isDeleting = false;
		}
	}

	async function clearAllData() {
		if (!confirm('This will delete ALL videos, playlists, and data. This action cannot be undone. Are you sure?')) {
			return;
		}

		isLoading = true;
		message = '';

		try {
			const response = await fetch('/api/clear-all-data', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});

			const data = await response.json();

			if (data.success) {
				message = 'All data cleared successfully!';
			} else {
				message = data.error || 'Failed to clear data';
			}
		} catch (error) {
			message = 'An error occurred while clearing data';
		} finally {
			isLoading = false;
		}
	}

	async function exportData() {
		isLoading = true;
		message = '';

		try {
			const response = await fetch('/api/export-data');
			const data = await response.json();

			if (data.success) {
				// Create and download the export file
				const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `minifyte-export-${new Date().toISOString().split('T')[0]}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				
				message = 'Data exported successfully!';
			} else {
				message = data.error || 'Failed to export data';
			}
		} catch (error) {
			message = 'An error occurred while exporting data';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Settings - MinifyTe</title>
</svelte:head>

<div class="min-h-screen bg-black">
	<!-- Header -->
	<header class="bg-black border-b border-white/20 sticky top-0 z-40">
		<div class="mx-auto px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<img src="/MinifyTe.png" alt="MinifyTe" class="h-8 sm:h-10 w-auto rounded-lg" />
					<span class="ml-2 sm:ml-4 text-sm sm:text-base text-white/60">Settings</span>
				</div>
				
				<div class="flex items-center gap-4">
					<a href="/dashboard" class="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm border border-white/20">
						Back to Dashboard
					</a>
				</div>
			</div>
		</div>
	</header>

	<div class="mx-auto px-4 py-8 max-w-4xl">
		<div class="space-y-8">
			<!-- User Information -->
			<div class="bg-black border border-white/20 rounded-2xl p-6">
				<h2 class="text-xl font-semibold text-white mb-4">User Information</h2>
				<div class="space-y-4">
					<div>
						<div class="block text-sm font-medium text-white mb-2">Username</div>
						<div class="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white">
							{currentUser?.username || 'Unknown'}
						</div>
					</div>
					<div>
						<div class="block text-sm font-medium text-white mb-2">Account Type</div>
						<div class="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white">
							Administrator
						</div>
					</div>
				</div>
			</div>

			<!-- Data Management -->
			<div class="bg-black border border-white/20 rounded-2xl p-6">
				<h2 class="text-xl font-semibold text-white mb-4">Data Management</h2>
				<div class="space-y-4">
					<div class="flex flex-col sm:flex-row gap-4">
						<button
							onclick={exportData}
							disabled={isLoading}
							class="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? 'Exporting...' : 'Export All Data'}
						</button>
						<button
							onclick={clearAllData}
							disabled={isLoading}
							class="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? 'Clearing...' : 'Clear All Data'}
						</button>
					</div>
					<p class="text-xs text-white/60">
						Export: Download all videos, playlists, and settings as a JSON file.<br>
						Clear: Permanently delete all videos, playlists, and data.
					</p>
				</div>
			</div>

			<!-- Account Management -->
			<div class="bg-black border border-white/20 rounded-2xl p-6">
				<h2 class="text-xl font-semibold text-white mb-4">Account Management</h2>
				<div class="space-y-4">
					<button
						onclick={() => showDeleteConfirm = true}
						class="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
					>
						Delete Account
					</button>
					<p class="text-xs text-white/60">
						Permanently delete your account and all associated data. This action cannot be undone.
					</p>
				</div>
			</div>

			<!-- System Information -->
			<div class="bg-black border border-white/20 rounded-2xl p-6">
				<h2 class="text-xl font-semibold text-white mb-4">System Information</h2>
				<div class="space-y-3">
					<div class="flex justify-between items-center py-2 border-b border-white/10">
						<span class="text-white/80">Application</span>
						<span class="text-white">MinifyTe v1.0.0</span>
					</div>
					<div class="flex justify-between items-center py-2 border-b border-white/10">
						<span class="text-white/80">Framework</span>
						<span class="text-white">SvelteKit</span>
					</div>
					<div class="flex justify-between items-center py-2 border-b border-white/10">
						<span class="text-white/80">Storage</span>
						<span class="text-white">Local Filesystem</span>
					</div>
					<div class="flex justify-between items-center py-2">
						<span class="text-white/80">Last Updated</span>
						<span class="text-white">{new Date().toLocaleDateString()}</span>
					</div>
				</div>
			</div>

			<!-- Logout -->
			<div class="bg-black border border-white/20 rounded-2xl p-6">
				<h2 class="text-xl font-semibold text-white mb-4">Session</h2>
				<button
					onclick={handleLogout}
					class="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
				>
					Logout
				</button>
			</div>

			{#if message}
				<div class="text-sm p-3 rounded-lg border {message.includes('success') ? 'bg-white/10 text-white border-white/20' : 'bg-black text-white border-red-500'}">
					{message}
				</div>
			{/if}
		</div>
	</div>

	<!-- Delete Account Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
			<div class="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-md">
				<h2 class="text-lg font-semibold text-white mb-4">Delete Account</h2>
				<p class="text-sm text-white/60 mb-4">
					This will permanently delete your account and all data. This action cannot be undone.
				</p>
				
				<div class="space-y-4">
					<div>
						<label for="delete-password" class="block text-sm font-medium text-white mb-2">
							Enter your password to confirm
						</label>
						<input
							id="delete-password"
							type="password"
							bind:value={deletePassword}
							placeholder="Enter your password"
							class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white text-sm"
						/>
					</div>

					<div class="flex flex-col sm:flex-row gap-3">
						<button
							onclick={deleteUser}
							disabled={isDeleting || !deletePassword.trim()}
							class="flex-1 py-2 px-4 bg-red-500 text-white hover:bg-red-600 disabled:bg-red-500/20 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
						>
							{isDeleting ? 'Deleting...' : 'Delete Account'}
						</button>
						<button
							onclick={() => { showDeleteConfirm = false; deletePassword = ''; message = ''; }}
							class="py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
