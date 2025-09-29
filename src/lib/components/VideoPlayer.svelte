<script lang="ts">
	import type { Video } from '$lib/stores/videos';

	interface Props {
		video: Video;
	}

	let { video }: Props = $props();
</script>

<div class="w-full">
	<h2 class="text-white text-lg font-medium mb-4">{video.title}</h2>
	
	<!-- Pure Native HTML5 Video Player -->
	<video
		class="w-full h-auto"
		src={video.url}
		poster={video.thumbnail}
		controls
		preload="metadata"
	>
		<track kind="captions" srclang="en" label="English" />
		<p>
			Your browser doesn't support HTML5 video. 
			<a href={video.url}>Download the video</a> instead.
		</p>
	</video>
</div>
