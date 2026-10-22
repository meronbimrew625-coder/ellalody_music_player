'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AudioLines, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

async function derivePassword(password, saltHex) {
  const encoder = new TextEncoder();
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{1,2}/g).map((x) => parseInt(x, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    material,
    256
  );
  return {
    hash: Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join(''),
    salt: Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join(''),
  };
}

export default function AuthForm({ mode = 'signin' }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      const key = 'ellalody:demo-users';
      const users = JSON.parse(localStorage.getItem(key) || '[]');
      const normalizedEmail = email.trim().toLowerCase();
      if (isSignup) {
        if (name.trim().length < 2) {
          setMessage('Please enter your name.');
          return;
        }
        if (password.length < 8) {
          setMessage('Use a password with at least 8 characters.');
          return;
        }
        if (users.some((user) => user.email === normalizedEmail)) {
          setMessage('An account with this email already exists in this browser.');
          return;
        }
        const { hash, salt } = await derivePassword(password);
        users.push({ name: name.trim(), email: normalizedEmail, hash, salt });
        localStorage.setItem(key, JSON.stringify(users));
        localStorage.setItem('ellalody:demo-session', JSON.stringify({ name: name.trim(), email: normalizedEmail }));
        router.push('/');
      } else {
        const user = users.find((entry) => entry.email === normalizedEmail);
        if (!user) {
          setMessage('No local demo account found for this email. Create an account first.');
          return;
        }
        const { hash } = await derivePassword(password, user.salt);
        if (hash !== user.hash) {
          setMessage('The email or password is incorrect.');
          return;
        }
        localStorage.setItem('ellalody:demo-session', JSON.stringify({ name: user.name, email: user.email }));
        router.push('/');
      }
    } catch {
      setMessage('Could not complete this action in browser storage. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <Link href="/" className="auth-brand"><span className="brand-mark"><AudioLines size={25} /></span><span>ella<span className="brand-light">lody</span></span></Link>
        <div className="eyebrow"><LockKeyhole size={14} /> YOUR PERSONAL MUSIC SPACE</div>
        <h1 className="page-title">{isSignup ? 'Create your ' : 'Welcome ' }<span className="gradient-text">{isSignup ? 'account.' : 'back.'}</span></h1>
        <p className="page-subtitle">{isSignup ? 'Save your music space on this browser.' : 'Sign in to your Ellalody demo account on this browser.'}</p>
        <div className="auth-demo-notice">Frontend demo only: this account is stored in this browser. It is not server authentication and will not sync across devices.</div>
        <form className="auth-form" onSubmit={submit}>
          {isSignup && <label><span><UserRound size={16} /> Name</span><input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required minLength={2} /></label>}
          <label><span><Mail size={16} /> Email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <label><span><LockKeyhole size={16} /> Password</span><div className="password-input"><input type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isSignup ? 'At least 8 characters' : 'Your password'} required minLength={isSignup ? 8 : 1} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          {message && <p className="auth-message" role="alert">{message}</p>}
          <button className="button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to Ellalody?'} <Link href={isSignup ? '/signin' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></p>
        <Link href="/" className="auth-back">← Back to Ellalody</Link>
      </div>
    </section>
  );
}
