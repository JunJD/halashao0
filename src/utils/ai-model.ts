import { ChatOpenAI } from '@langchain/openai';

const DEFAULT_MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // 默认型号，可用 OPENAI_MODEL 覆盖
const { OPENAI_BASE_URL } = process.env;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? process.env.DASHSCOPE_API_KEY ?? '';

export function createChatModel() {
    return new ChatOpenAI({
        model: DEFAULT_MODEL_NAME,
        temperature: 0.5,
        openAIApiKey: OPENAI_API_KEY,
        configuration: OPENAI_BASE_URL ? { baseURL: OPENAI_BASE_URL } : undefined,
    });
}
