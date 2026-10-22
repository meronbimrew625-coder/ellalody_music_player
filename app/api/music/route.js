import { NextResponse } from 'next/server';
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const term = (searchParams.get('q') || 'indie pop').trim().slice(0, 100);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 24), 1), 50);
  if (!term) return NextResponse.json({ tracks: [] });
  try {
    const url = new URL('https://itunes.apple.com/search');
    url.searchParams.set('term', term); url.searchParams.set('entity', 'song'); url.searchParams.set('limit', String(limit)); url.searchParams.set('media', 'music');
    const response = await fetch(url, { next: { revalidate: 300 }, headers: { 'User-Agent': 'EllalodyMusic/1.0' } });
    if (!response.ok) throw new Error(`Music provider returned ${response.status}`);
    const data = await response.json();
    const tracks = (data.results || []).filter(x => x.previewUrl && x.trackId).map(x => ({
      id: `apple-${x.trackId}`, provider: 'Apple/iTunes', providerId: String(x.trackId), title: x.trackName || 'Untitled', artist: x.artistName || 'Unknown artist', album: x.collectionName || 'Single', artwork: (x.artworkUrl100 || '').replace('100x100bb', '600x600bb'), previewUrl: x.previewUrl, duration: x.trackTimeMillis || 30000, genre: x.primaryGenreName || 'Music', url: x.trackViewUrl || null, releaseDate: x.releaseDate || null
    }));
    return NextResponse.json({ tracks, provider: 'Apple/iTunes', count: tracks.length });
  } catch (error) {
    return NextResponse.json({ tracks: [], error: 'Music search is temporarily unavailable. Please try again.' }, { status: 502 });
  }
}
