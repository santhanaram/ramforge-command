// Shows the success or error message passed back by a server action in the URL.
export function Notice({ ok, error }: { ok?: string | string[]; error?: string | string[] }) {
  const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const e = one(error), o = one(ok);
  if (e) return <div className="alert bad" role="alert">{e}</div>;
  if (o) return <div className="alert good" role="status">{o}</div>;
  return null;
}
