'use client';
import { Layout } from 'antd'; // Import Layout to use Sider
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useState, useEffect, useRef } from 'react'; // Import useEffect, useRef
import { useChat } from '@ai-sdk/react';
import { CopyIcon, GlobeIcon, RefreshCcwIcon, Sparkles } from 'lucide-react'; // Import Sparkles for header
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';

const { Sider } = Layout; // Destructure Sider
const CHAT_WIDTH = 320; // Define chat width

const models = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat({
    api: '/api/chat', // Ensure API path is set
  });

  const conversationEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

  // Auto-scroll to bottom
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Detect Design JSON in messages and apply to canvas
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant' && status !== 'in_progress') {
      // Check status for 'finished' state
      const textPart = lastMsg.parts.find((part) => part.type === 'text');
      if (textPart && typeof textPart.text === 'string') {
        const match = textPart.text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          try {
            const designData = JSON.parse(match[1]);
            if (designData?.objects) {
              console.log('Auto-applying design:', designData);
              const event = new CustomEvent('halas:load-json', { detail: designData });
              globalThis.dispatchEvent(event);
            }
          } catch (e) {
            console.error('Failed to parse design JSON from chat', e);
          }
        }
      }
    }
  }, [messages, status]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files,
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    );
    setInput('');
  };

  return (
    <Sider
      width={CHAT_WIDTH}
      theme="light"
      style={{
        borderLeft: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        zIndex: 10,
        height: '100%',
        padding: '16px', // Add padding to the sider content
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: '16px', // Add padding to the bottom of the header
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '16px', // Add margin below the header
        }}
      >
        <Sparkles size={18} color="#faad14" />
        <span style={{ fontWeight: 600, fontSize: 16 }}>Halas AI</span>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        <Conversation className="flex-grow overflow-y-auto">
          {' '}
          {/* Use flex-grow and overflow-y-auto */}
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' &&
                  message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                    <Sources>
                      <SourcesTrigger count={message.parts.filter((part) => part.type === 'source-url').length} />
                      {message.parts
                        .filter((part) => part.type === 'source-url')
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source key={`${message.id}-${i}`} href={part.url} title={part.url} />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      // Filter out the JSON block if it's in a text part
                      // eslint-disable-next-line no-case-declarations
                      const displayContent = (part.text || '').replace(/```json\s*([\s\S]*?)\s*```/, '');
                      if (!displayContent.trim() && (part.text || '').includes('```json')) {
                        return (
                          <div key={`${message.id}-${i}`} style={{ fontSize: 10, color: '#aaa' }}>
                            [Design Data Applied]
                          </div>
                        );
                      }
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            <MessageResponse>{displayContent}</MessageResponse>
                          </MessageContent>
                          {message.role === 'assistant' && i === messages.length - 1 && (
                            <MessageActions>
                              <MessageAction onClick={() => regenerate()} label="Retry">
                                <RefreshCcwIcon className="size-3" />
                              </MessageAction>
                              <MessageAction onClick={() => navigator.clipboard.writeText(displayContent)} label="Copy">
                                <CopyIcon className="size-3" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Message>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={
                            status === 'in_progress' &&
                            i === message.parts.length - 1 &&
                            message.id === messages.at(-1)?.id
                          }
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            <div ref={conversationEndRef} /> {/* Element to scroll to */}
            {status === 'in_progress' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea onChange={(e) => setInput(e.target.value)} value={input} />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton variant={webSearch ? 'default' : 'ghost'} onClick={() => setWebSearch(!webSearch)}>
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && status === 'in_progress'} status={status} />{' '}
            {/* Disable submit while loading */}
          </PromptInputFooter>
        </PromptInput>
      </div>
    </Sider>
  );
};
export default ChatBotDemo;
