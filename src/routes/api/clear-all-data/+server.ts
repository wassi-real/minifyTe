import { json } from '@sveltejs/kit';
import { readdir, unlink, rmdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

// DELETE - Clear all data (videos, playlists, thumbnails)
export const DELETE: RequestHandler = async () => {
	try {
		const staticDir = path.join(process.cwd(), 'static');
		
		// Clear videos directory
		const videosDir = path.join(staticDir, 'videos');
		if (existsSync(videosDir)) {
			const videoFiles = await readdir(videosDir);
			for (const file of videoFiles) {
				await unlink(path.join(videosDir, file));
			}
		}

		// Clear images directory
		const imagesDir = path.join(staticDir, 'images');
		if (existsSync(imagesDir)) {
			const imageFiles = await readdir(imagesDir);
			for (const file of imageFiles) {
				await unlink(path.join(imagesDir, file));
			}
		}

		// Clear playlists directory
		const playlistsDir = path.join(staticDir, 'playlists');
		if (existsSync(playlistsDir)) {
			const playlistFiles = await readdir(playlistsDir);
			for (const file of playlistFiles) {
				await unlink(path.join(playlistsDir, file));
			}
		}

		return json({ success: true, message: 'All data cleared successfully' });
	} catch (error) {
		console.error('Failed to clear data:', error);
		return json({ error: 'Failed to clear data' }, { status: 500 });
	}
};
