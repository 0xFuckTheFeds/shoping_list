import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  coinName: string;
  description: string;
  author: string;
  publishDate: string;
  content: string;
  fileName: string;
  imageUrl?: string;
}

const ArticleSchema = new Schema<IArticle>({
  title: { type: String, required: true },
  coinName: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: true },
  publishDate: { type: String, required: true },
  content: { type: String, required: true },
  fileName: { type: String, required: true },
  imageUrl: { type: String }
}, { timestamps: true });

export default mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);