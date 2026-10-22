'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Heart, ListMusic, Plus, Music2, ArrowUpRight, X, Pencil, Trash2, Play } from 'lucide-react';
import { useMusic } from './AppShell';
import TrackCard from './TrackCard';

export default function CollectionView({ mode }) {
  const m = useMusic();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('My playlists');
  const [activeFolder, setActiveFolder] = useState('All folders');
  const [selected, setSelected] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const oldTracksRef = useRef([]);
  const isFav = mode === 'favorites';
  const tracks = isFav ? m.favorites : m.tracks;
  const playlists = m.playlists || [];
  const folders = ['All folders', ...new Set(playlists.map(p => (p.folder || 'My playlists').trim()).filter(Boolean))];
  const visiblePlaylists = activeFolder === 'All folders' ? playlists : playlists.filter(p => (p.folder || 'My playlists') === activeFolder);

  function resetForm() { setName(''); setDescription(''); setFolder('My playlists'); setSelected([]); setEditingId(null); setShowCreate(false); }
  function create(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const selectedTracks = selected.map(id => m.tracks.find(t => String(t.id) === String(id))).filter(Boolean);
    m.setPlaylists(old => [{ id: Date.now().toString(), name: name.trim(), description: description.trim(), folder: folder.trim() || 'My playlists', trackIds: selectedTracks.map(t => String(t.id)), tracks: selectedTracks, createdAt: Date.now() }, ...old]);
    m.setToast('Playlist created'); resetForm();
  }
  function openEdit(p) { oldTracksRef.current = p.tracks || []; setEditingId(p.id); setName(p.name); setDescription(p.description || ''); setFolder(p.folder || 'My playlists'); setSelected((p.trackIds || []).map(String)); setShowCreate(true); }
  function saveEdit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const selectedTracks = selected.map(id => m.tracks.find(t => String(t.id) === String(id)) || (oldTracksRef.current || []).find(t => String(t.id) === String(id))).filter(Boolean);
    m.setPlaylists(old => old.map(p => p.id === editingId ? { ...p, name: name.trim(), description: description.trim(), folder: folder.trim() || 'My playlists', trackIds: selectedTracks.map(t => String(t.id)), tracks: selectedTracks } : p));
    m.setToast('Playlist updated'); resetForm();
  }
  function toggleTrack(id, checked) { const key = String(id); setSelected(old => checked ? [...new Set([...old, key])] : old.filter(x => x !== key)); }

  return <section className="page-wrap collection-page">
    <div className="eyebrow">{isFav ? <Heart size={14}/> : <ListMusic size={14}/>} YOUR PERSONAL COLLECTION</div>
    <div className="collection-title-row"><div><h1 className="page-title">{isFav ? 'The ones you' : 'Your own'} <span className="gradient-text">{isFav ? 'love.' : 'sound.'}</span></h1><p className="page-subtitle">{isFav ? 'All the tracks that made you hit that heart.' : 'Create playlists, add songs, and play your collections.'}</p></div>{!isFav && <button className="button-primary" onClick={() => { resetForm(); setShowCreate(true); }}><Plus size={17}/> New playlist</button>}</div>
    {isFav ? <><div className="collection-meta"><span>{tracks.length} SAVED TRACKS</span><span>COLLECTED WITH LOVE ♥</span></div>{tracks.length ? <div className="track-grid">{tracks.map((t, i) => <TrackCard key={t.id} track={t} list={tracks} index={i}/>)}</div> : <div className="empty-state large-empty"><div className="empty-icon"><Heart size={25}/></div><b>Your favorites live here.</b><p>Tap the heart on any track to keep it close.</p><Link href="/explore" className="button-primary">Find your favorites <ArrowUpRight size={16}/></Link></div>}</> : <>
      {playlists.length === 0 ? <div className="empty-state large-empty"><div className="empty-icon"><ListMusic size={25}/></div><b>Your playlists start here.</b><p>Create a playlist, choose songs, and play them together whenever you want.</p><button className="button-primary" onClick={() => setShowCreate(true)}><Plus size={16}/> Create your first playlist</button></div> : <><div className="playlist-folder-filter"><span>Playlist folders</span><div>{folders.map(folderName => <button type="button" key={folderName} className={activeFolder===folderName?'folder-filter-active':''} onClick={()=>setActiveFolder(folderName)}>{folderName}</button>)}</div></div><div className="playlist-grid">{visiblePlaylists.map(p => {
        const ids = (p.trackIds || []).map(String);
        const savedTracks = p.tracks || [];
        const pts = ids.map(id => m.tracks.find(t => String(t.id) === id) || savedTracks.find(t => String(t.id) === id)).filter(Boolean);
        return <article className="playlist-card" key={p.id}><div className="playlist-cover"><div className="cover-tile"><Music2 size={28}/></div><div className="cover-tile tile-two"><Heart size={22}/></div><div className="cover-tile tile-three"><ListMusic size={24}/></div><div className="cover-tile tile-four">✳</div></div><div className="playlist-info"><span className="playlist-folder-tag">{p.folder || 'My playlists'}</span><b>{p.name}</b><p>{p.description || 'A collection of your moments.'}</p><span>{pts.length} TRACK{pts.length === 1 ? '' : 'S'}</span><div className="playlist-manage-actions"><button type="button" className="button-secondary" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>{expandedId === p.id ? 'Hide tracks' : 'View tracks'}</button><button type="button" className="button-secondary" onClick={() => openEdit(p)}><Pencil size={14}/> Manage songs</button><button type="button" className="button-primary" onClick={() => { if (pts.length) m.playTrack(pts[0], pts); else m.setToast('Manage songs to add tracks to this playlist'); }}><Play size={14}/> Play</button></div>{expandedId === p.id && <div className="playlist-track-list">{pts.length ? pts.map((track, trackIndex) => <div className="playlist-track-row" key={track.id}><img src={track.artwork || '/cover.svg'} alt=""/><span><b>{track.title}</b><small>{track.artist}</small></span><button type="button" className="privacy-file-action" aria-label={`Play ${track.title}`} onClick={() => m.playTrack(track, pts)}><Play size={15}/></button></div>) : <p className="playlist-no-tracks">No tracks saved in this playlist yet. Choose Manage songs to add music.</p>}</div>}</div><button className="playlist-delete" onClick={() => { if (confirm(`Delete playlist “${p.name}”?`)) m.setPlaylists(old => old.filter(x => x.id !== p.id)); }} aria-label="Delete playlist" title="Delete playlist"><Trash2 size={15}/></button></article>;
      })}</div>{visiblePlaylists.length===0&&<div className="empty-state"><b>This folder is empty.</b><p>Create a playlist or choose another folder.</p></div>}</>}
      <div className="section-block playlist-library"><div className="section-heading"><div><h2>Find songs to add</h2><p>Choose tracks below, then use Manage songs on a playlist.</p></div><Link className="text-link" href="/explore">Explore music <ArrowUpRight size={15}/></Link></div>{m.tracks.length ? <div className="track-grid">{m.tracks.slice(0, 8).map((t, i) => <TrackCard key={t.id} track={t} list={m.tracks} index={i}/>)}</div> : <div className="empty-state"><b>No tracks loaded yet</b><p>Explore music first, then return here to add tracks to your playlists.</p><Link href="/explore" className="button-primary">Explore music</Link></div>}</div>
    </>}
    {showCreate && <div className="modal-backdrop" onClick={resetForm}><form className="create-modal" onClick={e => e.stopPropagation()} onSubmit={editingId ? saveEdit : create}><button type="button" className="modal-close" onClick={resetForm}><X size={19}/></button><div className="eyebrow"><ListMusic size={14}/> {editingId ? 'EDIT PLAYLIST' : 'NEW PLAYLIST'}</div><h2>{editingId ? 'Manage your' : 'Make it'} <span className="gradient-text">{editingId ? 'songs.' : 'a mood.'}</span></h2><label>Playlist name<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sunday slowdowns" required maxLength={48}/></label><label>Playlist folder<input value={folder} onChange={e=>setFolder(e.target.value)} placeholder="e.g. Workout, Study, Favorites" maxLength={36}/></label><label>Description <span className="optional">(optional)</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this playlist feel like?" rows={2} maxLength={160}/></label><div className="pick-tracks"><b>Select songs <span>({selected.length} selected)</span></b>{m.tracks.length ? m.tracks.map(t => <label className="pick-track" key={t.id}><input type="checkbox" checked={selected.includes(String(t.id))} onChange={e => toggleTrack(t.id, e.target.checked)}/><img src={t.artwork || '/cover.svg'} alt=""/><span>{t.title}<small>{t.artist}</small></span></label>) : <p className="playlist-no-tracks">No songs are loaded yet. Visit <Link href="/explore" onClick={resetForm}>Explore</Link>, play or load songs, then return to select them.</p>}</div><button className="button-primary create-submit" type="submit">{editingId ? 'Save playlist' : <><Plus size={16}/> Create playlist</>}</button></form></div>}
  </section>;
}
