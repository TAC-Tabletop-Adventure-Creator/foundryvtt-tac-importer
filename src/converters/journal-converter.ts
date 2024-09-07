import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { NoteType } from "../types/tac-types";

type JournalEntryCreationData = ConstructorDataType<foundry.data.JournalEntryData> | (ConstructorDataType<foundry.data.JournalEntryData> & Record<string, unknown>);

export const convertTacNotesToFoundryJournal = (tacNotes: NoteType[], adventureName: string): JournalEntryCreationData => {
    // Map each NoteType to a JournalPage
    const journalPages = tacNotes.map(note => ({
        name: note.name,
        text: {
            content: `<p>${note.description}</p>`
        }
    }));

    return {
        name: adventureName,
        pages: journalPages
    };
};