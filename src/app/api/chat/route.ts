/* eslint-disable camelcase */
import { NextRequest, NextResponse } from 'next/server';
import { createUIMessageStreamResponse } from 'ai';
import { graph } from '@/agent/graph';
// import { HumanMessage, AIMessage, BaseMessage, ToolMessage, FunctionMessage } from '@langchain/core/messages';
import { toUIMessageStream } from '@ai-sdk/langchain';
import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters';
import { randomUUID } from 'node:crypto';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    // const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    // const currentMessageContent = messages[messages.length - 1].content;
    // const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    // Pass additional context (model, webSearch) to the graph if needed
    // For now, the graph itself doesn't directly use these from the state
    // but this shows how you might pass them.
    const initialState = {
      messages: messages.map(convertVercelMessageToLangChainMessage),
      // You could add selectedModel or webSearch to the AgentState if the graph uses it
      // For instance: modelPreference: selectedModel, enableWebSearch: webSearch
    };

    // Resolve a thread id for LangGraph checkpointing
    const threadId = body.threadId || req.headers.get('x-thread-id') || randomUUID();

    const eventStream = graph.streamEvents(initialState, {
      version: 'v2',
      configurable: { thread_id: String(threadId) },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(eventStream),
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
