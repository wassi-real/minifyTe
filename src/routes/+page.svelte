<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	onMount(() => {
		auth.checkAuth();
		hasAccounts = auth.hasExistingAccounts();
		
		// Redirect to dashboard if already authenticated
		const unsubscribe = auth.subscribe(({ isAuthenticated }) => {
			if (isAuthenticated) {
				goto('/dashboard');
			}
		});

		return unsubscribe;
	});

	let username = $state('');
	let password = $state('');
	let message = $state('');
	let isLoading = $state(false);
	let hasAccounts = $state(false);

	async function handleLogin() {
		if (!username.trim() || !password.trim()) {
			message = 'Please enter both username and password';
			return;
		}

		isLoading = true;
		const result = auth.login(username, password);
		message = result.message;
		isLoading = false;

		if (result.success) {
			goto('/dashboard');
		}
	}

	function handleKeypress(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<svelte:head>
	<title>MinifyTe - Video Player</title>
</svelte:head>

<div class="min-h-screen bg-black flex items-center justify-center p-4">
	<div class="bg-black border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
		<div class="text-center mb-6 sm:mb-8">
			<img src="/MinifyTe.png" alt="MinifyTe" class="h-16 sm:h-20 w-auto mx-auto mb-4 rounded-xl" />
			<p class="text-sm sm:text-base text-white/60">Minimal Video Player</p>
			{#if hasAccounts}
				<p class="text-xs text-white/40 mt-2">Sign in to your account</p>
			{:else}
				<p class="text-xs text-white/40 mt-2">Create your admin account</p>
			{/if}
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-6">
			<div>
				<label for="username" class="block text-sm font-medium text-white mb-2">
					Username
				</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					onkeypress={handleKeypress}
					placeholder="Enter username"
					class="w-full px-3 py-2 sm:px-4 sm:py-3 bg-black border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all text-sm sm:text-base"
					disabled={isLoading}
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-white mb-2">
					Password
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					onkeypress={handleKeypress}
					placeholder="Enter password"
					class="w-full px-3 py-2 sm:px-4 sm:py-3 bg-black border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all text-sm sm:text-base"
					disabled={isLoading}
				/>
			</div>

			{#if message}
				<div class="text-center p-3 rounded-xl border {message.includes('successful') || message.includes('created') ? 'bg-white/10 text-white border-white/20' : 'bg-black text-white border-red-500'}">
					{message}
				</div>
			{/if}

			<button
				type="submit"
				disabled={isLoading}
				class="w-full py-2 px-4 sm:py-3 sm:px-6 bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:cursor-not-allowed font-medium rounded-xl transition-colors duration-200 text-sm sm:text-base"
			>
				{isLoading ? (hasAccounts ? 'Signing in...' : 'Creating account...') : (hasAccounts ? 'Sign In' : 'Create Admin Account')}
			</button>
		</form>

		{#if !hasAccounts}
			<div class="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-white/40">
				<p>First user becomes admin automatically</p>
			</div>
		{/if}
	</div>
</div>
