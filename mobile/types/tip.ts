export type TipStatus = 'todo' | 'doing' | 'done' | 'trash';

export type Tip = {
  id: string;
  title?: string;
  content?: string;
  imageUri?: string;
  sourceUrl?: string;
  memo?: string;
  category?: string;
  status: TipStatus;
  scheduledDate?: string;
  priority: number;
  afterMemo?: string;
  isInMyTips?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TipDraft = Omit<Tip, 'id' | 'createdAt' | 'updatedAt'>;
