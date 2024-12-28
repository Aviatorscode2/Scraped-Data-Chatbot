/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

export interface Review {
  reviewer: string;
  rating: number;
  text: string;
  date: string;
}

export const loadReviews = (): Review[] => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'reviews.csv');
    console.log('Loading reviews from:', filePath);

    const fileContent = readFileSync(filePath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const validatedRecords = records.map((record: any) => {
      // Convert "5 stars" format to number
      const ratingNumber = parseInt(record.Rating?.split(' ')[0]) || 0;
      
      return {
        reviewer: record.Reviewer || 'Anonymous',
        rating: ratingNumber,
        text: record.Review || '',
        date: record.Review_time || 'Unknown'
      };
    });

    console.log(`Processed ${validatedRecords.length} reviews successfully`);
    return validatedRecords;
  } catch (error) {
    console.error('Error loading reviews:', error);
    throw new Error(`Failed to load reviews: ${(error as Error).message}`);
  }
};