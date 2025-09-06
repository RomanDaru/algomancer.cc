// Utility to build a Tabletop Simulator DeckCustom JSON from Algomancy deck data
// Minimal schema mirrored from a working TTS Saved Object

export interface TTSCardTransform {
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

export interface TTSContainedObject {
  CardID: number;
  Name: 'Card';
  Nickname: string;
  Transform: TTSCardTransform;
}

export interface TTSCustomDeckEntry {
  FaceURL: string;
  BackURL: string;
  NumWidth: number;
  NumHeight: number;
  BackIsHidden: boolean;
  UniqueBack?: boolean;
}

export interface TTSDeckObjectState {
  Name: 'DeckCustom';
  ContainedObjects: TTSContainedObject[];
  DeckIDs: number[];
  CustomDeck: Record<string, TTSCustomDeckEntry>;
  Transform: TTSCardTransform;
  Nickname?: string;
}

export interface TTSDeckRoot {
  ObjectStates: TTSDeckObjectState[];
}

export interface ExportCardInput {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
}

const DEFAULT_TRANSFORM: TTSCardTransform = {
  posX: 0,
  posY: 1,
  posZ: 0,
  rotX: 0,
  rotY: 180,
  rotZ: 180,
  // Use a much smaller default card size than the sample deck
  // 1.0 is standard TTS size; adjust if needed
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
};

function sanitizeFilename(name: string): string {
  // Keep letters, numbers, spaces, dashes, underscores; replace others with '_'
  const cleaned = name.replace(/[^\w\-\s\.]/g, '_').trim();
  // Collapse whitespace to single space then replace spaces with underscores
  return cleaned.replace(/\s+/g, '_') || 'deck';
}

// Build a TTS Deck JSON using one CustomDeck entry per physical card copy
export function buildTTSDeck(
  deckName: string,
  cards: ExportCardInput[],
  backUrl: string
): { json: TTSDeckRoot; suggestedFilename: string } {
  const contained: TTSContainedObject[] = [];
  const deckIds: number[] = [];
  const customDeck: Record<string, TTSCustomDeckEntry> = {};

  let key = 0; // CustomDeck keys are 1-based in TTS

  for (const c of cards) {
    const qty = Math.max(0, Math.floor(c.quantity || 0));
    for (let i = 0; i < qty; i++) {
      key += 1;
      const keyStr = String(key);

      // In TTS, CardID = deckKey * 100 + indexWithinSheet (0 for 1x1)
      const cardId = key * 100;

      customDeck[keyStr] = {
        FaceURL: c.imageUrl,
        BackURL: backUrl,
        NumWidth: 1,
        NumHeight: 1,
        BackIsHidden: true,
      };

      contained.push({
        CardID: cardId,
        Name: 'Card',
        Nickname: c.name,
        Transform: { ...DEFAULT_TRANSFORM },
      });

      deckIds.push(cardId);
    }
  }

  const objectState: TTSDeckObjectState = {
    Name: 'DeckCustom',
    ContainedObjects: contained,
    DeckIDs: deckIds,
    CustomDeck: customDeck,
    Transform: { ...DEFAULT_TRANSFORM },
    Nickname: deckName,
  };

  return {
    json: { ObjectStates: [objectState] },
    suggestedFilename: sanitizeFilename(deckName) + '.json',
  };
}
