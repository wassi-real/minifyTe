import { writable } from 'svelte/store';

export interface Playlist {
	id: string;
	name: string;
	description?: string;
	videoIds: string[];
	createdAt: string;
	updatedAt: string;
}

export interface PlaylistStore {
	playlists: Playlist[];
	currentPlaylist: Playlist | null;
}

const initialState: PlaylistStore = {
	playlists: [],
	currentPlaylist: null
};

function createPlaylistStore() {
	const { subscribe, set, update } = writable<PlaylistStore>(initialState);

	return {
		subscribe,
		
		// Load playlists from server
		async loadPlaylists() {
			try {
				const response = await fetch('/api/playlists');
				if (response.ok) {
					const data = await response.json();
					update(state => ({
						...state,
						playlists: data.playlists || []
					}));
				}
			} catch (error) {
				console.error('Failed to load playlists:', error);
			}
		},

		// Create new playlist
		async createPlaylist(name: string, description?: string) {
			try {
				const response = await fetch('/api/playlists', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name, description })
				});

				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						update(state => ({
							...state,
							playlists: [...state.playlists, data.playlist]
						}));
						return { success: true, playlist: data.playlist };
					}
				}
				return { success: false, error: 'Failed to create playlist' };
			} catch (error) {
				console.error('Failed to create playlist:', error);
				return { success: false, error: 'Failed to create playlist' };
			}
		},

		// Update playlist
		async updatePlaylist(playlistId: string, updates: Partial<Pick<Playlist, 'name' | 'description'>>) {
			try {
				const response = await fetch('/api/playlists/update', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ playlistId, ...updates })
				});

				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						update(state => ({
							...state,
							playlists: state.playlists.map(p => 
								p.id === playlistId ? { ...p, ...data.playlist } : p
							),
							currentPlaylist: state.currentPlaylist?.id === playlistId 
								? { ...state.currentPlaylist, ...data.playlist }
								: state.currentPlaylist
						}));
						return { success: true, playlist: data.playlist };
					}
				}
				return { success: false, error: 'Failed to update playlist' };
			} catch (error) {
				console.error('Failed to update playlist:', error);
				return { success: false, error: 'Failed to update playlist' };
			}
		},

		// Delete playlist
		async deletePlaylist(playlistId: string) {
			try {
				const response = await fetch('/api/playlists', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ playlistId })
				});

				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						update(state => ({
							...state,
							playlists: state.playlists.filter(p => p.id !== playlistId),
							currentPlaylist: state.currentPlaylist?.id === playlistId ? null : state.currentPlaylist
						}));
						return { success: true };
					}
				}
				return { success: false, error: 'Failed to delete playlist' };
			} catch (error) {
				console.error('Failed to delete playlist:', error);
				return { success: false, error: 'Failed to delete playlist' };
			}
		},

		// Add video to playlist
		async addVideoToPlaylist(playlistId: string, videoId: string) {
			try {
				const response = await fetch('/api/playlists/videos', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ playlistId, videoId })
				});

				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						update(state => ({
							...state,
							playlists: state.playlists.map(p => 
								p.id === playlistId 
									? { ...p, videoIds: [...p.videoIds, videoId], updatedAt: new Date().toISOString() }
									: p
							),
							currentPlaylist: state.currentPlaylist?.id === playlistId
								? { ...state.currentPlaylist, videoIds: [...state.currentPlaylist.videoIds, videoId], updatedAt: new Date().toISOString() }
								: state.currentPlaylist
						}));
						return { success: true };
					}
				}
				return { success: false, error: 'Failed to add video to playlist' };
			} catch (error) {
				console.error('Failed to add video to playlist:', error);
				return { success: false, error: 'Failed to add video to playlist' };
			}
		},

		// Remove video from playlist
		async removeVideoFromPlaylist(playlistId: string, videoId: string) {
			try {
				const response = await fetch('/api/playlists/videos', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ playlistId, videoId })
				});

				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						update(state => ({
							...state,
							playlists: state.playlists.map(p => 
								p.id === playlistId 
									? { ...p, videoIds: p.videoIds.filter(id => id !== videoId), updatedAt: new Date().toISOString() }
									: p
							),
							currentPlaylist: state.currentPlaylist?.id === playlistId
								? { ...state.currentPlaylist, videoIds: state.currentPlaylist.videoIds.filter(id => id !== videoId), updatedAt: new Date().toISOString() }
								: state.currentPlaylist
						}));
						return { success: true };
					}
				}
				return { success: false, error: 'Failed to remove video from playlist' };
			} catch (error) {
				console.error('Failed to remove video from playlist:', error);
				return { success: false, error: 'Failed to remove video from playlist' };
			}
		},

		// Set current playlist
		setCurrentPlaylist(playlist: Playlist | null) {
			update(state => ({
				...state,
				currentPlaylist: playlist
			}));
		},

		// Get playlist by ID
		getPlaylistById(playlistId: string) {
			let result: Playlist | null = null;
			update(state => {
				result = state.playlists.find(p => p.id === playlistId) || null;
				return state;
			});
			return result;
		}
	};
}

export const playlists = createPlaylistStore();
