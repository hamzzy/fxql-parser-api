export interface FXQLEntry {
  EntryId?: number;
  SourceCurrency: string;
  DestinationCurrency: string;
  SellPrice: number | null;
  BuyPrice: number | null;
  CapAmount: number | null;
}

export interface FXQLResponse {
  message: string;
  code: string;
  data: FXQLEntry[];
}
