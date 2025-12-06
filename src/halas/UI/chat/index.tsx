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
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';

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

  // Stable thread id per conversation (persisted locally)
  const [threadId, setThreadId] = useState<string | null>(null);
  // Show Chain-of-Thought only after design flow triggers
  const [showCot, setShowCot] = useState(false);
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

  // Initialize and persist a thread id
  useEffect(() => {
    try {
      const key = 'halas:thread-id';
      let id = globalThis.localStorage?.getItem(key);
      if (!id) {
        id = crypto.randomUUID();
        globalThis.localStorage?.setItem(key, id);
      }
      setThreadId(id);
    } catch {}
  }, []);

  // Chain-of-thought step state (lightweight; driven by assistant text markers)
  type StepStatus = 'pending' | 'active' | 'complete';
  const [steps, setSteps] = useState<
    { key: 'intent' | 'gen' | 'layout' | 'done'; label: string; status: StepStatus }[]
  >([
    { key: 'intent', label: '理解需求', status: 'pending' },
    { key: 'gen', label: '生成元素', status: 'pending' },
    { key: 'layout', label: '布局', status: 'pending' },
    { key: 'done', label: '完成', status: 'pending' },
  ]);
  const [lastPrompt, setLastPrompt] = useState<string>('');

  // Update CoT steps based on assistant messages
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.role !== 'assistant') return;

    const textPart = last.parts.find((p) => p.type === 'text');
    const text = typeof textPart?.text === 'string' ? textPart.text : '';
    if (!text) return;

    setSteps((prev) => {
      const next = [...prev];
      const find = (k: (typeof prev)[number]['key']) => next.find((s) => s.key === k)!;

      // When assistant acknowledges design intent
      if (text.includes("I'm working on a design for:") || text.includes('DESIGN_INTENT:')) {
        find('intent').status = 'complete';
        if (find('gen').status === 'pending') find('gen').status = 'active';
        setShowCot(true);
      }
      // When genjsx reports element count
      if (
        (text.includes('Generated') &&
          (text.includes('elements') || text.includes('JSX') || text.includes('View/Text'))) ||
        text.includes('```jsx')
      ) {
        find('gen').status = 'complete';
        if (find('layout').status === 'pending') find('layout').status = 'active';
        setShowCot(true);
      }
      // When layout returns final design JSON
      if (text.includes('Here is your design:')) {
        find('layout').status = 'complete';
        find('done').status = 'complete';
        setShowCot(true);
      }
      return next;
    });
  }, [messages]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    // Mark the first step as active on submission
    setSteps((prev) =>
      prev.map((s) => (s.key === 'intent' && s.status === 'pending' ? { ...s, status: 'active' } : s)),
    );

    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files,
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
          threadId: threadId ?? undefined,
        },
      },
    );
    setInput('');
    if (message.text) setLastPrompt(message.text);
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

      {/* Chain of Thought panel (render only after triggered) */}
      {showCot && (
        <div style={{ marginBottom: 12 }}>
          <ChainOfThought defaultOpen>
            <ChainOfThoughtHeader />
            <ChainOfThoughtContent>
              {steps.map((s) => {
                // Derive lightweight, context-aware contents per step
                const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
                const assistantText = String(
                  lastAssistant?.parts.find((p) => p.type === 'text')?.text || ''
                );
                const sourceUrls = (lastAssistant?.parts || [])
                  .filter((p: any) => p.type === 'source-url' && p.url)
                  .map((p: any) => p.url as string);

                // Did we embed a JSON design block?
                const hasDesignJson = /```json[\s\S]*?```/i.test(assistantText);

                return (
                  <ChainOfThoughtStep
                    key={s.key}
                    label={s.label}
                    status={s.status === 'active' ? 'active' : s.status === 'complete' ? 'complete' : 'pending'}
                  >
                    {s.key === 'intent' && lastPrompt && (
                      <div className="text-xs text-muted-foreground">用户输入：{lastPrompt}</div>
                    )}

                    {s.key === 'gen' && sourceUrls.length > 0 && (
                      <ChainOfThoughtSearchResults>
                        {sourceUrls.slice(0, 5).map((u) => (
                          <ChainOfThoughtSearchResult key={u}>
                            {(() => {
                              try {
                                return new URL(u).hostname;
                              } catch {
                                return u;
                              }
                            })()}
                          </ChainOfThoughtSearchResult>
                        ))}
                      </ChainOfThoughtSearchResults>
                    )}

                    {s.key === 'layout' && hasDesignJson && (
                      <div className="text-xs text-muted-foreground">已生成设计数据（JSON）并应用到画布</div>
                    )}

                    {s.key === 'done' && s.status === 'complete' && (
                      <div className="text-xs text-muted-foreground">完成 ✅</div>
                    )}
                  </ChainOfThoughtStep>
                );
              })}
            </ChainOfThoughtContent>
          </ChainOfThought>
        </div>
      )}

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
