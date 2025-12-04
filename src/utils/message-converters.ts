import { UIMessage } from 'ai';
import { AIMessage, BaseMessage, ChatMessage, HumanMessage } from '@langchain/core/messages';

export const convertVercelMessageToLangChainMessage = (message: UIMessage) => {
    if (message.role === 'user') {
        return new HumanMessage(message.parts);
    } else if (message.role === 'assistant') {
        return new AIMessage(message.parts);
    } else {
        return new ChatMessage(message.parts, message.role);
    }
};

export const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
    if (message.getType() === 'human') {
        return { content: message.content, role: 'user' };
    } else if (message.getType() === 'ai') {
        return {
            content: message.content,
            role: 'assistant',
            parts: (message as AIMessage).tool_calls,
        };
    } else if (message.getType() === 'tool') {
        return {
            content: message.content,
            role: 'system',
        };
    } else {
        return { content: message.content, role: message.getType() };
    }
};