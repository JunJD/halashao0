import type { AssistantMessageProps } from "@copilotkit/react-ui";
import { Trans } from "@/i18n/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';
import styles from './index.module.scss';

export const MakeAssistantMessage: React.FC<AssistantMessageProps> = (props) => {
  const { message, isLoading, isCurrentMessage, isGenerating } = props;

  // 如果有自定义的生成式 UI，渲染它
  const stateRender = message?.generativeUI;

  if (!stateRender && !message?.content && !isLoading) return null;

  return (
    <div className={styles.messageContainer}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bot size={24} color="#1677ff" />
        <span style={{ fontWeight: 600, fontSize: 14 }}>Halas Copilot</span>
      </div>
      
      {/* Generative UI (if any) */}
      {/* Note: In CopilotKit v1.x, message.generativeUI might be a ReactNode or function.
          Assuming it's renderable directly or we might need to check types.
          Standard props pass it as ReactNode. */}
      {/* {message?.generativeUI} */}

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <span>
            {message?.generativeUI ? <Trans i18nKey="Thinking..." /> : <Trans i18nKey="Thinking..." />}
          </span>
          <span className="relative top-[4px] flex gap-1">
            <span className={styles.bounceDot} style={{ animationDelay: "0ms" }}></span>
            <span className={styles.bounceDot} style={{ animationDelay: "180ms" }}></span>
            <span className={styles.bounceDot} style={{ animationDelay: "360ms" }}></span>
          </span>
        </div>
      ) : (
        <>
          {message?.content && (
            <div style={{ fontSize: 14, lineHeight: 1.6, color: '#333' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
          
          {/* "Thinking" indicator or "Continue" tip */}
          {!isGenerating && isCurrentMessage && (
            <div className={styles.continueTip}>
              {/* SVG removed for simplicity, can use Icon */}
              <span><Trans i18nKey="Halas is ready" /></span>
            </div>
          )}
        </>
      )}
    </div>
  );
};