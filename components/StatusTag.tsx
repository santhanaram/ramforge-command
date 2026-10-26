const tone: Record<string, string> = {
  draft: '', queued: '', running: 'info', awaiting_review: 'approval', needs_changes: 'warn', approved: 'good', released: 'done',
  failed: 'bad', cancelled: '', succeeded: 'good', refused: 'bad', pending: 'approval', rejected: 'bad', restricted: 'warn',
  pass: 'good', fail: 'bad', warn: 'warn', live: 'good', simulated: 'sim',
};

export function StatusTag({ status, label }: { status: string; label?: string }) {
  return <span className={`tag ${tone[status] ?? ''}`}>{label ?? status.replace(/_/g, ' ')}</span>;
}
