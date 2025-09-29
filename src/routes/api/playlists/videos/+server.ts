import { json } from '@sveltejs/kit';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

const playlistsDir = path.join(process.cwd(), 'static', 'playlists');

// Ensure playlists directory exists
async function ensurePlaylistsDir() {
	if (!existsSync(playlistsDir)) {
		await import('fs').then(fs => fs.promises.mkdir(playlistsDir, { recursive: true }));
	}
}

// POST - Add video to playlist
export const POST: RequestHandler = async ({ request }) => {
	try {
		await ensurePlaylistsDir();
		
		const { playlistId, videoId } = await request.json();
		
		if (!playlistId || !videoId) {
			return json({ error: 'Playlist ID and Video ID are required' }, { status: 400 });
		}

		const playlistFile = path.join(playlistsDir, `${playlistId}.json`);
		
		if (!existsSync(playlistFile)) {
			return json({ error: 'Playlist not found' }, { status: 404 });
		}

		// Read existing playlist
		const content = await readFile(playlistFile, 'utf8');
		const playlist = JSON.parse(content);

		// Check if video is already in playlist
		if (playlist.videoIds.includes(videoId)) {
			return json({ error: 'Video already in playlist' }, { status: 400 });
		}

		// Add video to playlist
		playlist.videoIds.push(videoId);
		playlist.updatedAt = new Date().toISOString();

		// Save updated playlist
		await writeFile(playlistFile, JSON.stringify(playlist, null, 2));

		return json({ success: true, playlist });
	} catch (error) {
		console.error('Failed to add video to playlist:', error);
		return json({ error: 'Failed to add video to playlist' }, { status: 500 });
	}
};

// DELETE - Remove video from playlist
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		await ensurePlaylistsDir();
		
		const { playlistId, videoId } = await request.json();
		
		if (!playlistId || !videoId) {
			return json({ error: 'Playlist ID and Video ID are required' }, { status: 400 });
		}

		const playlistFile = path.join(playlistsDir, `${playlistId}.json`);
		
		if (!existsSync(playlistFile)) {
			return json({ error: 'Playlist not found' }, { status: 404 });
		}

		// Read existing playlist
		const content = await readFile(playlistFile, 'utf8');
		const playlist = JSON.parse(content);

		// Remove video from playlist
		playlist.videoIds = playlist.videoIds.filter((id: string) => id !== videoId);
		playlist.updatedAt = new Date().toISOString();

		// Save updated playlist
		await writeFile(playlistFile, JSON.stringify(playlist, null, 2));

		return json({ success: true, playlist });
	} catch (error) {
		console.error('Failed to remove video from playlist:', error);
		return json({ error: 'Failed to remove video from playlist' }, { status: 500 });
	}
};
