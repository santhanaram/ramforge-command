// Portrait manifest. Add an entry only for an image you own or have a licence to use.
// Put the file in public/portraits/ named by role ID (for example RF-001.webp), then add:
//   'RF-001': { src: '/portraits/RF-001.webp', alt: 'Stylised 3D portrait of Atlas Archer ...', credit: 'Your name or studio', licence: 'Owned by RAM' },
// Roles without an entry show an initials placeholder, clearly labelled as a placeholder.
export type Portrait = { src: string; alt: string; credit: string; licence: string };

export const portraits: Record<string, Portrait> = {};
