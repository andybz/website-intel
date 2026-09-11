export type PerformanceAsset = {
	url: string;
	type: string;
	sizeBytes: number;
};

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Rough thresholds inspired by the standard "Core Web Vitals"-style TTFB
// bands, applied here to our own synthetic server-side load measurement.
export function getLoadTimeRating(ms: number): { label: string; tone: 'green' | 'yellow' | 'red' } {
	if (ms < 1000) return { label: 'Good', tone: 'green' };
	if (ms < 3000) return { label: 'Needs Improvement', tone: 'yellow' };
	return { label: 'Slow', tone: 'red' };
}

export function getAssetTypeLabel(type: string): string {
	switch (type) {
		case 'script':
			return 'JavaScript';
		case 'style':
			return 'CSS';
		case 'image':
			return 'Image';
		default:
			return 'Other';
	}
}
