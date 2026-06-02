export type TipStatus = 'todo' | 'done' | 'trash';

export type Tip = {
  id: string;
  title?: string;
  content?: string;
  imageUri?: string;
  imagePath?: string;
  sourceUrl?: string;
  memo?: string;
  category?: string;
  status: TipStatus;
  scheduledDate?: string;
  priority: number;
  afterMemo?: string;
  isInMyTips?: boolean;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TipDraft = Omit<Tip, 'id' | 'createdAt' | 'updatedAt'>;
