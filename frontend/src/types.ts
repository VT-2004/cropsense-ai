export type Language = 'en' | 'hi';

export interface TopPrediction {
  class_name: string;
  confidence: number;
}

export interface PredictionResult {
  id?: string;
  filename: string;
  pre_check: string;
  raw_class_name: string;
  crop: string;
  condition: string;
  disease_name: string;
  cause: string;
  confidence: number;
  severity: 'Healthy' | 'Mild' | 'Moderate' | 'Severe' | string;
  severity_score: number;
  top3: TopPrediction[];
  yield_impact: number;
  risk_level: string;
  estimated_financial_loss: number;
  economic_advice?: string;
  treatment: string[];
  prevention: string;
  field_name?: string;
  image_preview?: string;
  created_at?: string;
}

export interface HistoryRecord extends PredictionResult {
  id: string;
  created_at: string;
}
