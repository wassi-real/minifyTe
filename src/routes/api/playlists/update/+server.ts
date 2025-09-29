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

// PUT - Update playlist metadata
export const PUT: RequestHandler = async ({ request }) => {
	try {
		await ensurePlaylistsDir();
		
		const { playlistId, name, description } = await request.json();
		
		if (!playlistId) {
			return json({ error: 'Playlist ID is required' }, { status: 400 });
		}

		const playlistFile = path.join(playlistsDir, `${playlistId}.json`);
		
		if (!existsSync(playlistFile)) {
			return json({ error: 'Playlist not found' }, { status: 404 });
		}

		// Read existing playlist
		const content = await readFile(playlistFile, 'utf8');
		const playlist = JSON.parse(content);

		// Update fields
		if (name !== undefined) playlist.name = name.trim();
		if (description !== undefined) playlist.description = description.trim();
		playlist.updatedAt = new Date().toISOString();

		// Save updated playlist
		await writeFile(playlistFile, JSON.stringify(playlist, null, 2));

		return json({ success: true, playlist });
	} catch (error) {
		console.error('Failed to update playlist:', error);
		return json({ error: 'Failed to update playlist' }, { status: 500 });
	}
};
