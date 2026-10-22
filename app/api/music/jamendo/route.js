import { NextResponse } from 'next/server';
export async function GET(request) {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) return NextResponse.json({ tracks: [], error: 'Jamendo is optional. Add JAMENDO_CLIENT_ID to .env.local to enable it.' }, { status: 503 });
  const { searchParams } = new URL(request.url); const query = (searchParams.get('q') || 'indie').trim().slice(0, 100);
  try {
    const url = new URL('https://api.jamendo.com/v3.0/tracks/');
    Object.entries({ client_id: clientId, format: 'json', limit: '30', namesearch: query, audioformat: 'mp32', include: 'musicinfo', order: 'popularity_total' }).forEach(([k,v])=>url.searchParams.set(k,v));
    const res = await fetch(url, { next: { revalidate: 180 } }); if (!res.ok) throw new Error('Jamendo request failed');
    const data = await res.json(); const tracks = (data.results || []).filter(x=>x.audio).map(x=>({id:`jamendo-${x.id}`,provider:'Jamendo',providerId:String(x.id),title:x.name,artist:x.artist_name,album:x.album_name||'Single',artwork:x.album_image||x.image||'',previewUrl:x.audio,duration:(x.duration||30)*1000,genre:x.musicinfo?.tags?.genres?.[0]||'Independent',url:x.shareurl||null}));
    return NextResponse.json({tracks,provider:'Jamendo',count:tracks.length});
  } catch { return NextResponse.json({tracks:[],error:'Jamendo is temporarily unavailable.'},{status:502}); }
}
