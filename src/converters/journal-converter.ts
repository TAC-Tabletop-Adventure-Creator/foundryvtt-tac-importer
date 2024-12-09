import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { TacExport, TacNote } from "../types/tac-types";

type JournalEntryCreationData = ConstructorDataType<foundry.data.JournalEntryData> | (ConstructorDataType<foundry.data.JournalEntryData> & Record<string, unknown>);

export const convertTacNotesToFoundryJournal = (tacAdventure: TacExport): JournalEntryCreationData => {
    // Map each NoteType to a JournalPage
    const journalPages = tacAdventure.notes.map((note: TacNote) => ({
        name: note.name,
        text: {
            content: `<p>${note.description}</p>`
        }
    }));

    return {
        name: tacAdventure.adventure.title,
        pages: journalPages
    };
};