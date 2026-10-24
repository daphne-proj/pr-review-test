import type { SupportNote } from './support-note';

export class SupportNoteRepository {
  private readonly tenants = new Map<string, Map<string, SupportNote>>();

  insert(note: SupportNote): void {
    const notes =
      this.tenants.get(note.tenantId) ?? new Map<string, SupportNote>();

    if (notes.has(note.id)) {
      throw new Error('note already exists');
    }

    notes.set(note.id, { ...note });
    this.tenants.set(note.tenantId, notes);
  }

  find(tenantId: string, id: string): SupportNote | undefined {
    const note = this.tenants.get(tenantId)?.get(id);
    return note === undefined ? undefined : { ...note };
  }

  all(tenantId: string): SupportNote[] {
    const notes = this.tenants.get(tenantId);
    return notes === undefined
      ? []
      : [...notes.values()].map((note) => ({ ...note }));
  }

  replace(note: SupportNote, expectedRevision: number): void {
    const notes = this.tenants.get(note.tenantId);
    const current = notes?.get(note.id);

    if (notes === undefined || current === undefined) {
      throw new Error('note not found');
    }

    if (
      current.revision !== expectedRevision ||
      note.revision !== expectedRevision + 1
    ) {
      throw new Error('note revision conflict');
    }

    notes.set(note.id, { ...note });
  }
}
