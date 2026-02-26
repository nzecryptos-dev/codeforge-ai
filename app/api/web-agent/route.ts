import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, projectId, userId, conversationId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, userId' },
        { status: 400 }
      );
    }

    // Create or get conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
    } else {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          projectId,
          title: message.substring(0, 50),
        },
      });
    }

    // Store user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Fetch conversation history for context
    const previousMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: -10, // Last 10 messages for context
    });

    // Build system prompt
    const systemPrompt = `You are an expert AI coding assistant specialized in code generation and task automation. 
You help developers write clean, efficient code and complete programming tasks. 
When asked to generate code, provide complete, production-ready solutions with explanations.
When storing code snippets, always mention the language and key features.`;

    // Prepare messages for OpenAI
    const openaiMessages = previousMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...openaiMessages,
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const assistantContent =
      response.choices[0].message.content || 'Unable to generate response';

    // Store assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantContent,
      },
    });

    // Extract code snippets if present
    const codeBlockRegex = /\`\`\`(\w+)?\n([\s\S]*?)\`\`\`/g;
    let codeMatch;

    while ((codeMatch = codeBlockRegex.exec(assistantContent)) !== null) {
      const language = codeMatch[1] || 'plaintext';
      const code = codeMatch[2];

      await prisma.codeSnippet.create({
        data: {
          conversationId: conversation.id,
          projectId,
          language,
          code,
          title: `Generated ${language} snippet`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
      },
      userMessage: {
        id: userMessage.id,
        role: 'user',
        content: message,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantContent,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('Web Agent Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (!conversationId && !userId) {
      return NextResponse.json(
        { error: 'Missing conversationId or userId' },
        { status: 400 }
      );
    }

    let messages;

    if (conversationId) {
      messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      // Get all conversations for user
      const conversations = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      return NextResponse.json({ conversations });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}