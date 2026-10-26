import { divisionNames, workforce } from '@/data/workforce';

export function RoleSelect({ name = 'role_id', defaultValue, id }: { name?: string; defaultValue?: string; id?: string }) {
  return (
    <select className="field" name={name} id={id} defaultValue={defaultValue} required>
      {divisionNames.map((d) => (
        <optgroup key={d} label={d}>
          {workforce.filter((r) => r.division === d).map((r) => <option key={r.id} value={r.id}>{r.name} · {r.title}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
