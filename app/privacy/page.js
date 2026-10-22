"use client";

import { useEffect, useRef, useState } from "react";
import { LockKeyhole, ShieldCheck, Upload, FileAudio, FileVideo, File, Download, Trash2, LogOut, Eye, X } from "lucide-react";

const META_KEY = "ellalody:privacy-meta";
const DB_NAME = "ellalody-private-files";
const STORE = "files";

function openDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error("Browser storage is unavailable")); return; }
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function dbRequest(mode, action) {
  return openDb().then(db => new Promise((resolve, reject) => {
    let result;
    const tx = db.transaction(STORE, mode);
    const req = action(tx.objectStore(STORE));
    req.onsuccess = () => { result = req.result; };
    req.onerror = () => reject(req.error || new Error("Database request failed"));
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Database transaction failed")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("Database transaction was cancelled")); };
  }));
}
const getFiles = () => dbRequest("readonly", store => store.getAll());
const saveFile = file => dbRequest("readwrite", store => store.put(file));
const removeFile = id => dbRequest("readwrite", store => store.delete(id));
function toBase64(bytes) {
  const data = new Uint8Array(bytes);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < data.length; i += chunkSize) {
    binary += String.fromCharCode(...data.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 180000, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function passwordHash(password, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 180000, hash: "SHA-256" }, material, 256);
  return toBase64(bits);
}

export default function PrivacyPage() {
  const [meta, setMeta] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try { setMeta(JSON.parse(localStorage.getItem(META_KEY) || "null")); } catch { setMeta(null); }
  }, []);

  async function addFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    if (!meta || !passwordForEncryption.current) { setMessage("Please lock and unlock the folder again before adding files."); if (inputRef.current) inputRef.current.value = ""; return; }
    setBusy(true); setMessage("");
    try {
      if (!globalThis.crypto?.subtle) throw new Error("secure-crypto-unavailable");
      const salt = fromBase64(meta.salt);
      const key = await deriveKey(passwordForEncryption.current || "", salt);
      for (const file of selected) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, await file.arrayBuffer());
        await saveFile({ id: globalThis.crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, type: file.type || "application/octet-stream", size: file.size, addedAt: Date.now(), iv: iv.buffer.slice(0), data: encrypted });
      }
      setFiles(await getFiles()); setMessage(`${selected.length} file(s) added to your Privacy Folder.`);
    } catch (error) {
      console.error("Privacy Folder upload failed:", error);
      const detail = error?.name === "QuotaExceededError" || error?.name === "UnknownError"
        ? "Browser storage is full. Try a smaller file or remove files you no longer need."
        : !globalThis.crypto?.subtle
          ? "Secure encryption is unavailable. Open Ellalody on localhost or HTTPS and try again."
          : "The file could not be saved. Try a smaller audio/video file and make sure your browser has enough storage space.";
      setMessage(detail);
    }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }
  const passwordForEncryption = useRef("");
  async function unlockWithKey(event) {
    event.preventDefault(); setMessage("");
    if (password.length < 4) { setMessage("Use a password with at least 4 characters."); return; }
    setBusy(true);
    try {
      if (!meta) {
        if (password !== confirm) { setMessage("The passwords do not match."); setBusy(false); return; }
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const nextMeta = { salt: toBase64(salt), hash: await passwordHash(password, salt) };
        localStorage.setItem(META_KEY, JSON.stringify(nextMeta)); setMeta(nextMeta); passwordForEncryption.current = password;
        setUnlocked(true); setFiles(await getFiles()); setPassword(""); setConfirm("");
      } else {
        const salt = fromBase64(meta.salt);
        if (await passwordHash(password, salt) !== meta.hash) { setMessage("Incorrect password. Please try again."); setBusy(false); return; }
        passwordForEncryption.current = password; setUnlocked(true); setFiles(await getFiles()); setPassword(""); setConfirm("");
      }
    } catch (error) { console.error("Privacy Folder unlock failed:", error); setMessage(error?.message === "Browser storage is unavailable" ? "This browser does not support private file storage. Try the latest Chrome or Edge." : "Could not open Privacy Folder. Refresh the page and try again."); }
    finally { setBusy(false); }
  }
  async function decryptFile(file) {
    const key = await deriveKey(passwordForEncryption.current, fromBase64(meta.salt));
    const iv = typeof file.iv === "string" ? fromBase64(file.iv) : new Uint8Array(file.iv);
    const encryptedData = typeof file.data === "string" ? fromBase64(file.data) : file.data;
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData);
    return new Blob([plain], { type: file.type || "application/octet-stream" });
  }
  async function downloadFile(file) {
    let url;
    try {
      const blob = await decryptFile(file);
      url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      setMessage(`Downloaded ${file.name}.`);
    } catch { setMessage("Could not decrypt this file. Lock and unlock the folder, then try again."); }
    finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  async function previewFile(file) {
    try {
      if (preview?.url) URL.revokeObjectURL(preview.url);
      const blob = await decryptFile(file);
      const url = URL.createObjectURL(blob);
      setPreview({ file, url });
      setMessage("");
    } catch (error) {
      console.error("Privacy Folder preview failed:", error);
      setMessage("Could not play this file. Try MP4 (H.264/AAC) video or MP3 audio, then try again.");
    }
  }
  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }
  function leaveFolder() { closePreview(); passwordForEncryption.current = ""; setUnlocked(false); setFiles([]); setPassword(""); setConfirm(""); setMessage(""); }
  async function deleteFile(id) { try { await removeFile(id); setFiles(await getFiles()); setMessage("File deleted from your Privacy Folder."); } catch { setMessage("Could not delete this file. Please try again."); } }
  const formatSize = n => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;

  if (!unlocked) return <div className="page-wrap privacy-page"><div className="privacy-gate"><div className="privacy-symbol"><LockKeyhole size={30}/></div><span className="eyebrow"><span className="eyebrow-dot"/> PRIVATE SPACE</span><h1 className="page-title">Privacy Folder</h1><p className="page-subtitle">Your personal files, protected by your password.</p><form className="privacy-password-form" onSubmit={unlockWithKey}><label htmlFor="privacy-password">{meta ? "Enter your password" : "Create a password"}</label><input id="privacy-password" className="password-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={meta ? "Enter password to continue" : "Create a password"} autoComplete="current-password" required minLength={4}/>{!meta&&<><label htmlFor="privacy-confirm">Confirm password</label><input id="privacy-confirm" className="password-input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Enter password again" autoComplete="new-password" required minLength={4}/></>}<button className="button-primary privacy-unlock-button" type="submit" disabled={busy}><LockKeyhole size={17}/>{busy ? "Please wait…" : meta ? "Unlock Privacy Folder" : "Create password & continue"}</button>{message&&<p className="privacy-message" role="alert">{message}</p>}</form><div className="privacy-hint"><ShieldCheck size={16}/><span>{meta ? "Files stay hidden until you unlock this folder." : "You will need this password every time you return."}</span></div></div></div>;

  return <div className="page-wrap privacy-page"><div className="privacy-heading-row"><div><span className="eyebrow"><span className="eyebrow-dot"/> UNLOCKED PRIVATE SPACE</span><h1 className="page-title">Privacy Folder</h1><p className="page-subtitle">Your audio, video, and other files in one private place.</p></div><button className="button-secondary privacy-leave" onClick={leaveFolder}><LogOut size={16}/> Lock folder</button></div><section className="privacy-files-panel"><div className="privacy-files-toolbar"><div><h2>Your files</h2><p>{files.length} saved {files.length===1?"file":"files"}</p></div><button type="button" className="button-primary" onClick={()=>inputRef.current?.click()} disabled={busy}><Upload size={17}/>{busy ? "Saving files…" : "Add files"}</button><input ref={inputRef} type="file" multiple accept="audio/*,video/*,image/*,.pdf,.txt,.doc,.docx" hidden onChange={addFiles}/></div><p className="privacy-supported">Select audio, video, images, or documents from your device.</p>{message&&<p className="privacy-message" role="status">{message}</p>}{files.length===0?<div className="privacy-empty"><div className="privacy-empty-icon"><LockKeyhole size={25}/></div><b>Your folder is empty</b><p>Add files to keep encrypted copies in this browser.</p><button type="button" className="button-secondary" onClick={()=>inputRef.current?.click()} disabled={busy}><Upload size={16}/> Choose files</button></div>:<div className="privacy-file-list">{files.map(file=><div className="privacy-file-row" key={file.id}><div className="privacy-file-icon">{file.type.startsWith("audio/")?<FileAudio size={20}/>:file.type.startsWith("video/")?<FileVideo size={20}/>:<File size={20}/>}</div><div className="privacy-file-name"><b title={file.name}>{file.name}</b><span>{formatSize(file.size)} · Encrypted copy</span></div><button className="privacy-file-action" title={file.type.startsWith("video/") ? "Watch video here" : file.type.startsWith("audio/") ? "Play audio here" : "Preview file"} aria-label={`Preview ${file.name}`} onClick={()=>previewFile(file)}><Eye size={17}/></button><button className="privacy-file-action" title="Download file" aria-label={`Download ${file.name}`} onClick={()=>downloadFile(file)}><Download size={17}/></button><button className="privacy-file-action privacy-delete" title="Delete file" aria-label={`Delete ${file.name}`} onClick={()=>deleteFile(file.id)}><Trash2 size={17}/></button></div>)}</div>}</section><p className="privacy-security-note"><ShieldCheck size={15}/> File contents are encrypted in this browser. Keep your password safe; this demo does not sync across devices.</p>{preview && <div className="privacy-preview-backdrop" role="dialog" aria-modal="true" aria-label={`Preview ${preview.file.name}`} onClick={closePreview}><section className="privacy-preview-dialog" onClick={event => event.stopPropagation()}><header className="privacy-preview-header"><div><b>{preview.file.name}</b><span>{preview.file.type.startsWith("video/") ? "Video preview" : preview.file.type.startsWith("audio/") ? "Audio preview" : "File preview"}</span></div><button type="button" className="privacy-file-action" onClick={closePreview} aria-label="Close preview"><X size={18}/></button></header>{preview.file.type.startsWith("video/") ? <video className="privacy-media-preview" src={preview.url} controls autoPlay playsInline preload="metadata">Your browser cannot play this video format.</video> : preview.file.type.startsWith("audio/") ? <div className="privacy-audio-preview"><FileAudio size={38}/><audio src={preview.url} controls autoPlay /></div> : preview.file.type.startsWith("image/") ? <img className="privacy-image-preview" src={preview.url} alt={preview.file.name}/> : <div className="privacy-preview-fallback"><p>Preview is not available for this file type.</p><button type="button" className="button-secondary" onClick={() => downloadFile(preview.file)}><Download size={16}/> Download file</button></div>}<p className="privacy-preview-note">This preview plays from the decrypted in-memory copy. You do not need to download the video.</p></section></div>}</div>;
}
