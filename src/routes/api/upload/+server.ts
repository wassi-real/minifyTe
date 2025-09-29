import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('video') as File;
		const title = formData.get('title') as string;
		const thumbnail = formData.get('thumbnail') as File | null;

		if (!file || !title) {
			return json({ error: 'Missing file or title' }, { status: 400 });
		}

		// Validate video file type
		const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
		if (!validVideoTypes.includes(file.type)) {
			return json({ error: 'Invalid video file type. Please upload MP4, WebM, or OGG files.' }, { status: 400 });
		}

		// Validate thumbnail file type if provided
		if (thumbnail) {
			const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!validImageTypes.includes(thumbnail.type)) {
				return json({ error: 'Invalid thumbnail type. Please upload JPEG, PNG, or WebP images.' }, { status: 400 });
			}
		}

		// Create directories if they don't exist
		const videosDir = path.join(process.cwd(), 'static', 'videos');
		const imagesDir = path.join(process.cwd(), 'static', 'images');
		
		if (!existsSync(videosDir)) {
			await mkdir(videosDir, { recursive: true });
		}
		if (!existsSync(imagesDir)) {
			await mkdir(imagesDir, { recursive: true });
		}

		// Generate unique filenames
		const timestamp = Date.now();
		const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
		
		// Save video file
		const videoExtension = path.extname(file.name);
		const videoFilename = `${timestamp}_${safeTitle}${videoExtension}`;
		const videoFilepath = path.join(videosDir, videoFilename);
		
		const videoBuffer = Buffer.from(await file.arrayBuffer());
		await writeFile(videoFilepath, videoBuffer);

		// Save thumbnail if provided
		let thumbnailUrl = undefined;
		if (thumbnail) {
			const thumbnailExtension = path.extname(thumbnail.name);
			const thumbnailFilename = `${timestamp}_${safeTitle}_thumb${thumbnailExtension}`;
			const thumbnailFilepath = path.join(imagesDir, thumbnailFilename);
			
			const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer());
			await writeFile(thumbnailFilepath, thumbnailBuffer);
			
			thumbnailUrl = `/images/${thumbnailFilename}`;
		}

		// Save initial metadata
		const metadataFile = path.join(videosDir, videoFilename.replace(/\.[^/.]+$/, '.json'));
		const metadata = {
			title,
			thumbnail: thumbnailUrl,
			uploadedAt: new Date().toISOString()
		};
		await writeFile(metadataFile, JSON.stringify(metadata, null, 2));

		// Return video info
		const videoInfo = {
			id: videoFilename, // Use filename as ID for consistency
			title,
			filename: videoFilename,
			url: `/videos/${videoFilename}`,
			thumbnail: thumbnailUrl,
			uploadedAt: new Date().toISOString(),
			size: file.size,
			type: file.type
		};

		return json({ success: true, video: videoInfo });

	} catch (error) {
		console.error('Upload error:', error);
		return json({ error: 'Failed to upload video' }, { status: 500 });
	}
};
