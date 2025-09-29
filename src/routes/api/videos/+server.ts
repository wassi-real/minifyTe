import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const GET: RequestHandler = async () => {
	try {
		const videosDir = path.join(process.cwd(), 'static', 'videos');
		
		if (!existsSync(videosDir)) {
			return json({ videos: [] });
		}

		const files = await readdir(videosDir);
		const videoFiles = files.filter(file => {
			const ext = path.extname(file).toLowerCase();
			return ['.mp4', '.webm', '.ogg'].includes(ext);
		});

		const videos = await Promise.all(
			videoFiles.map(async (filename) => {
				const filepath = path.join(videosDir, filename);
				const stats = await stat(filepath);
				
				// Try to load saved metadata
				const metadataFile = path.join(videosDir, filename.replace(/\.[^/.]+$/, '.json'));
				let title = filename; // Default title
				let thumbnail = undefined;
				
				if (existsSync(metadataFile)) {
					try {
						const metadataContent = await import('fs').then(fs => fs.promises.readFile(metadataFile, 'utf8'));
						const metadata = JSON.parse(metadataContent);
						title = metadata.title || title;
						thumbnail = metadata.thumbnail;
					} catch (error) {
						console.error('Error reading metadata for', filename, error);
					}
				} else {
					// Extract title from filename (remove timestamp prefix)
					const nameWithoutExt = path.parse(filename).name;
					title = nameWithoutExt.replace(/^\d+_/, '').replace(/_/g, ' ');
					
					// Check for existing thumbnail
					const imagesDir = path.join(process.cwd(), 'static', 'images');
					if (existsSync(imagesDir)) {
						const imageFiles = await readdir(imagesDir);
						const thumbnailFile = imageFiles.find(f => f.startsWith(filename.replace(/\.[^/.]+$/, '_thumb')));
						if (thumbnailFile) {
							thumbnail = `/images/${thumbnailFile}`;
						}
					}
				}
				
				return {
					id: filename, // Use filename as ID for simplicity
					title,
					filename,
					url: `/videos/${filename}`,
					thumbnail,
					uploadedAt: stats.birthtime.toISOString(),
					size: stats.size
				};
			})
		);

		// Sort by upload date (newest first)
		videos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

		return json({ videos });

	} catch (error) {
		console.error('Error listing videos:', error);
		return json({ error: 'Failed to list videos' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const filename = url.searchParams.get('filename');
		if (!filename) {
			return json({ error: 'Filename required' }, { status: 400 });
		}

		const filepath = path.join(process.cwd(), 'static', 'videos', filename);
		
		if (!existsSync(filepath)) {
			return json({ error: 'File not found' }, { status: 404 });
		}

		await unlink(filepath);
		return json({ success: true });

	} catch (error) {
		console.error('Error deleting video:', error);
		return json({ error: 'Failed to delete video' }, { status: 500 });
	}
};
