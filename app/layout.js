import './globals.css';
import { AppShell } from '../components/AppShell';
export const metadata = { title: 'Ellalody — Find your next favorite', description: 'Discover music, save favorites, and make every moment sound better.' };
export default function RootLayout({ children }) { return <html lang="en"><body><AppShell>{children}</AppShell></body></html>; }
