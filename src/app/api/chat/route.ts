/* eslint-disable camelcase */
import { NextRequest, NextResponse } from 'next/server';
import { createUIMessageStreamResponse } from 'ai';
import { graph } from '@/agent/graph';
import { HumanMessage, AIMessage, BaseMessage, ToolMessage, FunctionMessage } from '@langchain/core/messages';
import { toUIMessageStream } from '@ai-sdk/langchain';

// Helper to convert Vercel AI SDK messages to LangChain messages
function convertVercelMessageToLangChainMessage(message: any): BaseMessage | null {
  const { role, content, tool_calls, tool_call_id, name, parts } = message;

  // Handle new 'parts' structure from ai-elements
  let textContent = '';
  if (parts && Array.isArray(parts)) {
    textContent = parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('\n');
  } else if (content) {
    textContent = content;
  }

  switch (role) {
    case 'user':
      return new HumanMessage({ content: textContent, name: name });
    case 'assistant':
      // Vercel AI SDK assistant messages can contain tool_calls
      if (tool_calls && tool_calls.length > 0) {
        return new AIMessage({
          content: textContent,
          tool_calls: tool_calls.map((tc: any) => ({
            id: tc.id,
            name: tc.name,
            args: tc.args,
          })),
        });
      }
      return new AIMessage({ content: textContent });
    case 'tool':
      // Tool messages must have a tool_call_id
      if (!tool_call_id) {
        console.warn('Vercel AI SDK message with role "tool" is missing "tool_call_id". Skipping conversion.');
        return null;
      }
      return new ToolMessage({ content: textContent, tool_call_id: tool_call_id });
    case 'function': // LangChain uses "function" role for results of tool calls too
      // Function messages must have a name (the function that was called)
      if (!name) {
        console.warn('Vercel AI SDK message with role "function" is missing "name". Skipping conversion.');
        return null;
      }
      return new FunctionMessage({ content: textContent, name: name });
    default:
      console.warn(`Unknown message role: ${role}. Skipping conversion.`);
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model: selectedModel, webSearch } = await req.json();

    // Convert Vercel AI SDK messages to LangChain messages, filtering out nulls
    const lcMessages = messages
      .map(convertVercelMessageToLangChainMessage)
      .filter(m => m !== null) as BaseMessage[];
    console.log('messages===>', JSON.stringify(messages, null, 2));
    console.log('lcMessages===>', JSON.stringify(lcMessages, null, 2));

    // Pass additional context (model, webSearch) to the graph if needed
    // For now, the graph itself doesn't directly use these from the state
    // but this shows how you might pass them.
    const initialState = {
      messages: lcMessages,
      // You could add selectedModel or webSearch to the AgentState if the graph uses it
      // For instance: modelPreference: selectedModel, enableWebSearch: webSearch
    };

    // Create the event stream
    const eventStream = graph.streamEvents(
      initialState, // Pass the initial state to the graph
      { version: 'v2' },
    );

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(eventStream),
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}