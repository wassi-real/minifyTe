<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { videos, type Video } from '$lib/stores/videos';
	import { playlists, type Playlist } from '$lib/stores/playlists';
	import { goto } from '$app/navigation';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';

	let currentUser: any = $state(null);
	let videoList: Video[] = $state([]);
	let playlistList: Playlist[] = $state([]);
	let currentPlaylist: Playlist | null = $state(null);
	let selectedVideo: Video | null = $state(null);
	let showUpload = $state(false);
	let showCreatePlaylist = $state(false);
	let showPlaylistModal = $state(false);
	let showEditPlaylist = $state(false);
	let showEdit = $state(false);
	let isUploading = $state(false);
	let isEditing = $state(false);
	let uploadTitle = $state('');
	let uploadFile: File | null = $state(null);
	let thumbnailFile: File | null = $state(null);
	let uploadMessage = $state('');
	let editingVideo: Video | null = $state(null);
	let editTitle = $state('');
	let editThumbnailFile: File | null = $state(null);
	
	// Playlist states
	let playlistName = $state('');
	let playlistDescription = $state('');
	let editingPlaylist: Playlist | null = $state(null);
	let selectedVideoForPlaylist: Video | null = $state(null);
	let viewMode = $state<'all' | 'playlist'>('all'); // 'all' for all videos, 'playlist' for current playlist

	onMount(() => {
		// Check authentication
		const unsubscribe = auth.subscribe(({ user, isAuthenticated }) => {
			if (!isAuthenticated) {
				goto('/');
			} else {
				currentUser = user;
			}
		});

		// Load videos and playlists
		loadInitialVideos();
		loadInitialPlaylists();

		auth.checkAuth();

		return () => {
			unsubscribe();
		};
	});

	async function loadInitialVideos() {
		try {
			const response = await fetch('/api/videos');
			const data = await response.json();
			if (data.videos) {
				videoList = data.videos.map((v: any) => ({
					...v,
					uploadedAt: new Date(v.uploadedAt)
				}));
			}
		} catch (error) {
			console.error('Failed to load videos:', error);
		}
	}

	async function loadInitialPlaylists() {
		try {
			const response = await fetch('/api/playlists');
			const data = await response.json();
			if (data.playlists) {
				playlistList = data.playlists;
			}
		} catch (error) {
			console.error('Failed to load playlists:', error);
		}
	}


	// Playlist functions
	async function createPlaylist() {
		if (!playlistName.trim()) {
			uploadMessage = 'Playlist name is required';
			return;
		}

		try {
			const response = await fetch('/api/playlists', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					name: playlistName, 
					description: playlistDescription 
				})
			});

			const data = await response.json();
			if (data.success) {
				playlistList = [...playlistList, data.playlist];
				uploadMessage = 'Playlist created successfully!';
				playlistName = '';
				playlistDescription = '';
				showCreatePlaylist = false;
			} else {
				uploadMessage = data.error || 'Failed to create playlist';
			}
		} catch (error) {
			uploadMessage = 'Failed to create playlist';
		}
	}

	async function deletePlaylist(playlist: Playlist) {
		if (!confirm(`Are you sure you want to delete "${playlist.name}"?`)) return;

		try {
			const response = await fetch('/api/playlists', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playlistId: playlist.id })
			});

			const data = await response.json();
			if (data.success) {
				playlistList = playlistList.filter(p => p.id !== playlist.id);
				if (currentPlaylist?.id === playlist.id) {
					currentPlaylist = null;
					viewMode = 'all';
				}
				uploadMessage = 'Playlist deleted successfully!';
			} else {
				uploadMessage = data.error || 'Failed to delete playlist';
			}
		} catch (error) {
			uploadMessage = 'Failed to delete playlist';
		}
	}

	async function addVideoToPlaylist(playlist: Playlist, video: Video) {
		try {
			const response = await fetch('/api/playlists/videos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					playlistId: playlist.id, 
					videoId: video.id 
				})
			});

			const data = await response.json();
			if (data.success) {
				// Update playlist in the list
				playlistList = playlistList.map(p => 
					p.id === playlist.id 
						? { ...p, videoIds: [...p.videoIds, video.id] }
						: p
				);
				uploadMessage = `Added "${video.title}" to "${playlist.name}"`;
				showPlaylistModal = false;
			} else {
				uploadMessage = data.error || 'Failed to add video to playlist';
			}
		} catch (error) {
			uploadMessage = 'Failed to add video to playlist';
		}
	}

	async function removeVideoFromPlaylist(playlist: Playlist, video: Video) {
		try {
			const response = await fetch('/api/playlists/videos', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					playlistId: playlist.id, 
					videoId: video.id 
				})
			});

			const data = await response.json();
			if (data.success) {
				// Update playlist in the list
				playlistList = playlistList.map(p => 
					p.id === playlist.id 
						? { ...p, videoIds: p.videoIds.filter(id => id !== video.id) }
						: p
				);
				uploadMessage = `Removed "${video.title}" from "${playlist.name}"`;
			} else {
				uploadMessage = data.error || 'Failed to remove video from playlist';
			}
		} catch (error) {
			uploadMessage = 'Failed to remove video from playlist';
		}
	}

	function selectPlaylist(playlist: Playlist | null) {
		currentPlaylist = playlist;
		viewMode = playlist ? 'playlist' : 'all';
		selectedVideo = null; // Reset selected video when switching playlists
	}

	function openPlaylistModal(video: Video) {
		selectedVideoForPlaylist = video;
		showPlaylistModal = true;
	}

	function startEditPlaylist(playlist: Playlist) {
		editingPlaylist = playlist;
		playlistName = playlist.name;
		playlistDescription = playlist.description || '';
		showEditPlaylist = true;
	}

	async function updatePlaylist() {
		if (!editingPlaylist || !playlistName.trim()) {
			uploadMessage = 'Playlist name is required';
			return;
		}

		try {
			const response = await fetch('/api/playlists/update', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					playlistId: editingPlaylist.id,
					name: playlistName, 
					description: playlistDescription 
				})
			});

			const data = await response.json();
			if (data.success) {
				playlistList = playlistList.map(p => 
					p.id === editingPlaylist!.id ? { ...p, ...data.playlist } : p
				);
				if (currentPlaylist?.id === editingPlaylist!.id) {
					currentPlaylist = { ...currentPlaylist, ...data.playlist };
				}
				uploadMessage = 'Playlist updated successfully!';
				showEditPlaylist = false;
				editingPlaylist = null;
				playlistName = '';
				playlistDescription = '';
			} else {
				uploadMessage = data.error || 'Failed to update playlist';
			}
		} catch (error) {
			uploadMessage = 'Failed to update playlist';
		}
	}

	// Get videos for current view
	let displayVideos = $derived(viewMode === 'playlist' && currentPlaylist 
		? videoList.filter(video => currentPlaylist!.videoIds.includes(video.id))
		: videoList);

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (file) {
			// Validate file type
			const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
			if (!validTypes.includes(file.type)) {
				uploadMessage = 'Please select a valid video file (MP4, WebM, or OGG)';
				uploadFile = null;
				return;
			}

			uploadFile = file;
			if (!uploadTitle) {
				uploadTitle = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
			}
			uploadMessage = '';
		}
	}

	function handleThumbnailSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (file) {
			// Validate file type
			const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!validTypes.includes(file.type)) {
				uploadMessage = 'Please select a valid image file (JPEG, PNG, or WebP)';
				thumbnailFile = null;
				return;
			}

			thumbnailFile = file;
			uploadMessage = '';
		}
	}

	async function handleUpload() {
		if (!uploadFile || !uploadTitle.trim()) {
			uploadMessage = 'Please select a file and enter a title';
			return;
		}

		isUploading = true;
		uploadMessage = '';

		try {
			const result = await videos.uploadVideo(uploadFile, uploadTitle.trim(), thumbnailFile || undefined);
			
			if (result.success) {
				uploadMessage = 'Video uploaded successfully!';
				
				// Add new video to list immediately
				videoList = [...videoList, result.video];
				
				// Reset form
				uploadTitle = '';
				uploadFile = null;
				thumbnailFile = null;
				showUpload = false;
				
				// Clear file inputs
				const videoInput = document.querySelector('#video-file') as HTMLInputElement;
				const thumbnailInput = document.querySelector('#thumbnail-file') as HTMLInputElement;
				if (videoInput) videoInput.value = '';
				if (thumbnailInput) thumbnailInput.value = '';
			} else {
				uploadMessage = result.error || 'Failed to upload video. Please try again.';
			}

		} catch (error) {
			uploadMessage = 'Failed to upload video. Please try again.';
			console.error('Upload error:', error);
		} finally {
			isUploading = false;
		}
	}

	function selectVideo(video: Video) {
		selectedVideo = video;
	}

	function startEdit(video: Video) {
		editingVideo = video;
		editTitle = video.title;
		editThumbnailFile = null;
		showEdit = true;
		uploadMessage = '';
	}

	function handleEditThumbnailSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (file) {
			// Validate file type
			const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!validTypes.includes(file.type)) {
				uploadMessage = 'Please select a valid image file (JPEG, PNG, or WebP)';
				editThumbnailFile = null;
				return;
			}

			editThumbnailFile = file;
			uploadMessage = '';
		}
	}

	async function handleEdit() {
		if (!editingVideo || !editTitle.trim()) {
			uploadMessage = 'Please enter a title';
			return;
		}

		isEditing = true;
		uploadMessage = '';

		try {
			const result = await videos.updateVideo(editingVideo, {
				title: editTitle.trim(),
				thumbnail: editThumbnailFile || undefined
			});
			
			if (result.success) {
				uploadMessage = 'Video updated successfully!';
				// Update the video in the local array immediately
				if (editingVideo) {
					const videoIndex = videoList.findIndex(v => v.id === editingVideo!.id);
					if (videoIndex !== -1) {
						videoList[videoIndex] = { ...result.video };
						videoList = [...videoList]; // Force reactivity
					}
				}
				
				// Update selected video if it's the one being edited
				if (selectedVideo?.id === editingVideo.id) {
					selectedVideo = { ...result.video };
				}
				
				// Reset form
				editingVideo = null;
				editTitle = '';
				editThumbnailFile = null;
				showEdit = false;
				
				// Clear file input
				const thumbnailInput = document.querySelector('#edit-thumbnail-file') as HTMLInputElement;
				if (thumbnailInput) thumbnailInput.value = '';
			} else {
				uploadMessage = result.error || 'Failed to update video. Please try again.';
			}

		} catch (error) {
			uploadMessage = 'Failed to update video. Please try again.';
			console.error('Edit error:', error);
		} finally {
			isEditing = false;
		}
	}

	async function deleteVideo(video: Video) {
		if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
			const result = await videos.removeVideo(video);
			if (result.success) {
				// Remove from list immediately
				videoList = videoList.filter(v => v.id !== video.id);
				
				if (selectedVideo?.id === video.id) {
					selectedVideo = null;
				}
			} else {
				alert(result.error || 'Failed to delete video');
			}
		}
	}

	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}
</script>

<svelte:head>
	<title>Dashboard - MinifyTe</title>
</svelte:head>

<div class="min-h-screen bg-black">
	<!-- Mobile-First Header -->
	<header class="bg-black border-b border-white/20 sticky top-0 z-40">
		<div class="mx-auto px-4 py-3">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
				<div class="flex items-center">
					<img src="/MinifyTe.png" alt="MinifyTe" class="h-8 sm:h-10 w-auto rounded-lg" />
					<span class="ml-2 sm:ml-4 text-sm sm:text-base text-white/60">Video Library</span>
				</div>
				
				<div class="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
					<span class="text-sm text-white/80 hidden sm:block">Welcome, {currentUser?.username || 'User'}</span>
					<button
						onclick={() => showUpload = !showUpload}
						class="px-3 py-2 sm:px-4 bg-white text-black hover:bg-white/90 rounded-lg transition-colors text-sm flex-1 sm:flex-none font-medium"
					>
						Add Video
					</button>
					<button
						onclick={() => showCreatePlaylist = !showCreatePlaylist}
						class="px-3 py-2 sm:px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm border border-white/20"
					>
						Create Playlist
					</button>
					<a
						href="/settings"
						class="px-3 py-2 sm:px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm border border-white/20"
					>
						Settings
					</a>
				</div>
			</div>
		</div>
	</header>

	<div class="mx-auto px-4 py-4 sm:py-8">
		<!-- Playlist Navigation -->
		<div class="mb-6">
			<div class="flex flex-wrap gap-2 mb-4">
				<button
					onclick={() => selectPlaylist(null)}
					class="px-4 py-2 rounded-lg text-sm transition-colors border {viewMode === 'all' ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}"
				>
					All Videos ({videoList.length})
				</button>
				{#each playlistList as playlist}
					<button
						onclick={() => selectPlaylist(playlist)}
						class="px-4 py-2 rounded-lg text-sm transition-colors border {currentPlaylist?.id === playlist.id ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}"
					>
						{playlist.name} ({playlist.videoIds.length})
					</button>
				{/each}
			</div>
			
			{#if currentPlaylist}
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="text-lg font-semibold text-white">{currentPlaylist.name}</h3>
						{#if currentPlaylist.description}
							<p class="text-sm text-white/60">{currentPlaylist.description}</p>
						{/if}
					</div>
					<div class="flex gap-2">
						<button
							onclick={() => currentPlaylist && startEditPlaylist(currentPlaylist)}
							class="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
							aria-label="Edit playlist"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
						</button>
						<button
							onclick={() => currentPlaylist && deletePlaylist(currentPlaylist)}
							class="p-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 rounded-lg transition-colors border border-white/20 hover:border-red-500/40"
							aria-label="Delete playlist"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Upload Modal -->
		{#if showUpload}
			<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
				<div class="bg-black border border-white/20 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
					<h2 class="text-lg sm:text-xl font-semibold text-white mb-4">Upload Video</h2>
					
					<div class="space-y-4">
						<div>
							<label for="video-title" class="block text-sm font-medium text-white mb-2">
								Video Title
							</label>
							<input
								id="video-title"
								type="text"
								bind:value={uploadTitle}
								placeholder="Enter video title"
								class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
								disabled={isUploading}
							/>
						</div>

						<div>
							<label for="video-file" class="block text-sm font-medium text-white mb-2">
								Video File
							</label>
							<input
								id="video-file"
								type="file"
								accept="video/mp4,video/webm,video/ogg"
								onchange={handleFileSelect}
								class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white file:text-black hover:file:bg-white/90 file:text-xs"
								disabled={isUploading}
							/>
						</div>

						<div>
							<label for="thumbnail-file" class="block text-sm font-medium text-white mb-2">
								Thumbnail (Optional)
							</label>
							<input
								id="thumbnail-file"
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								onchange={handleThumbnailSelect}
								class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20 file:text-xs"
								disabled={isUploading}
							/>
						</div>

						{#if uploadMessage}
							<div class="text-sm p-3 rounded-lg border {uploadMessage.includes('success') ? 'bg-white/10 text-white border-white/20' : 'bg-black text-white border-red-500'}">
								{uploadMessage}
							</div>
						{/if}

						<div class="flex flex-col sm:flex-row gap-3 pt-4">
							<button
								onclick={handleUpload}
								disabled={isUploading || !uploadFile || !uploadTitle.trim()}
								class="flex-1 py-2 px-4 bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
							>
								{isUploading ? 'Uploading...' : 'Upload'}
							</button>
							<button
								onclick={() => { showUpload = false; uploadMessage = ''; }}
								class="py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
								disabled={isUploading}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Edit Modal -->
		{#if showEdit}
			<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
				<div class="bg-black border border-white/20 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
					<h2 class="text-lg sm:text-xl font-semibold text-white mb-4">Edit Video</h2>
					
					<div class="space-y-4">
						<div>
							<label for="edit-title" class="block text-sm font-medium text-white mb-2">
								Video Title
							</label>
							<input
								id="edit-title"
								type="text"
								bind:value={editTitle}
								placeholder="Enter video title"
								class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
								disabled={isEditing}
							/>
						</div>

						<div>
							<label for="edit-thumbnail-file" class="block text-sm font-medium text-white mb-2">
								New Thumbnail (Optional)
							</label>
							<input
								id="edit-thumbnail-file"
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								onchange={handleEditThumbnailSelect}
								class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20 file:text-xs"
								disabled={isEditing}
							/>
							{#if editingVideo?.thumbnail}
								<div class="mt-2">
									<p class="text-xs text-white/60 mb-1">Current thumbnail:</p>
									<img src={editingVideo.thumbnail} alt="Current thumbnail" class="w-20 h-14 object-cover rounded border border-white/20" />
								</div>
							{/if}
						</div>

						{#if uploadMessage}
							<div class="text-sm p-3 rounded-lg border {uploadMessage.includes('success') ? 'bg-white/10 text-white border-white/20' : 'bg-black text-white border-red-500'}">
								{uploadMessage}
							</div>
						{/if}

						<div class="flex flex-col sm:flex-row gap-3 pt-4">
							<button
								onclick={handleEdit}
								disabled={isEditing || !editTitle.trim()}
								class="flex-1 py-2 px-4 bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
							>
								{isEditing ? 'Updating...' : 'Update Video'}
							</button>
							<button
								onclick={() => { showEdit = false; uploadMessage = ''; }}
								class="py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
								disabled={isEditing}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Main Content - Mobile First Layout -->
		<div class="flex flex-col lg:flex-row gap-4 lg:gap-8">
			<!-- Video Library - Shows first on mobile -->
			<div class="order-2 lg:order-2 lg:w-80 xl:w-96">
				<div class="bg-black border border-white/20 rounded-2xl p-4 sm:p-6">
					<h2 class="text-base sm:text-lg font-semibold text-white mb-4">
						{currentPlaylist ? currentPlaylist.name : 'Your Videos'} ({displayVideos.length})
					</h2>
					
					{#if displayVideos.length === 0}
						<div class="text-center py-6 sm:py-8">
							<div class="text-gray-400 mb-4">
								<svg class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4h10m-8 0v8a2 2 0 002 2h4a2 2 0 002-2v-8m-6 0V9a1 1 0 112 0v1" />
								</svg>
							</div>
							<p class="text-white/60 text-sm sm:text-base">
								{currentPlaylist ? 'No videos in this playlist' : 'No videos uploaded yet'}
							</p>
							{#if !currentPlaylist}
								<button
									onclick={() => showUpload = true}
									class="mt-3 px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg transition-colors text-sm font-medium"
								>
									Upload your first video
								</button>
							{/if}
						</div>
					{:else}
						<div class="space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
							{#each displayVideos as video (video.id)}
							<div class="bg-white/5 rounded-xl p-3 sm:p-4 hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
								class:ring-2={selectedVideo?.id === video.id}
								class:ring-white={selectedVideo?.id === video.id}
								onclick={() => selectVideo(video)}
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectVideo(video); } }}
								role="button"
								tabindex="0">
								
								<div class="flex gap-3">
									<!-- Thumbnail -->
									{#if video.thumbnail}
										<img 
											src={video.thumbnail} 
											alt="{video.title} thumbnail"
											class="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded-lg flex-shrink-0"
										/>
									{:else}
										<div class="w-16 h-12 sm:w-20 sm:h-14 bg-white/10 rounded-lg flex-shrink-0 flex items-center justify-center border border-white/20">
											<svg class="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
											</svg>
										</div>
									{/if}
									
									<!-- Video Info -->
									<div class="flex-1 min-w-0">
										<div class="flex justify-between items-start mb-1">
											<h3 class="font-medium text-white text-sm sm:text-base truncate pr-2">{video.title}</h3>
											<div class="flex gap-1">
												{#if currentPlaylist}
													<button
														onclick={(e) => { e.stopPropagation(); currentPlaylist && removeVideoFromPlaylist(currentPlaylist, video); }}
														class="text-gray-400 hover:text-red-400 transition-colors p-1 flex-shrink-0"
														aria-label="Remove from playlist"
													>
														<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
														</svg>
													</button>
												{:else}
													<button
														onclick={(e) => { e.stopPropagation(); openPlaylistModal(video); }}
														class="text-gray-400 hover:text-blue-400 transition-colors p-1 flex-shrink-0"
														aria-label="Add to playlist"
													>
														<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
														</svg>
													</button>
												{/if}
												<button
													onclick={(e) => { e.stopPropagation(); startEdit(video); }}
													class="text-gray-400 hover:text-blue-400 transition-colors p-1 flex-shrink-0"
													aria-label="Edit video"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
													</svg>
												</button>
												<button
													onclick={(e) => { e.stopPropagation(); deleteVideo(video); }}
													class="text-gray-400 hover:text-red-400 transition-colors p-1 flex-shrink-0"
													aria-label="Delete video"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</div>
										</div>
										
											<div class="text-xs text-white/60">
												<div class="truncate">Uploaded: {formatDate(video.uploadedAt)}</div>
											</div>
									</div>
								</div>
							</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Video Player - Shows second on mobile -->
			<div class="order-1 lg:order-1 flex-1">
				{#if selectedVideo}
					<div class="bg-black border border-white/20 rounded-2xl p-4 sm:p-6">
						<VideoPlayer video={selectedVideo} />
					</div>
				{:else}
					<div class="bg-black border border-white/20 rounded-2xl p-8 sm:p-12 text-center">
						<div class="text-white/40 mb-4">
							<svg class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
						</div>
						<h2 class="text-lg sm:text-xl font-semibold text-white mb-2">No video selected</h2>
						<p class="text-white/60 text-sm sm:text-base">Choose a video from your library to start watching</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Create Playlist Modal -->
		{#if showCreatePlaylist}
			<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
				<div class="bg-black border border-white/20 rounded-2xl p-4 sm:p-6 w-full max-w-md">
					<h2 class="text-lg sm:text-xl font-semibold text-white mb-4">Create Playlist</h2>
					
					<div class="space-y-4">
						<div>
							<label for="playlist-name" class="block text-sm font-medium text-white mb-2">
								Playlist Name
							</label>
							<input
								id="playlist-name"
								type="text"
								bind:value={playlistName}
								placeholder="Enter playlist name"
								class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
							/>
						</div>

						<div>
							<label for="playlist-description" class="block text-sm font-medium text-white mb-2">
								Description (Optional)
							</label>
							<textarea
								id="playlist-description"
								bind:value={playlistDescription}
								placeholder="Enter playlist description"
								rows="3"
								class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base resize-none"
							></textarea>
						</div>

						{#if uploadMessage}
							<div class="text-sm p-3 rounded-lg border {uploadMessage.includes('success') ? 'bg-white/10 text-white border-white/20' : 'bg-black text-white border-red-500'}">
								{uploadMessage}
							</div>
						{/if}

						<div class="flex flex-col sm:flex-row gap-3 pt-4">
							<button
								onclick={createPlaylist}
								disabled={!playlistName.trim()}
								class="flex-1 py-2 px-4 bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
							>
								Create Playlist
							</button>
							<button
								onclick={() => { showCreatePlaylist = false; uploadMessage = ''; playlistName = ''; playlistDescription = ''; }}
								class="py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Edit Playlist Modal -->
		{#if showEditPlaylist}
			<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
				<div class="bg-black border border-white/20 rounded-2xl p-4 sm:p-6 w-full max-w-md">
					<h2 class="text-lg sm:text-xl font-semibold text-white mb-4">Edit Playlist</h2>
					
					<div class="space-y-4">
						<div>
							<label for="edit-playlist-name" class="block text-sm font-medium text-white mb-2">
								Playlist Name
							</label>
							<input
								id="edit-playlist-name"
								type="text"
								bind:value={playlistName}
								placeholder="Enter playlist name"
								class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
							/>
						</div>

						<div>
							<label for="edit-playlist-description" class="block text-sm font-medium text-white mb-2">
								Description (Optional)
							</label>
							<textarea
								id="edit-playlist-description"
								bind:value={playlistDescription}
								placeholder="Enter playlist description"
								rows="3"
								class="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base resize-none"
							></textarea>
						</div>

						{#if uploadMessage}
							<div class="text-sm p-3 rounded-lg border {uploadMessage.includes('success') ? 'bg-white/10 text-white border-white/20' : 'bg-black text-white border-red-500'}">
								{uploadMessage}
							</div>
						{/if}

						<div class="flex flex-col sm:flex-row gap-3 pt-4">
							<button
								onclick={updatePlaylist}
								disabled={!playlistName.trim()}
								class="flex-1 py-2 px-4 bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
							>
								Update Playlist
							</button>
							<button
								onclick={() => { showEditPlaylist = false; uploadMessage = ''; editingPlaylist = null; playlistName = ''; playlistDescription = ''; }}
								class="py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Add to Playlist Modal -->
		{#if showPlaylistModal && selectedVideoForPlaylist}
			<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
				<div class="bg-black border border-white/20 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
					<h2 class="text-lg sm:text-xl font-semibold text-white mb-4">Add to Playlist</h2>
					<p class="text-sm text-white/60 mb-4">Add "{selectedVideoForPlaylist.title}" to a playlist:</p>
					
					{#if playlistList.length === 0}
						<div class="text-center py-6">
							<p class="text-white/60 text-sm mb-4">No playlists created yet</p>
							<button
								onclick={() => { showPlaylistModal = false; showCreatePlaylist = true; }}
								class="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg transition-colors text-sm font-medium"
							>
								Create your first playlist
							</button>
						</div>
					{:else}
						<div class="space-y-2 max-h-60 overflow-y-auto">
							{#each playlistList as playlist}
								{@const isVideoInPlaylist = selectedVideoForPlaylist ? playlist.videoIds.includes(selectedVideoForPlaylist.id) : false}
								<button
									onclick={() => selectedVideoForPlaylist && addVideoToPlaylist(playlist, selectedVideoForPlaylist)}
									disabled={isVideoInPlaylist}
									class="w-full p-3 text-left rounded-lg border transition-colors {isVideoInPlaylist ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}"
								>
									<div class="flex justify-between items-center">
										<div>
											<div class="font-medium">{playlist.name}</div>
											{#if playlist.description}
												<div class="text-xs text-white/60 mt-1">{playlist.description}</div>
											{/if}
										</div>
										<div class="text-xs text-white/60">
											{isVideoInPlaylist ? 'Already added' : `${playlist.videoIds.length} videos`}
										</div>
									</div>
								</button>
							{/each}
						</div>

						{#if uploadMessage}
							<div class="text-sm p-3 rounded-lg border mt-4 {uploadMessage.includes('success') ? 'bg-white/10 text-white border-white/20' : 'bg-black text-white border-red-500'}">
								{uploadMessage}
							</div>
						{/if}
					{/if}

					<div class="flex justify-end gap-3 pt-4 mt-4 border-t border-white/10">
						<button
							onclick={() => { showPlaylistModal = false; uploadMessage = ''; selectedVideoForPlaylist = null; }}
							class="py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
