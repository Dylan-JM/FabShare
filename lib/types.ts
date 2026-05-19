export interface FabAsset {
  name: string;
  category: string;
  thumbnail: string;
  url: string;
  price: string;
  _index?: number;
  _needsEnrich?: boolean;
}
