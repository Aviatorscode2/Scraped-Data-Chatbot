import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from 'langchain/document';
import { Review } from './loadReviews';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

export const createVectorStore = async (reviews: Review[]) => {
  const documents = reviews.map(
    (review) =>
      new Document({
        pageContent: `Reviewer: ${review.reviewer}\nRating: ${review.rating}\nDate: ${review.date}\nReview: ${review.text}`,
        metadata: { rating: review.rating, date: review.date }
      })
  );

  return await MemoryVectorStore.fromDocuments(
    documents,
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    })
  );
};