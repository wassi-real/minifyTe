import { writable } from 'svelte/store';

export interface Video {
	id: string;
	title: string;
	filename: string;
	url: string;
	thumbnail?: string;
	uploadedAt: Date;
	size?: number;
	type?: string;
}

function createVideoStore() {
	const { subscribe, set, update } = writable<Video[]>([]);

	return {
		subscribe,
		loadVideos: async () => {
			try {
				const response = await fetch('/api/videos');
				const data = await response.json();
				
				if (data.videos) {
					const videos = data.videos.map((v: any) => ({
						...v,
						uploadedAt: new Date(v.uploadedAt)
					}));
					set(videos);
				}
			} catch (error) {
				console.error('Failed to load videos:', error);
			}
		},
		uploadVideo: async (file: File, title: string, thumbnail?: File) => {
			try {
				const formData = new FormData();
				formData.append('video', file);
				formData.append('title', title);
				if (thumbnail) {
					formData.append('thumbnail', thumbnail);
				}

				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				const data = await response.json();
				
				if (data.success && data.video) {
					const newVideo = {
						...data.video,
						uploadedAt: new Date(data.video.uploadedAt)
					};
					
					update(videos => [...videos, newVideo]);
					return { success: true, video: newVideo };
				} else {
					return { success: false, error: data.error || 'Upload failed' };
				}
			} catch (error) {
				console.error('Upload error:', error);
				return { success: false, error: 'Upload failed' };
			}
		},
		removeVideo: async (video: Video) => {
			try {
				const response = await fetch(`/api/videos?filename=${encodeURIComponent(video.filename)}`, {
					method: 'DELETE'
				});

				if (response.ok) {
					update(videos => videos.filter(v => v.id !== video.id));
					return { success: true };
				} else {
					return { success: false, error: 'Failed to delete video' };
				}
			} catch (error) {
				console.error('Delete error:', error);
				return { success: false, error: 'Failed to delete video' };
			}
		},
		updateVideo: async (video: Video, updates: { title?: string; thumbnail?: File }) => {
			try {
				const formData = new FormData();
				formData.append('title', updates.title || video.title);
				if (updates.thumbnail) {
					formData.append('thumbnail', updates.thumbnail);
				}

				const response = await fetch(`/api/videos/update?filename=${encodeURIComponent(video.filename)}`, {
					method: 'PUT',
					body: formData
				});

				const data = await response.json();
				
				if (data.success) {
					const updatedVideo = {
						...data.video,
						uploadedAt: new Date(data.video.uploadedAt)
					};
					update(videos => videos.map(v => 
						v.id === video.id ? updatedVideo : v
					));
					return { success: true, video: updatedVideo };
				} else {
					return { success: false, error: data.error || 'Failed to update video' };
				}
			} catch (error) {
				console.error('Update error:', error);
				return { success: false, error: 'Failed to update video' };
			}
		}
	};
}

export const videos = createVideoStore();
