/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { loadReviews, Review } from '@/utils/loadReviews';
import { createVectorStore } from '@/utils/createStore';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();


let reviews: Review[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vectorStore: any = null;

// Load reviews immediately
try {
  reviews = loadReviews();
  console.log(`Successfully loaded ${reviews.length} reviews`);
} catch (error) {
  console.error('Failed to load reviews:', error);
}

export async function POST(req: Request) {
  try {
    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        response: "I apologize, but I'm having trouble accessing the review data. Please try again later."
      });
    }

    const { message, history } = await req.json();

    // Initialize vector store if needed
    if (!vectorStore) {
      vectorStore = await createVectorStore(reviews);
    }

    // Search for relevant reviews
    const searchResults = await vectorStore.similaritySearch(message, 3);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const relevantContext = searchResults.map((doc: { pageContent: any; }) => doc.pageContent).join('\n\n');

    const chat = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are a helpful assistant that answers questions about a business based on its Google Maps reviews. 
        Here are some relevant reviews to help answer the question:

        ${relevantContext}

        Base your answers only on the information contained in these reviews. Be specific and cite details from 
        the reviews when possible. If you cannot find relevant information in the reviews, please say so.`
      ),
      new MessagesPlaceholder("history"),
      HumanMessagePromptTemplate.fromTemplate("{input}")
    ]);

    const chain = new ConversationChain({
      memory: new BufferMemory({ 
        returnMessages: true,
        memoryKey: "history"
      }),
      prompt: prompt,
      llm: chat,
    });

    const response = await chain.call({
      input: message
    });

    return NextResponse.json({ response: response.response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request: ' + (error as Error).message },
      { status: 500 }
    );
  }
}