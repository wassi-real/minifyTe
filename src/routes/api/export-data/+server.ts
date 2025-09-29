import { json } from '@sveltejs/kit';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

// GET - Export all data
export const GET: RequestHandler = async () => {
	try {
		const staticDir = path.join(process.cwd(), 'static');
		const exportData: any = {
			exportedAt: new Date().toISOString(),
			videos: [],
			playlists: [],
			images: []
		};

		// Export videos
		const videosDir = path.join(staticDir, 'videos');
		if (existsSync(videosDir)) {
			const videoFiles = await readdir(videosDir);
			const videoDataFiles = videoFiles.filter(file => file.endsWith('.json'));
			
			for (const file of videoDataFiles) {
				const content = await readFile(path.join(videosDir, file), 'utf8');
				const videoData = JSON.parse(content);
				exportData.videos.push(videoData);
			}
		}

		// Export playlists
		const playlistsDir = path.join(staticDir, 'playlists');
		if (existsSync(playlistsDir)) {
			const playlistFiles = await readdir(playlistsDir);
			const playlistDataFiles = playlistFiles.filter(file => file.endsWith('.json'));
			
			for (const file of playlistDataFiles) {
				const content = await readFile(path.join(playlistsDir, file), 'utf8');
				const playlistData = JSON.parse(content);
				exportData.playlists.push(playlistData);
			}
		}

		// Export image metadata (just list the files, not the actual images)
		const imagesDir = path.join(staticDir, 'images');
		if (existsSync(imagesDir)) {
			const imageFiles = await readdir(imagesDir);
			exportData.images = imageFiles.filter(file => !file.startsWith('.'));
		}

		return json({ success: true, data: exportData });
	} catch (error) {
		console.error('Failed to export data:', error);
		return json({ error: 'Failed to export data' }, { status: 500 });
	}
};
