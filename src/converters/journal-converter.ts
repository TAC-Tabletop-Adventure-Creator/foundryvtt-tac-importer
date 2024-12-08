import { ConstructorDataType } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";

type JournalEntryCreationData = ConstructorDataType<foundry.data.JournalEntryData> | (ConstructorDataType<foundry.data.JournalEntryData> & Record<string, unknown>);

export const convertTacNotesToFoundryJournal = (tacAdventure:any): JournalEntryCreationData => {
    // Map each NoteType to a JournalPage
    const journalPages = tacAdventure.notes.map((note: any) => ({
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