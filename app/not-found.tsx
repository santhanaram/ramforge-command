import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="loginwrap"><div className="panel login"><h1>Not found</h1><p>That page or record does not exist, or you do not have access to it.</p><Link className="btn" href="/">Back to overview</Link></div></main>
  );
}
